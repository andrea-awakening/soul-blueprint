// Builds data/lunar-new-year.json (1900-2100) and verifies it two independent ways:
//  1. an astronomical calculation with the Swiss Ephemeris (new moons + solar terms, China time), and
//  2. the Hong Kong Observatory's published Gregorian-Lunar conversion tables (1901-2100).
// The file is only written if both agree for every year. (The runtime's built-in Chinese calendar is
// compared too, for information: it is off by a day in a few years, so it is not used.)
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import sweph from 'sweph';

const c = sweph.constants;
sweph.set_ephe_path(path.join(process.cwd(), 'ephe'));
const FL = c.SEFLG_SWIEPH;
const lon = (jd, b) => sweph.calc_ut(jd, b, FL).data[0];
const norm = (x) => ((x % 360) + 360) % 360;
const diff = (a, b) => { let d = norm(a - b); if (d > 180) d -= 360; return d; };

// ---------- 1. ICU ----------
const fmt = new Intl.DateTimeFormat('en-u-ca-chinese', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric' });
function icuNewYear(year) {
  for (let d = 20; d <= 52; d++) {
    const date = new Date(Date.UTC(year, 0, d, 4)); // midday in China
    const parts = fmt.formatToParts(date);
    const m = parts.find((p) => p.type === 'month').value;
    const day = parts.find((p) => p.type === 'day').value;
    if (m === '1' && day === '1') return date.toISOString().slice(5, 10);
  }
  return null;
}

// ---------- 2. Astronomy ----------
// China civil date index for a JD (UT). Standard time UTC+8 from 1929; Beijing local mean time (UTC+7:45:40) before.
const chinaDay = (jd, year) => Math.floor(jd + 0.5 + (year >= 1929 ? 8 / 24 : (7 + 45 / 60 + 40 / 3600) / 24));
function newMoonNear(jd) {
  // refine to exact Sun-Moon conjunction
  for (let i = 0; i < 30; i++) {
    const d = diff(lon(jd, c.SE_MOON), lon(jd, c.SE_SUN));
    if (Math.abs(d) < 1e-7) break;
    jd -= d / 12.19;
  }
  return jd;
}
function newMoonOnOrBefore(jd, year) {
  let nm = newMoonNear(jd);
  while (chinaDay(nm, year) > chinaDay(jd, year)) nm = newMoonNear(nm - 29.53);
  // make sure there is not a later one still on/before
  for (;;) {
    const next = newMoonNear(nm + 29.53);
    if (chinaDay(next, year) <= chinaDay(jd, year)) nm = next; else break;
  }
  return nm;
}
function sunAt(target, jdGuess) {
  let jd = jdGuess;
  for (let i = 0; i < 30; i++) {
    const d = diff(target, lon(jd, c.SE_SUN));
    if (Math.abs(d) < 1e-8) break;
    jd += d / 0.9856;
  }
  return jd;
}
function astroNewYear(year) {
  const ws1 = sunAt(270, sweph.julday(year - 1, 12, 21.5, 0, c.SE_GREG_CAL));
  const ws2 = sunAt(270, sweph.julday(year, 12, 21.5, 0, c.SE_GREG_CAL));
  const m11a = newMoonOnOrBefore(ws1, year - 1);
  const m11b = newMoonOnOrBefore(ws2, year);
  const months = [m11a];
  while (chinaDay(months[months.length - 1], year) < chinaDay(m11b, year) - 5) months.push(newMoonNear(months[months.length - 1] + 29.53));
  const count = months.length - 1; // lunations from month 11 to the next month 11
  let leapIndex = -1;
  if (count === 13) {
    for (let i = 1; i <= 12; i++) {
      const start = chinaDay(months[i], year);
      const end = chinaDay(months[i + 1] ?? newMoonNear(months[i] + 29.53), year);
      // does a principal term (Sun at a multiple of 30 degrees) fall inside this month?
      let has = false;
      const l0 = lon(months[i], c.SE_SUN);
      const nextTerm = Math.ceil(l0 / 30) * 30;
      const jdTerm = sunAt(norm(nextTerm), months[i] + diff(norm(nextTerm), l0) / 0.9856);
      const td = chinaDay(jdTerm, year);
      if (td >= start && td < end) has = true;
      if (!has) { leapIndex = i; break; }
    }
  }
  // month 11 = index 0. Without a leap month before it, month 1 = index 2.
  const idx = leapIndex === 1 || leapIndex === 2 ? 3 : 2;
  const jd = months[idx];
  const dayIdx = chinaDay(jd, year);
  const date = new Date((dayIdx - 2440588) * 86400000);
  return date.toISOString().slice(5, 10);
}

// ---------- 3. Published reference: Hong Kong Observatory conversion tables (1901-2100) ----------
import { readFileSync } from 'node:fs';
const hko = Object.fromEntries(
  readFileSync(path.join(process.cwd(), 'scripts/hko-lunar-new-year.txt'), 'utf8').trim().split('\n').map((l) => [l.slice(0, 4), l.slice(5)]),
);

const table = {};
const problems = [];
const notes = [];
for (let y = 1900; y <= 2100; y++) {
  const astro = astroNewYear(y);
  const icu = icuNewYear(y);
  if (icu !== astro) notes.push(`${y}: built-in runtime calendar says ${icu}, astronomy says ${astro}`);
  if (y >= 1901) {
    if (!hko[y]) problems.push(`${y}: missing from the Hong Kong Observatory list`);
    else if (hko[y] !== astro) problems.push(`${y}: Hong Kong Observatory ${hko[y]} vs astronomy ${astro}`);
  }
  table[y] = astro;
}
if (table[1900] !== '01-31') problems.push(`1900: table ${table[1900]} vs well-known date 01-31`);
if (notes.length) console.log('Note (not used): ' + notes.join('; '));
if (problems.length) {
  console.log('MISMATCHES\n' + problems.join('\n'));
  process.exit(1);
}
writeFileSync(path.join(process.cwd(), 'data/lunar-new-year.json'), JSON.stringify(table));
console.log('Lunar New Year table written: 201 years. Swiss Ephemeris astronomy agrees with the Hong Kong Observatory for all of 1901-2100.');
