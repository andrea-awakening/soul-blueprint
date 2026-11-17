// The guardrail that runs after every AI response. It checks that nothing in the text contradicts
// the engine's facts, and that the banned words, emojis and Dreamspell terms never get through.
// Pure functions, covered by tests/validate.test.ts.
import type { BlueprintFacts } from '../engine';
import type { Card } from '../reading/build';
import { SIGNS } from '../engine/zodiac';
import { NAWALES } from '../engine/mayan';
import { ANIMALS } from '../engine/chinese';
import type { NameNumbers } from '../engine/numerology';
import majorCities from '../../data/cities-major.json';

const SIGN_RE = SIGNS.join('|');
const BODY_WORDS: Record<string, string> = {
  sun: 'sun', moon: 'moon', mercury: 'mercury', venus: 'venus', mars: 'mars', jupiter: 'jupiter', saturn: 'saturn', uranus: 'uranus',
  neptune: 'neptune', pluto: 'pluto', chiron: 'chiron', lilith: 'lilith', 'black moon lilith': 'lilith', rockefellia: 'rockefellia',
  'north node': 'northNode', 'south node': 'southNode', ascendant: 'asc', rising: 'asc', 'rising sign': 'asc', midheaven: 'mc', mc: 'mc',
  descendant: 'dc', ic: 'ic', 'part of fortune': 'fortune',
};
const BODY_RE = 'Black Moon Lilith|Part of Fortune|North Node|South Node|Rising sign|Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron|Lilith|Rockefellia|Ascendant|Rising|Midheaven|Descendant|MC|IC';

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2608}\u{260C}-\u{263C}\u{2654}-\u{26B6}\u{26B9}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
const BANNED = [
  /\bgame[- ]changer/i, /\blevel(?:ing|ling)? up\b/i, /\blightworker/i, /\bjust manifest/i, /\bjust think positive/i, /\bhustl(?:e|ing)\b/i,
  /\bgrind(?:ing)?\b/i, /\bboss babe/i, /\byou will\b/i, /\byou'll\b/i, /\byou’ll\b/i, /\bdestined\b/i,
];
const DREAMSPELL = [
  /\bKin\b/, /\bkin\s+\d/i, /\bgalactic\b/i, /\bdreamspell\b/i, /\bwavespell\b/i, /\bskywalker\b/i, /\bworldbridger\b/i, /\bSeed\b/, /\bday sign[^.]{0,30}\bseed\b/i,
  /\b(?:Red|White|Blue|Yellow)\s+(?:Dragon|Wind|Night|Serpent|Hand|Star|Moon|Dog|Monkey|Human|Wizard|Eagle|Warrior|Earth|Mirror|Storm|Sun)\b/,
  /\b(?:Magnetic|Lunar|Electric|Self-Existing|Overtone|Rhythmic|Resonant|Planetary|Spectral|Crystal|Cosmic)\s+tone\b/i,
];
const FIRST_PERSON = [/\bwhen I was\b/i, /\bin my own (?:life|journey|experience)\b/i, /\bmy clients?\b/i, /\bI remember\b/i];

