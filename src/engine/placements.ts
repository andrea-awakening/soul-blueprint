// Names, symbols and overview lines of the placements. Pure data, safe to use in the browser.
export type PlacementId =
  | 'sun' | 'moon' | 'asc' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'
  | 'mc' | 'dc' | 'ic' | 'rockefellia' | 'chiron' | 'lilith' | 'fortune' | 'northNode' | 'southNode';

export const PLACEMENT_ORDER: PlacementId[] = [
  'sun', 'moon', 'asc', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'mc', 'dc', 'ic', 'rockefellia', 'chiron', 'lilith', 'fortune', 'northNode', 'southNode',
];

export const PLACEMENT_INFO: Record<PlacementId, { name: string; symbol: string; overview: string }> = {
  sun: { name: 'Sun', symbol: '☉', overview: 'Core identity, purpose and vitality' },
  moon: { name: 'Moon', symbol: '☽', overview: 'Emotional world, instincts and inner needs' },
  asc: { name: 'Ascendant', symbol: 'AC', overview: 'First impression and how you meet the world' },
  mercury: { name: 'Mercury', symbol: '☿', overview: 'Mind, communication and learning style' },
  venus: { name: 'Venus', symbol: '♀', overview: 'Love, values and what you find beautiful' },
  mars: { name: 'Mars', symbol: '♂', overview: 'Drive, action and how you go after what you want' },
  jupiter: { name: 'Jupiter', symbol: '♃', overview: 'Growth, luck and where life expands' },
  saturn: { name: 'Saturn', symbol: '♄', overview: 'Discipline, responsibility and long-term lessons' },
  uranus: { name: 'Uranus', symbol: '♅', overview: 'Change, freedom and where you break the mold' },
  neptune: { name: 'Neptune', symbol: '♆', overview: 'Dreams, intuition and spiritual life' },
  pluto: { name: 'Pluto', symbol: '♇', overview: 'Power, depth and transformation' },
  mc: { name: 'Midheaven', symbol: 'MC', overview: 'Career, calling and public reputation' },
  dc: { name: 'Descendant', symbol: 'DC', overview: 'Partnership and what you look for in others' },
  ic: { name: 'IC', symbol: 'IC', overview: 'Roots, home and inner foundation' },
  rockefellia: { name: '904 Rockefellia', symbol: '904', overview: 'Wealth and how you build it' },
  chiron: { name: 'Chiron, the Wounded Healer', symbol: '⚷', overview: 'Your deepest wound and your gift for healing' },
  lilith: { name: 'Black Moon Lilith', symbol: '⚸', overview: 'The raw, untamed power you are reclaiming' },
  fortune: { name: 'Part of Fortune', symbol: '⊗', overview: 'Where joy and ease come naturally' },
  northNode: { name: 'North Node', symbol: '☊', overview: "Your soul's direction of growth in this life" },
  southNode: { name: 'South Node', symbol: '☋', overview: 'Past patterns and the comfort zone you are growing beyond' },
};

/** Short names used in aspect lines and validation. */
export const SHORT_NAME: Record<PlacementId, string> = {
  sun: 'Sun', moon: 'Moon', asc: 'Ascendant', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
  uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto', mc: 'Midheaven', dc: 'Descendant', ic: 'IC', rockefellia: 'Rockefellia',
  chiron: 'Chiron', lilith: 'Lilith', fortune: 'Part of Fortune', northNode: 'North Node', southNode: 'South Node',
};

