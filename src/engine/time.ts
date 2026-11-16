// Local birth time -> the exact UTC moment, using the IANA time-zone history
// (the offset in force on that date, including daylight saving).
// The table in data/tzdata.json is built from the official IANA database including its full
// pre-1970 history ("backzone"), so older births in countries such as Sweden, Norway, the
// Netherlands or Iceland use their own clock history instead of a neighbour's.
import tzdata from '../../data/tzdata.json';

interface ZoneTable {
  first: number; // offset in seconds before the first recorded change
  t: number[]; // flattened pairs: [unixSeconds, offsetSeconds, ...]
}
const ZONES = (tzdata as unknown as { zones: Record<string, ZoneTable> }).zones;
export const TZDATA_VERSION = (tzdata as unknown as { version: string }).version;

export function isValidZone(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(ZONES, name);
}

/** UTC offset in minutes (can be fractional for old local mean time) in force at a UTC instant. */
export function zoneOffsetMinutes(zoneName: string, utcMs: number): number {
  const z = ZONES[zoneName];
  if (!z) throw new Error(`Unknown time zone: ${zoneName}`);
  const sec = Math.floor(utcMs / 1000);
  const t = z.t;
  let lo = 0;
  let hi = t.length / 2 - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (t[mid * 2] <= sec) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return (found < 0 ? z.first : t[found * 2 + 1]) / 60;
}

export interface LocalMoment {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
}

export interface TimeOption {
  utcMs: number;
  offsetMinutes: number;
  /** What a clock on the wall actually showed at this moment. */
  wallLabel: string;
  description: string;
}

export type ResolvedTime =
  | { kind: 'ok'; utcMs: number; offsetMinutes: number; meanTime: boolean }
  | { kind: 'ambiguous' | 'nonexistent'; options: [TimeOption, TimeOption] };

function fmtClock(h: number, m: number): string {
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

function wallClock(zoneName: string, utcMs: number): string {
  const off = zoneOffsetMinutes(zoneName, utcMs);
  const d = new Date(utcMs + off * 60000);
  return fmtClock(d.getUTCHours(), d.getUTCMinutes());
}

/**
 * Resolve a local wall-clock time. Normally there is exactly one answer.
 * In the repeated hour (clocks go back) there are two; in the skipped hour
 * (clocks go forward) there are none. Those two cases return the two possible moments.
 */
export function resolveLocalTime(local: LocalMoment, zoneName: string): ResolvedTime {
  if (!isValidZone(zoneName)) throw new Error(`Unknown time zone: ${zoneName}`);
  const zone = { offset: (ts: number) => zoneOffsetMinutes(zoneName, ts) };
  const naive = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  // Date.UTC treats years 0-99 as 1900+; not relevant for supported birth years.
  const DAY = 86400000;
  const offsets = Array.from(new Set([zone.offset(naive - DAY), zone.offset(naive), zone.offset(naive + DAY)]));
  const valid = offsets
    .map((o) => ({ o, ts: naive - o * 60000 }))
    .filter(({ o, ts }) => Math.abs(zone.offset(ts) - o) < 1e-6)
    .sort((a, b) => a.ts - b.ts);

  if (valid.length === 1) {
    const o = valid[0].o;
    return { kind: 'ok', utcMs: valid[0].ts, offsetMinutes: o, meanTime: Math.abs(o - Math.round(o)) > 1e-6 };
  }
  if (valid.length >= 2) {
    const [first, second] = [valid[0], valid[valid.length - 1]];
    return {
      kind: 'ambiguous',
      options: [
        { utcMs: first.ts, offsetMinutes: first.o, wallLabel: fmtClock(local.hour, local.minute), description: 'the first time, before the clocks went back' },
        { utcMs: second.ts, offsetMinutes: second.o, wallLabel: fmtClock(local.hour, local.minute), description: 'the second time, after the clocks went back' },
      ],
    };
  }
  // Skipped hour: this clock time never happened. Offer the moment just before and just after the jump.
  const sorted = offsets.slice().sort((a, b) => a - b);
  const before = sorted[0]; // offset in force before the clocks went forward
  const after = sorted[sorted.length - 1];
  const tsEarlier = naive - after * 60000; // reads one step earlier on the old clock
  const tsLater = naive - before * 60000; // reads one step later on the new clock
  return {
    kind: 'nonexistent',
    options: [
      { utcMs: tsEarlier, offsetMinutes: zone.offset(tsEarlier), wallLabel: wallClock(zoneName, tsEarlier), description: 'before the clocks went forward' },
      { utcMs: tsLater, offsetMinutes: zone.offset(tsLater), wallLabel: wallClock(zoneName, tsLater), description: 'after the clocks went forward' },
    ],
  };
}

/** For unknown-birth-time sampling: always returns one moment, never asks. */
export function resolveLocalTimeLenient(local: LocalMoment, zoneName: string): { utcMs: number; offsetMinutes: number } {
  const r = resolveLocalTime(local, zoneName);
  if (r.kind === 'ok') return { utcMs: r.utcMs, offsetMinutes: r.offsetMinutes };
  const pick = r.kind === 'nonexistent' ? r.options[1] : r.options[0];
  return { utcMs: pick.utcMs, offsetMinutes: pick.offsetMinutes };
}

export { julianDayNumber } from './jdn';
