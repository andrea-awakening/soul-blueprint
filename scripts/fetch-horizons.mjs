// One-time helper: asks NASA JPL Horizons (public API) for the apparent geocentric ecliptic longitude of each body
// at the documented UTC moment of every extra reference birth, and stores the answers in src/accuracy/fixtures.json.
// These are the independent "expected" values. The engine is never used to produce them.
import { readFileSync, writeFileSync } from 'node:fs';
import sweph from 'sweph';

const EXTRA = [
  { id: 'dst-us', label: 'Daylight-saving birth (US summer, 1975)', birth: { date: '1975-06-04', time: '09:09', place: 'Los Angeles, California, USA', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' }, expect: { utc: '1975-06-04T16:09Z', utcSource: 'Pacific Daylight Time, UTC-7', chinese: { animal: 'Rabbit', element: 'Wood', yinYang: 'Yin' } } },
  { id: 'jan-before-lny', label: 'January birth before Lunar New Year (1954)', birth: { date: '1954-01-29', time: '04:30', place: 'Kosciusko, Mississippi, USA', lat: 33.0576, lon: -89.5876, tz: 'America/Chicago' }, expect: { utc: '1954-01-29T10:30Z', utcSource: 'Central Standard Time, UTC-6', chinese: { animal: 'Snake', element: 'Water', yinYang: 'Yin' } } },
  { id: 'feb-29', label: 'February 29 birth (1976)', birth: { date: '1976-02-29', time: '12:00', place: 'New York, USA', lat: 40.7128, lon: -74.006, tz: 'America/New_York' }, expect: { utc: '1976-02-29T17:00Z', utcSource: 'Eastern Standard Time, UTC-5', chinese: { animal: 'Dragon', element: 'Fire', yinYang: 'Yang' } } },
  { id: 'south-perth', label: 'Southern-hemisphere birth (Perth, 1979)', birth: { date: '1979-04-04', time: '06:30', place: 'Perth, Australia', lat: -31.9522, lon: 115.8614, tz: 'Australia/Perth' }, expect: { utc: '1979-04-03T22:30Z', utcSource: 'Australian Western Standard Time, UTC+8', chinese: { animal: 'Goat', element: 'Earth', yinYang: 'Yin' } } },
  { id: 'south-auckland', label: 'Southern summer time across the date line (Auckland, 2000)', birth: { date: '2000-01-01', time: '00:01', place: 'Auckland, New Zealand', lat: -36.8485, lon: 174.7633, tz: 'Pacific/Auckland' }, expect: { utc: '1999-12-31T11:01Z', utcSource: 'New Zealand Daylight Time, UTC+13', chinese: { animal: 'Rabbit', element: 'Earth', yinYang: 'Yin' }, mayan: "11 Iq'" } },
  { id: 'north-reykjavik', label: 'Birth above 60 degrees latitude (Reykjavik, 1965)', birth: { date: '1965-11-21', time: '07:50', place: 'Reykjavik, Iceland', lat: 64.1355, lon: -21.8954, tz: 'Atlantic/Reykjavik' }, expect: { utc: '1965-11-21T08:50Z', utcSource: 'Iceland standard time before 1968, UTC-1', houseSystem: 'Placidus', chinese: { animal: 'Snake', element: 'Wood', yinYang: 'Yin' } } },
  { id: 'polar-tromso', label: 'Polar birth, Porphyry fallback (Tromso, 1985)', birth: { date: '1985-07-10', time: '14:00', place: 'Tromso, Norway', lat: 69.6492, lon: 18.9553, tz: 'Europe/Oslo' }, expect: { utc: '1985-07-10T12:00Z', utcSource: 'Central European Summer Time, UTC+2', houseSystem: 'Porphyry', chinese: { animal: 'Ox', element: 'Wood', yinYang: 'Yin' } } },
  { id: 'uk-bst', label: 'British Summer Time (1961)', birth: { date: '1961-07-01', time: '19:45', place: 'Sandringham, England', lat: 52.83, lon: 0.51, tz: 'Europe/London' }, expect: { utc: '1961-07-01T18:45Z', utcSource: 'British Summer Time, UTC+1', chinese: { animal: 'Ox', element: 'Metal', yinYang: 'Yin' } } },
  { id: 'uk-double', label: 'Wartime double summer time (London, 1944)', birth: { date: '1944-07-15', time: '10:00', place: 'London, England', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' }, expect: { utc: '1944-07-15T08:00Z', utcSource: 'British Double Summer Time, UTC+2', chinese: { animal: 'Monkey', element: 'Wood', yinYang: 'Yang' } } },
  { id: 'hawaii', label: 'Hawaii, no daylight saving (1961)', birth: { date: '1961-08-04', time: '19:24', place: 'Honolulu, Hawaii, USA', lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu' }, expect: { utc: '1961-08-05T05:24Z', utcSource: 'Hawaii Standard Time, UTC-10', chinese: { animal: 'Ox', element: 'Metal', yinYang: 'Yin' } } },
  { id: 'india', label: 'Half-hour time zone (Mumbai, 1984)', birth: { date: '1984-03-15', time: '08:20', place: 'Mumbai, India', lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' }, expect: { utc: '1984-03-15T02:50Z', utcSource: 'India Standard Time, UTC+5:30', chinese: { animal: 'Rat', element: 'Wood', yinYang: 'Yang' } } },
  { id: 'argentina-1936', label: 'Old summer-time rules (Buenos Aires, 1936)', birth: { date: '1936-12-17', time: '21:00', place: 'Buenos Aires, Argentina', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' }, expect: { utc: '1936-12-18T00:00Z', utcSource: 'Argentine summer time 1936-37, UTC-3', chinese: { animal: 'Rat', element: 'Fire', yinYang: 'Yang' } } },
  { id: 'la-1926', label: 'Before daylight saving existed locally (Los Angeles, 1926)', birth: { date: '1926-06-01', time: '09:30', place: 'Los Angeles, California, USA', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' }, expect: { utc: '1926-06-01T17:30Z', utcSource: 'Pacific Standard Time, UTC-8', chinese: { animal: 'Tiger', element: 'Fire', yinYang: 'Yang' } } },
  { id: 'recent', label: 'Recent birth (London, 2015)', birth: { date: '2015-05-02', time: '08:34', place: 'London, England', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' }, expect: { utc: '2015-05-02T07:34Z', utcSource: 'British Summer Time, UTC+1', chinese: { animal: 'Goat', element: 'Wood', yinYang: 'Yin' } } },
  { id: 'south-sydney', label: 'Southern summer time, January before Lunar New Year (Sydney, 1990)', birth: { date: '1990-01-15', time: '10:00', place: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' }, expect: { utc: '1990-01-14T23:00Z', utcSource: 'Australian Eastern Daylight Time, UTC+11', chinese: { animal: 'Snake', element: 'Earth', yinYang: 'Yin' } } },
  { id: 'tokyo', label: 'Japan (Tokyo, 1970)', birth: { date: '1970-08-08', time: '03:15', place: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' }, expect: { utc: '1970-08-07T18:15Z', utcSource: 'Japan Standard Time, UTC+9', chinese: { animal: 'Dog', element: 'Metal', yinYang: 'Yang' } } },
  { id: 'dst-repeat', label: 'Repeated hour when clocks go back (New York, Nov 7 2010, 1:30 AM)', birth: { date: '2010-11-07', time: '01:30', place: 'New York, USA', lat: 40.7128, lon: -74.006, tz: 'America/New_York' }, expect: { timeQuestion: 'ambiguous' } },
  { id: 'dst-skip', label: 'Skipped hour when clocks go forward (New York, Mar 14 2010, 2:30 AM)', birth: { date: '2010-03-14', time: '02:30', place: 'New York, USA', lat: 40.7128, lon: -74.006, tz: 'America/New_York' }, expect: { timeQuestion: 'nonexistent' } },
];

const BODIES = { sun: '10', moon: '301', mercury: '199', venus: '299', mars: '499', jupiter: '599', saturn: '699', uranus: '799', neptune: '899', pluto: '999', chiron: '2060;', rockefellia: '904;' };

const withUtc = EXTRA.filter((e) => e.expect.utc);
const jds = withUtc.map((e) => {
  const d = new Date(e.expect.utc.replace('Z', ':00Z'));
  return sweph.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours() + d.getUTCMinutes() / 60, sweph.constants.SE_GREG_CAL);
});
for (const e of withUtc) e.expect.jpl = {};

for (const [name, cmd] of Object.entries(BODIES)) {
  const tlist = jds.map((j) => `'${j.toFixed(7)}'`).join(',');
  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND='${encodeURIComponent(cmd)}'&OBJ_DATA='NO'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&TLIST=${encodeURIComponent(tlist)}&QUANTITIES='31'&ANG_FORMAT='DEG'&CSV_FORMAT='YES'`;
  const text = await (await fetch(url)).text();
  const block = text.split('$$SOE')[1]?.split('$$EOE')[0];
  if (!block) throw new Error(`No data for ${name}: ${text.slice(0, 400)}`);
  const lines = block.trim().split('\n');
  if (lines.length !== jds.length) throw new Error(`Expected ${jds.length} rows for ${name}, got ${lines.length}`);
  // Horizons returns the rows sorted by time, not in the order asked. Match each row to its birth by date.
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (const line of lines) {
    const cols = line.split(',').map((x) => x.trim());
    const m = /^(\d{4})-(\w{3})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(cols[0]);
    if (!m) throw new Error(`Unreadable row for ${name}: ${line}`);
    const rowMs = Date.UTC(Number(m[1]), MONTHS.indexOf(m[2]), Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]));
    const target = withUtc.find((e) => Math.abs(new Date(e.expect.utc.replace('Z', ':00Z')).getTime() - rowMs) < 30000);
    if (!target) throw new Error(`Row ${cols[0]} for ${name} matches no birth`);
    // CSV columns: date, (solar presence), (lunar presence), ObsEcLon, ObsEcLat
    const nums = cols.slice(1).filter((x) => /^-?\d+\.\d+$/.test(x));
    target.expect.jpl[name] = Number(nums[0]);
  }
  for (const e of withUtc) if (typeof e.expect.jpl[name] !== 'number') throw new Error(`No ${name} value for ${e.id}`);
  console.log(name, 'ok');
  await new Promise((r) => setTimeout(r, 400));
}

const path = new URL('../src/accuracy/fixtures.json', import.meta.url);
const fixtures = JSON.parse(readFileSync(path, 'utf8'));
fixtures.extra = EXTRA;
writeFileSync(path, JSON.stringify(fixtures, null, 2));
console.log('saved', EXTRA.length, 'extra births');
