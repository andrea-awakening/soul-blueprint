// The fixed library of plain meanings. It serves three jobs:
//  1. the "Learn More" reference guides,
//  2. grounding keywords handed to the AI with each fact, and
//  3. the neutral fallback reading shown if the AI text is unavailable or fails validation.
// Nothing here is personal to a chart. No AI is involved in this file.

export const THEMES = [
  'communicator', 'teacher', 'healer', 'creator/artist', 'builder', 'leader', 'nurturer', 'seeker/philosopher',
  'transformer', 'visionary/innovator', 'analyst/refiner', 'harmonizer/diplomat', 'independent spirit', 'deep feeler',
  'intuitive/mystic', 'adventurer', 'guardian/protector', 'entrepreneur/wealth-builder', 'rebel/disruptor',
  'connector/community-weaver', 'performer/visible one', 'quiet observer', 'server/helper', 'truth-teller',
] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_INFO: Record<Theme, string> = {
  communicator: 'You carry and translate ideas. Words, in any form, are one of your natural tools.',
  teacher: 'You make things understandable for other people, and they tend to grow around you.',
  healer: 'You help people mend. Often this grows out of something you had to mend in yourself first.',
  'creator/artist': 'You need to make things. Beauty and expression are a real need for you.',
  builder: 'You turn ideas into things that last, step by patient step.',
  leader: 'People look to you for direction, whether or not you asked for the role.',
  nurturer: 'You notice what people need and tend to it. Things grow in your care.',
  'seeker/philosopher': 'You are after meaning. Big questions pull you forward.',
  transformer: 'You know how to end one chapter and begin another, and you help others do the same.',
  'visionary/innovator': 'You see what could exist before it does.',
  'analyst/refiner': 'You see what could be better, and you have the patience to improve it.',
  'harmonizer/diplomat': 'You bring people and viewpoints into balance.',
  'independent spirit': 'You need room to do things your own way.',
  'deep feeler': 'You feel more than most, and that depth is a form of intelligence.',
  'intuitive/mystic': 'You pick up on what is not said or seen, and trust a wider kind of knowing.',
  adventurer: 'You learn by going, trying and exploring.',
  'guardian/protector': 'You stand watch over people, values or places that matter.',
  'entrepreneur/wealth-builder': 'You have a feel for creating value and resources.',
  'rebel/disruptor': 'You question what everyone else accepts, and that opens new doors.',
  'connector/community-weaver': 'You bring people together and help them belong.',
  'performer/visible one': 'You are built to be seen. Your presence itself carries a message.',
  'quiet observer': 'You watch first. Your insight comes from standing back.',
  'server/helper': 'You find meaning in being useful to others.',
  'truth-teller': 'You say what is real, even when it is uncomfortable.',
};

