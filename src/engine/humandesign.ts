// Human Design, calculated from the same Swiss Ephemeris positions.
// Personality = the birth moment. Design = the moment the Sun was exactly 88 degrees of arc earlier.
import { BODY, calc, norm360, angDiff } from './swe';

/** Gate order around the wheel, starting with Gate 41 at 302 degrees tropical (2 degrees Aquarius). */
export const GATE_WHEEL = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];
const WHEEL_START = 302;
const GATE_SIZE = 5.625;
const LINE_SIZE = 0.9375;

export function gateLineOf(lon: number): { gate: number; line: number } {
  const off = norm360(lon - WHEEL_START);
  const idx = Math.floor(off / GATE_SIZE);
  const line = Math.floor((off - idx * GATE_SIZE) / LINE_SIZE) + 1;
  return { gate: GATE_WHEEL[idx], line: Math.min(line, 6) };
}

export const CENTERS = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Sacral', 'Solar Plexus', 'Spleen', 'Root'] as const;
export type Center = (typeof CENTERS)[number];

const CENTER_GATES: Record<Center, number[]> = {
  Head: [64, 61, 63],
  Ajna: [47, 24, 4, 17, 43, 11],
  Throat: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  G: [1, 13, 25, 46, 2, 15, 10, 7],
  Heart: [21, 40, 26, 51],
  Sacral: [5, 14, 29, 59, 9, 3, 42, 27, 34],
  'Solar Plexus': [6, 37, 22, 36, 30, 55, 49],
  Spleen: [48, 57, 44, 50, 32, 28, 18],
  Root: [53, 60, 52, 19, 39, 41, 58, 38, 54],
};
export const GATE_CENTER: Record<number, Center> = {};
for (const cn of CENTERS) for (const g of CENTER_GATES[cn]) GATE_CENTER[g] = cn;

/** The 36 channels. */
export const CHANNELS: { a: number; b: number; name: string }[] = [
  { a: 1, b: 8, name: 'Inspiration' }, { a: 2, b: 14, name: 'The Beat' }, { a: 3, b: 60, name: 'Mutation' }, { a: 4, b: 63, name: 'Logic' },
  { a: 5, b: 15, name: 'Rhythm' }, { a: 6, b: 59, name: 'Intimacy' }, { a: 7, b: 31, name: 'The Alpha' }, { a: 9, b: 52, name: 'Concentration' },
  { a: 10, b: 20, name: 'Awakening' }, { a: 10, b: 34, name: 'Exploration' }, { a: 10, b: 57, name: 'Perfected Form' }, { a: 11, b: 56, name: 'Curiosity' },
  { a: 12, b: 22, name: 'Openness' }, { a: 13, b: 33, name: 'The Prodigal' }, { a: 16, b: 48, name: 'The Wavelength' }, { a: 17, b: 62, name: 'Acceptance' },
  { a: 18, b: 58, name: 'Judgment' }, { a: 19, b: 49, name: 'Synthesis' }, { a: 20, b: 34, name: 'Charisma' }, { a: 20, b: 57, name: 'The Brainwave' },
  { a: 21, b: 45, name: 'Money' }, { a: 23, b: 43, name: 'Structuring' }, { a: 24, b: 61, name: 'Awareness' }, { a: 25, b: 51, name: 'Initiation' },
  { a: 26, b: 44, name: 'Surrender' }, { a: 27, b: 50, name: 'Preservation' }, { a: 28, b: 38, name: 'Struggle' }, { a: 29, b: 46, name: 'Discovery' },
  { a: 30, b: 41, name: 'Recognition' }, { a: 32, b: 54, name: 'Transformation' }, { a: 34, b: 57, name: 'Power' }, { a: 35, b: 36, name: 'Transitoriness' },
  { a: 37, b: 40, name: 'Community' }, { a: 39, b: 55, name: 'Emoting' }, { a: 42, b: 53, name: 'Maturation' }, { a: 47, b: 64, name: 'Abstraction' },
];

