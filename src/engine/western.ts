// Western astrology: placements, houses, aspects and chart summaries.
// Tropical zodiac, Placidus houses, True Node, mean Black Moon Lilith.
import { BODY, calc, houses, norm360, angDiff, type HouseResult } from './swe';
import { SIGNS, RULERS, degParts, elementOf, modalityOf, signIndexOf, sabianDegree, fmtDegMin, type Element, type Modality } from './zodiac';

import { PLACEMENT_ORDER, PLACEMENT_INFO, SHORT_NAME, type PlacementId } from './placements';
export { PLACEMENT_ORDER, PLACEMENT_INFO, SHORT_NAME, type PlacementId };

const PLANETS10: PlacementId[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const ANGLES: PlacementId[] = ['asc', 'mc', 'dc', 'ic'];
const MINOR: PlacementId[] = ['chiron', 'lilith', 'rockefellia', 'northNode', 'southNode', 'fortune'];
const CAN_RETRO: PlacementId[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'rockefellia'];
/** Points that take part in aspects. South Node, DC and IC mirror their opposite points, so they are left out. */
const ASPECT_POINTS: PlacementId[] = [...PLANETS10, 'chiron', 'lilith', 'rockefellia', 'northNode', 'fortune', 'asc', 'mc'];

export const ASPECT_TYPES = [
  { type: 'conjunction', angle: 0, verb: 'conjunct' },
  { type: 'sextile', angle: 60, verb: 'sextile' },
  { type: 'square', angle: 90, verb: 'square' },
  { type: 'trine', angle: 120, verb: 'trine' },
  { type: 'quincunx', angle: 150, verb: 'quincunx' },
  { type: 'opposition', angle: 180, verb: 'opposite' },
] as const;
export type AspectType = (typeof ASPECT_TYPES)[number]['type'];

export interface Aspect {
  a: PlacementId;
  b: PlacementId;
  type: AspectType;
  verb: string;
  orb: number; // degrees from exact
}

export interface CuspNote {
  /** Within 1 degree of a sign boundary: the neighbouring sign. */
  neighborSign?: string;
  /** Within 1 degree of a house cusp (time known only): the neighbouring house. */
  neighborHouse?: number;
}

export interface Placement {
  id: PlacementId;
  name: string;
  symbol: string;
  overview: string;
  lon: number;
  sign: string;
  signIndex: number;
  degree: string; // "4°40'"
  house?: number;
  retrograde?: boolean;
  domicile?: boolean;
  chartRuler?: boolean;
  sabianDegree?: number;
  cusp?: CuspNote;
  aspects: Aspect[];
  /** Unknown birth time only. */
  degreeApproximate?: boolean;
  possibleSigns?: string[];
}

export interface WesternChart {
  timeKnown: boolean;
  houseSystem: 'Placidus' | 'Porphyry' | null;
  cusps: number[] | null;
  placements: Placement[];
  hidden: PlacementId[];
  dayChart: boolean | null;
  summary: {
    bigThree: { sun: string; moon: string | null; rising: string | null };
    chartRuler: { planet: PlacementId; name: string; sign: string; house?: number } | null;
    elements: Record<Element, PlacementId[]>;
    modalities: Record<Modality, PlacementId[]>;
    retrogrades: PlacementId[];
    stelliums: { kind: 'sign' | 'house'; where: string; planets: PlacementId[] }[];
    domiciles: PlacementId[];
  };
}

export function orbLimit(a: PlacementId, b: PlacementId, type: AspectType): number {
  if (MINOR.includes(a) || MINOR.includes(b)) return 3;
  if (type === 'quincunx') return 3;
  if (a === 'sun' || a === 'moon' || b === 'sun' || b === 'moon') return 8;
  return 6;
}

export function findAspect(a: PlacementId, lonA: number, b: PlacementId, lonB: number): Aspect | null {
  const sep = Math.abs(angDiff(lonA, lonB));
  let best: Aspect | null = null;
  for (const t of ASPECT_TYPES) {
    const orb = Math.abs(sep - t.angle);
    if (orb <= orbLimit(a, b, t.type) && (!best || orb < best.orb)) best = { a, b, type: t.type, verb: t.verb, orb };
  }
  return best;
}

export function houseOf(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const span = norm360(cusps[(i + 1) % 12] - start);
    const off = norm360(lon - start);
    if (off < span) return i + 1;
  }
  return 12;
}

export interface RawPositions {
  lons: Partial<Record<PlacementId, number>>;
  speeds: Partial<Record<PlacementId, number>>;
  houses: HouseResult | null;
  dayChart: boolean | null;
}