export interface SignInfo { qualities: string; style: string; element: string; modality: string; tags: Theme[] }
export const SIGN_INFO: Record<string, SignInfo> = {
  Aries: { qualities: 'initiative, courage, directness and a pioneering drive', style: 'acts first and learns by doing', element: 'fire', modality: 'cardinal', tags: ['leader', 'adventurer', 'independent spirit'] },
  Taurus: { qualities: 'steadiness, patience, sensuality and a love of what lasts', style: 'builds slowly and values comfort and security', element: 'earth', modality: 'fixed', tags: ['builder', 'nurturer', 'entrepreneur/wealth-builder'] },
  Gemini: { qualities: 'curiosity, quick thinking, adaptability and a gift for words', style: 'learns through conversation and variety', element: 'air', modality: 'mutable', tags: ['communicator', 'teacher', 'connector/community-weaver'] },
  Cancer: { qualities: 'sensitivity, care, loyalty and strong emotional memory', style: 'protects what it loves and needs a safe home base', element: 'water', modality: 'cardinal', tags: ['nurturer', 'deep feeler', 'guardian/protector'] },
  Leo: { qualities: 'warmth, creativity, generosity and the wish to shine', style: 'leads from the heart and expresses itself boldly', element: 'fire', modality: 'fixed', tags: ['performer/visible one', 'creator/artist', 'leader'] },
  Virgo: { qualities: 'discernment, precision, usefulness and a wish to improve things', style: 'notices details and serves through skill', element: 'earth', modality: 'mutable', tags: ['analyst/refiner', 'server/helper', 'healer'] },
  Libra: { qualities: 'relationships and connection, balance and fairness, beauty and diplomacy', style: 'weighs every side and seeks harmony', element: 'air', modality: 'cardinal', tags: ['harmonizer/diplomat', 'creator/artist', 'connector/community-weaver'] },
  Scorpio: { qualities: 'depth, intensity, loyalty and the power to transform', style: 'looks beneath the surface and commits completely', element: 'water', modality: 'fixed', tags: ['transformer', 'deep feeler', 'truth-teller'] },
  Sagittarius: { qualities: 'optimism, honesty, freedom and a hunger for meaning', style: 'explores widely and aims for the bigger picture', element: 'fire', modality: 'mutable', tags: ['seeker/philosopher', 'adventurer', 'teacher'] },
  Capricorn: { qualities: 'ambition, discipline, responsibility and long-range vision', style: 'climbs steadily and builds real authority', element: 'earth', modality: 'cardinal', tags: ['builder', 'leader', 'guardian/protector'] },
  Aquarius: { qualities: 'originality, independence, big-picture thinking and care for the collective', style: 'questions convention and looks toward the future', element: 'air', modality: 'fixed', tags: ['visionary/innovator', 'rebel/disruptor', 'independent spirit'] },
  Pisces: { qualities: 'compassion, imagination, intuition and a sense of connection to everything', style: 'feels its way and dissolves boundaries', element: 'water', modality: 'mutable', tags: ['intuitive/mystic', 'deep feeler', 'healer'] },
};

export const PLANET_INFO: Record<string, { domain: string; guide: string }> = {
  sun: { domain: 'core identity, purpose and vitality', guide: 'Core identity, ego and life purpose.' },
  moon: { domain: 'emotions, instincts and inner needs', guide: 'Emotions, instincts and your inner world.' },
  asc: { domain: 'your outward manner and first approach to life', guide: 'The Ascendant (rising sign): how you meet the world and how others first see you.' },
  mercury: { domain: 'mind, communication and learning style', guide: 'Thinking and communication style.' },
  venus: { domain: 'love, values, beauty and attraction', guide: 'Love, beauty, values and attraction.' },
  mars: { domain: 'drive, desire and the way you act', guide: 'Drive, action and desire.' },
  jupiter: { domain: 'growth, faith, luck and expansion', guide: 'Growth, luck, expansion and philosophy.' },
  saturn: { domain: 'discipline, responsibility and life lessons', guide: 'Discipline, structure and life lessons.' },
  uranus: { domain: 'innovation, freedom and sudden change (shared by your generation)', guide: 'Innovation, rebellion and sudden change. It moves slowly, so everyone born within about seven years shares its sign.' },
  neptune: { domain: 'dreams, intuition and spirituality (shared by your generation)', guide: 'Dreams, spirituality and imagination. Everyone born within about fourteen years shares its sign.' },
  pluto: { domain: 'power, depth and transformation (shared by your generation)', guide: 'Transformation, power and deep change. A whole generation shares its sign.' },
  mc: { domain: 'career direction and public role', guide: 'The Midheaven: career path and public direction.' },
  dc: { domain: 'what you seek and meet in close partnership', guide: 'The Descendant: what you look for in others and in partnership.' },
  ic: { domain: 'roots, home and private foundation', guide: 'The IC: your private roots and inner home.' },
  rockefellia: { domain: 'how you build wealth', guide: 'Asteroid 904 Rockefellia: a modern placement some astrologers use to explore how you build wealth.' },
  chiron: { domain: 'the core wound and the healing gift that grows from it', guide: 'The "wounded healer": a core wound and the path of healing it opens for you and others.' },
  lilith: { domain: 'untamed power and what you refuse to shrink', guide: 'Black Moon Lilith: the raw, untamed part of you that you reclaim over time.' },
  fortune: { domain: 'natural joy, ease and flow', guide: 'The Part of Fortune: where joy and ease come most naturally.' },
  northNode: { domain: 'the growth direction your life keeps pointing toward', guide: 'The North Node: the growth you are moving toward.' },
  southNode: { domain: 'familiar patterns and gifts you arrived with', guide: 'The South Node: the familiar patterns you are growing beyond.' },
};

