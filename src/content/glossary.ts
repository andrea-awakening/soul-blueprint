// Tap-for-definition glossary. Short, plain definitions. `chapters` limits a term to the chapters where it applies.
import { PLANET_INFO, SIGN_INFO, HOUSE_INFO, ASPECT_INFO, HD_TYPE_INFO, HD_CENTER_INFO, NUMBER_ROLE } from './library';
import { NAWALES } from '../engine/mayan';

export interface Term {
  term: string; // matched as a whole word, ignoring case
  def: string;
  chapters?: number[];
}

const ASTRO = [1, 6, 7, 8, 9];
const HD = [2, 8, 9];
const MAYA = [3, 8, 9];
const NUM = [4, 8, 9];
const CN = [5, 8, 9];

const terms: Term[] = [];
const add = (term: string, def: string, chapters?: number[]) => terms.push({ term, def, chapters });

// Western astrology
const planetNames: [string, string][] = [
  ['Sun', 'sun'], ['Moon', 'moon'], ['Mercury', 'mercury'], ['Venus', 'venus'], ['Mars', 'mars'], ['Jupiter', 'jupiter'], ['Saturn', 'saturn'],
  ['Uranus', 'uranus'], ['Neptune', 'neptune'], ['Pluto', 'pluto'], ['Chiron', 'chiron'], ['Lilith', 'lilith'], ['Rockefellia', 'rockefellia'],
  ['North Node', 'northNode'], ['South Node', 'southNode'], ['Part of Fortune', 'fortune'], ['Ascendant', 'asc'], ['Midheaven', 'mc'], ['Descendant', 'dc'], ['IC', 'ic'],
];
for (const [name, key] of planetNames) add(name, PLANET_INFO[key].guide, ASTRO);
add('Rising', 'Your rising sign is the sign of your Ascendant: how you meet the world and how others first see you.', ASTRO);
for (const [sign, info] of Object.entries(SIGN_INFO)) add(sign, `${sign} (${info.element}, ${info.modality}): ${info.qualities}.`, ASTRO);
HOUSE_INFO.forEach((h, i) => {
  const n = i + 1;
  const ord = n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
  add(`${ord} house`, `The ${ord} house covers ${h.areas}.`, ASTRO);
});
add('house', 'One of twelve areas of life in your chart. A planet\'s house shows where in life its energy is most active.', ASTRO);
add('houses', 'Twelve areas of life in your chart. A planet\'s house shows where in life its energy is most active.', ASTRO);
add('conjunct', ASPECT_INFO.conjunction.guide, ASTRO);
add('conjunction', ASPECT_INFO.conjunction.guide, ASTRO);
add('sextile', ASPECT_INFO.sextile.guide, ASTRO);
add('square', ASPECT_INFO.square.guide, ASTRO);
add('trine', ASPECT_INFO.trine.guide, ASTRO);
add('opposite', ASPECT_INFO.opposition.guide, ASTRO);
add('opposition', ASPECT_INFO.opposition.guide, ASTRO);
add('quincunx', ASPECT_INFO.quincunx.guide, ASTRO);
add('aspect', 'An angle between two planets that shows how those two parts of you talk to each other.', ASTRO);
add('aspects', 'Angles between planets that show how different parts of you talk to each other.', ASTRO);
add('retrograde', 'A planet that appeared to move backward at your birth. Its themes are worked through inwardly and revisited over time. It is a different rhythm, not a flaw.', ASTRO);
add('stellium', 'Three or more planets in the same sign or house. A strong concentration of energy in that area.', ASTRO);
add('chart ruler', 'The planet that rules your rising sign. It carries extra weight in your whole chart.', ASTRO);
add('home sign', 'A planet in the sign it rules. It expresses itself easily and strongly there.', ASTRO);
add('element', 'Fire, earth, air or water. Each sign belongs to one, and it describes the sign\'s basic temperament.', [1, 8, 9]);
add('modality', 'Cardinal, fixed or mutable: whether a sign tends to start things, sustain them or adapt.', ASTRO);
add('Big Three', 'Your Sun, Moon and rising sign. Together they give the quickest sketch of who you are.', ASTRO);
add('birth chart', 'A map of where the Sun, Moon and planets were at the moment and place you were born.', ASTRO);

