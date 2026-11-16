// "Learn More": the collapsed reference guide of each chapter, built from the fixed library.
import type { BlueprintFacts } from '../engine';
import {
  PLANET_INFO, SIGN_INFO, HOUSE_INFO, ASPECT_INFO, ELEMENT_INFO, MODALITY_INFO, HD_TYPE_INFO, HD_AUTHORITY_INFO, HD_CENTER_INFO, HD_LINE_INFO, HD_GATES,
  NAWAL_INFO, TONE_INFO, NUMBER_INFO, NUMBER_ROLE, ANIMAL_INFO, CHINESE_ELEMENT_INFO, ACG_PLANET_INFO, ACG_ANGLE_INFO, CYCLE_INFO, THEME_INFO,
} from './library';
import { NAWALES } from '../engine/mayan';

export interface GuideSection { heading: string; rows?: [string, string][]; paragraphs?: string[] }

const ord = (n: number) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

export function guideFor(chapter: number, facts: BlueprintFacts): { title: string; sections: GuideSection[] } {
  switch (chapter) {
    case 1:
      return {
        title: 'Full astrology reference guide',
        sections: [
          { heading: 'The four elements', paragraphs: Object.values(ELEMENT_INFO) },
          { heading: 'The three modalities', paragraphs: Object.values(MODALITY_INFO) },
          { heading: 'The planets and points', rows: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'lilith', 'rockefellia', 'fortune', 'northNode', 'southNode'].map((k) => [k === 'northNode' ? 'North Node' : k === 'southNode' ? 'South Node' : k === 'fortune' ? 'Part of Fortune' : k === 'rockefellia' ? '904 Rockefellia' : k[0].toUpperCase() + k.slice(1), PLANET_INFO[k].guide]) },
          { heading: 'The angles', rows: [['Ascendant', PLANET_INFO.asc.guide], ['Descendant', PLANET_INFO.dc.guide], ['Midheaven', PLANET_INFO.mc.guide], ['IC', PLANET_INFO.ic.guide]] },
          { heading: 'The twelve signs', rows: Object.entries(SIGN_INFO).map(([s, i]) => [s, `${i.qualities[0].toUpperCase()}${i.qualities.slice(1)}. ${i.element[0].toUpperCase()}${i.element.slice(1)}, ${i.modality}.`]) },
          { heading: 'The twelve houses (where the energy plays out)', rows: HOUSE_INFO.map((h, i) => [`${ord(i + 1)}: ${h.short}`, h.areas[0].toUpperCase() + h.areas.slice(1) + '.']) },
          { heading: 'Aspects (how planets talk to each other)', paragraphs: Object.values(ASPECT_INFO).map((a) => a.guide) },
          { heading: 'Retrogrades', paragraphs: ["A planet retrograde at birth means its themes are worked through inwardly and revisited over a lifetime, instead of expressed outwardly right away. It's not a flaw, just a different rhythm."] },
          { heading: 'Degree meanings', paragraphs: ['Each of the 360 degrees of the zodiac has its own theme, from a tradition called the Sabian symbols. A placement at 15°18\' belongs to degree 16: it always rounds up. The theme is woven into each reading in our own words.'] },
          { heading: 'How this was calculated', paragraphs: [
            'Every position comes from the Swiss Ephemeris, the same astronomical engine professional astrologers use. Tropical zodiac, True Node, mean Black Moon Lilith.',
            facts.meta.timeKnown
              ? `Moment used: ${facts.meta.utc?.replace('T', ' at ').replace('Z', ' UTC')} (${facts.meta.utcOffset} at ${facts.meta.place}). Latitude ${facts.meta.lat.toFixed(4)}, longitude ${facts.meta.lon.toFixed(4)}. Time zone ${facts.meta.zone} (IANA database ${facts.meta.tzVersion}). Houses: ${facts.meta.houseSystem}.`
              : `Birth time unknown: calculated for noon, midnight and 11:59 PM at ${facts.meta.place} (${facts.meta.zone}), and compared. Only what stays the same all day is shown.`,
            ...facts.meta.notes,
            'Aspect orbs: 8° with the Sun or Moon, 6° otherwise, 3° for a quincunx and for anything involving Chiron, Lilith, Rockefellia, the nodes or the Part of Fortune.',
          ] },
        ],
      };
    case 2:
      return {
        title: 'Human Design reference guide',
        sections: [
          { heading: 'What is Human Design?', paragraphs: ['A system that blends astrology, the I Ching, Kabbalah and the chakras into a practical map of how your energy is built to work. It is calculated from two moments: your birth, and the moment about 88 days earlier when the Sun was exactly 88 degrees behind its birth position.'] },
          { heading: 'The five Types (what kind of vehicle you are)', rows: Object.entries(HD_TYPE_INFO).map(([t, i]) => [t, i.summary]) },
          { heading: 'Strategy (how to start the engine)', rows: Object.entries(HD_TYPE_INFO).map(([t, i]) => [t, i.strategy]) },
          { heading: 'Authority (your GPS)', rows: Object.entries(HD_AUTHORITY_INFO).map(([a, i]) => [a, i.gps]) },
          { heading: 'The nine centers', rows: Object.entries(HD_CENTER_INFO).map(([c, i]) => [c, `${i.theme}. Defined: ${i.defined} Open: ${i.open}`]) },
          { heading: 'Profile lines (your driving style)', rows: Object.entries(HD_LINE_INFO).map(([n, i]) => [`${n} ${i.name}`, i.text]) },
          { heading: 'Gates, channels and the Incarnation Cross', paragraphs: ['Gates are 64 specific themes. A channel forms when the gates at both of its ends are active, which defines the two centers it connects. Your Incarnation Cross is formed by the four gates of your Sun and Earth, at birth and at the earlier Design moment.'] },
          { heading: 'The 64 gates', rows: Object.entries(HD_GATES).map(([n, [name, key]]) => [`Gate ${n}`, `${name}: ${key}.`]) },
        ],
      };
    case 3:
      return {
        title: 'Mayan astrology reference guide',
        sections: [
          { heading: 'What is this calendar?', paragraphs: [
            'The sacred calendar of 260 days pairs 20 day signs (nawales) with 13 tones. It has been counted without a break for well over two thousand years.',
            'This reading uses the traditional count kept by K\'iche\' Maya daykeepers in the highlands of Guatemala today (correlation 584283). It is a different system from the modern "Dreamspell" calendar, which gives different results.',
          ] },
          { heading: 'The 20 nawales', rows: NAWALES.map((n, i) => [`${n.kiche}`, `${n.meaning}. The energy of ${NAWAL_INFO[i].essence}. Yucatec name: ${n.yucatec}.`]) },
          { heading: 'The 13 tones', rows: Object.entries(TONE_INFO).map(([n, t]) => [`Tone ${n}`, t[0].toUpperCase() + t.slice(1) + '.']) },
          { heading: 'The trecena', paragraphs: ['A trecena is a run of 13 days, counted from tone 1 to tone 13. It takes its name from the day sign that opens it. The trecena you were born in is the wider current underneath your own day.'] },
        ],
      };
    case 4:
      return {
        title: 'Numerology reference guide',
        sections: [
          { heading: 'Your core numbers', paragraphs: Object.values(NUMBER_ROLE) },
          { heading: 'What each number means', rows: Object.entries(NUMBER_INFO).map(([n, i]) => [n, i.keywords[0].toUpperCase() + i.keywords.slice(1) + '.']) },
          { heading: 'How it is calculated', paragraphs: [
            'Pythagorean letter values: A J S = 1, B K T = 2, C L U = 3, D M V = 4, E N W = 5, F O X = 6, G P Y = 7, H Q Z = 8, I R = 9.',
            'Life Path: the month, day and year are each reduced to one digit, added together, and reduced again. Master numbers 11, 22 and 33 are never reduced, at any step.',
            'Names: accents are removed (é becomes e, ñ becomes n), and hyphens, apostrophes and spaces are ignored. All letters are added together, then reduced. Vowels are A, E, I, O and U. Y is treated as a consonant.',
          ] },
        ],
      };
    case 5:
      return {
        title: 'Chinese zodiac reference guide',
        sections: [
          { heading: 'The twelve animals', rows: Object.entries(ANIMAL_INFO).map(([a, i]) => [a, i.qualities[0].toUpperCase() + i.qualities.slice(1) + '.']) },
          { heading: 'The five elements', rows: Object.entries(CHINESE_ELEMENT_INFO).map(([e, t]) => [e, t[0].toUpperCase() + t.slice(1) + '.']) },
          { heading: 'Yin and yang', paragraphs: ['Every year is yin or yang. Yang years are more outward and active. Yin years are more inward and receptive.'] },
          { heading: 'How it is calculated', paragraphs: [
            'The Chinese year starts at Lunar New Year, which falls between late January and mid February. If you were born before it, you belong to the previous year. The dates used here match the Hong Kong Observatory tables for 1901 to 2100.',
            'The inner animal comes from the two-hour window of the local clock time you were born in: Rat 11 PM to 1 AM, Ox 1 to 3 AM, and so on through the twelve animals.',
          ] },
        ],
      };
    case 6:
      return {
        title: 'Astrocartography reference guide',
        sections: [
          { heading: 'The four kinds of line', rows: Object.entries(ACG_ANGLE_INFO).map(([a, t]) => [`${a} line`, `Where a planet was ${a === 'MC' ? 'highest in the sky' : a === 'IC' ? 'directly underfoot' : a === 'ASC' ? 'rising' : 'setting'}. It touches ${t}.`]) },
          { heading: 'What each planet brings', rows: Object.entries(ACG_PLANET_INFO).map(([p, t]) => [p[0].toUpperCase() + p.slice(1), t[0].toUpperCase() + t.slice(1) + '.']) },
          { heading: 'How to read it', paragraphs: ['Each line is a zone a few hundred miles wide, not an exact point. Cities listed are large cities within about 300 km (190 miles) of a line. The lines are calculated from the Swiss Ephemeris positions at your birth moment.'] },
        ],
      };
    case 7:
      return {
        title: 'Life cycles reference guide',
        sections: [
          { heading: 'The cycles', rows: Object.entries(CYCLE_INFO).map(([k, t]) => [k, t]) },
          { heading: 'How the dates are found', paragraphs: ['The ephemeris is searched for the exact day each planet comes back to the place it held at your birth. Planets sometimes move backward for a while as seen from Earth, so one return can have two or three passes. Every pass is listed.'] },
        ],
      };
    case 8:
      return {
        title: 'How your themes were found',
        sections: [
          { heading: 'The method', paragraphs: ['Each reading card in your Blueprint was tagged with up to three themes from one fixed list. The tags were then counted across the systems: Western astrology, Human Design, Mayan astrology, numerology and the Chinese zodiac. The themes shown are the ones that appear in at least three different systems. If fewer than three themes reach that bar, the strongest themes found in two systems are added, and every theme lists its exact sources.'] },
          { heading: 'The full list of themes', rows: Object.entries(THEME_INFO).map(([t, d]) => [t[0].toUpperCase() + t.slice(1), d]) },
        ],
      };
    default:
      return {
        title: 'About this chapter',
        sections: [{ heading: 'How this was written', paragraphs: ['These directions grow out of your top themes and, if you wrote any, your journal reflections. They are possibilities to explore, not career advice, and not a promise about income or outcomes.'] }],
      };
  }
}