/** Checks that apply to every piece of generated text, in every chapter. */
export function generalProblems(text: string): string[] {
  const out: string[] = [];
  if (EMOJI.test(text)) out.push('contains an emoji or decorative symbol');
  for (const re of BANNED) if (re.test(text)) out.push(`uses a banned phrase (${re.source.replace(/\\b|\(\?:|\)|\\/g, '')})`);
  for (const re of FIRST_PERSON) if (re.test(text)) out.push('tells a personal story or speaks as a real person');
  if (/[*#_`]{2,}|^\s*[-*]\s/m.test(text)) out.push('uses markdown formatting');
  return out;
}

export function mayanProblems(text: string, facts: BlueprintFacts): string[] {
  const out: string[] = [];
  for (const re of DREAMSPELL) if (re.test(text)) out.push(`uses a Dreamspell term (${re.source.slice(0, 24)})`);
  const allowed = new Set([facts.mayan.nawal.kiche, facts.mayan.trecena.kiche]);
  for (const n of NAWALES) {
    if (n.kiche.length < 3 || allowed.has(n.kiche)) continue; // "E" and "Aj" are too short to match safely
    const re = new RegExp(`(^|[^\\p{L}'])${n.kiche.replace(/'/g, "['’]")}(?![\\p{L}'’])`, 'u');
    if (re.test(text)) out.push(`mentions the day sign ${n.kiche}, which is not in this Blueprint`);
  }
  for (const m of text.matchAll(/\btone\s+(?:of\s+)?(\d{1,2})\b/gi)) if (Number(m[1]) !== facts.mayan.tone) out.push(`says Tone ${m[1]} but the engine says Tone ${facts.mayan.tone}`);
  return out;
}

interface AstroOpts {
  /** Signs this card may mention without naming a placement (its own sign, a cusp neighbour...). */
  allowedSigns?: Set<string>;
  /** Houses this card may mention. Undefined = any house that belongs to a named placement. */
  allowedHouses?: Set<number>;
}

/** Every "Moon in Capricorn", "Capricorn Moon" and "Moon in the 8th house" must match the engine. */
export function astroProblems(text: string, facts: BlueprintFacts, opts: AstroOpts = {}): string[] {
  const out: string[] = [];
  const byId = new Map(facts.western.placements.map((p) => [p.id as string, p]));
  const covered: [number, number][] = [];
  const check = (bodyWord: string, sign: string, at: number, len: number) => {
    const id = BODY_WORDS[bodyWord.toLowerCase()];
    const p = id ? byId.get(id) : undefined;
    covered.push([at, at + len]);
    if (!p) { out.push(`mentions ${bodyWord} in ${sign}, but ${bodyWord} is not shown in this Blueprint`); return; }
    const ok = p.possibleSigns ? p.possibleSigns.includes(sign) : p.sign === sign;
    if (!ok) out.push(`says ${bodyWord} in ${sign} but the engine says ${p.possibleSigns ? p.possibleSigns.join(' or ') : p.sign}`);
  };
  const inRe = new RegExp(`\\b(${BODY_RE})(?:\\s+(?:is|sits|falls|lands|placed))?\\s+in\\s+(${SIGN_RE})\\b`, 'g');
  for (const m of text.matchAll(inRe)) check(m[1], m[2], m.index!, m[0].length);
  const adjRe = new RegExp(`\\b(${SIGN_RE})\\s+(${BODY_RE})\\b`, 'g');
  for (const m of text.matchAll(adjRe)) check(m[2], m[1], m.index!, m[0].length);

  const houseAllowed = new Set<number>(opts.allowedHouses ?? []);
  const bodyHouseRe = new RegExp(`\\b(${BODY_RE})(?:\\s+(?:is|sits|falls|lands|placed))?\\s+in\\s+(?:the|your)\\s+(\\d{1,2})(?:st|nd|rd|th)\\s+house`, 'gi');
  const coveredHouses: number[] = [];
  for (const m of text.matchAll(bodyHouseRe)) {
    const id = BODY_WORDS[m[1].toLowerCase()];
    const p = id ? byId.get(id) : undefined;
    coveredHouses.push(m.index!);
    if (!p || !p.house) out.push(`gives ${m[1]} a house, but the engine has none for it`);
    else if (p.house !== Number(m[2])) out.push(`says ${m[1]} in the ${m[2]}th house but the engine says house ${p.house}`);
  }
  for (const m of text.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)[\s-]+house\b/gi)) {
    const n = Number(m[1]);
    if (!facts.western.timeKnown) { out.push('mentions a house although the birth time is unknown'); continue; }
    if (n < 1 || n > 12) { out.push(`mentions a ${m[1]}th house, which does not exist`); continue; }
    if (coveredHouses.some((i) => m.index! > i && m.index! - i < 60)) continue;
    if (opts.allowedHouses && !houseAllowed.has(n)) out.push(`mentions the ${m[0]} but this card's facts do not include it`);
  }
  if (opts.allowedSigns) {
    for (const m of text.matchAll(new RegExp(`\\b(${SIGN_RE})\\b`, 'g'))) {
      if (covered.some(([a, b]) => m.index! >= a && m.index! < b)) continue;
      if (!opts.allowedSigns.has(m[1])) out.push(`mentions ${m[1]}, which is not part of this card's facts`);
    }
  }
  return out;
}

