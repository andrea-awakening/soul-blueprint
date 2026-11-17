// Turns the engine's facts into chapters made of cards.
// Every card starts with a neutral, deterministic text built from the fixed library ("fallback").
// The AI may later replace the wording, never the facts: headlines, meta lines, sources and lists of
// placements all come from here.
import type { BlueprintFacts } from '../engine';
import type { Placement, Aspect } from '../engine/western';
import { SHORT_NAME, type PlacementId } from '../engine/placements';
import { ordinal } from '../engine/zodiac';
import type { NameNumbers } from '../engine/numerology';
import { sabianTheme } from '../content/sabian';
import {
  SIGN_INFO, PLANET_INFO, PLANET_SHORT, HOUSE_INFO, ASPECT_INFO, HD_TYPE_INFO, HD_AUTHORITY_INFO, HD_CENTER_INFO, HD_LINE_INFO, HD_GATES,
  NAWAL_INFO, TONE_INFO, NUMBER_INFO, NUMBER_ROLE, ANIMAL_INFO, CHINESE_ELEMENT_INFO, acgLineMeaning, CYCLE_INFO,
  THEME_INFO, type Theme,
} from '../content/library';
import { CHAPTERS, UNKNOWN_TIME_LINE, DEPENDS_ON_TIME, ADD_NAME_NOTE, ROCKEFELLIA_OPENER, ACG_ZONE_LINE } from '../content/copy';

export type SystemName = 'Western astrology' | 'Human Design' | 'Mayan astrology' | 'Numerology' | 'Chinese zodiac';

export interface ListItem { id: string; lead: string; text: string }

export interface Card {
  id: string;
  kind: 'summary' | 'placement' | 'hd' | 'mayan' | 'number' | 'animal' | 'place' | 'cycle' | 'themes' | 'note';
  headline: string;
  symbol?: string;
  symbolStyle?: 'glyph' | 'mono';
  meta?: string;
  overview?: string;
  paragraphs: string[];
  list?: { label: string; items: ListItem[] };
  /** Small quiet line under the text (for example "This depends on your exact birth time."). */
  note?: string;
  /** For Soul Themes: where a tag on this card comes from. */
  system?: SystemName;
  source?: string;
  tags: Theme[];
  /** Soul Themes: the exact sources a theme came from. */
  sources?: string;
  /** Soul's Work: lived-experience prompts, each with its own text box. */
  prompts?: string[];
  planetId?: PlacementId;
  viz?: 'wheel' | 'elements' | 'modalities' | 'centers' | 'map' | 'timeline' | 'constellation';
  /** Facts handed to the AI for this card. Removed before the chapter is sent to the browser. */
  ai?: Record<string, unknown>;
  /** Which AI request writes this card. */
  part?: string;
  /** A section heading (with an ornament) shown above this card. */
  section?: string;
  sectionNote?: string;
  /** The grand finale card of a chapter. */
  finale?: boolean;
  /** Astrocartography: which map tab this card belongs to. */
  group?: string;
}

