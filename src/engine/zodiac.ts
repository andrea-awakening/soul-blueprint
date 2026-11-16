// Shared zodiac facts and formatting. Pure data, safe to use in the browser.
export const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] as const;
export type SignName = (typeof SIGNS)[number];

export const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export const ELEMENTS = ['fire', 'earth', 'air', 'water'] as const;
export type Element = (typeof ELEMENTS)[number];
export const MODALITIES = ['cardinal', 'fixed', 'mutable'] as const;
export type Modality = (typeof MODALITIES)[number];

export function elementOf(signIndex: number): Element {
  return ELEMENTS[signIndex % 4];
}
export function modalityOf(signIndex: number): Modality {
  return MODALITIES[signIndex % 3];
}

/** Modern rulerships, by sign index. */
export const RULERS = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'pluto', 'jupiter', 'saturn', 'uranus', 'neptune'] as const;

export function signIndexOf(lon: number): number {
  return Math.floor((((lon % 360) + 360) % 360) / 30);
}

export interface DegParts {
  signIndex: number;
  sign: SignName;
  deg: number; // whole degrees within the sign, 0-29
  min: number; // whole arcminutes, 0-59
  sec: number; // arcseconds (decimal)
  inSign: number; // decimal degrees within the sign
}

export function degParts(lon: number): DegParts {
  const l = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(l / 30);
  const inSign = l - signIndex * 30;
  const deg = Math.floor(inSign);
  const minFloat = (inSign - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  return { signIndex, sign: SIGNS[signIndex], deg, min, sec, inSign };
}

/** "4°40'" : degrees and minutes within the sign (truncated, the way astro.com prints them). */
export function fmtDegMin(lon: number): string {
  const p = degParts(lon);
  return `${p.deg}°${String(p.min).padStart(2, '0')}'`;
}

export function fmtFull(lon: number): string {
  const p = degParts(lon);
  return `${p.deg}°${String(p.min).padStart(2, '0')}'${String(Math.floor(p.sec)).padStart(2, '0')}" ${p.sign}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Sabian degree: always round up to the next whole degree (15°18' -> degree 16). */
export function sabianDegree(lon: number): number {
  return degParts(lon).deg + 1;
}