const HD_TYPES = ['Manifesting Generator', 'Manifestor', 'Generator', 'Projector', 'Reflector'];

export function hdProblems(text: string, facts: BlueprintFacts): string[] {
  const out: string[] = [];
  const hd = facts.humanDesign;
  const v = hd.timeKnown ? hd.chart : hd.stable;
  // Type names
  let rest = text;
  for (const t of HD_TYPES) {
    const re = new RegExp(`\\b${t}s?\\b`, 'g');
    if (re.test(rest)) {
      const fine = v.type === t || (t === 'Generator' && v.type === 'Manifesting Generator') || (t === 'Manifestor' && v.type === 'Manifesting Generator');
      if (!fine) out.push(`mentions the type ${t} but the engine says ${v.type ?? 'the type depends on the birth time'}`);
    }
    rest = rest.replace(re, ' ');
  }
  // Gates and channels
  const gates = new Set<number>();
  if (hd.timeKnown) hd.chart.gates.forEach((g) => gates.add(g));
  else {
    hd.stable.cross?.gates.forEach((g) => gates.add(g));
    hd.stable.channels?.forEach((c) => { gates.add(c.a); gates.add(c.b); });
  }
  for (const m of text.matchAll(/\bgates?\s+(\d{1,2})\b/gi)) if (!gates.has(Number(m[1]))) out.push(`mentions Gate ${m[1]}, which is not in this design`);
  const channels = new Set((v.channels ?? []).flatMap((c) => [`${c.a}-${c.b}`, `${c.b}-${c.a}`]));
  for (const m of text.matchAll(/\bchannel\s+(?:of\s+)?(\d{1,2})\s*[-–/]\s*(\d{1,2})\b/gi)) if (!channels.has(`${m[1]}-${m[2]}`)) out.push(`mentions Channel ${m[1]}-${m[2]}, which is not defined in this design`);
  for (const m of text.matchAll(/(?<![\d/])([1-6])\/([1-6])(?![\d/])/g)) if (v.profile !== `${m[1]}/${m[2]}`) out.push(`mentions profile ${m[0]} but the engine says ${v.profile ?? 'the profile depends on the birth time'}`);
  for (const m of text.matchAll(/\b(Emotional|Sacral|Splenic|Ego|Self-Projected|Mental|Lunar)\s+authority\b/g)) {
    if (!v.authority || !v.authority.startsWith(m[1])) out.push(`mentions ${m[0]} but the engine says ${v.authority ?? 'the authority depends on the birth time'}`);
  }
  return out;
}

export function numerologyProblems(text: string, facts: BlueprintFacts, names: NameNumbers | null): string[] {
  const out: string[] = [];
  const values: Record<string, number | undefined> = {
    'life path': facts.numerology.lifePath, birthday: facts.numerology.birthday, 'personal year': facts.numerology.personalYear,
    expression: names?.expression, 'soul urge': names?.soulUrge, personality: names?.personality,
  };
  const re = /\b(Life Path|Birthday|Personal Year|Expression|Soul Urge|Personality)(?:\s+number)?(?:\s+(?:is|of))?\s+(\d{1,2})\b/gi;
  for (const m of text.matchAll(re)) {
    const expected = values[m[1].toLowerCase()];
    if (expected === undefined) out.push(`gives a ${m[1]} number, but none was calculated`);
    else if (expected !== Number(m[2])) out.push(`says ${m[1]} ${m[2]} but the engine says ${expected}`);
  }
  return out;
}