/** Short everyday phrases for aspect lines. */
export const PLANET_SHORT: Record<string, string> = {
  sun: 'your core self', moon: 'your emotional world', mercury: 'your mind', venus: 'the way you love', mars: 'your drive', jupiter: 'your growth',
  saturn: 'your discipline', uranus: 'your need for freedom', neptune: 'your dreams and intuition', pluto: 'your power to transform',
  chiron: 'your healing path', lilith: 'your untamed side', rockefellia: 'the way you build wealth', northNode: 'your life direction',
  southNode: 'your familiar patterns', fortune: 'your sense of ease', asc: 'the way you meet the world', mc: 'your public path', dc: 'your partnerships', ic: 'your roots',
};

export const HOUSE_INFO: { short: string; areas: string }[] = [
  { short: 'Self', areas: 'identity, body, first impressions and the way you start things' },
  { short: 'Values and money', areas: 'money, possessions, self-worth and what you value' },
  { short: 'Communication', areas: 'thinking, speaking, writing, learning, siblings and your neighborhood' },
  { short: 'Home and family', areas: 'home, family, roots and emotional foundations' },
  { short: 'Creativity and romance', areas: 'creativity, self-expression, romance, play and children' },
  { short: 'Health and service', areas: 'daily work, routines, health and being of service' },
  { short: 'Partnerships', areas: 'committed relationships, marriage and one-to-one partnerships' },
  { short: 'Transformation and intimacy', areas: 'deep bonds, shared resources, endings and transformation' },
  { short: 'Philosophy and travel', areas: 'beliefs, higher learning, travel and the search for meaning' },
  { short: 'Career and public image', areas: 'career, reputation, achievement and public life' },
  { short: 'Community and friends', areas: 'friendships, groups, community and hopes for the future' },
  { short: 'Spirituality and the subconscious', areas: 'solitude, the subconscious, spirituality and what is hidden' },
];

export const ASPECT_INFO: Record<string, { guide: string; fallback: string }> = {
  conjunction: { guide: 'Conjunction (0°): two energies blended into one. Intense and focused.', fallback: 'are fused and tend to act as one' },
  sextile: { guide: 'Sextile (60°): easy opportunity that grows when you use it.', fallback: 'support each other and open easy opportunities' },
  square: { guide: 'Square (90°): friction that pushes you to grow.', fallback: 'create friction that can push real growth' },
  trine: { guide: 'Trine (120°): natural flow and talent.', fallback: 'flow together as a natural talent' },
  quincunx: { guide: 'Quincunx (150°): two parts of you that need conscious adjustment to work together.', fallback: 'call for ongoing, conscious adjustment' },
  opposition: { guide: 'Opposition (180°): two forces asking for balance.', fallback: 'pull in different directions and ask for balance' },
};

export const ELEMENT_INFO: Record<string, string> = {
  fire: 'Fire (Aries, Leo, Sagittarius): passionate, dynamic doers driven by energy and action.',
  earth: 'Earth (Taurus, Virgo, Capricorn): practical, grounded builders who value stability and results.',
  air: 'Air (Gemini, Libra, Aquarius): thinkers who live in ideas, connection and relationships.',
  water: 'Water (Cancer, Scorpio, Pisces): emotional, intuitive feelers guided by feeling over logic.',
};
export const MODALITY_INFO: Record<string, string> = {
  cardinal: 'Cardinal (Aries, Cancer, Libra, Capricorn): starters. They begin things.',
  fixed: 'Fixed (Taurus, Leo, Scorpio, Aquarius): sustainers. They hold steady and see things through.',
  mutable: 'Mutable (Gemini, Virgo, Sagittarius, Pisces): adapters. They adjust and change course.',
};

