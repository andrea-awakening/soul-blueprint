// Thin wrapper around the Swiss Ephemeris (the `sweph` Node binding).
// Every planetary number in Soul Blueprint comes from here. No hand-written planet math.
import path from 'node:path';
import sweph from 'sweph';

const c = sweph.constants;
let ready = false;

export function initSwe(): void {
  if (ready) return;
  sweph.set_ephe_path(path.join(process.cwd(), 'ephe'));
  ready = true;
}

export const BODY = {
  sun: c.SE_SUN,
  moon: c.SE_MOON,
  mercury: c.SE_MERCURY,
  venus: c.SE_VENUS,
  mars: c.SE_MARS,
  jupiter: c.SE_JUPITER,
  saturn: c.SE_SATURN,
  uranus: c.SE_URANUS,
  neptune: c.SE_NEPTUNE,
  pluto: c.SE_PLUTO,
  trueNode: c.SE_TRUE_NODE,
  meanNode: c.SE_MEAN_NODE,
  chiron: c.SE_CHIRON,
  lilith: c.SE_MEAN_APOG, // Black Moon Lilith (mean)
  rockefellia: c.SE_AST_OFFSET + 904, // asteroid 904 (not 1924, which is Horus)
} as const;

export type BodyKey = keyof typeof BODY;

export function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

/** Signed smallest difference a - b, in (-180, 180]. */
export function angDiff(a: number, b: number): number {
  let d = norm360(a - b);
  if (d > 180) d -= 360;
  return d;
}

/** Julian Day (UT) for a UTC calendar moment. */
export function julianDayUT(y: number, m: number, d: number, hourDecimal: number): number {
  return sweph.julday(y, m, d, hourDecimal, c.SE_GREG_CAL);
}

export function jdFromDate(date: Date): number {
  return (
    julianDayUT(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600,
    )
  );
}

export function dateFromJd(jd: number): Date {
  // JD 2440587.5 = 1970-01-01T00:00:00Z
  return new Date(Math.round((jd - 2440587.5) * 86400000));
}

export interface BodyPos {
  lon: number; // tropical ecliptic longitude, 0-360
  lat: number;
  speed: number; // degrees per day
}

/**
 * Tropical geocentric apparent position from the Swiss Ephemeris data files.
 * Throws if the data files are missing: we never silently fall back to a less exact method.
 */
export function calc(jdUT: number, body: number): BodyPos {
  initSwe();
  const flags = c.SEFLG_SWIEPH | c.SEFLG_SPEED;
  const r = sweph.calc_ut(jdUT, body, flags);
  if (r.flag < 0 || (r.flag & c.SEFLG_SWIEPH) === 0) {
    throw new Error(`Swiss Ephemeris could not calculate body ${body}: ${r.error || 'ephemeris files missing'}`);
  }
  return { lon: norm360(r.data[0]), lat: r.data[1], speed: r.data[3] };
}

export interface EquatorialPos {
  ra: number; // right ascension, degrees
  dec: number; // declination, degrees
}

export function calcEquatorial(jdUT: number, body: number): EquatorialPos {
  initSwe();
  const flags = c.SEFLG_SWIEPH | c.SEFLG_SPEED | c.SEFLG_EQUATORIAL;
  const r = sweph.calc_ut(jdUT, body, flags);
  if (r.flag < 0 || (r.flag & c.SEFLG_SWIEPH) === 0) {
    throw new Error(`Swiss Ephemeris could not calculate body ${body}: ${r.error || 'ephemeris files missing'}`);
  }
  return { ra: norm360(r.data[0]), dec: r.data[1] };
}

export interface HouseResult {
  system: 'Placidus' | 'Porphyry';
  cusps: number[]; // index 0 = 1st house cusp ... index 11 = 12th
  asc: number;
  mc: number;
  armc: number;
}

/** Placidus houses; Porphyry above about 66 degrees latitude or if Placidus fails. */
export function houses(jdUT: number, lat: number, lon: number): HouseResult {
  initSwe();
  const polar = Math.abs(lat) >= 66;
  if (!polar) {
    const r = sweph.houses(jdUT, lat, lon, 'P');
    if (r.flag >= 0) {
      return { system: 'Placidus', cusps: r.data.houses.slice(0, 12), asc: r.data.points[0], mc: r.data.points[1], armc: r.data.points[2] };
    }
  }
  const r = sweph.houses(jdUT, lat, lon, 'O');
  return { system: 'Porphyry', cusps: r.data.houses.slice(0, 12), asc: r.data.points[0], mc: r.data.points[1], armc: r.data.points[2] };
}

/** Greenwich apparent sidereal time in degrees. */
export function gstDegrees(jdUT: number): number {
  initSwe();
  return norm360(sweph.sidtime(jdUT) * 15);
}