export function chineseProblems(text: string, facts: BlueprintFacts): string[] {
  const out: string[] = [];
  const c = facts.chinese;
  if (!c) return out;
  const allowed = new Set([c.animal, c.hourAnimal].filter(Boolean) as string[]);
  for (const a of ANIMALS) {
    if (allowed.has(a)) continue;
    if (new RegExp(`\\b(?:year|hour|sign) of the ${a}\\b|\\b(?:Wood|Fire|Earth|Metal|Water) ${a}\\b|\\b${a} (?:year|hour)\\b`).test(text)) out.push(`mentions the ${a}, which is not in this Blueprint`);
  }
  for (const m of text.matchAll(new RegExp(`\\b(Wood|Fire|Earth|Metal|Water) (${ANIMALS.join('|')})\\b`, 'g'))) {
    if (m[2] === c.animal && m[1] !== c.element) out.push(`says ${m[0]} but the engine says ${c.element} ${c.animal}`);
  }
  return out;
}

/** Years in generated life-cycle text must be years the engine listed for that card. */
export function yearProblems(text: string, allowedYears: Set<string>): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\b(19|20)\d{2}\b/g)) if (!allowedYears.has(m[0])) out.push(`mentions the year ${m[0]}, which is not one of this card's dates`);
  return out;
}

/** Signs and houses a placement card may mention without tying them to a named placement. */
export function cardAstroScope(card: Card, facts: BlueprintFacts): AstroOpts {
  const p = facts.western.placements.find((x) => x.id === card.planetId);
  if (!p) return {};
  const signs = new Set<string>(p.possibleSigns ?? [p.sign]);
  if (p.cusp?.neighborSign) signs.add(p.cusp.neighborSign);
  // A node or angle card may name its opposite point's sign.
  const opposite: Record<string, string> = { northNode: 'southNode', southNode: 'northNode', asc: 'dc', dc: 'asc', mc: 'ic', ic: 'mc' };
  const opp = facts.western.placements.find((x) => x.id === opposite[p.id]);
  if (opp) (opp.possibleSigns ?? [opp.sign]).forEach((s) => signs.add(s));
  const houses = new Set<number>();
  if (p.house) houses.add(p.house);
  if (p.cusp?.neighborHouse) houses.add(p.cusp.neighborHouse);
  const angleHouse: Record<string, number> = { asc: 1, ic: 4, dc: 7, mc: 10 };
  if (angleHouse[p.id] && facts.western.timeKnown) houses.add(angleHouse[p.id]);
  if (opp?.house) houses.add(opp.house);
  return { allowedSigns: signs, allowedHouses: houses };
}