// ---------- Human Design ----------
export const HD_TYPE_INFO: Record<string, { vehicle: string; summary: string; strategy: string; tags: Theme[] }> = {
  Manifestor: { vehicle: 'a vehicle that starts itself', summary: 'Built to initiate. You can start things on your own and set others in motion.', strategy: 'Inform the people who will be affected before you act, so the road clears in front of you.', tags: ['leader', 'independent spirit', 'rebel/disruptor'] },
  Generator: { vehicle: 'a vehicle with a powerful, steady engine', summary: 'Built with sustainable life-force energy. You do your best work when something truly lights you up.', strategy: 'Wait for life to bring something to you, then notice whether your gut responds with a yes or a no.', tags: ['builder', 'nurturer', 'server/helper'] },
  'Manifesting Generator': { vehicle: 'a fast vehicle with a powerful engine', summary: 'A steady engine that also moves fast. You often do several things at once and skip steps others need.', strategy: 'Wait to respond like a Generator, then tell the people involved before you move.', tags: ['builder', 'adventurer', 'visionary/innovator'] },
  Projector: { vehicle: 'a vehicle built to navigate and guide', summary: 'Built to see deeply into people and systems and guide them. Your energy works in focused bursts, not marathons.', strategy: 'Wait to be recognised and invited for the big things. When you are truly asked, your guidance lands.', tags: ['teacher', 'quiet observer', 'analyst/refiner'] },
  Reflector: { vehicle: 'a vehicle that mirrors the road it is on', summary: 'Built to sample and reflect the health of the people and places around you. Very rare.', strategy: 'Give big decisions a full cycle of the Moon (about 28 days) before you settle on them.', tags: ['quiet observer', 'intuitive/mystic', 'connector/community-weaver'] },
};

export const HD_AUTHORITY_INFO: Record<string, { gps: string; tags: Theme[] }> = {
  'Emotional (Solar Plexus)': { gps: 'Your clarity comes in waves. Sleep on big decisions and let the high and the low pass. What is still true once you feel calm is your answer.', tags: ['deep feeler'] },
  Sacral: { gps: 'Your gut answers in the moment with a clear yes or no, often as a sound or a pull in the body. Trust that first response.', tags: ['builder'] },
  Splenic: { gps: 'A quiet, instant knowing that speaks once and does not repeat itself. Your work is to trust it in the moment.', tags: ['intuitive/mystic'] },
  'Ego (Manifested)': { gps: 'Listen to what you hear yourself say and what your heart truly wants. If your will is not in it, it is a no.', tags: ['leader'] },
  'Ego (Projected)': { gps: 'Ask what you really want and whether your heart is in it. Talking it through, once invited, brings it out.', tags: ['leader'] },
  'Self-Projected': { gps: 'You hear your truth as you speak it. Talk decisions through with someone you trust and listen to your own voice.', tags: ['communicator'] },
  'Mental (Environmental)': { gps: 'There is no inner yes or no to wait for. Talk decisions through with trusted people in a place that feels right, and notice what becomes clear.', tags: ['quiet observer'] },
  Lunar: { gps: 'Take a full lunar cycle before big decisions, and talk them over with different people while you wait.', tags: ['intuitive/mystic'] },
};

export const HD_CENTER_INFO: Record<string, { theme: string; defined: string; open: string }> = {
  Head: { theme: 'Inspiration and mental pressure', defined: 'A steady source of questions and inspiration.', open: 'You take in other people\'s questions. Not every question is yours to answer.' },
  Ajna: { theme: 'Thinking and certainty', defined: 'A consistent way of processing and forming views.', open: 'A flexible mind that can see many angles. You do not have to be certain.' },
  Throat: { theme: 'Communication and expression', defined: 'A reliable voice and way of expressing.', open: 'Your voice changes with the room. It carries most when you are asked.' },
  G: { theme: 'Identity, love and direction', defined: 'A stable sense of who you are and where you are heading.', open: 'A fluid sense of self. The right places and people show you your direction.' },
  Heart: { theme: 'Willpower and self-worth', defined: 'Consistent willpower. You can make promises and keep them.', open: 'Nothing to prove. Your worth does not depend on willpower.' },
  Sacral: { theme: 'Life force and work energy', defined: 'Sustainable energy for work you love.', open: 'You borrow energy from others. Rest before you are worn out.' },
  'Solar Plexus': { theme: 'Emotions and feeling', defined: 'Your own emotional wave, moving up and down over time.', open: 'You feel other people\'s emotions strongly. Not all of it is yours.' },
  Spleen: { theme: 'Instinct, intuition and wellbeing', defined: 'A reliable instinct for what is safe and healthy in the moment.', open: 'Sensitive to what feels safe. You may hold on to things longer than is good for you.' },
  Root: { theme: 'Pressure and drive', defined: 'A steady relationship with pressure and stress.', open: 'You absorb pressure to hurry. You are allowed to move at your own pace.' },
};

