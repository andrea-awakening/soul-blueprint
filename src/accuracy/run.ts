// The accuracy harness. Runs the engine against every reference chart and returns one row per checked value.
// Used by the automated tests (a failing row blocks the build) and by the admin test page.
import fixtures from './fixtures.json';
import { computeBlueprint, type BlueprintFacts } from '../engine';
import { SIGNS, fmtFull } from '../engine/zodiac';
import { resolveLocalTime } from '../engine/time';
import { computeMayan } from '../engine/mayan';
import { computeChinese } from '../engine/chinese';
import { dateNumbers, nameNumbers, cleanName } from '../engine/numerology';
import { calc, BODY, julianDayUT, angDiff } from '../engine/swe';
import { ACTIVATION_ORDER } from '../engine/humandesign';
import type { PlacementId } from '../engine/western';

export interface Row {
  chart: string;
  group: string;
  item: string;
  expected: string;
  actual: string;
  diff: string;
  pass: boolean;
  source: string;
}

const ABBR = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];
const ARCMIN = 1 / 60;

/** "Lib 3 22 28" -> decimal longitude */
function parsePos(s: string): number {
  const [sign, d, m, sec] = s.split(' ');
  return ABBR.indexOf(sign) * 30 + Number(d) + Number(m) / 60 + Number(sec || 0) / 3600;
}
function fmtArc(deg: number): string {
  const a = Math.abs(deg) * 3600;
  return a < 60 ? `${a.toFixed(1)}"` : `${Math.floor(a / 60)}'${Math.round(a % 60)}"`;
}
const AUTH_ALIASES: Record<string, string> = { 'Solar Plexus': 'Emotional (Solar Plexus)', Emotional: 'Emotional (Solar Plexus)' };

function posRow(chart: string, group: string, item: string, expected: number, actual: number | undefined, source: string): Row {
  if (actual === undefined) return { chart, group, item, expected: fmtFull(expected), actual: 'missing', diff: '-', pass: false, source };
  const d = angDiff(actual, expected);
  return { chart, group, item, expected: fmtFull(expected), actual: fmtFull(actual), diff: fmtArc(d), pass: Math.abs(d) <= ARCMIN, source };
}
function eqRow(chart: string, group: string, item: string, expected: unknown, actual: unknown, source: string): Row {
  const e = String(expected);
  const a = String(actual);
  return { chart, group, item, expected: e, actual: a, diff: e === a ? 'same' : 'DIFFERENT', pass: e === a, source };
}

type ChartFixture = (typeof fixtures.charts)[number];

