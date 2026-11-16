// Names, symbols and overview lines of the placements. Pure data, safe to use in the browser.
export type PlacementId =
  | 'sun' | 'moon' | 'asc' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'
  | 'mc' | 'dc' | 'ic' | 'rockefellia' | 'chiron' | 'lilith' | 'fortune' | 'northNode' | 'southNode';

export const PLACEMENT_ORDER: PlacementId[] = [
  'sun', 'moon', 'asc', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'mc', 'dc', 'ic', 'rockefellia', 'chiron', 'lilith', 'fortune', 'northNode', 'southNode',
];

export const PLACEMENT_INFO: Record<PlacementId, { name: string; symbol: string; overview: string }> = {
  sun: { name: 'Sun', symbol: '☉', overview: 'My soul fundamentally is…' },
  moon: { name: 'Moon', symbol: '☽', overview: 'I experience emotions…' },
  asc: { name: 'Ascendant', symbol: 'AC', overview: 'I seem to the outer world as…' },
  mercury: { name: 'Mercury', symbol: '☿', overview: 'I communicate…' },
  venus: { name: 'Venus', symbol: '♀', overview: 'I love…' },
  mars: { name: 'Mars', symbol: '♂', overview: 'I take action…' },
  jupiter: { name: 'Jupiter', symbol: '♃', overview: 'I expand through…' },
  saturn: { name: 'Saturn', symbol: '♄', overview: 'I discipline myself…' },
  uranus: { name: 'Uranus', symbol: '♅', overview: 'My generation innovates…' },
  neptune: { name: 'Neptune', symbol: '♆', overview: 'I am intuitive and I dream…' },
  pluto: { name: 'Pluto', symbol: '♇', overview: 'My generation experiences power…' },
  mc: { name: 'Midheaven', symbol: 'MC', overview: 'My career path is…' },
  dc: { name: 'Descendant', symbol: 'DC', overview: 'I seek in partnership…' },
  ic: { name: 'IC', symbol: 'IC', overview: 'My roots and inner home are…' },
  rockefellia: { name: '904 Rockefellia', symbol: '904', overview: 'I create wealth…' },
  chiron: { name: 'Chiron, the Wounded Healer', symbol: '⚷', overview: 'My deepest wound that I am here to heal and help others with is…' },
  lilith: { name: 'Black Moon Lilith', symbol: '⚸', overview: 'My untamed, reclaimed power is…' },
  fortune: { name: 'Part of Fortune', symbol: '⊗', overview: 'I find joy and ease through…' },
  northNode: { name: 'North Node', symbol: '☊', overview: "My soul's life path and destiny is…" },
  southNode: { name: 'South Node', symbol: '☋', overview: 'My past life and early age habitual patterns are…' },
};

/** Short names used in aspect lines and validation. */
export const SHORT_NAME: Record<PlacementId, string> = {
  sun: 'Sun', moon: 'Moon', asc: 'Ascendant', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
  uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto', mc: 'Midheaven', dc: 'Descendant', ic: 'IC', rockefellia: 'Rockefellia',
  chiron: 'Chiron', lilith: 'Lilith', fortune: 'Part of Fortune', northNode: 'North Node', southNode: 'South Node',
};