export const HD_LINE_INFO: Record<number, { name: string; text: string; tags: Theme[] }> = {
  1: { name: 'Investigator', text: 'You need a solid foundation of knowledge before you feel secure.', tags: ['analyst/refiner', 'seeker/philosopher'] },
  2: { name: 'Hermit', text: 'You have natural gifts that come out when you are left alone, until someone calls you out.', tags: ['quiet observer', 'independent spirit'] },
  3: { name: 'Martyr', text: 'You learn through trial and error and find out what works by living it.', tags: ['adventurer', 'transformer'] },
  4: { name: 'Opportunist', text: 'Your opportunities come through your network and close relationships.', tags: ['connector/community-weaver', 'nurturer'] },
  5: { name: 'Heretic', text: 'People expect practical solutions from you, and you are at your best in a crisis.', tags: ['leader', 'rebel/disruptor'] },
  6: { name: 'Role Model', text: 'Your life has three phases: experimenting, stepping back to observe, then living as an example.', tags: ['teacher', 'quiet observer'] },
};

/** The 64 gates: name and a short keynote. */
export const HD_GATES: Record<number, [string, string]> = {
  1: ['Self-Expression', 'creative originality'], 2: ['Direction of the Self', 'receptivity and inner direction'], 3: ['Ordering', 'bringing order out of new beginnings'],
  4: ['Formulization', 'finding answers and formulas'], 5: ['Fixed Rhythms', 'natural timing and habit'], 6: ['Friction', 'emotional boundaries and intimacy'],
  7: ['The Role of the Self', 'leading through example'], 8: ['Contribution', 'making an original contribution'], 9: ['Focus', 'concentration on detail'],
  10: ['Behavior of the Self', 'self-love and being yourself'], 11: ['Ideas', 'a stream of ideas and images'], 12: ['Caution', 'careful, moving expression'],
  13: ['The Listener', 'hearing other people\'s stories'], 14: ['Power Skills', 'resources and capable energy'], 15: ['Extremes', 'love of humanity and its many rhythms'],
  16: ['Skills', 'enthusiasm and practiced talent'], 17: ['Opinions', 'logical views and organizing'], 18: ['Correction', 'seeing what could be improved'],
  19: ['Wanting', 'sensitivity to needs'], 20: ['The Now', 'presence and saying what is'], 21: ['The Hunter', 'control over resources'],
  22: ['Openness', 'grace and emotional charm'], 23: ['Assimilation', 'explaining new insight simply'], 24: ['Rationalization', 'returning to a thought until it resolves'],
  25: ['The Spirit of the Self', 'innocence and universal love'], 26: ['The Egoist', 'persuasion and selling'], 27: ['Caring', 'nourishing and protecting others'],
  28: ['The Game Player', 'the search for a life worth the struggle'], 29: ['Perseverance', 'commitment and saying yes'], 30: ['Recognition of Feelings', 'desire and intensity of feeling'],
  31: ['Leading', 'leadership by influence'], 32: ['Continuity', 'instinct for what will last'], 33: ['Privacy', 'retreat and remembering'],
  34: ['Power', 'pure personal power'], 35: ['Change', 'hunger for new experience'], 36: ['Crisis', 'growth through emotional experience'],
  37: ['Friendship', 'family, community and fair exchange'], 38: ['The Fighter', 'fighting for what gives life meaning'], 39: ['Provocation', 'stirring spirit in others'],
  40: ['Aloneness', 'the will to provide, and the need for rest'], 41: ['Contraction', 'imagination and new beginnings'], 42: ['Growth', 'finishing what was started'],
  43: ['Insight', 'breakthrough inner knowing'], 44: ['Alertness', 'instinct for patterns and people'], 45: ['The Gatherer', 'gathering and directing resources'],
  46: ['Determination of the Self', 'love of the body and right timing'], 47: ['Realization', 'making sense of the past'], 48: ['Depth', 'depth of knowledge and skill'],
  49: ['Principles', 'principles and necessary change'], 50: ['Values', 'guarding shared values'], 51: ['Shock', 'courage and initiative'],
  52: ['Stillness', 'stillness and focus'], 53: ['Beginnings', 'the drive to start new cycles'], 54: ['Ambition', 'drive to rise and transform'],
  55: ['Spirit', 'emotional abundance and mood'], 56: ['Stimulation', 'storytelling'], 57: ['Intuitive Clarity', 'intuition in the present moment'],
  58: ['Vitality', 'joy in making things better'], 59: ['Sexuality', 'breaking down barriers to closeness'], 60: ['Acceptance', 'working within limits'],
  61: ['Mystery', 'inner truth and wanting to know'], 62: ['Detail', 'naming things precisely'], 63: ['Doubt', 'questioning until it is proven'], 64: ['Confusion', 'sorting through images toward clarity'],
};