function runChart(fx: ChartFixture): Row[] {
  const rows: Row[] = [];
  const id = fx.label;
  const src = fx.source;
  const res = computeBlueprint({ date: fx.birth.date, time: fx.birth.time, place: { name: fx.birth.place, lat: fx.birth.lat, lon: fx.birth.lon, tz: fx.birth.tz }, nowMs: Date.UTC(2026, 10, 16) });
  if (res.status !== 'ok') {
    return [{ chart: id, group: 'Engine', item: 'calculation', expected: 'a chart', actual: res.status, diff: '-', pass: false, source: src }];
  }
  const f: BlueprintFacts = res.facts;
  const ex = fx.expect;
  rows.push(eqRow(id, 'Time', 'UTC moment (time zone + daylight saving)', ex.utc, f.meta.utc, src));
  rows.push(eqRow(id, 'Houses', 'House system', ex.houseSystem, f.meta.houseSystem, src));
  const byId = new Map(f.western.placements.map((p) => [p.id, p]));
  for (const [key, val] of Object.entries(ex.positions)) {
    rows.push(posRow(id, 'Positions', byId.get(key as PlacementId)?.name ?? key, parsePos(val), byId.get(key as PlacementId)?.lon, src));
  }
  ex.cusps.forEach((c, i) => rows.push(posRow(id, 'Houses', `House ${i + 1} cusp`, parsePos(c), f.western.cusps?.[i], src)));
  for (const [key, house] of Object.entries(ex.houses)) {
    rows.push(eqRow(id, 'Houses', `${byId.get(key as PlacementId)?.name ?? key} is in house`, house, byId.get(key as PlacementId)?.house, src));
  }
  for (const [key, val] of Object.entries(ex.positions)) {
    rows.push(eqRow(id, 'Signs', `${byId.get(key as PlacementId)?.name ?? key} sign`, SIGNS[ABBR.indexOf(val.split(' ')[0])], byId.get(key as PlacementId)?.sign, src));
  }
  rows.push(eqRow(id, 'Positions', 'Retrograde bodies', [...ex.retrograde].sort().join(', ') || 'none', f.western.summary.retrogrades.slice().sort().join(', ') || 'none', src));
  for (const [a, type, b, orb] of ex.aspects) {
    const found = byId.get(a as PlacementId)?.aspects.find((x) => x.b === b);
    const [od, om] = orb.split(' ').map(Number);
    const expOrb = od + om / 60;
    const ok = !!found && found.type === type && Math.abs(found.orb - expOrb) <= ARCMIN;
    rows.push({ chart: id, group: 'Aspects', item: `${a} ${type} ${b}`, expected: `${type}, orb ${od}°${String(om).padStart(2, '0')}'`, actual: found ? `${found.type}, orb ${Math.floor(found.orb)}°${String(Math.floor((found.orb % 1) * 60)).padStart(2, '0')}'` : 'not found', diff: found ? fmtArc(found.orb - expOrb) : '-', pass: ok, source: src });
  }
  if (f.humanDesign.timeKnown) {
    const hd = f.humanDesign.chart;
    const exP = ex.hd.personality.split(' ');
    const exD = ex.hd.design.split(' ');
    ACTIVATION_ORDER.forEach((planet, i) => {
      rows.push(eqRow(id, 'Human Design', `Personality ${planet} (gate.line)`, exP[i], `${hd.personality[i].gate}.${hd.personality[i].line}`, src));
      rows.push(eqRow(id, 'Human Design', `Design ${planet} (gate.line)`, exD[i], `${hd.design[i].gate}.${hd.design[i].line}`, src));
    });
    rows.push(eqRow(id, 'Human Design', 'Type', ex.hd.type, hd.type, src));
    rows.push(eqRow(id, 'Human Design', 'Authority', AUTH_ALIASES[ex.hd.authority] ?? ex.hd.authority, hd.authority, src + ` (printed there as "${ex.hd.authority}")`));
    rows.push(eqRow(id, 'Human Design', 'Profile', ex.hd.profile, hd.profile, src));
    rows.push(eqRow(id, 'Human Design', 'Definition', ex.hd.definition, hd.definition, src));
    rows.push(eqRow(id, 'Human Design', 'Incarnation Cross', ex.hd.cross, hd.cross.label, src));
  }
  rows.push(eqRow(id, 'Mayan', 'Tone and nawal', ex.mayan.label, f.mayan.label, ex.mayan.source));
  rows.push(eqRow(id, 'Mayan', 'Trecena', ex.mayan.trecena, f.mayan.trecena.kiche, ex.mayan.source));
  rows.push(eqRow(id, 'Numerology', 'Life Path', ex.numerology.lifePath, f.numerology.lifePath, 'brief section 4.5, worked by hand'));
  rows.push(eqRow(id, 'Numerology', 'Birthday number', ex.numerology.birthday, f.numerology.birthday, 'brief section 4.5, worked by hand'));
  rows.push(eqRow(id, 'Chinese zodiac', 'Year animal', `${ex.chinese.yinYang} ${ex.chinese.element} ${ex.chinese.animal}`, `${f.chinese?.yinYang} ${f.chinese?.element} ${f.chinese?.animal}`, 'Lunar New Year table (Hong Kong Observatory)'));
  rows.push(eqRow(id, 'Chinese zodiac', 'Hour animal', ex.chinese.hourAnimal, f.chinese?.hourAnimal, 'two-hour branches of the local clock'));
  return rows;
}

type ExtraFixture = {
  id: string; label: string; tests: string; birth: { date: string; time: string; place: string; lat: number; lon: number; tz: string };
  expect: {
    utc?: string; utcSource?: string; jpl?: Record<string, number>; houseSystem?: string; timeQuestion?: string;
    chinese?: { animal: string; element: string; yinYang: string }; mayan?: string; lifePath?: number; note?: string;
  };
};

