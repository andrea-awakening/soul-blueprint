// Birth-place search over the bundled GeoNames city list (CC BY 4.0, geonames.org).
// Runs fully offline on the server: what someone types is never sent to a third party.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export interface Place { id: number; name: string; region: string; country: string; lat: number; lon: number; tz: string; pop: number }

interface Row extends Place { nName: string; nAlts: string[]; nWords: string[] }

let rows: Row[] | null = null;

export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

function load(): Row[] {
  if (rows) return rows;
  const text = readFileSync(path.join(process.cwd(), 'data', 'places.txt'), 'utf8');
  rows = text.split('\n').map((line, id) => {
    const [name, region, country, lat, lon, tz, pop, alts] = line.split('\t');
    const nName = normalize(name);
    return {
      id, name, region, country, lat: Number(lat), lon: Number(lon), tz, pop: Number(pop),
      nName, nAlts: alts ? alts.split(',').map(normalize) : [],
      nWords: `${nName} ${normalize(region)} ${normalize(country)}`.split(' '),
    };
  });
  return rows;
}

export function placeLabel(p: Place): string {
  return [p.name, p.region && p.region !== p.name ? p.region : '', p.country].filter(Boolean).join(', ');
}

export function getPlace(id: number): Place | null {
  const all = load();
  const r = Number.isInteger(id) && id >= 0 && id < all.length ? all[id] : null;
  return r ? { id: r.id, name: r.name, region: r.region, country: r.country, lat: r.lat, lon: r.lon, tz: r.tz, pop: r.pop } : null;
}

export function searchPlaces(query: string, limit = 8): { id: number; label: string }[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const tokens = q.split(' ');
  const hits: { row: Row; score: number }[] = [];
  for (const row of load()) {
    let nameLen = 0;
    // Try the longest run of leading words that is a prefix of the city name (or one of its other names).
    for (let k = tokens.length; k >= 1; k--) {
      const head = tokens.slice(0, k).join(' ');
      if (row.nName.startsWith(head) || row.nAlts.some((a) => a.startsWith(head))) { nameLen = k; break; }
    }
    if (!nameLen) continue;
    // Any remaining words must match the start of a word in the name, state or country.
    const rest = tokens.slice(nameLen);
    if (!rest.every((t) => row.nWords.some((w) => w.startsWith(t)))) continue;
    const head = tokens.slice(0, nameLen).join(' ');
    const exact = row.nName === head || row.nAlts.includes(head) ? 2 : row.nName.startsWith(head) ? 1 : 0;
    hits.push({ row, score: exact * 1e9 + row.pop });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit).map(({ row }) => ({ id: row.id, label: placeLabel(row) }));
}