// City names that are also everyday English words: too risky to match.
const PLACE_STOP = new Set(['Nice', 'Reading', 'Mobile', 'Bath', 'Split', 'Male', 'Orange', 'Victoria', 'Independence', 'Enterprise', 'Surprise', 'Hope', 'Bend', 'Normal', 'Liberal', 'Union', 'Central', 'Mission', 'Summit', 'Paradise', 'Eden', 'Home', 'Rest', 'Love', 'Light', 'Sun', 'Moon', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Neptune', 'Pluto', 'Mercury', 'Uranus', 'Europe', 'Asia', 'Africa', 'America', 'Pacific', 'Atlantic', 'Georgia', 'Jersey', 'Guinea', 'Chad', 'Jordan', 'Turkey', 'China', 'Unity', 'Concord', 'Providence', 'Progress', 'Grace', 'Faith', 'Harmony', 'Liberty', 'Freedom', 'Victory', 'Sunrise', 'Aurora', 'Florence', 'Regina', 'Sofia', 'Santiago', 'Valencia', 'Columbia', 'Washington', 'Lincoln', 'Jackson', 'Madison', 'Carmel', 'David', 'Roman', 'Rome', 'Most', 'Bar', 'Man', 'Van', 'Ho', 'Wa', 'Bo', 'Buy', 'Kent', 'Ray', 'Sale', 'Mary', 'Same', 'Tours', 'Lead', 'Deal', 'Angels']);
const plain = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
let placeIndex: { names: Map<string, string>; re: RegExp } | null = null;
function places() {
  if (placeIndex) return placeIndex;
  const names = new Map<string, string>(); // name -> kind
  for (const [city, country] of majorCities as [string, string, number, number, number][]) {
    // Each name is also matched without its accents ("Reykjavik" for "Reykjavík").
    for (const [name, kind] of [[city, 'city'], [country, 'country']] as const) {
      for (const n of new Set([name, plain(name)])) if (n.length >= 4 && !PLACE_STOP.has(n) && /^\p{Lu}/u.test(n)) names.set(n, kind);
    }
  }
  const alts = [...names.keys()].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  placeIndex = { names, re: new RegExp(`(?<![\\p{L}\\p{N}'’-])(?:${alts.join('|')})(?![\\p{L}\\p{N}-])`, 'gu') };
  return placeIndex;
}

/** Astrocartography text may only name cities and countries that sit on this person's own lines. */
export function placeProblems(text: string, facts: BlueprintFacts): string[] {
  const acg = facts.astrocartography;
  const allowed = new Set<string>();
  for (const l of acg?.lines ?? []) for (const c of l.cities) for (const n of [c.name, c.country]) { allowed.add(n); allowed.add(plain(n)); }
  const out: string[] = [];
  for (const m of text.matchAll(places().re)) if (!allowed.has(m[0])) out.push(`names ${m[0]}, which is not one of the places near this person's lines`);
  return out;
}

/**
 * When a sentence names specific lines ("Sun MC", "Moon DSC") together with places, every place in that
 * sentence must really sit on one of the lines it names.
 */
export function linePlaceProblems(text: string, facts: BlueprintFacts): string[] {
  const acg = facts.astrocartography;
  if (!acg) return [];
  const out: string[] = [];
  const lineRe = /\b(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\s+(MC|IC|ASC|DSC)\b/g;
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const named = [...sentence.matchAll(lineRe)].map((m) => acg.lines.find((l) => l.planet === m[1].toLowerCase() && l.angle === m[2]));
    if (!named.length) continue;
    const ok = new Set<string>();
    for (const l of named) for (const c of l?.cities ?? []) for (const n of [c.name, c.country]) { ok.add(n); ok.add(plain(n)); }
    for (const m of sentence.matchAll(places().re)) if (!ok.has(m[0])) out.push(`says ${m[0]} is on ${[...sentence.matchAll(lineRe)].map((x) => x[0]).join(' or ')}, but the engine does not place it there`);
  }
  return out;
}

/** All checks for one piece of text belonging to a chapter (and optionally to one card). */
export function problemsFor(text: string, chapter: number, facts: BlueprintFacts, names: NameNumbers | null, card?: Card): string[] {
  const out = generalProblems(text);
  if (!text.trim()) return out;
  const scope = card && card.kind === 'placement' ? cardAstroScope(card, facts) : {};
  if (chapter === 1 || chapter >= 6) out.push(...astroProblems(text, facts, chapter === 1 ? scope : {}));
  if (chapter === 2 || chapter >= 8) out.push(...hdProblems(text, facts));
  if (chapter === 3 || chapter >= 8) out.push(...mayanProblems(text, facts));
  if (chapter === 4 || chapter >= 8) out.push(...numerologyProblems(text, facts, names));
  if (chapter === 5 || chapter >= 8) out.push(...chineseProblems(text, facts));
  if (chapter === 6) out.push(...placeProblems(text, facts), ...linePlaceProblems(text, facts));
  if (chapter === 7 && card?.list) out.push(...yearProblems(text, new Set(card.list.items.flatMap((i) => i.text.match(/\b(?:19|20)\d{2}\b/g) ?? []))));
  return [...new Set(out)];
}