const JPL_BODIES: Record<string, number> = {
  sun: BODY.sun, moon: BODY.moon, mercury: BODY.mercury, venus: BODY.venus, mars: BODY.mars, jupiter: BODY.jupiter, saturn: BODY.saturn,
  uranus: BODY.uranus, neptune: BODY.neptune, pluto: BODY.pluto, chiron: BODY.chiron, rockefellia: BODY.rockefellia,
};

function runExtra(fx: ExtraFixture): Row[] {
  const rows: Row[] = [];
  const id = fx.label;
  const [y, m, d] = fx.birth.date.split('-').map(Number);
  const [hh, mm] = fx.birth.time.split(':').map(Number);
  if (fx.expect.timeQuestion) {
    const r = resolveLocalTime({ year: y, month: m, day: d, hour: hh, minute: mm }, fx.birth.tz);
    rows.push(eqRow(id, 'Time', 'Daylight-saving edge is detected', fx.expect.timeQuestion, r.kind, 'known clock-change date'));
    return rows;
  }
  const res = computeBlueprint({ date: fx.birth.date, time: fx.birth.time, place: { name: fx.birth.place, lat: fx.birth.lat, lon: fx.birth.lon, tz: fx.birth.tz }, nowMs: Date.UTC(2026, 10, 16) });
  if (res.status !== 'ok') return [{ chart: id, group: 'Engine', item: 'calculation', expected: 'a chart', actual: res.status, diff: '-', pass: false, source: '' }];
  const f = res.facts;
  if (fx.expect.utc) rows.push(eqRow(id, 'Time', 'UTC moment (time zone + daylight saving)', fx.expect.utc, f.meta.utc, fx.expect.utcSource || 'documented time-zone history'));
  if (fx.expect.houseSystem) rows.push(eqRow(id, 'Houses', 'House system', fx.expect.houseSystem, f.meta.houseSystem, 'brief section 4.2'));
  if (fx.expect.jpl && fx.expect.utc) {
    // Compare at the documented UTC moment, so this row tests the planet math on its own.
    const u = new Date(fx.expect.utc.replace('Z', ':00Z'));
    const jd = julianDayUT(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate(), u.getUTCHours() + u.getUTCMinutes() / 60);
    for (const [key, lon] of Object.entries(fx.expect.jpl)) {
      rows.push(posRow(id, 'Positions', key[0].toUpperCase() + key.slice(1), lon, calc(jd, JPL_BODIES[key]).lon, 'NASA JPL Horizons (apparent geocentric ecliptic longitude)'));
    }
  }
  if (fx.expect.chinese) rows.push(eqRow(id, 'Chinese zodiac', 'Year animal', `${fx.expect.chinese.yinYang} ${fx.expect.chinese.element} ${fx.expect.chinese.animal}`, `${f.chinese?.yinYang} ${f.chinese?.element} ${f.chinese?.animal}`, 'Lunar New Year table (Hong Kong Observatory)'));
  if (fx.expect.mayan) rows.push(eqRow(id, 'Mayan', 'Tone and nawal', fx.expect.mayan, f.mayan.label, 'published traditional-count anchor date'));
  if (fx.expect.lifePath !== undefined) rows.push(eqRow(id, 'Numerology', 'Life Path', fx.expect.lifePath, f.numerology.lifePath, 'brief section 4.5, worked by hand'));
  return rows;
}