/** Every longitude for one moment. With lat/lon also houses, angles and the Part of Fortune. */
export function rawPositions(jdUT: number, geo: { lat: number; lon: number } | null): RawPositions {
  const lons: Partial<Record<PlacementId, number>> = {};
  const speeds: Partial<Record<PlacementId, number>> = {};
  for (const id of [...PLANETS10, 'chiron', 'lilith', 'rockefellia'] as const) {
    const p = calc(jdUT, BODY[id as keyof typeof BODY]);
    lons[id] = p.lon;
    speeds[id] = p.speed;
  }
  const node = calc(jdUT, BODY.trueNode);
  lons.northNode = node.lon;
  lons.southNode = norm360(node.lon + 180);
  let h: HouseResult | null = null;
  let dayChart: boolean | null = null;
  if (geo) {
    h = houses(jdUT, geo.lat, geo.lon);
    lons.asc = norm360(h.asc);
    lons.mc = norm360(h.mc);
    lons.dc = norm360(h.asc + 180);
    lons.ic = norm360(h.mc + 180);
    // Day chart: the Sun is above the horizon (houses 7 to 12).
    dayChart = norm360(lons.sun! - lons.asc) >= 180;
    lons.fortune = dayChart ? norm360(lons.asc + lons.moon! - lons.sun!) : norm360(lons.asc + lons.sun! - lons.moon!);
  }
  return { lons, speeds, houses: h, dayChart };
}

function cuspNote(lon: number, cusps: number[] | null, isAngle: boolean): CuspNote | undefined {
  const p = degParts(lon);
  const note: CuspNote = {};
  if (p.inSign < 1) note.neighborSign = SIGNS[(p.signIndex + 11) % 12];
  else if (p.inSign > 29) note.neighborSign = SIGNS[(p.signIndex + 1) % 12];
  if (cusps && !isAngle) {
    const house = houseOf(lon, cusps);
    const fromStart = norm360(lon - cusps[house - 1]);
    const toEnd = norm360(cusps[house % 12] - lon);
    if (fromStart < 1) note.neighborHouse = house === 1 ? 12 : house - 1;
    else if (toEnd < 1) note.neighborHouse = house === 12 ? 1 : house + 1;
  }
  return note.neighborSign || note.neighborHouse ? note : undefined;
}

function buildSummary(placements: Placement[], timeKnown: boolean): WesternChart['summary'] {
  const byId = new Map(placements.map((p) => [p.id, p]));
  const elements: Record<Element, PlacementId[]> = { fire: [], earth: [], air: [], water: [] };
  const modalities: Record<Modality, PlacementId[]> = { cardinal: [], fixed: [], mutable: [] };
  const signGroups = new Map<string, PlacementId[]>();
  const houseGroups = new Map<number, PlacementId[]>();
  for (const id of PLANETS10) {
    const p = byId.get(id);
    if (!p || p.possibleSigns) continue; // a sign we cannot be sure of is never counted
    elements[elementOf(p.signIndex)].push(id);
    modalities[modalityOf(p.signIndex)].push(id);
    signGroups.set(p.sign, [...(signGroups.get(p.sign) || []), id]);
    if (p.house) houseGroups.set(p.house, [...(houseGroups.get(p.house) || []), id]);
  }
  const stelliums: WesternChart['summary']['stelliums'] = [];
  for (const [sign, ids] of signGroups) if (ids.length >= 3) stelliums.push({ kind: 'sign', where: sign, planets: ids });
  for (const [house, ids] of houseGroups) if (ids.length >= 3) stelliums.push({ kind: 'house', where: String(house), planets: ids });
  const asc = byId.get('asc');
  let chartRuler: WesternChart['summary']['chartRuler'] = null;
  if (timeKnown && asc) {
    const rulerId = RULERS[asc.signIndex] as PlacementId;
    const r = byId.get(rulerId);
    if (r && !r.possibleSigns) chartRuler = { planet: rulerId, name: PLACEMENT_INFO[rulerId].name, sign: r.sign, house: r.house };
  }
  const sun = byId.get('sun')!;
  const moon = byId.get('moon');
  return {
    bigThree: {
      sun: sun.possibleSigns ? sun.possibleSigns.join(' or ') : sun.sign,
      moon: moon ? (moon.possibleSigns ? moon.possibleSigns.join(' or ') : moon.sign) : null,
      rising: timeKnown && asc ? asc.sign : null,
    },
    chartRuler,
    elements,
    modalities,
    retrogrades: placements.filter((p) => p.retrograde).map((p) => p.id),
    stelliums,
    domiciles: placements.filter((p) => p.domicile).map((p) => p.id),
  };
}

function basePlacement(id: PlacementId, lon: number): Placement {
  const info = PLACEMENT_INFO[id];
  const si = signIndexOf(lon);
  return { id, ...info, lon, sign: SIGNS[si], signIndex: si, degree: fmtDegMin(lon), aspects: [] };
}