// ---------- Mayan (traditional K'iche' count) ----------
export const NAWAL_INFO: { essence: string; gifts: string; growth: string; tags: Theme[] }[] = [
  { essence: 'the waters, the deep unconscious and the unusual mind', gifts: 'sensitivity, dreams, imagination and creative genius', growth: 'staying grounded when feelings and impressions flood in', tags: ['intuitive/mystic', 'deep feeler', 'creator/artist'] },
  { essence: 'wind, breath and the spirit that moves through words', gifts: 'communication, fresh ideas and clearing what is stale', growth: 'steadying a changeable mind and mood', tags: ['communicator', 'visionary/innovator', 'truth-teller'] },
  { essence: 'the dawn: the moment darkness turns to light', gifts: 'new beginnings, hope and bringing things into the light', growth: 'trusting the light while you are still in the dark part', tags: ['transformer', 'visionary/innovator', 'healer'] },
  { essence: 'the net that gathers and holds', gifts: 'gathering people, resources and knowledge', growth: 'untying the knots and entanglements that hold you back', tags: ['connector/community-weaver', 'builder', 'entrepreneur/wealth-builder'] },
  { essence: 'the serpent: life force, wisdom and inner fire', gifts: 'vitality, instinctive knowing and a sense of justice', growth: 'directing strong energy with care', tags: ['transformer', 'healer', 'truth-teller'] },
  { essence: 'death and rebirth, and the presence of the ancestors', gifts: 'calm in the face of endings, protection and deep peace', growth: 'letting cycles close without fear', tags: ['transformer', 'guardian/protector', 'intuitive/mystic'] },
  { essence: 'the deer: strength with grace, and the four directions', gifts: 'natural authority, steadiness and care for the natural world', growth: 'leading without carrying everything alone', tags: ['leader', 'guardian/protector', 'nurturer'] },
  { essence: 'ripening: life, fertility and what grows from what is planted', gifts: 'creativity, abundance and helping things come to fruition', growth: 'patience with the timing of growth', tags: ['creator/artist', 'nurturer', 'builder'] },
  { essence: 'the offering: sacred fire, gratitude and balance restored', gifts: 'generosity, reciprocity and the ability to set things right', growth: 'giving without keeping score', tags: ['healer', 'server/helper', 'harmonizer/diplomat'] },
  { essence: 'the dog: loyalty, law and faithful guidance', gifts: 'fairness, fidelity and a strong sense of right and wrong', growth: 'holding high standards with warmth', tags: ['guardian/protector', 'truth-teller', 'leader'] },
  { essence: 'the thread of life, the weaver of time and all the arts', gifts: 'artistry, play, continuity and starting things well', growth: 'finishing what you weave', tags: ['creator/artist', 'performer/visible one', 'connector/community-weaver'] },
  { essence: 'the road: the path of destiny and the journey itself', gifts: 'guidance, travel and helping others find their way', growth: 'trusting your own path as much as you guide others on theirs', tags: ['adventurer', 'teacher', 'seeker/philosopher'] },
  { essence: 'the staff and the home: integrity and the pillar that sustains a family', gifts: 'steadiness, authority earned through honesty, and care for home', growth: 'bending when life asks for flexibility', tags: ['builder', 'guardian/protector', 'leader'] },
  { essence: 'the jaguar: the feminine power of the Earth and its mysteries', gifts: 'strength, inner knowing and a deep bond with nature', growth: 'using power with humility', tags: ['intuitive/mystic', 'guardian/protector', 'independent spirit'] },
  { essence: 'the bird: vision, freedom and the link between sky and earth', gifts: 'far sight, good fortune and a talent for prosperity', growth: 'bringing the high view down into daily life', tags: ['visionary/innovator', 'entrepreneur/wealth-builder', 'independent spirit'] },
  { essence: 'forgiveness, conscience and the wisdom of the ancestors', gifts: 'reflection, curiosity and the grace to forgive', growth: 'forgiving yourself as easily as you forgive others', tags: ['healer', 'seeker/philosopher', 'deep feeler'] },
  { essence: 'thought: knowledge that becomes wisdom through experience', gifts: 'intelligence, ideas and good counsel', growth: 'moving from thinking into action', tags: ['seeker/philosopher', 'teacher', 'analyst/refiner'] },
  { essence: 'the obsidian blade: truth that cuts away what does not belong', gifts: 'discernment, healing and clear decisions', growth: 'cutting with care, including with yourself', tags: ['healer', 'truth-teller', 'analyst/refiner'] },
  { essence: 'the storm: thunder, rain and the strength of community', gifts: 'care for family and community, healing and abundance', growth: 'not taking on every storm as your own', tags: ['nurturer', 'connector/community-weaver', 'healer'] },
  { essence: 'the sun and the hunter: light, certainty and the courage of a hero', gifts: 'leadership, clarity and the will to overcome darkness', growth: 'listening as well as you lead', tags: ['leader', 'performer/visible one', 'truth-teller'] },
];