function runRules(): Row[] {
  const rows: Row[] = [];
  const R = 'Rule checks';
  // Mayan anchors (traditional count, GMT 584283)
  rows.push(eqRow(R, 'Mayan', 'December 21, 2012', '4 Ajpu', computeMayan(2012, 12, 21).label, 'brief section 4.4 self-check'));
  rows.push(eqRow(R, 'Mayan', 'January 1, 2000', "11 Iq'", computeMayan(2000, 1, 1).label, 'published traditional-count anchor date'));
  rows.push(eqRow(R, 'Mayan', 'Trecena of a tone-1 day is itself (Dec 18, 2012 = 1 No\'j)', "No'j", computeMayan(2012, 12, 18).trecena.kiche, 'definition of the trecena'));
  // Time zones with their own pre-1970 history (lost in most software, restored here from the IANA "backzone" file)
  const utcOf = (y: number, mo: number, d: number, h: number, mi: number, tz: string) => {
    const r = resolveLocalTime({ year: y, month: mo, day: d, hour: h, minute: mi }, tz);
    return r.kind === 'ok' ? new Date(r.utcMs).toISOString().slice(0, 16) + 'Z' : r.kind;
  };
  rows.push(eqRow(R, 'Time', 'Stockholm, noon on July 1, 1945 (Sweden had no summer time)', '1945-07-01T11:00Z', utcOf(1945, 7, 1, 12, 0, 'Europe/Stockholm'), 'documented time-zone history'));
  rows.push(eqRow(R, 'Time', 'Oslo, noon on July 1, 1960 (Norwegian summer time)', '1960-07-01T10:00Z', utcOf(1960, 7, 1, 12, 0, 'Europe/Oslo'), 'documented time-zone history'));
  rows.push(eqRow(R, 'Time', 'Oslo, noon on July 1, 1970 (no summer time)', '1970-07-01T11:00Z', utcOf(1970, 7, 1, 12, 0, 'Europe/Oslo'), 'documented time-zone history'));
  rows.push(eqRow(R, 'Time', 'Copenhagen, noon on July 1, 1946 (Danish summer time)', '1946-07-01T10:00Z', utcOf(1946, 7, 1, 12, 0, 'Europe/Copenhagen'), 'documented time-zone history'));
  rows.push(eqRow(R, 'Time', 'Mexico City, noon on July 1, 1995 (no summer time yet)', '1995-07-01T18:00Z', utcOf(1995, 7, 1, 12, 0, 'America/Mexico_City'), 'documented time-zone history'));
  rows.push(eqRow(R, 'Time', 'Mexico City, noon on July 1, 2000 (summer time)', '2000-07-01T17:00Z', utcOf(2000, 7, 1, 12, 0, 'America/Mexico_City'), 'documented time-zone history'));
  rows.push(eqRow(R, 'Time', 'Mexico City, noon on July 1, 2023 (summer time abolished)', '2023-07-01T18:00Z', utcOf(2023, 7, 1, 12, 0, 'America/Mexico_City'), 'documented time-zone history'));
  // Cusp notes (within 1 degree of a sign boundary or house cusp), worked by hand from the astro.com sheets
  const refA = fixtures.charts[0];
  const refB = fixtures.charts[1];
  const chartOf = (fx: ChartFixture, time: string | null, date = fx.birth.date) => {
    const r = computeBlueprint({ date, time, place: { name: fx.birth.place, lat: fx.birth.lat, lon: fx.birth.lon, tz: fx.birth.tz }, nowMs: Date.UTC(2026, 10, 16) });
    if (r.status !== 'ok') throw new Error('engine did not return a chart');
    return r.facts;
  };
  const a = chartOf(refA, refA.birth.time);
  const b = chartOf(refB, refB.birth.time);
  const pl = (f: BlueprintFacts, id: string) => f.western.placements.find((p) => p.id === id);
  rows.push(eqRow(R, 'Cusps', 'Reference A: Saturn at 0\u00B014\' Aquarius sits at the edge of', 'Capricorn', pl(a, 'saturn')?.cusp?.neighborSign, 'astro.com Data Sheet'));
  rows.push(eqRow(R, 'Cusps', 'Reference A: Rockefellia at 0\u00B055\' Cancer sits at the edge of', 'Gemini', pl(a, 'rockefellia')?.cusp?.neighborSign, 'astro.com Data Sheet'));
  rows.push(eqRow(R, 'Cusps', 'Reference A: Sun at 3\u00B022\' Libra has no cusp note', 'none', pl(a, 'sun')?.cusp ? 'note' : 'none', 'astro.com Data Sheet'));
  rows.push(eqRow(R, 'Cusps', 'Reference B: Jupiter (7\u00B049\' Leo, house 3) is within 1\u00B0 of the cusp of house', 4, pl(b, 'jupiter')?.cusp?.neighborHouse, 'astro.com Data Sheet (IC at 8\u00B004\' Leo)'));
  rows.push(eqRow(R, 'Sabian degree', 'Reference B: Moon at 15\u00B019\' Capricorn rounds up to degree', 16, pl(b, 'moon')?.sabianDegree, 'brief section 4.2'));
  rows.push(eqRow(R, 'Summary', 'Reference B: chart ruler (Gemini rising)', 'mercury in Virgo, house 5', `${b.western.summary.chartRuler?.planet} in ${b.western.summary.chartRuler?.sign}, house ${b.western.summary.chartRuler?.house}`, 'astro.com Data Sheet'));
  rows.push(eqRow(R, 'Summary', 'Reference B: planets in their home sign', 'mercury, pluto, saturn', b.western.summary.domiciles.slice().sort().join(', '), 'modern rulerships'));
  rows.push(eqRow(R, 'Summary', 'Reference B: element count (fire/earth/air/water)', '1/6/2/1', (['fire', 'earth', 'air', 'water'] as const).map((e) => b.western.summary.elements[e].length).join('/'), 'astro.com Data Sheet'));
  rows.push(eqRow(R, 'Summary', 'Reference A: Part of Fortune uses the day formula', 'day chart', a.western.dayChart ? 'day chart' : 'night chart', 'astro.com Data Sheet (Sun in house 7)'));
  rows.push(eqRow(R, 'Summary', 'Reference B: Part of Fortune uses the night formula', 'night chart', b.western.dayChart ? 'day chart' : 'night chart', 'astro.com Data Sheet (Sun in house 5)'));
  // Unknown birth time
  const au = chartOf(refA, null);
  const hiddenIds = ['asc', 'mc', 'dc', 'ic', 'fortune'];
  rows.push(eqRow(R, 'Unknown birth time', 'Angles and Part of Fortune are hidden', 'hidden', hiddenIds.every((id) => !pl(au, id)) ? 'hidden' : 'shown', 'brief section 5'));
  rows.push(eqRow(R, 'Unknown birth time', 'No houses, no Sabian degrees', 'none', au.western.placements.some((p) => p.house || p.sabianDegree) ? 'present' : 'none', 'brief section 5'));
  rows.push(eqRow(R, 'Unknown birth time', 'No astrocartography, no hour animal', 'none', au.astrocartography || au.chinese?.hourAnimal ? 'present' : 'none', 'brief section 5'));
  rows.push(eqRow(R, 'Unknown birth time', 'Reference A date: Moon stays in one sign all day', 'Taurus (degree approximate)', `${pl(au, 'moon')?.possibleSigns ? pl(au, 'moon')?.possibleSigns?.join(' or ') : pl(au, 'moon')?.sign}${pl(au, 'moon')?.degreeApproximate ? ' (degree approximate)' : ''}`, 'astro.com Moon position and speed'));
  const au2 = chartOf(refA, null, '1991-09-28');
  rows.push(eqRow(R, 'Unknown birth time', 'Two days later the Moon changes sign: both are shown', 'Taurus or Gemini', pl(au2, 'moon')?.possibleSigns?.join(' or '), 'astro.com Moon position and speed'));
  rows.push(eqRow(R, 'Unknown birth time', 'Mayan, Life Path and year animal do not need the time', "8 Aq'ab'al / 1 / Goat", `${au.mayan.label} / ${au.numerology.lifePath} / ${au.chinese?.animal}`, 'same as Reference A'));
  // Chinese zodiac around Lunar New Year
  const cz = (y: number, m: number, d: number) => { const c = computeChinese(y, m, d, null); return c ? `${c.yinYang} ${c.element} ${c.animal}` : 'none'; };
  rows.push(eqRow(R, 'Chinese zodiac', 'Jan 26, 1990 (day before Lunar New Year)', 'Yin Earth Snake', cz(1990, 1, 26), 'Hong Kong Observatory: Lunar New Year 1990 = Jan 27'));
  rows.push(eqRow(R, 'Chinese zodiac', 'Jan 27, 1990 (Lunar New Year)', 'Yang Metal Horse', cz(1990, 1, 27), 'Hong Kong Observatory'));
  rows.push(eqRow(R, 'Chinese zodiac', 'Feb 3, 1954 (Lunar New Year)', 'Yang Wood Horse', cz(1954, 2, 3), 'Hong Kong Observatory'));
  rows.push(eqRow(R, 'Chinese zodiac', 'Feb 2, 1954', 'Yin Water Snake', cz(1954, 2, 2), 'Hong Kong Observatory'));
  rows.push(eqRow(R, 'Chinese zodiac', 'Feb 18, 2034 (third new moon year)', 'Yin Water Ox', cz(2034, 2, 18), 'Hong Kong Observatory: Lunar New Year 2034 = Feb 19'));
  rows.push(eqRow(R, 'Chinese zodiac', 'Jan 1, 2000', 'Yin Earth Rabbit', cz(2000, 1, 1), 'Hong Kong Observatory: Lunar New Year 2000 = Feb 5'));
  rows.push(eqRow(R, 'Chinese zodiac', 'Hour animal at 23:30', 'Rat', computeChinese(2000, 6, 1, 23)?.hourAnimal, 'two-hour branches'));
  rows.push(eqRow(R, 'Chinese zodiac', 'Hour animal at 00:30', 'Rat', computeChinese(2000, 6, 1, 0)?.hourAnimal, 'two-hour branches'));
  rows.push(eqRow(R, 'Chinese zodiac', 'Hour animal at 12:00', 'Horse', computeChinese(2000, 6, 1, 12)?.hourAnimal, 'two-hour branches'));
  // Numerology
  rows.push(eqRow(R, 'Numerology', 'Life Path for 1992-11-29 (11 + 11 + 3 = 25)', 7, dateNumbers(1992, 11, 29, 2026).lifePath, 'worked by hand'));
  rows.push(eqRow(R, 'Numerology', 'Life Path for 1979-12-22 (3 + 22 + 8 = 33, kept)', 33, dateNumbers(1979, 12, 22, 2026).lifePath, 'worked by hand'));
  rows.push(eqRow(R, 'Numerology', 'Life Path for 1984-02-04 (2 + 4 + 22 = 28 = 10 = 1)', 1, dateNumbers(1984, 2, 4, 2026).lifePath, 'worked by hand'));
  rows.push(eqRow(R, 'Numerology', 'Life Path for 2000-11-09 (11 + 9 + 2 = 22, kept)', 22, dateNumbers(2000, 11, 9, 2026).lifePath, 'worked by hand'));
  rows.push(eqRow(R, 'Numerology', 'Birthday number for the 29th (2 + 9 = 11, kept)', 11, dateNumbers(1990, 5, 29, 2026).birthday, 'worked by hand'));
  rows.push(eqRow(R, 'Numerology', 'Birthday number for the 22nd (kept)', 22, dateNumbers(1990, 5, 22, 2026).birthday, 'worked by hand'));
  rows.push(eqRow(R, 'Numerology', 'Personal Year 2026 for a Sept 26 birthday (9 + 8 + 1 = 18 = 9)', 9, dateNumbers(1991, 9, 26, 2026).personalYear, 'worked by hand'));
  rows.push(eqRow(R, 'Numerology', "Name cleanup: \"María-José O'Neil Ñandú\"", 'MARIAJOSEONEILNANDU', cleanName("María-José O'Neil Ñandú"), 'brief section 4.5'));
  const nn = nameNumbers('John Smith');
  rows.push(eqRow(R, 'Numerology', 'Expression for "John Smith" (20 + 24 = 44 = 8)', 8, nn?.expression, 'worked by hand'));
  rows.push(eqRow(R, 'Numerology', 'Soul Urge for "John Smith" (O 6 + I 9 = 15 = 6)', 6, nn?.soulUrge, 'worked by hand'));
  rows.push(eqRow(R, 'Numerology', 'Personality for "John Smith" (29 = 11, kept)', 11, nn?.personality, 'worked by hand'));
  rows.push(eqRow(R, 'Numerology', 'Accents do not change the result', JSON.stringify(nameNumbers('Andre Nunez')), JSON.stringify(nameNumbers('André Núñez')), 'brief section 4.5'));
  return rows;
}

export function runAccuracy(): Row[] {
  const rows: Row[] = [];
  for (const fx of fixtures.charts) rows.push(...runChart(fx));
  for (const fx of fixtures.extra as unknown as ExtraFixture[]) rows.push(...runExtra(fx));
  rows.push(...runRules());
  return rows;
}

export function summarize(rows: Row[]) {
  const failed = rows.filter((r) => !r.pass);
  return { total: rows.length, passed: rows.length - failed.length, failed: failed.length };
}
