// Builds data/tzdata.json: historical UTC offsets for every time zone used by the city list.
// Source: the official IANA time zone database, INCLUDING its "backzone" file, which keeps the separate
// pre-1970 history of countries (Sweden, Norway, Netherlands, Iceland...) that the default build merges
// into a neighbour. The IANA files are read as plain data; nothing from the download is executed.
// Usage: node scripts/build-tzdata.mjs <folder with the unpacked IANA tzdata> <empty work folder>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const [srcDir, workDir] = process.argv.slice(2).map((p) => path.resolve(p));
if (!srcDir || !workDir) throw new Error('usage: build-tzdata.mjs <tzdata folder> <work folder>');
const read = (f) => readFileSync(path.join(srcDir, f), 'utf8');
const version = read('version').trim();

// Zones listed per country in zone.tab: the ones whose full history we keep.
const keep = new Set(read('zone.tab').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t')[2]));

// Pull Zone blocks and Rule lines out of backzone.
const backLines = read('backzone').split('\n');
const backZones = new Map(); // name -> lines
const backRules = [];
let current = null;
for (const raw of backLines) {
  const line = raw.replace(/#.*$/, '').replace(/\s+$/, '');
  if (!line.trim()) continue;
  const f = line.trim().split(/\s+/);
  if (f[0] === 'Zone') {
    current = f[1];
    backZones.set(current, [line]);
  } else if (f[0] === 'Rule') {
    current = null;
    backRules.push(line);
  } else if (f[0] === 'Link') {
    current = null;
  } else if (current && /^\s/.test(raw)) {
    backZones.get(current).push(line);
  }
}
const restored = [...backZones.keys()].filter((z) => keep.has(z));
const restoredSet = new Set(restored);

const MAIN = ['africa', 'antarctica', 'asia', 'australasia', 'europe', 'northamerica', 'southamerica', 'etcetera', 'backward'];
const out = [];
for (const file of MAIN) {
  for (const raw of read(file).split('\n')) {
    const line = raw.replace(/#.*$/, '').replace(/\s+$/, '');
    if (!line.trim()) continue;
    const f = line.trim().split(/\s+/);
    // Drop "Link <target> <name>" when <name> gets its own full history back.
    if (f[0] === 'Link' && restoredSet.has(f[2])) continue;
    out.push(line);
  }
}
out.push(...backRules);
for (const z of restored) out.push(...backZones.get(z));

mkdirSync(workDir, { recursive: true });
const combined = path.join(workDir, 'combined.zi');
const compiled = path.join(workDir, 'compiled');
if (existsSync(compiled)) throw new Error('work folder must not already contain a compiled folder');
writeFileSync(combined, out.join('\n') + '\n');
try {
  execFileSync('/usr/sbin/zic', ['-b', 'fat', '-d', compiled, combined], { stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
  const msg = String(e.stderr || e.message);
  if (!existsSync(compiled)) throw new Error('zic failed: ' + msg.slice(0, 600));
}

function parseTzif(buf) {
  const header = (o) => ({ isut: buf.readUInt32BE(o + 20), isstd: buf.readUInt32BE(o + 24), leap: buf.readUInt32BE(o + 28), time: buf.readUInt32BE(o + 32), type: buf.readUInt32BE(o + 36), char: buf.readUInt32BE(o + 40) });
  if (buf.toString('latin1', 0, 4) !== 'TZif') throw new Error('not a TZif file');
  const ver = buf[4];
  const h1 = header(0);
  let o = 44 + h1.time * 5 + h1.type * 6 + h1.char + h1.leap * 8 + h1.isstd + h1.isut;
  if (ver < 0x32) throw new Error('TZif version 1 only');
  const h = header(o);
  o += 44;
  const times = [];
  for (let i = 0; i < h.time; i++) times.push(Number(buf.readBigInt64BE(o + i * 8)));
  o += h.time * 8;
  const idx = [];
  for (let i = 0; i < h.time; i++) idx.push(buf[o + i]);
  o += h.time;
  const offsets = [];
  for (let i = 0; i < h.type; i++) offsets.push(buf.readInt32BE(o + i * 6));
  return { times, idx, offsets };
}

const zonesNeeded = new Set(readFileSync(path.resolve('data/places.txt'), 'utf8').split('\n').map((l) => l.split('\t')[5]).filter(Boolean));
const zones = {};
const missing = [];
for (const z of [...zonesNeeded].sort()) {
  const file = path.join(compiled, z);
  if (!existsSync(file)) { missing.push(z); continue; }
  const { times, idx, offsets } = parseTzif(readFileSync(file));
  // Keep only real changes of offset, as [unixSeconds, offsetSeconds] pairs flattened.
  const t = [];
  let last = offsets[0];
  for (let i = 0; i < times.length; i++) {
    const off = offsets[idx[i]];
    if (off !== last) { t.push(times[i], off); last = off; }
  }
  zones[z] = { first: offsets[0], t };
}
if (missing.length) throw new Error('zones missing from the compiled data: ' + missing.join(', '));
writeFileSync(path.resolve('data/tzdata.json'), JSON.stringify({ version, source: 'IANA tzdata ' + version + ' with backzone (zone.tab zones)', zones }));
const ny = zones['America/New_York'];
console.log(`tzdata ${version}: ${Object.keys(zones).length} zones, ${restored.length} zones with restored pre-1970 history.`);
console.log('New York table runs to', new Date(ny.t[ny.t.length - 2] * 1000).toISOString().slice(0, 10));