/** Full chart for a known birth time. */
export function computeWestern(jdUT: number, geo: { lat: number; lon: number }): WesternChart {
  const raw = rawPositions(jdUT, geo);
  const cusps = raw.houses!.cusps.map(norm360);
  const placements: Placement[] = [];
  for (const id of PLACEMENT_ORDER) {
    const lon = raw.lons[id]!;
    const p = basePlacement(id, lon);
    const isAngle = ANGLES.includes(id);
    if (!isAngle) p.house = houseOf(lon, cusps);
    if (CAN_RETRO.includes(id) && (raw.speeds[id] ?? 0) < 0) p.retrograde = true;
    if (PLANETS10.includes(id) && RULERS[p.signIndex] === id) p.domicile = true;
    p.sabianDegree = sabianDegree(lon);
    const cn = cuspNote(lon, cusps, isAngle);
    if (cn) p.cusp = cn;
    placements.push(p);
  }
  const aspects: Aspect[] = [];
  for (let i = 0; i < ASPECT_POINTS.length; i++) {
    for (let j = i + 1; j < ASPECT_POINTS.length; j++) {
      const a = ASPECT_POINTS[i];
      const b = ASPECT_POINTS[j];
      if ((a === 'asc' && b === 'mc') || (a === 'fortune' && (b === 'asc' || b === 'mc'))) continue;
      const asp = findAspect(a, raw.lons[a]!, b, raw.lons[b]!);
      if (asp) aspects.push(asp);
    }
  }
  attachAspects(placements, aspects);
  const summary = buildSummary(placements, true);
  if (summary.chartRuler) {
    const r = placements.find((p) => p.id === summary.chartRuler!.planet);
    if (r) r.chartRuler = true;
  }
  return { timeKnown: true, houseSystem: raw.houses!.system, cusps, placements, hidden: [], dayChart: raw.dayChart, summary };
}

function attachAspects(placements: Placement[], aspects: Aspect[]): void {
  const byId = new Map(placements.map((p) => [p.id, p]));
  for (const asp of aspects) {
    byId.get(asp.a)?.aspects.push(asp);
    byId.get(asp.b)?.aspects.push({ ...asp, a: asp.b, b: asp.a });
  }
  for (const p of placements) p.aspects.sort((x, y) => x.orb - y.orb);
}

/**
 * Limited chart for an unknown birth time. Calculated at local noon and compared with
 * the first and last minute of the day. Anything that depends on the clock time is hidden.
 */
export function computeWesternUnknownTime(jdNoon: number, jdStart: number, jdEnd: number): WesternChart {
  const noon = rawPositions(jdNoon, null);
  const start = rawPositions(jdStart, null);
  const end = rawPositions(jdEnd, null);
  const hidden: PlacementId[] = ['asc', 'mc', 'dc', 'ic', 'fortune'];
  const placements: Placement[] = [];
  for (const id of PLACEMENT_ORDER) {
    if (hidden.includes(id)) continue;
    const p = basePlacement(id, noon.lons[id]!);
    const s0 = signIndexOf(start.lons[id]!);
    const s1 = signIndexOf(end.lons[id]!);
    if (s0 !== s1) {
      p.possibleSigns = [SIGNS[s0], SIGNS[s1]];
    } else {
      p.sign = SIGNS[s0];
      p.signIndex = s0;
      if (PLANETS10.includes(id) && RULERS[s0] === id) p.domicile = true;
      // Cusp note only when it holds for the whole day.
      const a = cuspNote(start.lons[id]!, null, false);
      const b = cuspNote(end.lons[id]!, null, false);
      if (a?.neighborSign && a.neighborSign === b?.neighborSign) p.cusp = { neighborSign: a.neighborSign };
    }
    p.degreeApproximate = true;
    const r0 = (start.speeds[id] ?? 0) < 0;
    const r1 = (end.speeds[id] ?? 0) < 0;
    if (CAN_RETRO.includes(id) && r0 && r1) p.retrograde = true;
    placements.push(p);
  }
  // Aspects: only those that hold at the start, middle and end of the day. The Moon moves too fast to include.
  const pts = ASPECT_POINTS.filter((id) => !hidden.includes(id) && id !== 'moon');
  const aspects: Aspect[] = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const [a, b] = [pts[i], pts[j]];
      const n = findAspect(a, noon.lons[a]!, b, noon.lons[b]!);
      if (!n) continue;
      const s = findAspect(a, start.lons[a]!, b, start.lons[b]!);
      const e = findAspect(a, end.lons[a]!, b, end.lons[b]!);
      if (s && e && s.type === n.type && e.type === n.type) aspects.push(n);
    }
  }
  attachAspects(placements, aspects);
  return { timeKnown: false, houseSystem: null, cusps: null, placements, hidden, dayChart: null, summary: buildSummary(placements, false) };
}
