// Pythagorean numerology. Pure functions: safe to run in the browser, so the full name never has to leave the device.
const LETTER: Record<string, number> = {};
'AJS BKT CLU DMV ENW FOX GPY HQZ IR'.split(' ').forEach((group, i) => {
  for (const ch of group) LETTER[ch] = i + 1;
});
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']); // Y is treated as a consonant

const digitSum = (n: number) => String(Math.abs(n)).split('').reduce((s, d) => s + Number(d), 0);

/** Reduce to a single digit. Master numbers 11, 22 and 33 are never reduced, at any step. */
export function reduceNumber(n: number): number {
  let x = n;
  while (x > 9 && x !== 11 && x !== 22 && x !== 33) x = digitSum(x);
  return x;
}

/** Strip accents (é -> e, ñ -> n) and drop everything that is not a letter A-Z. */
export function cleanName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[Øø]/g, 'O')
    .replace(/[Ææ]/g, 'AE')
    .replace(/[Œœ]/g, 'OE')
    .replace(/[Łł]/g, 'L')
    .replace(/[Đđ]/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

export interface DateNumbers {
  lifePath: number;
  birthday: number;
  personalYear: number;
  personalYearFor: number;
}

export function dateNumbers(year: number, month: number, day: number, currentYear: number): DateNumbers {
  const lifePath = reduceNumber(reduceNumber(month) + reduceNumber(day) + reduceNumber(digitSum(year)));
  const birthday = reduceNumber(day);
  const personalYear = reduceNumber(reduceNumber(month) + reduceNumber(day) + reduceNumber(digitSum(currentYear)));
  return { lifePath, birthday, personalYear, personalYearFor: currentYear };
}

export interface NameNumbers {
  expression: number;
  soulUrge: number;
  personality: number;
}

/** Only when the full birth name was given. Returns null if the name has no usable letters. */
export function nameNumbers(fullName: string): NameNumbers | null {
  const letters = cleanName(fullName);
  if (letters.length < 2) return null;
  let all = 0;
  let vowels = 0;
  let consonants = 0;
  for (const ch of letters) {
    const v = LETTER[ch];
    all += v;
    if (VOWELS.has(ch)) vowels += v;
    else consonants += v;
  }
  return { expression: reduceNumber(all), soulUrge: reduceNumber(vowels), personality: reduceNumber(consonants) };
}