export interface Chapter {
  n: number;
  topNote?: string;
  cards: Card[];
  synthesis: string[];
  journal: string[];
  /** 'fallback' until AI text has been merged in. */
  parts: Record<string, 'fallback' | 'ai'>;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const houseName = (n: number) => `${ordinal(n)} house`;

function aspectLead(a: Aspect): string {
  return `${SHORT_NAME[a.a]} ${a.verb} ${SHORT_NAME[a.b]}`;
}
/** Order-independent id, so the same aspect shares one text under both planets. */
export function aspectId(a: Aspect): string {
  return ['asp', ...[a.a, a.b].sort(), a.type].join('-');
}

function placementHeadline(p: Placement): string {
  if (p.possibleSigns) return `${p.name} in ${p.possibleSigns[0]} or ${p.possibleSigns[1]}`;
  return `${p.name} in ${p.sign}`;
}

function placementMeta(p: Placement, timeKnown: boolean): string {
  const bits: string[] = [];
  if (p.chartRuler) bits.push('Chart ruler');
  if (p.id === 'asc') bits.push('Rising sign');
  if (p.house) bits.push(`${cap(houseName(p.house))}`.replace('house', 'House'));
  if (timeKnown) bits.push(p.degree);
  else if (!p.possibleSigns) bits.push(`about ${p.degree.split('°')[0]}°`, 'degree approximate');
  if (p.retrograde) bits.push('Retrograde');
  if (p.domicile) bits.push('Home sign');
  return bits.join(' · ');
}

/** Said inside the reading whenever a planet sits in the sign it rules. */
export function homeSentence(p: Placement): string {
  return `${p.sign} is ${SHORT_NAME[p.id]}'s home sign, so this placement is especially strong.`;
}

function placementFallback(p: Placement): string[] {
  const planet = PLANET_INFO[p.id];
  const out: string[] = [];
  const short = SHORT_NAME[p.id];
  if (p.possibleSigns) {
    const [a, b] = p.possibleSigns;
    out.push(
      `The ${short} changed signs on the day you were born, so without your birth time it could be in ${a} or in ${b}. Both are shown here, so you can see which one feels true.`,
      `In ${a}, your ${planet.domain} would work through ${SIGN_INFO[a].qualities}. In ${b}, it would work through ${SIGN_INFO[b].qualities}.`,
    );
    return out;
  }
  const sign = SIGN_INFO[p.sign];
  let first = `Your ${short} covers ${planet.domain}. In ${p.sign}, it works through ${sign.qualities}.`;
  if (p.id === 'rockefellia') first = `${ROCKEFELLIA_OPENER} In ${p.sign}, it suggests an approach to wealth shaped by ${sign.qualities}.`;
  if (p.domicile) first += ` ${homeSentence(p)}`;
  if (p.retrograde) first += ` It was retrograde at your birth, so you work through these themes inwardly and revisit them over time.`;
  out.push(first);
  if (p.house) {
    let second = `In the ${houseName(p.house)}, this shows up most in ${HOUSE_INFO[p.house - 1].areas}.`;
    if (p.sabianDegree) second += ` The degree it sits on carries a theme of ${sabianTheme(p.signIndex, p.sabianDegree)}.`;
    out.push(second);
  } else if (p.sabianDegree) {
    out.push(`The degree it sits on carries a theme of ${sabianTheme(p.signIndex, p.sabianDegree)}.`);
  }
  const cusp = cuspSentences(p);
  if (cusp) out.push(cusp);
  return out;
}

/** The quiet cusp sentence(s). Used in the fallback text and appended if the AI leaves it out. */
export function cuspSentences(p: Placement): string {
  if (!p.cusp) return '';
  const short = SHORT_NAME[p.id];
  const bits: string[] = [];
  if (p.cusp.neighborSign) {
    const n = p.cusp.neighborSign;
    bits.push(`Your ${short} sits right at the edge of ${n}, so you may feel some of that energy too. ${n} adds ${SIGN_INFO[n].qualities}.`);
  }
  if (p.cusp.neighborHouse) {
    const h = p.cusp.neighborHouse;
    bits.push(`It also sits right at the edge of the ${houseName(h)}, so ${HOUSE_INFO[h - 1].areas} may be part of the picture too.`);
  }
  return bits.join(' ');
}

function listNames(ids: PlacementId[]): string {
  const names = ids.map((id) => SHORT_NAME[id]);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// ---------------------------------------------------------------- Chapter 1
/** Only the five main aspects are shown, and only the tightest few for each planet. The engine still calculates all of them. */
const MAIN_ASPECTS = new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition']);
const MAX_ASPECTS = 4;
export function shownAspects(p: Placement): Aspect[] {
  return p.aspects.filter((a) => MAIN_ASPECTS.has(a.type)).slice(0, MAX_ASPECTS); // already sorted, tightest orb first
}

function chapter1(f: BlueprintFacts): Chapter {
  const w = f.western;
  const s = w.summary;
  const cards: Card[] = [];
  const signTags = (sign: string): Theme[] => SIGN_INFO[sign]?.tags.slice(0, 2) ?? [];

  // 1. The chart wheel
  cards.push({
    id: 'c1-wheel', kind: 'summary', headline: 'Your Chart Wheel', viz: 'wheel', part: 'none',
    paragraphs: [w.timeKnown
      ? 'This is the sky at the moment you were born. Each symbol is a planet. As you read about a planet below, it lights up on the wheel.'
      : 'This is the sky on the day you were born. Each symbol is a planet. As you read about a planet below, it lights up on the wheel.'],
    tags: [],
  });

  // 2. Element balance
  cards.push({
    id: 'c1-elements', kind: 'summary', headline: 'Element Balance', viz: 'elements', part: 'd',
    paragraphs: [
      (['fire', 'earth', 'air', 'water'] as const).map((e) => `${cap(e)}: ${s.elements[e].length}${s.elements[e].length ? ` (${listNames(s.elements[e])})` : ''}`).join('. ') + '.',
      `Counted across your ten planets. A strong element comes naturally to you. A light one is something you grow into or look for in other people.`,
    ],
    tags: [],
    ai: { element_counts: Object.fromEntries(Object.entries(s.elements).map(([k, v]) => [k, v.map((id) => SHORT_NAME[id])])) },
  });

  // 3. Big Three
  const big = [`Your Sun is in ${s.bigThree.sun}`];
  if (s.bigThree.moon) big.push(`your Moon is in ${s.bigThree.moon}`);
  if (s.bigThree.rising) big.push(`your rising sign is ${s.bigThree.rising}`);
  const elementCounts = (Object.entries(s.elements) as [string, PlacementId[]][]).sort((a, b) => b[1].length - a[1].length);
  cards.push({
    id: 'c1-bigthree', kind: 'summary', headline: 'Your Big Three', part: 'd',
    paragraphs: [
      `${big.length > 1 ? `${big.slice(0, -1).join(', ')} and ${big[big.length - 1]}` : big[0]}. These three are the quickest sketch of who you are: your core self, your emotional world${s.bigThree.rising ? ' and the way you meet life' : ''}.`,
      `Your chart leans most toward ${elementCounts[0][0]}${elementCounts[1][1].length ? ` and ${elementCounts[1][0]}` : ''}, so your nature is ${elementCounts[0][0] === 'fire' ? 'energetic and action-led' : elementCounts[0][0] === 'earth' ? 'practical and grounded' : elementCounts[0][0] === 'air' ? 'curious and idea-led' : 'feeling-led and intuitive'}.`,
    ],
    tags: [],
    ai: { big_three: s.bigThree, strongest_elements: elementCounts.filter((e) => e[1].length).slice(0, 2).map((e) => `${e[0]} (${e[1].length} planets)`) },
  });

  // 4. Each placement
  const partOf: Record<string, string> = {
    sun: 'a', moon: 'a', asc: 'a', mercury: 'a', venus: 'a', mars: 'a', jupiter: 'a',
    saturn: 'b', uranus: 'b', neptune: 'b', pluto: 'b', mc: 'b', dc: 'b', ic: 'b',
    rockefellia: 'c', chiron: 'c', lilith: 'c', fortune: 'c', northNode: 'c', southNode: 'c',
  };
  for (const p of w.placements) {
    const card: Card = {
      id: `c1-${p.id}`, kind: 'placement', planetId: p.id, part: partOf[p.id],
      headline: placementHeadline(p), symbol: p.symbol, symbolStyle: p.id === 'rockefellia' ? 'mono' : 'glyph',
      meta: placementMeta(p, w.timeKnown), overview: p.overview,
      paragraphs: placementFallback(p),
      system: 'Western astrology', source: placementHeadline(p),
      tags: p.possibleSigns ? [] : signTags(p.sign),
      ai: {
        placement: SHORT_NAME[p.id], covers: p.overview, means: PLANET_INFO[p.id].domain,
        ...(p.possibleSigns
          ? { possible_signs: p.possibleSigns, why: 'It changed signs on the birth date and the birth time is unknown. Describe both signs briefly and say why both are shown.' }
          : { sign: p.sign, sign_keywords: SIGN_INFO[p.sign].qualities }),
        ...(p.house ? { house: p.house, house_keywords: HOUSE_INFO[p.house - 1].areas } : {}),
        ...(p.sabianDegree && !p.possibleSigns ? { degree_theme: sabianTheme(p.signIndex, p.sabianDegree) } : {}),
        ...(p.retrograde ? { retrograde: true } : {}),
        ...(p.domicile ? { in_home_sign: true, home_sign_sentence: homeSentence(p) } : {}),
        ...(p.chartRuler ? { is_chart_ruler: true } : {}),
        ...(p.cusp?.neighborSign ? { at_edge_of_sign: p.cusp.neighborSign, edge_sign_keywords: SIGN_INFO[p.cusp.neighborSign].qualities } : {}),
        ...(p.cusp?.neighborHouse ? { at_edge_of_house: p.cusp.neighborHouse, edge_house_keywords: HOUSE_INFO[p.cusp.neighborHouse - 1].areas } : {}),
        ...(p.id === 'rockefellia' ? { must_open_with: ROCKEFELLIA_OPENER } : {}),
      },
    };
    const aspects = shownAspects(p);
    if (aspects.length) {
      card.list = {
        label: 'Strongest aspects',
        items: aspects.map((a) => ({
          id: aspectId(a), lead: aspectLead(a),
          text: `${PLANET_SHORT[a.a]} and ${PLANET_SHORT[a.b]} ${ASPECT_INFO[a.type].fallback}.`,
        })),
      };
    }
    cards.push(card);
  }
  if (!w.timeKnown) {
    cards.push({
      id: 'c1-hidden', kind: 'note', headline: 'What needs your birth time', part: 'none',
      paragraphs: ['Your Ascendant, Descendant, Midheaven, IC, houses, Part of Fortune and degree meanings all depend on the exact minute you were born, so they are left out. If you find your birth time later, you can come back and enter it to see the full chart.'],
      tags: [],
    });
  }

  // 5. Chart Patterns: chart ruler, modality balance, retrogrades, stelliums
  const patterns: Card[] = [];
  if (s.chartRuler) {
    patterns.push({
      id: 'c1-ruler', kind: 'summary', headline: `Your Chart Ruler: ${s.chartRuler.name}`, part: 'd',
      meta: `${s.chartRuler.name} in ${s.chartRuler.sign}${s.chartRuler.house ? ` · ${ordinal(s.chartRuler.house)} House` : ''}`,
      // The first paragraph (how it was found) is fixed. The AI only adds what it means.
      paragraphs: [
        `Your Ascendant is in ${s.bigThree.rising}. ${s.bigThree.rising} is ruled by ${s.chartRuler.name}, so ${s.chartRuler.name} is your chart ruler.`,
        `The chart ruler sets the tone for the whole chart, so ${s.chartRuler.name} in ${s.chartRuler.sign}${s.chartRuler.house ? ` in the ${houseName(s.chartRuler.house)}` : ''} carries extra weight in your life.`,
      ],
      tags: [],
      ai: { rising_sign: s.bigThree.rising, chart_ruler: s.chartRuler.name, ruler_sign: s.chartRuler.sign, ruler_house: s.chartRuler.house, already_shown_first: `Your Ascendant is in ${s.bigThree.rising}. ${s.bigThree.rising} is ruled by ${s.chartRuler.name}, so ${s.chartRuler.name} is your chart ruler.` },
    });
  }
  patterns.push({
    id: 'c1-modalities', kind: 'summary', headline: 'Modality Balance', viz: 'modalities', part: 'd',
    paragraphs: [
      (['cardinal', 'fixed', 'mutable'] as const).map((m) => `${cap(m)}: ${s.modalities[m].length}${s.modalities[m].length ? ` (${listNames(s.modalities[m])})` : ''}`).join('. ') + '.',
      'Cardinal energy starts things, fixed energy sustains them, and mutable energy adapts.',
    ],
    tags: [],
    ai: { modality_counts: Object.fromEntries(Object.entries(s.modalities).map(([k, v]) => [k, v.map((id) => SHORT_NAME[id])])) },
  });
  patterns.push({
    id: 'c1-retro', kind: 'summary', headline: 'Retrograde Planets', part: 'd',
    paragraphs: [
      s.retrogrades.length
        ? `${listNames(s.retrogrades)} ${s.retrogrades.length === 1 ? 'was' : 'were'} retrograde when you were born. A retrograde planet works inwardly: you process its themes privately and revisit them over time. It is a different rhythm, not a flaw.`
        : 'No planets were retrograde when you were born. Your planetary energies express themselves outwardly and directly.',
    ],
    tags: [],
    ai: { retrograde: s.retrogrades.map((id) => SHORT_NAME[id]) },
  });
  patterns.push({
    id: 'c1-stelliums', kind: 'summary', headline: 'Stelliums', part: 'd',
    paragraphs: [
      s.stelliums.length
        ? s.stelliums.map((st) => `${listNames(st.planets)} gather in ${st.kind === 'sign' ? st.where : `your ${houseName(Number(st.where))}`}.`).join(' ') + ' Three or more planets together form a stellium: a strong concentration of energy, and a major focus of your life.'
        : 'You have no stellium (three or more planets in one sign or house). Your energy is spread across more areas of life.',
    ],
    tags: [],
    ai: { stelliums: s.stelliums.map((st) => ({ in: st.kind === 'sign' ? st.where : houseName(Number(st.where)), planets: st.planets.map((id) => SHORT_NAME[id]) })) },
  });
  patterns[0].section = 'Chart Patterns';
  patterns[0].sectionNote = 'The bigger shapes your placements make together.';
  cards.push(...patterns);

  // 6. Major Life Themes, the finale (fallback: the tags that appear most across the placements)
  const tally = new Map<Theme, string[]>();
  for (const c of cards) if (c.kind === 'placement') for (const t of c.tags) tally.set(t, [...(tally.get(t) || []), c.source!]);
  const top = [...tally.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 4);
  cards.push({
    id: 'c1-lifethemes', kind: 'themes', headline: 'Major Life Themes', part: 'd', finale: true,
    overview: 'What your whole chart keeps pointing to',
    paragraphs: [],
    list: { label: '', items: top.map(([t, src], i) => ({ id: `lt-${i}`, lead: `The ${cap(t.split('/')[0])}`, text: `${src.slice(0, 4).join(', ')} point this way. ${THEME_INFO[t]}` })) },
    tags: [],
    ai: { instruction: 'Return 3 or 4 named archetypes with one sentence of evidence each.' },
  });

  const chapter: Chapter = {
    n: 1, cards,
    topNote: w.timeKnown ? undefined : UNKNOWN_TIME_LINE,
    synthesis: [
      `With your Sun in ${s.bigThree.sun}${s.bigThree.moon ? `, your Moon in ${s.bigThree.moon}` : ''}${s.bigThree.rising ? ` and ${s.bigThree.rising} rising` : ''}, your chart describes one person seen from many angles. The themes above are the ones it repeats most, and they are the ones you are here to live.`,
    ],
    journal: CHAPTERS[0].journalFallback,
    parts: { a: 'fallback', b: 'fallback', c: 'fallback', d: 'fallback', e: 'fallback' },
  };
  return chapter;
}

// ---------------------------------------------------------------- Chapter 2
function chapter2(f: BlueprintFacts): Chapter {
  const cards: Card[] = [];
  const hd = f.humanDesign;
  const known = hd.timeKnown;
  const v = known ? hd.chart : hd.stable;
  const sys: SystemName = 'Human Design';
  const pending = (id: string, headline: string): Card => ({ id, kind: 'hd', headline, paragraphs: [], note: DEPENDS_ON_TIME, tags: [], part: 'none' });

  if (v.type) {
    const t = HD_TYPE_INFO[v.type];
    cards.push({
      id: 'c2-type', kind: 'hd', headline: `Type: ${v.type}`, overview: 'What kind of vehicle you are', part: 'a', system: sys, source: v.type,
      paragraphs: [`You are ${t.vehicle}. ${t.summary}`, `When you live this well, the feeling to look for is ${v.signature?.toLowerCase()}. When you push against it, ${v.notSelf?.toLowerCase()} tends to show up. That feeling is a signal, not a failure.`],
      tags: t.tags.slice(0, 2),
      ai: { type: v.type, vehicle_image: t.vehicle, meaning: t.summary, feels_like_when_aligned: v.signature, signal_when_off: v.notSelf },
    });
    cards.push({
      id: 'c2-strategy', kind: 'hd', headline: `Strategy: ${v.strategy}`, overview: 'How to start the engine', part: 'a',
      paragraphs: [t.strategy],
      tags: [],
      ai: { strategy: v.strategy, meaning: t.strategy, type: v.type },
    });
  } else {
    cards.push(pending('c2-type', 'Type'), pending('c2-strategy', 'Strategy'));
  }
  if (v.authority) {
    const a = HD_AUTHORITY_INFO[v.authority];
    cards.push({
      id: 'c2-authority', kind: 'hd', headline: `Authority: ${v.authority}`, overview: 'Your GPS for decisions', part: 'a', system: sys, source: `${v.authority.split(' (')[0]} authority`,
      paragraphs: [a.gps],
      tags: a.tags,
      ai: { authority: v.authority, meaning: a.gps },
    });
  } else cards.push(pending('c2-authority', 'Authority'));
  if (v.profile && v.profileNames) {
    const [l1, l2] = v.profile.split('/').map(Number);
    cards.push({
      id: 'c2-profile', kind: 'hd', headline: `Profile: ${v.profile} ${v.profileNames[0]} / ${v.profileNames[1]}`, overview: 'Your driving style', part: 'a', system: sys, source: `Profile ${v.profile}`,
      paragraphs: [],
      list: { label: 'The two lines', items: [
        { id: 'line-a', lead: `Line ${l1}, ${v.profileNames[0]}`, text: HD_LINE_INFO[l1].text },
        { id: 'line-b', lead: `Line ${l2}, ${v.profileNames[1]}`, text: HD_LINE_INFO[l2].text },
      ] },
      tags: [HD_LINE_INFO[l1].tags[0], HD_LINE_INFO[l2].tags[0]],
      ai: { profile: v.profile, line_one: `${l1} ${v.profileNames[0]}: ${HD_LINE_INFO[l1].text}`, line_two: `${l2} ${v.profileNames[1]}: ${HD_LINE_INFO[l2].text}` },
    });
  } else cards.push(pending('c2-profile', 'Profile'));
  if (v.definedCenters && v.openCenters) {
    cards.push({
      id: 'c2-defined', kind: 'hd', headline: 'Defined Centers', overview: 'The parts of your engine that run on their own fuel', viz: 'centers', part: 'a',
      paragraphs: v.definedCenters.length ? [] : ['You have no defined centers. Every center is open, which is the mark of a Reflector.'],
      list: v.definedCenters.length ? { label: '', items: v.definedCenters.map((c) => ({ id: `def-${c}`, lead: c === 'G' ? 'G center' : c, text: `${HD_CENTER_INFO[c].theme.toLowerCase()}. ${HD_CENTER_INFO[c].defined}` })) } : undefined,
      tags: [],
      ai: { defined_centers: v.definedCenters.map((c) => `${c}: ${HD_CENTER_INFO[c].theme}`) },
    });
    cards.push({
      id: 'c2-open', kind: 'hd', headline: 'Open Centers', overview: 'Where you borrow fuel from the people around you', part: 'a',
      paragraphs: v.openCenters.length ? ['Open is not a weakness. It is where you take in the world and grow wise about it.'] : ['You have no open centers.'],
      list: v.openCenters.length ? { label: '', items: v.openCenters.map((c) => ({ id: `open-${c}`, lead: c === 'G' ? 'G center' : c, text: `${HD_CENTER_INFO[c].theme.toLowerCase()}. ${HD_CENTER_INFO[c].open}` })) } : undefined,
      tags: [],
      ai: { open_centers: v.openCenters.map((c) => `${c}: ${HD_CENTER_INFO[c].theme}`) },
    });
  } else cards.push(pending('c2-defined', 'Defined and Open Centers'));
  if (v.channels) {
    cards.push({
      id: 'c2-channels', kind: 'hd', headline: 'Defined Channels', overview: 'Your consistent life-force themes', part: 'a', system: sys,
      source: v.channels.length ? v.channels.map((c) => `Channel ${c.a}-${c.b}`).join(', ') : undefined,
      paragraphs: v.channels.length ? [] : ['You have no defined channels.'],
      list: v.channels.length ? { label: '', items: v.channels.map((c) => ({
        id: `ch-${c.a}-${c.b}`, lead: `Channel ${c.a}-${c.b}, ${c.name}`,
        text: `Connects your ${c.centers[0]} and ${c.centers[1]}. Gate ${c.a} (${HD_GATES[c.a][0]}: ${HD_GATES[c.a][1]}) meets Gate ${c.b} (${HD_GATES[c.b][0]}: ${HD_GATES[c.b][1]}).`,
      })) } : undefined,
      tags: [],
      ai: { channels: v.channels.map((c) => ({ channel: `${c.a}-${c.b}`, name: c.name, connects: c.centers, gates: [`Gate ${c.a} ${HD_GATES[c.a][0]}: ${HD_GATES[c.a][1]}`, `Gate ${c.b} ${HD_GATES[c.b][0]}: ${HD_GATES[c.b][1]}`] })) },
    });
  } else cards.push(pending('c2-channels', 'Defined Channels'));
  if (v.cross) {
    const g = v.cross.gates;
    cards.push({
      id: 'c2-cross', kind: 'hd', headline: 'Incarnation Cross', meta: v.cross.label, overview: 'The overall theme of your life', part: 'a', system: sys, source: v.cross.name,
      paragraphs: [
        `${v.cross.angle === 'Right Angle' ? 'A Right Angle cross suggests a life focused on your own journey and what you discover along it.' : v.cross.angle === 'Left Angle' ? 'A Left Angle cross suggests a life woven together with other people, where meetings and relationships carry your purpose.' : 'A Juxtaposition cross suggests a life with a very specific, fixed focus.'}`,
        `Its four gates: ${g.map((n) => `Gate ${n} (${HD_GATES[n][0]}: ${HD_GATES[n][1]})`).join(', ')}.`,
      ],
      tags: [],
      ai: { cross: v.cross.name, angle: v.cross.angle, gates: g.map((n) => `Gate ${n} ${HD_GATES[n][0]}: ${HD_GATES[n][1]}`) },
    });
  } else cards.push(pending('c2-cross', 'Incarnation Cross'));

  return {
    n: 2, cards, topNote: known ? undefined : UNKNOWN_TIME_LINE,
    synthesis: [v.type ? `You are a ${v.profile ? `${v.profile} ` : ''}${v.type}${v.authority ? ` with ${v.authority.split(' (')[0]} authority` : ''}. Your Strategy shows you how to enter things, and your Authority shows you how to decide. Try them on small decisions first and watch what changes.` : 'The parts of your design shown here hold true whatever time you were born. The rest opens up once you know your birth time.'],
    journal: CHAPTERS[1].journalFallback,
    parts: { a: 'fallback' },
  };
}

// ---------------------------------------------------------------- Chapter 3
function chapter3(f: BlueprintFacts): Chapter {
  const m = f.mayan;
  const n = NAWAL_INFO[m.nawal.index];
  const t = NAWAL_INFO[m.trecena.index];
  const sys: SystemName = 'Mayan astrology';
  const cards: Card[] = [
    {
      id: 'c3-nawal', kind: 'mayan', headline: `Nawal: ${m.nawal.kiche}`, meta: `${m.nawal.meaning} · Yucatec name: ${m.nawal.yucatec}`, overview: 'The energy you were born carrying', part: 'a', system: sys, source: `${m.nawal.kiche} (nawal)`,
      paragraphs: [`You were born on a ${m.nawal.kiche} day. ${m.nawal.kiche} is the energy of ${n.essence}.`, `Its gifts are often ${n.gifts}. Its growth edge is ${n.growth}.`],
      tags: n.tags.slice(0, 2),
      ai: { nawal_kiche_name: m.nawal.kiche, english_meaning: m.nawal.meaning, essence: n.essence, gifts: n.gifts, growth_edge: n.growth },
    },
    {
      id: 'c3-tone', kind: 'mayan', headline: `Tone: ${m.tone}`, overview: 'How that energy moves', part: 'a', system: sys, source: `Tone ${m.tone}`,
      paragraphs: [`Your tone is ${m.tone}, which carries ${TONE_INFO[m.tone]}. It describes the way your ${m.nawal.kiche} energy tends to move through life.`],
      tags: [],
      ai: { tone: m.tone, tone_meaning: TONE_INFO[m.tone] },
    },
    {
      id: 'c3-trecena', kind: 'mayan', headline: `Trecena: ${m.trecena.kiche}`, meta: `${m.trecena.meaning} · Yucatec name: ${m.trecena.yucatec}`, overview: 'The wider current underneath your day', part: 'a', system: sys, source: `${m.trecena.kiche} trecena`,
      paragraphs: [
        m.trecena.index === m.nawal.index
          ? `You were born on the first day of the ${m.trecena.kiche} trecena, so your day sign and your trecena are the same. Its energy runs through you twice over.`
          : `You were born in the 13-day period opened by ${m.trecena.kiche}, the energy of ${t.essence}. It is the wider current underneath your own day.`,
      ],
      tags: t.tags.slice(0, 1),
      ai: { trecena_kiche_name: m.trecena.kiche, english_meaning: m.trecena.meaning, essence: t.essence, same_as_nawal: m.trecena.index === m.nawal.index },
    },
  ];
  return {
    n: 3, cards,
    synthesis: [`Your nawal is ${m.nawal.kiche}: the energy of ${n.essence}. Your tone, ${m.tone}, moves it with ${TONE_INFO[m.tone]}, and the ${m.trecena.kiche} trecena adds its theme underneath.`],
    journal: CHAPTERS[2].journalFallback,
    parts: { a: 'fallback' },
  };
}

// ---------------------------------------------------------------- Chapter 4
export function validNameNumbers(nn: unknown): NameNumbers | null {
  if (!nn || typeof nn !== 'object') return null;
  const o = nn as Record<string, unknown>;
  const ok = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && Object.prototype.hasOwnProperty.call(NUMBER_INFO, v);
  return ok(o.expression) && ok(o.soulUrge) && ok(o.personality) ? { expression: o.expression as number, soulUrge: o.soulUrge as number, personality: o.personality as number } : null;
}

function chapter4(f: BlueprintFacts, names: NameNumbers | null): Chapter {
  const num = f.numerology;
  const sys: SystemName = 'Numerology';
  const one = (id: string, label: string, role: string, value: number, tagged: boolean, extraMeta?: string): Card => ({
    id, kind: 'number', headline: `${label}: ${value}`, symbol: String(value), symbolStyle: 'mono', meta: extraMeta, part: 'a',
    overview: role.split(': ')[1],
    system: tagged ? sys : undefined, source: tagged ? `${label} ${value}` : undefined,
    paragraphs: [`Your ${label} is ${value}, a number of ${NUMBER_INFO[value].keywords}.`],
    tags: tagged ? NUMBER_INFO[value].tags : [],
    ai: { number_name: label, value, what_it_describes: role, keywords: NUMBER_INFO[value].keywords, is_master_number: value > 9 },
  });
  const cards: Card[] = [
    one('c4-lifepath', 'Life Path', NUMBER_ROLE.lifePath, num.lifePath, true),
    one('c4-birthday', 'Birthday number', NUMBER_ROLE.birthday, num.birthday, true),
    one('c4-year', 'Personal Year', NUMBER_ROLE.personalYear, num.personalYear, false, `For ${num.personalYearFor}`),
  ];
  if (names) {
    cards.push(
      one('c4-expression', 'Expression', NUMBER_ROLE.expression, names.expression, true),
      one('c4-soulurge', 'Soul Urge', NUMBER_ROLE.soulUrge, names.soulUrge, true),
      one('c4-personality', 'Personality', NUMBER_ROLE.personality, names.personality, true),
    );
  } else {
    cards.push({ id: 'c4-addname', kind: 'note', headline: 'Three more numbers', paragraphs: [ADD_NAME_NOTE], tags: [], part: 'none' });
  }
  return {
    n: 4, cards,
    synthesis: [`Your Life Path ${num.lifePath} is the main road. Your Birthday number ${num.birthday} is a gift you carry along it, and Personal Year ${num.personalYear} is the stretch of road you are on in ${num.personalYearFor}.`],
    journal: CHAPTERS[3].journalFallback,
    parts: { a: 'fallback' },
  };
}

// ---------------------------------------------------------------- Chapter 5
function chapter5(f: BlueprintFacts): Chapter {
  const c = f.chinese;
  const cards: Card[] = [];
  if (!c) {
    cards.push({ id: 'c5-none', kind: 'note', headline: 'Outside the table', paragraphs: ['Your birth year is outside the verified Lunar New Year table (1900 to 2100), so this chapter is left empty instead of guessed.'], tags: [], part: 'none' });
  } else {
    const a = ANIMAL_INFO[c.animal];
    cards.push({
      id: 'c5-year', kind: 'animal', headline: `${c.element} ${c.animal}`, meta: `${c.yinYang} · Chinese year ${c.chineseYear}`, overview: 'Your year animal', part: 'a', system: 'Chinese zodiac', source: `${c.element} ${c.animal}`,
      paragraphs: [
        `You were born in the year of the ${c.animal}. People born under this animal are often ${a.qualities}.`,
        `Your element is ${c.element}, which adds ${CHINESE_ELEMENT_INFO[c.element]}. Your year is ${c.yinYang}: ${c.yinYang === 'Yin' ? 'the receptive, inward side of energy' : 'the active, outward side of energy'}.`,
        ...(c.beforeNewYear ? [`You were born before Lunar New Year that year (it fell on ${fmtDate(c.birthYearNewYear)}), so you belong to the Chinese year before the one on the Western calendar.`] : []),
      ],
      tags: a.tags,
      ai: { year_animal: c.animal, animal_keywords: a.qualities, element: c.element, element_keywords: CHINESE_ELEMENT_INFO[c.element], yin_yang: c.yinYang, born_before_lunar_new_year: c.beforeNewYear },
    });
    if (c.hourAnimal) {
      const h = ANIMAL_INFO[c.hourAnimal];
      cards.push({
        id: 'c5-hour', kind: 'animal', headline: `Inner animal: ${c.hourAnimal}`, overview: 'The animal of your birth hour', part: 'a', system: 'Chinese zodiac', source: `${c.hourAnimal} hour`,
        paragraphs: [`You were born in the hour of the ${c.hourAnimal}. This inner animal describes your more private self, which may be ${h.qualities}.`],
        tags: h.tags.slice(0, 1),
        ai: { hour_animal: c.hourAnimal, animal_keywords: h.qualities },
      });
    } else {
      cards.push({ id: 'c5-hour', kind: 'animal', headline: 'Inner animal', paragraphs: [], note: DEPENDS_ON_TIME, tags: [], part: 'none' });
    }
  }
  return {
    n: 5, cards,
    synthesis: c ? [`You are a ${c.yinYang} ${c.element} ${c.animal}${c.hourAnimal ? `, with the ${c.hourAnimal} as your inner animal` : ''}. Hold it lightly. It is one more mirror.`] : [],
    journal: CHAPTERS[4].journalFallback,
    parts: c ? { a: 'fallback' } : {},
  };
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${d}, ${y}`;
}
// ---------------------------------------------------------------- Chapter 6
function chapter6(f: BlueprintFacts): Chapter {
  const acg = f.astrocartography;
  if (!acg) {
    return {
      n: 6, topNote: UNKNOWN_TIME_LINE,
      cards: [{ id: 'c6-hidden', kind: 'note', headline: 'This chapter needs your birth time', paragraphs: ['The lines on your map shift by a whole time zone for every hour of the day, so they cannot be drawn without the time you were born. Nothing is shown here instead of a guess.'], note: DEPENDS_ON_TIME, tags: [], part: 'none' }],
      synthesis: [], journal: [], parts: {},
    };
  }
  const why: Record<string, string> = {
    career: 'Places where you feel more visible, confident and recognised for your work.',
    love: 'Places that feel softer and more beautiful, where connection comes more easily.',
    growth: 'Places where life feels bigger, luckier and more open.',
    home: 'Places that feel emotionally familiar. Good for rest and for putting down roots.',
    spirit: 'Places that open your imagination and your spiritual life. They can also feel dreamy, so stay grounded there.',
    careful: 'Places that feel heavier, more intense or more demanding. They are not forbidden. They ask more of you, and some people do their deepest growing there.',
  };
  const full = new Map(acg.lines.map((l) => [`${l.planet}-${l.angle}`, l]));
  // The map card holds the tabs. Each group card below is shown under the map when its tab is chosen.
  const cards: Card[] = [
    { id: 'c6-map', kind: 'place', headline: 'Your Map', viz: 'map', paragraphs: [ACG_ZONE_LINE], tags: [], part: 'none' },
  ];
  for (const g of acg.groups) {
    const withCities = g.lines.filter((l) => l.cities.length);
    cards.push({
      id: `c6-${g.key}`, kind: 'place', headline: g.title, part: 'a', group: g.key,
      paragraphs: [why[g.key]],
      // Every line is listed with its meaning in plain words, never by name alone.
      list: { label: 'Your lines', items: g.lines.map((l) => ({
        id: `${g.key}-${l.planet}-${l.angle}`, lead: `${cap(l.planet)} ${l.angle} line`,
        text: `${acgLineMeaning(l.planet, l.angle)}. ${l.cities.length ? `Near it: ${l.cities.slice(0, 4).join('; ')}.` : 'No large city sits close to this line.'}`,
      })) },
      tags: [],
      ai: {
        group: g.title,
        lines: withCities.map((l) => ({
          line: `${cap(l.planet)} ${l.angle}`, meaning: acgLineMeaning(l.planet, l.angle),
          places: (full.get(`${l.planet}-${l.angle}`)?.cities ?? []).slice(0, 4).map((c) => `${c.name}, ${c.country}`),
        })),
      },
    });
  }
  return {
    n: 6, cards,
    synthesis: ['A map like this does not tell you where to live. It shows what each place brings out in you. The places you have already loved, or struggled in, are the best test of it.'],
    journal: CHAPTERS[5].journalFallback,
    parts: { a: 'fallback' },
  };
}

// ---------------------------------------------------------------- Chapter 7
function chapter7(f: BlueprintFacts): Chapter {
  const { events, approximate } = f.cycles;
  const show = (iso: string) => (approximate ? fmtDate(iso).replace(/ \d+,/, '') : fmtDate(iso));
  const kinds = ['Saturn return', 'Jupiter return', 'Nodal return', 'Chiron return', 'Uranus opposition'] as const;
  const cards: Card[] = [{ id: 'c7-timeline', kind: 'cycle', headline: 'Your Timeline', viz: 'timeline', paragraphs: [approximate ? 'Because your birth time is unknown, these dates are shown to the month.' : 'Each date is the exact day the planet returned, or will return, to its place at your birth. Some returns happen in two or three passes.'], tags: [], part: 'none' }];
  for (const kind of kinds) {
    const list = events.filter((e) => e.kind === kind);
    if (!list.length) continue;
    cards.push({
      id: `c7-${kind.split(' ')[0].toLowerCase()}`, kind: 'cycle', headline: kind === 'Uranus opposition' ? 'Uranus Opposition' : kind === 'Chiron return' ? 'Chiron Return' : `${kind.split(' ')[0]} Returns`, part: 'a',
      paragraphs: [CYCLE_INFO[kind]],
      list: { label: 'Your dates', items: list.map((e) => ({
        id: `${kind}-${e.number}`,
        lead: `${e.status === 'past' ? 'Past' : e.status === 'now' ? 'Now' : 'Upcoming'} · age ${Math.round(e.ageAtFirstPass)}`,
        text: [...new Set(e.passes.map(show))].join(', then '),
      })) },
      tags: [],
      ai: { cycle: kind, meaning: CYCLE_INFO[kind], occurrences: list.map((e) => ({ age: Math.round(e.ageAtFirstPass), status: e.status, dates: [...new Set(e.passes.map(show))] })) },
    });
  }
  return {
    n: 7, cards, topNote: approximate ? UNKNOWN_TIME_LINE : undefined,
    synthesis: ['You are not behind. Each of these returns is a chapter that opens in its own season. Look back at the ones you have lived, and you may see how each one moved you closer to yourself.'],
    journal: CHAPTERS[6].journalFallback,
    parts: { a: 'fallback' },
  };
}

/** Chapters 1 to 7, with fallback text in place. */
export function buildChapters(facts: BlueprintFacts, names: NameNumbers | null): Chapter[] {
  return [chapter1(facts), chapter2(facts), chapter3(facts), chapter4(facts, names), chapter5(facts), chapter6(facts), chapter7(facts)];
}

/** Remove the AI-only payloads before a chapter is sent to the browser. */
export function forBrowser(ch: Chapter): Chapter {
  return { ...ch, cards: ch.cards.map(({ ai: _ai, ...rest }) => rest) };
}

// ---------------------------------------------------------------- Soul Themes (chapter 8)
export interface ThemeSource { system: SystemName; label: string }
export interface SoulTheme { theme: Theme; sources: ThemeSource[]; systems: number; description: string }

/**
 * Count the tags across every system and keep the top 3 to 5 themes that appear in at least 3 systems.
 * If fewer than 3 themes reach that bar, the list is filled up to 3 with the next strongest themes
 * (at least 2 systems). Every source is listed, so the reader always sees where a theme came from.
 */
export function computeSoulThemes(chapters: Chapter[]): SoulTheme[] {
  const map = new Map<Theme, ThemeSource[]>();
  for (const ch of chapters) {
    for (const c of ch.cards) {
      if (!c.system || !c.source) continue;
      for (const t of c.tags) {
        const list = map.get(t) || [];
        if (!list.some((s) => s.label === c.source)) list.push({ system: c.system, label: c.source });
        map.set(t, list);
      }
    }
  }
  const all = [...map.entries()].map(([theme, sources]) => ({ theme, sources, systems: new Set(sources.map((s) => s.system)).size, description: THEME_INFO[theme] }));
  all.sort((a, b) => b.systems - a.systems || b.sources.length - a.sources.length || a.theme.localeCompare(b.theme));
  const strong = all.filter((t) => t.systems >= 3).slice(0, 5);
  if (strong.length >= 3) return strong;
  const fill = all.filter((t) => t.systems === 2).slice(0, 3 - strong.length);
  return [...strong, ...fill];
}
