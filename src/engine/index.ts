// The calculation engine: birth data in, facts out. Deterministic, no AI anywhere in this folder.
import { resolveLocalTime, resolveLocalTimeLenient, isValidZone, TZDATA_VERSION } from './time';
import { julianDayUT } from './swe';
import { computeWestern, computeWesternUnknownTime, type WesternChart } from './western';
import { computeHumanDesign, computeHumanDesignUnknownTime, type HumanDesign, type HumanDesignStable } from './humandesign';
import { computeMayan, type MayanResult } from './mayan';
import { dateNumbers, type DateNumbers } from './numerology';
import { computeChinese, type ChineseResult } from './chinese';
import { computeAstrocartography, type AcgLine, type AcgGroup } from './astrocartography';
import { computeCycles, type CycleEvent } from './cycles';

export interface BlueprintInput {
  date: string; // "1991-09-26" (local civil date)
  time: string | null; // "17:30" local clock time, or null when the birth time is unknown
  place: { name: string; lat: number; lon: number; tz: string };
  /** Answer to the one daylight-saving question, when it was asked. */
  timeChoice?: 0 | 1;
  /** "Now", for personal year and past/upcoming cycles. Defaults to the server clock. */
  nowMs?: number;
}

export interface BlueprintFacts {
  version: 1;
  meta: {
    date: string;
    time: string | null;
    timeKnown: boolean;
    place: string;
    lat: number;
    lon: number;
    zone: string;
    utc: string | null; // the exact UTC moment used
    utcOffset: string | null; // e.g. "UTC-6"
    houseSystem: string | null;
    tzVersion: string;
    notes: string[];
  };
  western: WesternChart;
  humanDesign: { timeKnown: true; chart: HumanDesign } | { timeKnown: false; stable: HumanDesignStable };
  mayan: MayanResult;
  numerology: DateNumbers;
  chinese: ChineseResult | null;
  astrocartography: { lines: AcgLine[]; groups: AcgGroup[] } | null;
  cycles: { events: CycleEvent[]; approximate: boolean };
}

export type BlueprintResult =
  | { status: 'ok'; facts: BlueprintFacts }
  | { status: 'choose-time'; kind: 'ambiguous' | 'nonexistent'; question: string; options: { label: string; description: string }[] }
  | { status: 'error'; message: string };

export const MIN_YEAR = 1900;

function jdOf(utcMs: number): number {
  const d = new Date(utcMs);
  return julianDayUT(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600);
}

function offsetLabel(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.round(abs - h * 60);
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}

export function computeBlueprint(input: BlueprintInput): BlueprintResult {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date);
  if (!dm) return { status: 'error', message: 'Please enter a full birth date.' };
  const [year, month, day] = [Number(dm[1]), Number(dm[2]), Number(dm[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return { status: 'error', message: 'That date does not exist. Please check the day and month.' };
  }
  const nowMs = input.nowMs ?? Date.now();
  if (year < MIN_YEAR || check.getTime() > nowMs) {
    return { status: 'error', message: `Birth dates from ${MIN_YEAR} up to today are supported.` };
  }
  const { lat, lon, tz } = input.place;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !isValidZone(tz)) {
    return { status: 'error', message: 'Please choose your birth city from the list.' };
  }
  const notes: string[] = [];
  const mayan = computeMayan(year, month, day);
  const numerology = dateNumbers(year, month, day, new Date(nowMs).getUTCFullYear());

  if (input.time) {
    const tm = /^(\d{1,2}):(\d{2})$/.exec(input.time);
    if (!tm || Number(tm[1]) > 23 || Number(tm[2]) > 59) return { status: 'error', message: 'Please enter the birth time as hours and minutes.' };
    const [hour, minute] = [Number(tm[1]), Number(tm[2])];
    const resolved = resolveLocalTime({ year, month, day, hour, minute }, tz);
    let utcMs: number;
    let offsetMinutes: number;
    if (resolved.kind === 'ok') {
      utcMs = resolved.utcMs;
      offsetMinutes = resolved.offsetMinutes;
      if (resolved.meanTime) notes.push('Clocks at this place and date ran on local mean time, so the time conversion may be less exact than for modern births.');
    } else if (input.timeChoice === 0 || input.timeChoice === 1) {
      utcMs = resolved.options[input.timeChoice].utcMs;
      offsetMinutes = resolved.options[input.timeChoice].offsetMinutes;
    } else {
      const question =
        resolved.kind === 'ambiguous'
          ? `The clocks went back that night, so ${resolved.options[0].wallLabel} happened twice. Which one were you born in?`
          : 'The clocks jumped forward that night, so that exact time was skipped. Which is closer to what your birth certificate says?';
      return {
        status: 'choose-time',
        kind: resolved.kind,
        question,
        options: resolved.options.map((o) => ({ label: o.wallLabel, description: o.description })),
      };
    }
    const jd = jdOf(utcMs);
    const western = computeWestern(jd, { lat, lon });
    if (western.houseSystem === 'Porphyry') notes.push('This far north or south, Placidus houses cannot be drawn, so Porphyry houses are used instead.');
    const facts: BlueprintFacts = {
      version: 1,
      meta: {
        date: input.date, time: input.time, timeKnown: true, place: input.place.name, lat, lon, zone: tz,
        utc: new Date(utcMs).toISOString().slice(0, 16) + 'Z', utcOffset: offsetLabel(offsetMinutes), houseSystem: western.houseSystem, tzVersion: TZDATA_VERSION, notes,
      },
      western,
      humanDesign: { timeKnown: true, chart: computeHumanDesign(jd) },
      mayan,
      numerology,
      chinese: computeChinese(year, month, day, hour),
      astrocartography: computeAstrocartography(jd),
      cycles: { events: computeCycles(jd, nowMs), approximate: false },
    };
    return { status: 'ok', facts };
  }

  // Unknown birth time: noon, plus the first and last minute of the local day.
  const noon = resolveLocalTimeLenient({ year, month, day, hour: 12, minute: 0 }, tz);
  const start = resolveLocalTimeLenient({ year, month, day, hour: 0, minute: 0 }, tz);
  const end = resolveLocalTimeLenient({ year, month, day, hour: 23, minute: 59 }, tz);
  const [jdNoon, jdStart, jdEnd] = [jdOf(noon.utcMs), jdOf(start.utcMs), jdOf(end.utcMs)];
  notes.push('Birth time unknown: calculated for the whole day, and only what stays the same all day is shown.');
  const facts: BlueprintFacts = {
    version: 1,
    meta: { date: input.date, time: null, timeKnown: false, place: input.place.name, lat, lon, zone: tz, utc: null, utcOffset: offsetLabel(noon.offsetMinutes), houseSystem: null, tzVersion: TZDATA_VERSION, notes },
    western: computeWesternUnknownTime(jdNoon, jdStart, jdEnd),
    humanDesign: { timeKnown: false, stable: computeHumanDesignUnknownTime(jdStart, jdEnd) },
    mayan,
    numerology,
    chinese: computeChinese(year, month, day, null),
    astrocartography: null,
    cycles: { events: computeCycles(jdNoon, nowMs), approximate: true },
  };
  return { status: 'ok', facts };
}