export const TONE_INFO: Record<number, string> = {
  1: 'beginnings, unity and raw potential',
  2: 'duality, relationship and choice',
  3: 'movement, action and creative results',
  4: 'stability, foundation and the four directions',
  5: 'work, empowerment and getting things done',
  6: 'flow, responsiveness and steadiness under test',
  7: 'balance, reflection and a sense of purpose',
  8: 'wholeness, harmony and gratitude',
  9: 'patience, realisation and the cycles of life',
  10: 'community, cooperation and bringing things into form',
  11: 'change, many experiences and finding what is essential',
  12: 'understanding, gathered experience and sharing it',
  13: 'completion, strength of spirit and far-reaching ability',
};

// ---------- Numerology ----------
export const NUMBER_INFO: Record<number, { keywords: string; tags: Theme[] }> = {
  1: { keywords: 'independence, initiative and leadership', tags: ['leader', 'independent spirit'] },
  2: { keywords: 'partnership, sensitivity and diplomacy', tags: ['harmonizer/diplomat', 'nurturer'] },
  3: { keywords: 'creativity, expression and joy', tags: ['creator/artist', 'communicator'] },
  4: { keywords: 'structure, steadiness and hard work', tags: ['builder', 'guardian/protector'] },
  5: { keywords: 'freedom, change and adventure', tags: ['adventurer', 'independent spirit'] },
  6: { keywords: 'care, responsibility and harmony at home', tags: ['nurturer', 'healer'] },
  7: { keywords: 'inner search, analysis and spirituality', tags: ['seeker/philosopher', 'quiet observer'] },
  8: { keywords: 'power, achievement and material mastery', tags: ['entrepreneur/wealth-builder', 'leader'] },
  9: { keywords: 'compassion, completion and service to the whole', tags: ['healer', 'server/helper'] },
  11: { keywords: 'intuition, inspiration and illumination (a master number)', tags: ['intuitive/mystic', 'visionary/innovator'] },
  22: { keywords: 'large-scale building and practical vision (a master number)', tags: ['builder', 'visionary/innovator'] },
  33: { keywords: 'compassionate teaching and healing through love (a master number)', tags: ['teacher', 'healer'] },
};
export const NUMBER_ROLE: Record<string, string> = {
  lifePath: 'Life Path: the main road of your life, taken from your full birth date.',
  birthday: 'Birthday number: a particular gift you carry, taken from the day of the month you were born.',
  personalYear: 'Personal Year: the theme of the current year for you. It changes every year.',
  expression: 'Expression: your natural abilities, taken from every letter of your birth name.',
  soulUrge: 'Soul Urge: what your heart most wants, taken from the vowels of your birth name.',
  personality: 'Personality: how you come across to others, taken from the consonants of your birth name.',
};

