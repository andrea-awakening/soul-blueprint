// Traditional Mayan count (K'iche'), GMT correlation 584283: the count kept by Maya daykeepers in Guatemala today.
import { julianDayNumber } from './jdn';

export const GMT_CORRELATION = 584283;

export const NAWALES: { kiche: string; meaning: string; yucatec: string }[] = [
  { kiche: 'Imox', meaning: 'Water, the deep unconscious', yucatec: 'Imix' },
  { kiche: "Iq'", meaning: 'Wind, breath', yucatec: "Ik'" },
  { kiche: "Aq'ab'al", meaning: 'Dawn, first light', yucatec: "Ak'bal" },
  { kiche: "K'at", meaning: 'Net, web', yucatec: "K'an" },
  { kiche: 'Kan', meaning: 'Serpent', yucatec: 'Chikchan' },
  { kiche: 'Kame', meaning: 'Death and rebirth', yucatec: 'Kimi' },
  { kiche: 'Kej', meaning: 'Deer', yucatec: "Manik'" },
  { kiche: "Q'anil", meaning: 'Ripening, new life', yucatec: 'Lamat' },
  { kiche: 'Toj', meaning: 'Offering, sacred fire', yucatec: 'Muluk' },
  { kiche: "Tz'i'", meaning: 'Dog, loyalty and law', yucatec: 'Ok' },
  { kiche: "B'atz'", meaning: 'Thread of life, monkey', yucatec: 'Chuwen' },
  { kiche: 'E', meaning: 'Road, the path', yucatec: 'Eb' },
  { kiche: 'Aj', meaning: 'Reed, staff, home', yucatec: 'Ben' },
  { kiche: "I'x", meaning: 'Jaguar', yucatec: 'Ix' },
  { kiche: "Tz'ikin", meaning: 'Bird, vision', yucatec: 'Men' },
  { kiche: 'Ajmaq', meaning: 'Forgiveness, the ancestors', yucatec: 'Kib' },
  { kiche: "No'j", meaning: 'Thought, wisdom', yucatec: 'Kaban' },
  { kiche: 'Tijax', meaning: 'Obsidian blade', yucatec: "Etz'nab" },
  { kiche: 'Kawoq', meaning: 'Storm, community', yucatec: 'Kawak' },
  { kiche: 'Ajpu', meaning: 'Sun, the hunter', yucatec: 'Ajaw' },
];

export interface MayanResult {
  tone: number; // 1-13
  nawal: { index: number; kiche: string; meaning: string; yucatec: string };
  trecena: { index: number; kiche: string; meaning: string; yucatec: string };
  label: string; // "8 Kawoq"
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** From the local civil birth date. */
export function computeMayan(year: number, month: number, day: number): MayanResult {
  const jdn = julianDayNumber(year, month, day);
  const days = jdn - GMT_CORRELATION;
  const tone = mod(days + 3, 13) + 1;
  const index = mod(days + 19, 20);
  // Trecena: the day sign of the day, in the same 13-day cycle, that carries tone 1.
  const trecenaIndex = mod(index - (tone - 1), 20);
  return {
    tone,
    nawal: { index, ...NAWALES[index] },
    trecena: { index: trecenaIndex, ...NAWALES[trecenaIndex] },
    label: `${tone} ${NAWALES[index].kiche}`,
  };
}
