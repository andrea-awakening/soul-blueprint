// Shared server helpers: input checking, a small in-memory cache, and basic rate limiting per IP address.
// Nothing here is written to disk or logged. Birth data lives only in memory for the length of a request
// (plus a short-lived cache so the chapters of one reading do not recalculate the chart each time).
import { computeBlueprint, type BlueprintFacts, type BlueprintResult } from '../engine';
import type { NameNumbers } from '../engine/numerology';
import { buildChapters, validNameNumbers, type Chapter } from '../reading/build';
import { getPlace, placeLabel } from './places';

export interface CleanInput {
  date: string;
  time: string | null;
  placeId: number;
  timeChoice?: 0 | 1;
  names: NameNumbers | null;
  firstName: string | null;
}

export function readInput(body: unknown): CleanInput | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return null;
  if (b.time !== null && (typeof b.time !== 'string' || !/^\d{1,2}:\d{2}$/.test(b.time))) return null;
  if (typeof b.placeId !== 'number' || !Number.isInteger(b.placeId)) return null;
  const first = typeof b.firstName === 'string' ? b.firstName.replace(/[^\p{L}\p{M}' -]/gu, '').trim().slice(0, 30) : '';
  return {
    date: b.date,
    time: b.time as string | null,
    placeId: b.placeId,
    timeChoice: b.timeChoice === 0 || b.timeChoice === 1 ? b.timeChoice : undefined,
    names: validNameNumbers(b.nameNumbers),
    firstName: first || null,
  };
}

interface Computed { facts: BlueprintFacts; chapters: Chapter[] }
const cache = new Map<string, Computed>();

/** Calculate (or reuse) the chart and its chapters for one input. */
export function compute(input: CleanInput): BlueprintResult | { status: 'ok'; facts: BlueprintFacts; chapters: Chapter[] } {
  const place = getPlace(input.placeId);
  if (!place) return { status: 'error', message: 'Please choose your birth city from the list.' };
  const key = JSON.stringify([input.date, input.time, input.placeId, input.timeChoice ?? null, input.names, new Date().toISOString().slice(0, 10)]);
  const hit = cache.get(key);
  if (hit) return { status: 'ok', ...hit };
  const res = computeBlueprint({ date: input.date, time: input.time, place: { name: placeLabel(place), lat: place.lat, lon: place.lon, tz: place.tz }, timeChoice: input.timeChoice });
  if (res.status !== 'ok') return res;
  const value = { facts: res.facts, chapters: buildChapters(res.facts, input.names) };
  cache.set(key, value);
  if (cache.size > 40) cache.delete(cache.keys().next().value as string);
  return { status: 'ok', ...value };
}

export { allow, tooMany, clientIp } from './ratelimit';
