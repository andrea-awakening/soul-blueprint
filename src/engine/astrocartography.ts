// Astrocartography: where on Earth each planet was rising, setting, overhead (MC) or underfoot (IC) at the birth moment.
import majorCities from '../../data/cities-major.json';
import { BODY, calcEquatorial, gstDegrees, norm360 } from './swe';

export const ACG_PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const;
export type AcgPlanet = (typeof ACG_PLANETS)[number];
export type AcgAngle = 'MC' | 'IC' | 'ASC' | 'DSC';

export interface AcgLine {
  planet: AcgPlanet;
  angle: AcgAngle;
  /** [lat, lon] points. MC and IC lines are straight north-south lines at one longitude. */
  points: [number, number][];
  cities: { name: string; country: string; lat: number; lon: number; distanceKm: number; population: number }[];
}

export type AcgGroupKey = 'career' | 'love' | 'growth' | 'home' | 'spirit' | 'careful';

export interface AcgGroup {
  key: AcgGroupKey;
  title: string;
  lines: { planet: AcgPlanet; angle: AcgAngle; cities: string[] }[];
}

const RAD = Math.PI / 180;
const wrapLon = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;
const ZONE_KM = 300; // each line is a zone a few hundred miles wide

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function nearCities(points: [number, number][], meridian: number | null): AcgLine['cities'] {
  const found: AcgLine['cities'] = [];
  for (const [name, country, lat, lon, pop] of majorCities as [string, string, number, number, number][]) {
    let best = Infinity;
    if (meridian !== null) {
      best = haversineKm(lat, lon, lat, meridian);
    } else {
      for (const [plat, plon] of points) {
        if (Math.abs(plat - lat) > 4) continue;
        const d = haversineKm(lat, lon, plat, plon);
        if (d < best) best = d;
      }
    }
    if (best <= ZONE_KM) found.push({ name, country, lat, lon, distanceKm: Math.round(best), population: pop });
  }
  // The list is already sorted by population. Keep the largest few, at most two per country,
  // so the places are ones people know and are not all in one corner of the map.
  const out: AcgLine['cities'] = [];
  const perCountry = new Map<string, number>();
  for (const c of found) {
    const n = perCountry.get(c.country) || 0;
    if (n >= 2) continue;
    perCountry.set(c.country, n + 1);
    out.push(c);
    if (out.length >= 5) break;
  }
  return out;
}

export function computeAstrocartography(jdUT: number): { lines: AcgLine[]; groups: AcgGroup[] } {
  const gst = gstDegrees(jdUT);
  const lines: AcgLine[] = [];
  for (const planet of ACG_PLANETS) {
    const { ra, dec } = calcEquatorial(jdUT, BODY[planet]);
    const mcLon = wrapLon(ra - gst);
    const icLon = wrapLon(mcLon + 180);
    lines.push({ planet, angle: 'MC', points: [[-85, mcLon], [85, mcLon]], cities: nearCities([], mcLon) });
    lines.push({ planet, angle: 'IC', points: [[-85, icLon], [85, icLon]], cities: nearCities([], icLon) });
    const asc: [number, number][] = [];
    const dsc: [number, number][] = [];
    for (let lat = -66; lat <= 66; lat += 1) {
      const x = -Math.tan(lat * RAD) * Math.tan(dec * RAD);
      if (Math.abs(x) > 1) continue; // the planet never rises or sets at this latitude
      const H = Math.acos(x) / RAD; // hour angle at rising/setting
      asc.push([lat, wrapLon(ra - H - gst)]);
      dsc.push([lat, wrapLon(ra + H - gst)]);
    }
    lines.push({ planet, angle: 'ASC', points: asc, cities: nearCities(asc, null) });
    lines.push({ planet, angle: 'DSC', points: dsc, cities: nearCities(dsc, null) });
  }
  const pick = (planet: AcgPlanet, angles: AcgAngle[]) =>
    lines.filter((l) => l.planet === planet && angles.includes(l.angle)).map((l) => ({ planet: l.planet, angle: l.angle, cities: l.cities.map((c) => `${c.name}, ${c.country}`) }));
  const ALL: AcgAngle[] = ['MC', 'ASC', 'DSC', 'IC'];
  const groups: AcgGroup[] = [
    { key: 'career', title: 'Career and visibility', lines: [...pick('sun', ALL), ...pick('jupiter', ['MC'])] },
    { key: 'love', title: 'Love and beauty', lines: pick('venus', ALL) },
    { key: 'growth', title: 'Growth and luck', lines: pick('jupiter', ALL) },
    { key: 'home', title: 'Home and rest', lines: pick('moon', ALL) },
    { key: 'spirit', title: 'Creativity and spirit', lines: pick('neptune', ALL) },
    { key: 'careful', title: 'Places to be careful', lines: [...pick('saturn', ALL), ...pick('mars', ALL), ...pick('pluto', ALL)] },
  ];
  return { lines, groups };
}
