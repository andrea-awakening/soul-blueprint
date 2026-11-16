// Chinese zodiac. The year changes at Lunar New Year, not on January 1.
// Dates come from data/lunar-new-year.json (1900-2100), verified against the Hong Kong Observatory tables.
import lunarNewYear from '../../data/lunar-new-year.json';

export const ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'] as const;
const STEM_ELEMENTS = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'] as const;

export interface ChineseResult {
  /** The Chinese year the birth belongs to (the Gregorian year in which that Chinese year began). */
  chineseYear: number;
  animal: string;
  element: string;
  yinYang: 'Yin' | 'Yang';
  /** True when the birthday falls in January or February before that year's Lunar New Year. */
  beforeNewYear: boolean;
  lunarNewYearDate: string; // "1991-02-15": the Lunar New Year that started this person's Chinese year
  /** Lunar New Year in the Western calendar year of the birth (the date the birthday is compared with). */
  birthYearNewYear: string;
  hourAnimal: string | null;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

export function computeChinese(year: number, month: number, day: number, hour: number | null): ChineseResult | null {
  const table = lunarNewYear as Record<string, string>;
  const lny = table[String(year)];
  if (!lny) return null; // outside 1900-2100: never guess
  const [m, d] = lny.split('-').map(Number);
  const beforeNewYear = month < m || (month === m && day < d);
  const chineseYear = beforeNewYear ? year - 1 : year;
  const started = table[String(chineseYear)];
  if (!started) return null;
  const stem = mod(chineseYear - 4, 10);
  const branch = mod(chineseYear - 4, 12);
  // Two-hour branches of the local clock: Rat 23:00-00:59, Ox 01:00-02:59, and so on.
  const hourAnimal = hour === null ? null : ANIMALS[Math.floor(mod(hour + 1, 24) / 2)];
  return {
    chineseYear,
    animal: ANIMALS[branch],
    element: STEM_ELEMENTS[stem],
    yinYang: stem % 2 === 0 ? 'Yang' : 'Yin',
    beforeNewYear,
    lunarNewYearDate: `${chineseYear}-${started}`,
    birthYearNewYear: `${year}-${lny}`,
    hourAnimal,
  };
}