// Human Design
for (const [type, info] of Object.entries(HD_TYPE_INFO)) add(type, `${type}: ${info.summary}`, HD);
add('Type', 'In Human Design, your Type is the kind of vehicle you are: how your energy is built to work.', HD);
add('Strategy', 'How to start the engine. The way your Type is built to enter into things so they go smoothly.', HD);
add('Authority', 'Your GPS. The part of you that makes trustworthy decisions, before the mind gets involved.', HD);
add('Profile', 'Your driving style. Two numbers that describe how you learn and how you meet the world.', HD);
add('Incarnation Cross', 'The overall theme of your life in Human Design, formed by the four gates of your Sun and Earth.', HD);
add('bodygraph', 'The Human Design chart: nine centers connected by channels.', HD);
add('center', 'One of nine energy hubs in the body. Defined centers run on their own fuel. Open centers borrow fuel from people around you.', HD);
add('centers', 'Nine energy hubs in the body. Defined centers run on their own fuel. Open centers borrow fuel from people around you.', HD);
add('defined', 'Consistent and reliable in you. A defined center works the same way every day.', HD);
add('channel', 'A line connecting two centers. When both of its gates are active in you, the channel and both centers are defined.', HD);
add('channels', 'Lines connecting two centers. When both gates of a channel are active in you, the channel and both centers are defined.', HD);
add('gate', 'One of 64 specific themes in Human Design, each tied to a center.', HD);
add('gates', '64 specific themes in Human Design, each tied to a center.', HD);
for (const [name, info] of Object.entries(HD_CENTER_INFO)) {
  if (name === 'G' || name === 'Heart' || name === 'Head' || name === 'Root') add(`${name} center`, `${name} center: ${info.theme.toLowerCase()}.`, HD);
  else add(name, `${name} center: ${info.theme.toLowerCase()}.`, HD);
}
add('Splenic', 'Splenic authority: a quiet, instant knowing that speaks once, in the moment.', HD);
add('Emotional', 'Emotional authority: clarity comes over time, after the emotional wave has passed.', HD);
add('not-self', 'The feeling that shows up when you are living against your design. It is a signal, not a failure.', HD);

// Mayan
add('nawal', 'Your day sign in the traditional Mayan calendar: the energy of the day you were born.', MAYA);
add('day sign', 'Also called the nawal: the energy of the day you were born in the traditional Mayan calendar.', MAYA);
add('tone', 'A number from 1 to 13 that travels with your day sign and describes how its energy moves.', MAYA);
add('trecena', 'The 13-day period you were born into. It is named for the day sign that opened it.', MAYA);
add('daykeepers', 'Maya calendar keepers in the highlands of Guatemala, who have counted the sacred days without a break for centuries.', MAYA);
for (const n of NAWALES) add(n.kiche, `${n.kiche}: ${n.meaning}. One of the 20 day signs. Known as ${n.yucatec} in Yucatec Maya.`, MAYA);

// Numerology
add('Life Path', NUMBER_ROLE.lifePath, NUM);
add('Birthday number', NUMBER_ROLE.birthday, NUM);
add('Personal Year', NUMBER_ROLE.personalYear, NUM);
add('Expression', NUMBER_ROLE.expression, NUM);
add('Soul Urge', NUMBER_ROLE.soulUrge, NUM);
add('Personality', NUMBER_ROLE.personality, [4]);
add('master number', '11, 22 and 33. They are never reduced to a single digit, and they carry extra intensity.', NUM);
add('master numbers', '11, 22 and 33. They are never reduced to a single digit, and they carry extra intensity.', NUM);

// Chinese zodiac
add('yin', 'The receptive, inward, steady side of energy. Paired with yang.', CN);
add('yang', 'The active, outward, expressive side of energy. Paired with yin.', CN);
add('Lunar New Year', 'The start of the Chinese year, on a new moon in late January or February. Your year animal changes here, not on January 1.', CN);
add('inner animal', 'The animal of the two-hour window you were born in. It describes your more private self.', CN);
add('year animal', 'The animal of the Chinese year you were born in. It describes your basic nature.', CN);

// Astrocartography and cycles
add('astrocartography', 'A world map of where each planet was rising, setting, overhead or underfoot at your birth.', [6, 8, 9]);
add('MC line', 'Where a planet was highest in the sky at your birth. It touches career and public life.', [6]);
add('IC line', 'Where a planet was directly underfoot at your birth. It touches home and private life.', [6]);
add('ASC line', 'Where a planet was rising at your birth. It touches your identity and vitality.', [6]);
add('DSC line', 'Where a planet was setting at your birth. It touches partnerships and the people you meet.', [6]);
add('return', 'The moment a planet comes back to the exact place it held when you were born.', [7]);
add('Saturn return', 'Saturn coming back to its birth position, around ages 29 and 58. A time of growing up into yourself.', [7, 8, 9]);
add('Jupiter return', 'Jupiter coming back to its birth position, about every 12 years. A new chapter of growth.', [7]);
add('Chiron return', 'Chiron coming back to its birth position, around age 50. Old wounds return to be met with what you have learned.', [7]);
add('Nodal return', 'The Moon\'s nodes coming back to their birth position, about every 18 to 19 years. A reset of direction.', [7]);
add('Uranus opposition', 'Uranus reaching the point opposite its birth position, around ages 40 to 44. A push toward the parts of you not yet lived.', [7]);

// Longest terms first, so "North Node" wins over "Node" and "5th house" over "house".
export const GLOSSARY: Term[] = terms.sort((a, b) => b.term.length - a.term.length);

export function termsForChapter(chapter: number): Term[] {
  return GLOSSARY.filter((t) => !t.chapters || t.chapters.includes(chapter));
}