export const ACTIVATION_ORDER = ['Sun', 'Earth', 'Moon', 'North Node', 'South Node', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;

export interface Activation {
  planet: (typeof ACTIVATION_ORDER)[number];
  lon: number;
  gate: number;
  line: number;
}

function activationsAt(jdUT: number): Activation[] {
  const sun = calc(jdUT, BODY.sun).lon;
  const node = calc(jdUT, BODY.trueNode).lon; // True Node, as Jovian Archive uses
  const lons: Record<string, number> = {
    Sun: sun,
    Earth: norm360(sun + 180),
    Moon: calc(jdUT, BODY.moon).lon,
    'North Node': node,
    'South Node': norm360(node + 180),
    Mercury: calc(jdUT, BODY.mercury).lon,
    Venus: calc(jdUT, BODY.venus).lon,
    Mars: calc(jdUT, BODY.mars).lon,
    Jupiter: calc(jdUT, BODY.jupiter).lon,
    Saturn: calc(jdUT, BODY.saturn).lon,
    Uranus: calc(jdUT, BODY.uranus).lon,
    Neptune: calc(jdUT, BODY.neptune).lon,
    Pluto: calc(jdUT, BODY.pluto).lon,
  };
  return ACTIVATION_ORDER.map((planet) => ({ planet, lon: lons[planet], ...gateLineOf(lons[planet]) }));
}

/** Solve numerically for the moment the Sun was exactly 88 degrees before its birth position. */
export function designMoment(jdBirth: number): number {
  const target = norm360(calc(jdBirth, BODY.sun).lon - 88);
  let jd = jdBirth - 88 / 0.9856;
  for (let i = 0; i < 50; i++) {
    const s = calc(jd, BODY.sun);
    const diff = angDiff(target, s.lon);
    if (Math.abs(diff) < 1e-9) break;
    jd += diff / s.speed;
  }
  return jd;
}

const RIGHT_ANGLE: [string, number[]][] = [
  ['the Sphinx', [13, 7, 1, 2]], ['the Unexpected', [41, 31, 28, 27]], ['Explanation', [49, 4, 43, 23]], ['Contagion', [30, 29, 14, 8]],
  ['the Sleeping Phoenix', [55, 59, 34, 20]], ['Planning', [37, 40, 9, 16]], ['Consciousness', [63, 64, 5, 35]], ['Rulership', [22, 47, 26, 45]],
  ['Eden', [36, 6, 11, 12]], ['the Vessel of Love', [25, 46, 10, 15]], ['Service', [17, 18, 58, 52]], ['Tension', [21, 48, 38, 39]],
  ['Penetration', [51, 57, 54, 53]], ['Maya', [42, 32, 61, 62]], ['Laws', [3, 50, 60, 56]], ['the Four Ways', [24, 44, 19, 33]],
];
const LEFT_ANGLE: [string, number[]][] = [
  ['Masks', [13, 7]], ['Revolution', [49, 4]], ['Industry', [30, 29]], ['Spirit', [55, 59]], ['Migration', [37, 40]], ['Dominion', [63, 64]],
  ['Informing', [22, 47]], ['the Plane', [36, 6]], ['Healing', [25, 46]], ['Upheaval', [17, 18]], ['Endeavor', [21, 48]], ['the Clarion', [51, 57]],
  ['Limitation', [42, 32]], ['Wishes', [3, 50]], ['Incarnation', [24, 44]], ['the Alpha', [41, 31]], ['Refinement', [19, 33]], ['Defiance', [2, 1]],
  ['Distraction', [60, 56]], ['Obscuration', [61, 62]], ['Cycles', [54, 53]], ['Individualism', [38, 39]], ['Demands', [58, 52]], ['Prevention', [15, 10]],
  ['Education', [12, 11]], ['Confrontation', [45, 26]], ['Separation', [35, 5]], ['Identification', [16, 9]], ['Duality', [20, 34]], ['Uncertainty', [8, 14]],
  ['Dedication', [23, 43]], ['Alignment', [27, 28]],
];
const JUXTAPOSITION: Record<number, string> = {
  1: 'Self-Expression', 2: 'the Driver', 3: 'Mutation', 4: 'Formulization', 5: 'Habits', 6: 'Conflict', 7: 'Interaction', 8: 'Contribution',
  9: 'Focus', 10: 'Behavior', 11: 'Ideas', 12: 'Articulation', 13: 'Listening', 14: 'Empowering', 15: 'Extremes', 16: 'Experimentation',
  17: 'Opinions', 18: 'Correction', 19: 'Need', 20: 'the Now', 21: 'Control', 22: 'Grace', 23: 'Assimilation', 24: 'Rationalization',
  25: 'Innocence', 26: 'the Trickster', 27: 'Caring', 28: 'Risks', 29: 'Commitment', 30: 'Fates', 31: 'Influence', 32: 'Conservation',
  33: 'Retreat', 34: 'Power', 35: 'Experience', 36: 'Crisis', 37: 'Bargains', 38: 'Opposition', 39: 'Provocation', 40: 'Denial',
  41: 'Fantasy', 42: 'Completion', 43: 'Insight', 44: 'Alertness', 45: 'Possession', 46: 'Serendipity', 47: 'Oppression', 48: 'Depth',
  49: 'Principles', 50: 'Values', 51: 'Shock', 52: 'Stillness', 53: 'Beginnings', 54: 'Ambition', 55: 'Moods', 56: 'Stimulation',
  57: 'Intuition', 58: 'Vitality', 59: 'Strategy', 60: 'Limitation', 61: 'Thinking', 62: 'Detail', 63: 'Doubts', 64: 'Confusion',
};

export type CrossAngle = 'Right Angle' | 'Juxtaposition' | 'Left Angle';

export function crossAngle(pLine: number, dLine: number): CrossAngle {
  if (pLine === 4 && dLine === 1) return 'Juxtaposition';
  if (pLine >= 5 || (pLine === 4 && dLine === 1)) return 'Left Angle';
  return 'Right Angle';
}

export function crossName(angle: CrossAngle, sunGate: number): string {
  if (angle === 'Juxtaposition') return `Juxtaposition Cross of ${JUXTAPOSITION[sunGate]}`;
  const table = angle === 'Right Angle' ? RIGHT_ANGLE : LEFT_ANGLE;
  const hit = table.find(([, gates]) => gates.includes(sunGate));
  return `${angle} Cross of ${hit ? hit[0] : 'Gate ' + sunGate}`;
}

export const PROFILE_LINES: Record<number, string> = { 1: 'Investigator', 2: 'Hermit', 3: 'Martyr', 4: 'Opportunist', 5: 'Heretic', 6: 'Role Model' };

export type HDType = 'Manifestor' | 'Generator' | 'Manifesting Generator' | 'Projector' | 'Reflector';

const TYPE_INFO: Record<HDType, { strategy: string; signature: string; notSelf: string }> = {
  Manifestor: { strategy: 'Inform before you act', signature: 'Peace', notSelf: 'Anger' },
  Generator: { strategy: 'Wait to respond', signature: 'Satisfaction', notSelf: 'Frustration' },
  'Manifesting Generator': { strategy: 'Wait to respond, then inform', signature: 'Satisfaction', notSelf: 'Frustration' },
  Projector: { strategy: 'Wait for recognition and the invitation', signature: 'Success', notSelf: 'Bitterness' },
  Reflector: { strategy: 'Wait a full lunar cycle', signature: 'Surprise', notSelf: 'Disappointment' },
};

export interface HumanDesign {
  designJd: number;
  personality: Activation[];
  design: Activation[];
  gates: number[];
  channels: { a: number; b: number; name: string; centers: [Center, Center] }[];
  definedCenters: Center[];
  openCenters: Center[];
  type: HDType;
  strategy: string;
  signature: string;
  notSelf: string;
  authority: string;
  profile: string; // "6/2"
  profileNames: [string, string];
  definition: string;
  cross: { angle: CrossAngle; name: string; gates: [number, number, number, number]; label: string };
}

export function computeHumanDesign(jdBirth: number): HumanDesign {
  const designJd = designMoment(jdBirth);
  const personality = activationsAt(jdBirth);
  const design = activationsAt(designJd);
  const gateSet = new Set<number>([...personality, ...design].map((a) => a.gate));
  const channels = CHANNELS.filter((ch) => gateSet.has(ch.a) && gateSet.has(ch.b)).map((ch) => ({
    ...ch,
    centers: [GATE_CENTER[ch.a], GATE_CENTER[ch.b]] as [Center, Center],
  }));
  const defined = new Set<Center>();
  const adj = new Map<Center, Set<Center>>();
  for (const ch of channels) {
    const [x, y] = ch.centers;
    defined.add(x);
    defined.add(y);
    if (!adj.has(x)) adj.set(x, new Set());
    if (!adj.has(y)) adj.set(y, new Set());
    adj.get(x)!.add(y);
    adj.get(y)!.add(x);
  }
  const connected = (from: Center, to: Center): boolean => {
    if (!defined.has(from) || !defined.has(to)) return false;
    const seen = new Set<Center>([from]);
    const stack: Center[] = [from];
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur === to) return true;
      for (const n of adj.get(cur) || []) if (!seen.has(n)) { seen.add(n); stack.push(n); }
    }
    return false;
  };
  const direct = (x: Center, y: Center) => adj.get(x)?.has(y) ?? false;
  const MOTORS: Center[] = ['Sacral', 'Heart', 'Solar Plexus', 'Root'];
  const motorToThroat = MOTORS.some((m) => connected(m, 'Throat'));

  let type: HDType;
  if (defined.size === 0) type = 'Reflector';
  else if (defined.has('Sacral')) type = motorToThroat ? 'Manifesting Generator' : 'Generator';
  else if (motorToThroat) type = 'Manifestor';
  else type = 'Projector';

  let authority: string;
  if (defined.has('Solar Plexus')) authority = 'Emotional (Solar Plexus)';
  else if (defined.has('Sacral')) authority = 'Sacral';
  else if (defined.has('Spleen')) authority = 'Splenic';
  else if (defined.has('Heart')) authority = direct('Heart', 'Throat') ? 'Ego (Manifested)' : 'Ego (Projected)';
  else if (direct('G', 'Throat')) authority = 'Self-Projected';
  else if (type === 'Reflector') authority = 'Lunar';
  else authority = 'Mental (Environmental)';

  // Definition: how many separate groups the defined centers form.
  const seenAll = new Set<Center>();
  let groups = 0;
  for (const cn of defined) {
    if (seenAll.has(cn)) continue;
    groups++;
    const stack = [cn];
    seenAll.add(cn);
    while (stack.length) {
      const cur = stack.pop()!;
      for (const n of adj.get(cur) || []) if (!seenAll.has(n)) { seenAll.add(n); stack.push(n); }
    }
  }
  const definition = ['None', 'Single', 'Split', 'Triple Split', 'Quadruple Split'][Math.min(groups, 4)];

  const pSun = personality[0];
  const pEarth = personality[1];
  const dSun = design[0];
  const dEarth = design[1];
  const angle = crossAngle(pSun.line, dSun.line);
  const name = crossName(angle, pSun.gate);
  const info = TYPE_INFO[type];
  return {
    designJd,
    personality,
    design,
    gates: Array.from(gateSet).sort((a, b) => a - b),
    channels,
    definedCenters: CENTERS.filter((cn) => defined.has(cn)),
    openCenters: CENTERS.filter((cn) => !defined.has(cn)),
    type,
    strategy: info.strategy,
    signature: info.signature,
    notSelf: info.notSelf,
    authority,
    profile: `${pSun.line}/${dSun.line}`,
    profileNames: [PROFILE_LINES[pSun.line], PROFILE_LINES[dSun.line]],
    definition,
    cross: { angle, name, gates: [pSun.gate, pEarth.gate, dSun.gate, dEarth.gate], label: `${name} (${pSun.gate}/${pEarth.gate} | ${dSun.gate}/${dEarth.gate})` },
  };
}