// ---------- Chinese zodiac ----------
export const ANIMAL_INFO: Record<string, { qualities: string; tags: Theme[] }> = {
  Rat: { qualities: 'quick-witted, resourceful and good at spotting opportunity', tags: ['entrepreneur/wealth-builder', 'analyst/refiner'] },
  Ox: { qualities: 'steady, dependable and patient', tags: ['builder', 'guardian/protector'] },
  Tiger: { qualities: 'brave, magnetic and independent', tags: ['leader', 'rebel/disruptor'] },
  Rabbit: { qualities: 'gentle, diplomatic and attentive to beauty', tags: ['harmonizer/diplomat', 'nurturer'] },
  Dragon: { qualities: 'confident, visionary and full of life', tags: ['visionary/innovator', 'performer/visible one'] },
  Snake: { qualities: 'wise, intuitive and private', tags: ['intuitive/mystic', 'quiet observer'] },
  Horse: { qualities: 'energetic, free-spirited and warm', tags: ['adventurer', 'independent spirit'] },
  Goat: { qualities: 'gentle, creative and kind-hearted', tags: ['creator/artist', 'nurturer'] },
  Monkey: { qualities: 'clever, playful and inventive', tags: ['visionary/innovator', 'communicator'] },
  Rooster: { qualities: 'observant, honest and hardworking', tags: ['truth-teller', 'analyst/refiner'] },
  Dog: { qualities: 'loyal, fair and protective', tags: ['guardian/protector', 'server/helper'] },
  Pig: { qualities: 'generous, sincere and fond of life\'s pleasures', tags: ['nurturer', 'harmonizer/diplomat'] },
};
export const CHINESE_ELEMENT_INFO: Record<string, string> = {
  Wood: 'growth, generosity and vision',
  Fire: 'passion, warmth and leadership',
  Earth: 'stability, practicality and care',
  Metal: 'determination, clarity and strength',
  Water: 'wisdom, flexibility and intuition',
};

// ---------- Astrocartography ----------
export const ACG_PLANET_INFO: Record<string, string> = {
  sun: 'confidence, visibility and feeling fully yourself',
  moon: 'emotional belonging, comfort and a sense of home',
  mercury: 'learning, writing, connections and busy exchange',
  venus: 'love, beauty, pleasure and ease with people',
  mars: 'energy and drive, but also friction and haste',
  jupiter: 'growth, optimism, opportunity and good fortune',
  saturn: 'hard work, responsibility and lessons that take time',
  uranus: 'freedom, surprises and sudden change',
  neptune: 'inspiration, creativity, spirituality and dreaminess',
  pluto: 'intensity, deep change and confronting power',
};
export const ACG_ANGLE_INFO: Record<string, string> = {
  MC: 'career and public life',
  IC: 'home and private life',
  ASC: 'your own identity and vitality',
  DSC: 'partnerships and the people you meet',
};

// ---------- Life cycles ----------
export const CYCLE_INFO: Record<string, string> = {
  'Jupiter return': 'About every 12 years Jupiter comes home. A new chapter of growth and opportunity opens, and it is a good time to say yes to something bigger.',
  'Saturn return': 'Around ages 29 and 58 Saturn comes home. Life asks what is truly yours to build, and what is not falls away. It can feel heavy, and it is how you grow up into yourself.',
  'Chiron return': 'Around age 50 Chiron comes home. Old wounds come back to be met with everything you have learned, and often turn into what you offer others.',
  'Nodal return': 'About every 18 to 19 years the Moon\'s nodes come home. Your direction resets, and people and events tend to point you back toward your path.',
  'Uranus opposition': 'Around ages 40 to 44 Uranus sits opposite where it was at your birth. The parts of you that were set aside ask to be lived. Many people make big changes here.',
};
