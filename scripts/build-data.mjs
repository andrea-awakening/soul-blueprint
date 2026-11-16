// Builds the compact data files from the raw GeoNames + Natural Earth downloads in .raw/
// Sources: GeoNames (CC BY 4.0, https://www.geonames.org) and Natural Earth (public domain).
import { readFileSync, writeFileSync } from 'node:fs';

const raw = (f) => readFileSync(new URL('../.raw/' + f, import.meta.url), 'utf8');

const countries = new Map();
for (const line of raw('countryInfo.txt').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const c = line.split('\t');
  countries.set(c[0], c[4]);
}
const admin1 = new Map();
for (const line of raw('admin1CodesASCII.txt').split('\n')) {
  if (!line) continue;
  const c = line.split('\t');
  admin1.set(c[0], c[1]);
}

const latin = /^[\p{Script=Latin}\s.'’\-]+$/u;
const out = [];
const major = [];
const seen = new Set();
for (const line of raw('cities1000.txt').split('\n')) {
  if (!line) continue;
  const c = line.split('\t');
  const [, name, ascii, alts, lat, lon, fclass, , cc, , a1] = c;
  const pop = Number(c[14]);
  const tz = c[17];
  if (fclass !== 'P' || !tz) continue;
  const country = countries.get(cc) || cc;
  const region = admin1.get(`${cc}.${a1}`) || '';
  const key = `${name}|${region}|${cc}|${Number(lat).toFixed(1)}|${Number(lon).toFixed(1)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  let altList = [];
  if (pop >= 50000 && alts) {
    const set = new Set();
    for (const a of alts.split(',')) {
      if (a.length < 3 || a.length > 32 || !latin.test(a) || !/^\p{Lu}/u.test(a)) continue;
      if (a === name || a === ascii) continue;
      set.add(a);
      if (set.size >= 14) break;
    }
    altList = [...set];
  }
  const extra = ascii && ascii !== name ? [ascii, ...altList] : altList;
  out.push([name, region, country, Number(lat).toFixed(4), Number(lon).toFixed(4), tz, pop, extra.join(',')].join('\t'));
  if (pop >= 100000) major.push([name, country, Number(Number(lat).toFixed(3)), Number(Number(lon).toFixed(3)), pop]);
}
writeFileSync(new URL('../data/places.txt', import.meta.url), out.join('\n'));
major.sort((a, b) => b[4] - a[4]);
writeFileSync(new URL('../data/cities-major.json', import.meta.url), JSON.stringify(major));

const land = JSON.parse(raw('ne_110m_land.geojson'));
const round = (v) => (Array.isArray(v[0]) ? v.map(round) : [Math.round(v[0] * 100) / 100, Math.round(v[1] * 100) / 100]);
const slim = { type: 'FeatureCollection', features: land.features.map((f) => ({ type: 'Feature', properties: {}, geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) } })) };
writeFileSync(new URL('../public/data/land.json', import.meta.url), JSON.stringify(slim));
console.log('places', out.length, 'major', major.length);