/** The parts of a Human Design chart that can be compared across a whole day. */
export interface HumanDesignStable {
  type: string | null;
  strategy: string | null;
  signature: string | null;
  notSelf: string | null;
  authority: string | null;
  profile: string | null;
  profileNames: [string, string] | null;
  definedCenters: Center[] | null;
  openCenters: Center[] | null;
  channels: HumanDesign['channels'] | null;
  cross: HumanDesign['cross'] | null;
}

/**
 * Unknown birth time: calculate across the whole local day (every 10 minutes) and keep only
 * what never changes. Anything that changes is returned as null ("This depends on your exact birth time.").
 */
export function computeHumanDesignUnknownTime(jdStart: number, jdEnd: number): HumanDesignStable {
  const samples: HumanDesign[] = [];
  const step = 10 / 1440;
  for (let jd = jdStart; jd < jdEnd; jd += step) samples.push(computeHumanDesign(jd));
  samples.push(computeHumanDesign(jdEnd));
  const same = <T,>(pick: (h: HumanDesign) => T): T | null => {
    const first = JSON.stringify(pick(samples[0]));
    return samples.every((s) => JSON.stringify(pick(s)) === first) ? pick(samples[0]) : null;
  };
  return {
    type: same((h) => h.type),
    strategy: same((h) => h.strategy),
    signature: same((h) => h.signature),
    notSelf: same((h) => h.notSelf),
    authority: same((h) => h.authority),
    profile: same((h) => h.profile),
    profileNames: same((h) => h.profileNames),
    definedCenters: same((h) => h.definedCenters),
    openCenters: same((h) => h.openCenters),
    channels: same((h) => h.channels.map((c) => ({ a: c.a, b: c.b, name: c.name, centers: c.centers }))),
    cross: same((h) => h.cross),
  };
}
