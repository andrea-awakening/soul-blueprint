'use client';
// The whole journey: welcome -> form -> journey map and vehicle -> loading screen -> chapters (unlocked one at a time) -> closing.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { WELCOME, FORM, LOADING, CLOSING, CHAPTERS, OVERVIEW, VEHICLES, TRAVEL_LINES, type VehicleId } from '../content/copy';
import { nameNumbers } from '../engine/numerology';
import { computeSoulThemes, type Chapter, type SoulTheme } from '../reading/build';
import {
  keyFor, loadLast, loadByInput, save, forget, mergePart, collectTags, buildThemesChapter, buildWorkChapter, journalEntries,
  loadVehicle, saveVehicle, rememberPlace, takePlace, estimateMinutes,
  type Blueprint, type BirthInput, type PartResult, type Highlight,
} from './store';
import { ReaderProvider } from './Reader';
import { ChapterView } from './ChapterView';
import { Stardust } from './Viz';
import { Vehicle, JourneyMap, Track, Heart, Sparkles, sparkleBurst } from './Art';

type Stage = 'boot' | 'welcome' | 'form' | 'overview' | 'loading' | 'reading';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function askPart(input: BirthInput, chapter: number, part: string, extra: Record<string, unknown> = {}): Promise<PartResult> {
  const body = JSON.stringify({ date: input.date, time: input.time, placeId: input.placeId, timeChoice: input.timeChoice, nameNumbers: input.nameNumbers, firstName: input.firstName, chapter, part, ...extra });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/chapter', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      const json = (await res.json()) as PartResult;
      if (json.status === 'busy' && attempt === 0) { await wait(5000); continue; }
      return json;
    } catch {
      if (attempt === 0) { await wait(1500); continue; }
    }
  }
  return { status: 'error', cards: [] };
}

// ------------------------------------------------------------------ Welcome
function Welcome({ onBegin }: { onBegin: () => void }) {
  return (
    <main className="shell center-screen rise">
      <span className="kicker">{WELCOME.kicker}</span>
      <h1 className="display gold">{WELCOME.title[0]}<br /><em>{WELCOME.title[1]}</em></h1>
      {WELCOME.paragraphs.map((p, i) => <p key={i} className={i === 0 ? 'welcome-first' : i === 2 ? 'welcome-why' : 'lede'}>{p}</p>)}
      <div className="card plain" style={{ marginTop: 34 }}>
        <span className="label">{WELCOME.howTitle}</span>
        <ul className="how">
          {WELCOME.how.map(([a, b], i) => (
            <li key={i}><span className="num">{i + 1}</span><span><strong>{a}</strong> {b}</span></li>
          ))}
        </ul>
      </div>
      <div className="btn-row"><button type="button" className="btn btn-gold" onClick={onBegin}>{WELCOME.cta}</button></div>
    </main>
  );
}

// ------------------------------------------------------------------ Form
interface TimeQuestion { question: string; options: { label: string; description: string }[] }

function BirthForm({ onDone }: { onDone: (input: BirthInput, data: { facts: Blueprint['facts']; chapters: Chapter[]; ai: boolean }) => void }) {
  const [firstName, setFirstName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [ampm, setAmpm] = useState('AM');
  const [unknown, setUnknown] = useState(false);
  const [city, setCity] = useState('');
  const [place, setPlace] = useState<{ id: number; label: string } | null>(null);
  const [options, setOptions] = useState<{ id: number; label: string }[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState<TimeQuestion | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (place && place.label === city) { setOptions([]); return; }
    const q = city.trim();
    if (q.length < 2) { setOptions([]); return; }
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (mine === seq.current) { setOptions(json.results || []); setActiveIdx(0); }
      } catch { /* the list simply stays empty */ }
    }, 180);
    return () => clearTimeout(t);
  }, [city, place]);

  const pick = (o: { id: number; label: string }) => { setPlace(o); setCity(o.label); setOptions([]); };

  const submit = async (timeChoice?: 0 | 1) => {
    setError('');
    const y = Number(year);
    const d = Number(day);
    const m = Number(month);
    if (!m || !d || !y || year.length !== 4 || d < 1 || d > 31) { setError(FORM.errors.date); return; }
    if (!unknown && (hour === '' || minute === '')) { setError(FORM.errors.time); return; }
    if (!place) { setError(FORM.errors.city); return; }
    const h24 = unknown ? 0 : (Number(hour) % 12) + (ampm === 'PM' ? 12 : 0);
    const input: BirthInput = {
      firstName: firstName.trim().slice(0, 30),
      date: `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      time: unknown ? null : `${String(h24).padStart(2, '0')}:${String(Number(minute)).padStart(2, '0')}`,
      placeId: place.id,
      placeLabel: place.label,
      timeChoice,
      // The full name is turned into three numbers here, on this device. Only the numbers go any further.
      nameNumbers: fullName.trim() ? nameNumbers(fullName) : null,
    };
    setBusy(true);
    try {
      const res = await fetch('/api/blueprint', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
      const json = await res.json();
      if (json.status === 'ok') onDone(input, json);
      else if (json.status === 'choose-time') setAsk({ question: json.question, options: json.options });
      else setError(json.message || FORM.errors.generic);
    } catch {
      setError(FORM.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  if (ask) {
    return (
      <main className="shell center-screen rise">
        <span className="kicker">One quick question</span>
        <h2 className="section">{ask.question}</h2>
        <div className="choice">
          {ask.options.map((o, i) => (
            <button key={i} type="button" className="btn btn-ghost" disabled={busy} onClick={() => submit(i as 0 | 1)}>{o.label}, {o.description}</button>
          ))}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </main>
    );
  }

  return (
    <main className="shell rise" style={{ paddingTop: 72 }}>
      <h1 className="display gold">{FORM.title[0]} <em>{FORM.title[1]}</em></h1>
      <p className="lede" style={{ marginBottom: 36 }}>{FORM.intro}</p>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        <div className="field">
          <label className="label" htmlFor="firstName">{FORM.firstName}</label>
          <input id="firstName" className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" maxLength={30} />
          <p className="hint">{FORM.firstNameHint}</p>
        </div>

        <div className="field">
          <span className="label">{FORM.date}</span>
          <div className="row-3">
            <select className="input" aria-label="Birth month" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">Month</option>
              {MONTHS.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
            </select>
            <input className="input" aria-label="Birth day" inputMode="numeric" placeholder="Day" maxLength={2} value={day} onChange={(e) => setDay(e.target.value.replace(/\D/g, ''))} />
            <input className="input" aria-label="Birth year" inputMode="numeric" placeholder="Year" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))} />
          </div>
        </div>

        <div className="field">
          <span className="label">{FORM.time}</span>
          <div className="row-time">
            <select className="input" aria-label="Birth hour" value={hour} disabled={unknown} onChange={(e) => setHour(e.target.value)}>
              <option value="">Hour</option>
              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <select className="input" aria-label="Birth minute" value={minute} disabled={unknown} onChange={(e) => setMinute(e.target.value)}>
              <option value="">Min</option>
              {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
            </select>
            <select className="input" aria-label="AM or PM" value={ampm} disabled={unknown} onChange={(e) => setAmpm(e.target.value)}>
              <option>AM</option>
              <option>PM</option>
            </select>
          </div>
          <p className="hint">{FORM.timeHint}</p>
          <label className="check"><input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} />{FORM.unknownTime}</label>
        </div>

        <div className="field">
          <label className="label" htmlFor="city">{FORM.city}</label>
          <div style={{ position: 'relative' }}>
          <input
            id="city" className="input" value={city} placeholder={FORM.cityPlaceholder} autoComplete="off" role="combobox" aria-expanded={options.length > 0} aria-controls="city-list" aria-autocomplete="list"
            onChange={(e) => { setCity(e.target.value); setPlace(null); }}
            onKeyDown={(e) => {
              if (!options.length) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(options.length - 1, i + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
              else if (e.key === 'Enter') { e.preventDefault(); pick(options[activeIdx]); }
              else if (e.key === 'Escape') setOptions([]);
            }}
          />
          {options.length > 0 && (
            <ul className="suggest" id="city-list" role="listbox">
              {options.map((o, i) => (
                <li key={o.id} role="option" aria-selected={i === activeIdx}>
                  <button type="button" className={i === activeIdx ? 'active' : ''} onClick={() => pick(o)}>{o.label}</button>
                </li>
              ))}
            </ul>
          )}
          </div>
          <p className="hint">{FORM.cityHint}</p>
        </div>

        <div className="field">
          <label className="label" htmlFor="fullName">{FORM.fullName}</label>
          <input id="fullName" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="off" maxLength={120} />
          <p className="hint">{FORM.fullNameHint}</p>
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        <div className="btn-row"><button type="submit" className="btn btn-gold" disabled={busy}>{busy ? 'Calculating' : FORM.submit}</button></div>
      </form>
    </main>
  );
}

// ------------------------------------------------------------------ Journey overview and vehicle choice
function Overview({ minutes, vehicle, onVehicle, onStart }: { minutes: number[]; vehicle: VehicleId; onVehicle: (v: VehicleId) => void; onStart: () => void }) {
  const total = minutes.reduce((a, b) => a + b, 0);
  const hours = Math.floor(total / 60);
  const totalText = hours ? `${hours} hour${hours > 1 ? 's' : ''}${total % 60 ? ` ${total % 60} minutes` : ''}` : `${total} minutes`;
  return (
    <main className="shell rise" style={{ paddingTop: 64 }}>
      <span className="kicker">{OVERVIEW.kicker}</span>
      <h1 className="display gold">{OVERVIEW.title[0]} <em>{OVERVIEW.title[1]}</em></h1>
      <p className="lede">{OVERVIEW.intro}</p>
      <p className="mono" style={{ margin: '0 0 30px' }}>About {totalText} in all. Go at your own pace. Your place is saved on this device.</p>

      <div className="card plain" style={{ marginTop: 0 }}>
        <span className="label">{OVERVIEW.vehicleTitle}</span>
        <div className="vehicle-pick" role="radiogroup" aria-label={OVERVIEW.vehicleTitle}>
          {VEHICLES.map((v) => (
            <button key={v.id} type="button" role="radio" aria-checked={vehicle === v.id} className={vehicle === v.id ? 'on' : ''} onClick={(e) => { onVehicle(v.id); const r = e.currentTarget.getBoundingClientRect(); sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 12); }}>
              <Vehicle kind={v.id} size={58} />
              <span>{v.label}</span>
            </button>
          ))}
        </div>
        <p className="quiet" style={{ margin: '14px 0 0' }}>{OVERVIEW.vehicleNote}</p>
      </div>

      <JourneyMap minutes={minutes} vehicle={vehicle} />
      <div className="btn-row" style={{ justifyContent: 'center' }}><button type="button" className="btn btn-gold" onClick={onStart}>{OVERVIEW.cta}</button></div>
    </main>
  );
}

// ------------------------------------------------------------------ Loading screen (the quote)
function LoadingScreen({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [phase, setPhase] = useState<'quote' | 'quote-out' | 'song' | 'song-out'>('quote');
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const songRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const start = Date.now();
      await wait(1600 + 4000); // the quote resolves, then holds about 4 seconds...
      while (alive && !readyRef.current && Date.now() - start < 50000) await wait(400); // ...longer only if chapter 1 isn't ready yet
      if (!alive) return;
      setPhase('quote-out');
      await wait(1100);
      if (!alive) return;
      setPhase('song');
      await wait(900);
      if (!alive) return;
      const r = songRef.current?.getBoundingClientRect();
      if (r) { sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 44); setTimeout(() => sparkleBurst(r.left + r.width * 0.25, r.top + r.height / 2, 18), 260); setTimeout(() => sparkleBurst(r.left + r.width * 0.75, r.top + r.height / 2, 18), 420); }
      await wait(3000);
      if (!alive) return;
      setPhase('song-out');
      await wait(1100);
      if (alive) onDone();
    })();
    return () => { alive = false; };
  }, [onDone]);
  return (
    <div className="loading" role="status" aria-live="polite">
      {phase.startsWith('quote') ? (
        <blockquote className={`quote ${phase === 'quote' ? 'resolve-quick' : 'dissolve'}`}>
          {'“'}{LOADING.quoteParts.map(([text, key], i) => (key ? <span key={i} className="gold-text glow">{text}</span> : <span key={i}>{text}</span>))}{'”'}
          <span className="label by">{LOADING.attribution}</span>
        </blockquote>
      ) : (
        <p ref={songRef} className={`song gold-text ${phase === 'song' ? 'resolve-quick' : 'dissolve'}`}>{LOADING.line}</p>
      )}
      <span className="load-shimmer" aria-hidden="true" />
    </div>
  );
}

// ------------------------------------------------------------------ Travelling between chapters
function Travel({ from, to, vehicle }: { from: number; to: number; vehicle: VehicleId }) {
  const [pct, setPct] = useState(((from - 1) / 9) * 100);
  const [line, setLine] = useState(() => (from * 2 + to) % TRAVEL_LINES.length);
  useEffect(() => {
    const t = setTimeout(() => setPct(((to - 1) / 9) * 100), 60);
    const i = setInterval(() => setLine((n) => (n + 1) % TRAVEL_LINES.length), 3400);
    return () => { clearTimeout(t); clearInterval(i); };
  }, [to]);
  return (
    <div className="loading travel" role="status" aria-live="polite">
      <div className="travel-inner">
        <Track pct={pct} vehicle={vehicle} big moving />
        <p key={line} className="travel-line resolve-quick">{TRAVEL_LINES[line]}</p>
        <p className="label">{to <= 9 ? `Next stop: ${CHAPTERS[to - 1].title.join(' ')}` : 'Last stop: home'}</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Journey
type Prefetch = { promise: Promise<{ chapter: Chapter; themes: SoulTheme[] }>; journalKey: string };

export default function Journey() {
  const [stage, setStage] = useState<Stage>('boot');
  const [bp, setBp] = useState<Blueprint | null>(null);
  const [view, setView] = useState(1);
  const [menu, setMenu] = useState(false);
  const [ch1Ready, setCh1Ready] = useState(false);
  const [writing, setWriting] = useState<number[]>([]);
  const [travel, setTravel] = useState<{ from: number; to: number } | null>(null);
  const [saveOk, setSaveOk] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleId>('horse');
  const [scrolled, setScrolled] = useState(0);
  const bpRef = useRef<Blueprint | null>(null);
  bpRef.current = bp;
  const writingRef = useRef<number[]>([]);
  writingRef.current = writing;
  const pre = useRef<Record<number, Prefetch | undefined>>({});
  const restoreY = useRef<number | null>(null);

  // Reopening the page on the same device brings back the same Blueprint, unchanged, at the chapter the reader was on.
  useEffect(() => {
    const v = loadVehicle();
    if (v) setVehicle(v);
    const last = loadLast();
    if (last) {
      const place = takePlace();
      const at = Math.max(1, Math.min(place?.view ?? last.at ?? last.unlocked, Math.min(last.unlocked, 10)));
      if (place) restoreY.current = place.y;
      setBp(last); setView(at); setStage('reading');
    } else setStage('welcome');
  }, []);

  // Coming back from My Notes or the PDF page: return to the same spot on the page.
  useEffect(() => {
    if (stage !== 'reading' || restoreY.current === null) return;
    const y = restoreY.current;
    restoreY.current = null;
    const t = setTimeout(() => window.scrollTo(0, y), 80);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (!bp) return;
    const t = setTimeout(() => setSaveOk(save(bp)), 250);
    return () => clearTimeout(t);
  }, [bp]);
  // Leaving the page (for My Notes or the PDF) saves at once, so nothing typed in the last moment is lost.
  useEffect(() => () => { if (bpRef.current) save(bpRef.current); }, []);

  // How far down the current chapter the reader is, for the progress bar.
  useEffect(() => {
    if (stage !== 'reading') return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(max > 40 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [stage, view]);

  const patchChapter = useCallback((n: number, part: string, res: PartResult) => {
    setBp((prev) => {
      if (!prev || prev.opened.includes(n) || !prev.chapters[n - 1]) return prev; // an opened chapter never changes
      const chapters = prev.chapters.slice();
      chapters[n - 1] = mergePart(chapters[n - 1], part, res);
      return { ...prev, chapters };
    });
  }, []);

  /** Chapter 1 first (in parallel parts), then the others in the background, three at a time, while the person reads. */
  const write = useCallback(async (input: BirthInput, chapters: Chapter[]) => {
    const parts = Object.keys(chapters[0].parts);
    const results = await Promise.all(parts.map(async (part) => {
      const res = await askPart(input, 1, part);
      patchChapter(1, part, res);
      return res;
    }));
    setCh1Ready(true);
    if (results.every((r) => r.status === 'unavailable')) { setWriting([]); return; }
    const queue = [2, 3, 4, 5, 6, 7];
    const worker = async () => {
      for (let n = queue.shift(); n !== undefined; n = queue.shift()) {
        if (bpRef.current?.key !== keyFor(input)) return;
        if (Object.keys(chapters[n - 1].parts).length && !bpRef.current.opened.includes(n)) patchChapter(n, 'a', await askPart(input, n, 'a'));
        const done = n;
        setWriting((w) => w.filter((x) => x !== done));
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }, [patchChapter]);

  const start = useCallback((input: BirthInput, data: { facts: Blueprint['facts']; chapters: Chapter[]; ai: boolean }) => {
    const existing = loadByInput(input);
    if (existing) { // same birth data on this device: reopen it, never regenerate
      setBp(existing); setView(Math.max(1, Math.min(existing.at ?? existing.unlocked, 10))); setStage('reading'); window.scrollTo(0, 0);
      return;
    }
    const fresh: Blueprint = { v: 2, key: keyFor(input), input, facts: data.facts, chapters: data.chapters, unlocked: 1, opened: [], highlights: [], journal: {}, ai: data.ai, at: 1 };
    setBp(fresh);
    bpRef.current = fresh;
    pre.current = {};
    setView(1);
    setStage('overview');
    window.scrollTo(0, 0);
    if (data.ai) { setCh1Ready(false); setWriting([2, 3, 4, 5, 6, 7]); void write(input, data.chapters); }
    else { setCh1Ready(true); setWriting([]); }
  }, [write]);

  const open = useCallback((n: number) => {
    setBp((prev) => (prev ? { ...prev, at: n, unlocked: Math.max(prev.unlocked, n), opened: prev.opened.includes(n) ? prev.opened : [...prev.opened, n] } : prev));
    setView(n);
    setTravel(null);
    window.scrollTo(0, 0);
  }, []);

  /** Ask for chapter 8 or 9. Chapter 9 also reads the journal reflections written so far. */
  const fetchLate = useCallback((cur: Blueprint, target: 8 | 9): Prefetch => {
    const entries = journalEntries(cur).map(({ prompt, answer }) => ({ prompt, answer }));
    const tags = collectTags(cur.chapters);
    const promise = askPart(cur.input, target, 'a', target === 9 ? { tags, journal: entries } : { tags }).then((res) => {
      // If the server could not be reached at all, count the themes on this device with the same function.
      const themes: SoulTheme[] = res.themes ?? cur.themes ?? computeSoulThemes(cur.chapters.slice(0, 7));
      return { chapter: target === 8 ? buildThemesChapter(themes, res) : buildWorkChapter(themes, res), themes };
    });
    return { promise, journalKey: JSON.stringify(entries) };
  }, []);

  // Write ahead: chapter 8 once the five systems it counts are all open, chapter 9 once chapter 8 is open.
  useEffect(() => {
    const cur = bpRef.current;
    if (stage !== 'reading' || !cur || !cur.ai) return;
    if (view >= 6 && view <= 7 && !cur.chapters[7] && !pre.current[8] && [1, 2, 3, 4, 5].every((n) => cur.opened.includes(n))) pre.current[8] = fetchLate(cur, 8);
    if (view === 8 && !cur.chapters[8] && !pre.current[9]) pre.current[9] = fetchLate(cur, 9);
  }, [stage, view, fetchLate]);

  const goNext = useCallback(async (from: number) => {
    const cur = bpRef.current;
    if (!cur) return;
    const target = from + 1;
    const t0 = Date.now();
    setTravel({ from, to: target });
    const arrive = async () => { const left = 2300 - (Date.now() - t0); if (left > 0) await wait(left); open(target); };
    if (target <= 7) {
      while (writingRef.current.includes(target) && Date.now() - t0 < 45000) await wait(300);
      await arrive();
      return;
    }
    if (target === 10 || cur.chapters[target - 1]) { await arrive(); return; }
    const late = target as 8 | 9;
    let job = pre.current[late];
    // Chapter 9 listens to the journal. If the reader has written more since it was started, write it again.
    if (late === 9 && job && job.journalKey !== JSON.stringify(journalEntries(cur).map(({ prompt, answer }) => ({ prompt, answer })))) job = undefined;
    job ??= fetchLate(cur, late);
    pre.current[late] = job;
    const { chapter, themes } = await job.promise;
    setBp((prev) => {
      if (!prev) return prev;
      const chapters = prev.chapters.slice();
      chapters[target - 1] = chapter;
      return { ...prev, chapters, themes: prev.themes ?? themes };
    });
    await arrive();
  }, [open, fetchLate]);

  const onHighlights = useCallback((next: Highlight[]) => setBp((prev) => (prev ? { ...prev, highlights: [...prev.highlights.filter((h) => h.chapter !== viewRef.current), ...next] } : prev)), []);
  const viewRef = useRef(view);
  viewRef.current = view;
  const onJournal = useCallback((id: string, text: string) => setBp((prev) => (prev && prev.journal[id] !== text ? { ...prev, journal: { ...prev.journal, [id]: text } } : prev)), []);
  const finishLoading = useCallback(() => { setStage('reading'); open(1); }, [open]);
  const leave = useCallback(() => { if (bpRef.current) save(bpRef.current); rememberPlace(viewRef.current); }, []);
  const pickVehicle = useCallback((v: VehicleId) => { setVehicle(v); saveVehicle(v); }, []);

  const chapter = bp && view <= 9 ? bp.chapters[view - 1] : null;
  const progress = view >= 10 ? 100 : ((view - 1 + scrolled) / 9) * 100;

  return (
    <>
      <Stardust />
      <Sparkles />
      {stage === 'welcome' && <Welcome onBegin={() => { setStage('form'); window.scrollTo(0, 0); }} />}
      {stage === 'form' && <BirthForm onDone={start} />}
      {stage === 'overview' && bp && <Overview minutes={estimateMinutes(bp.chapters)} vehicle={vehicle} onVehicle={pickVehicle} onStart={() => { setStage('loading'); window.scrollTo(0, 0); }} />}
      {stage === 'loading' && <LoadingScreen ready={ch1Ready} onDone={finishLoading} />}
      {stage === 'reading' && bp && (
        <>
          <nav className="topbar no-print" aria-label="Blueprint">
            <div className="topbar-row">
              <button type="button" className="link-btn" onClick={() => setMenu(true)}>Chapters</button>
              <Link className="link-btn" href="/notes" onClick={leave}>My notes</Link>
            </div>
            {view <= 9 && <button type="button" className="progress" aria-label={`Your journey: ${view <= 9 ? `chapter ${view} of 9` : 'home'}. Open the chapter menu.`} onClick={() => setMenu(true)}>
              <Track pct={progress} vehicle={vehicle} />
            </button>}
          </nav>
          <main className="shell">
            {!saveOk && <p className="top-note" role="status">This device is not saving your Blueprint right now (this can happen in a private window). You can still read it.</p>}
            {chapter && (
              <ReaderProvider key={`${bp.key}:${view}`} chapter={view} highlights={bp.highlights.filter((h) => h.chapter === view)} journal={bp.journal} interactive onHighlights={onHighlights} onJournal={onJournal}>
                <ChapterView
                  key={view} bp={bp} chapter={chapter} first
                  onContinue={() => void goNext(view)} busy={travel !== null} onLeave={leave}
                  continueLabel={view === 9 ? 'Continue to the closing' : `Continue to chapter ${view + 1}`}
                />
              </ReaderProvider>
            )}
            {view === 10 && (
              <section className="center-screen rise closing">
                <div className="arrive"><Track pct={100} vehicle={vehicle} big /></div>
                <span className="kicker">{CLOSING.kicker}</span>
                <h1 className="display gold">{CLOSING.title[0]} <em>{CLOSING.title[1]}</em> <Heart size={34} /></h1>
                {CLOSING.paragraphs.map((p, i) => <p key={i} className={i === 0 ? '' : 'lede'} style={i === 0 ? { fontSize: 19 } : undefined}>{p}</p>)}
                <div className="btn-row">
                  <Link className="btn btn-gold" href="/print" onClick={leave}>{CLOSING.download}</Link>
                  <Link className="btn btn-ghost" href="/notes" onClick={leave}>{CLOSING.notes}</Link>
                </div>
                <p style={{ marginTop: 40 }}>
                  <button type="button" className="link-btn" onClick={() => { forget(); setBp(null); setStage('welcome'); window.scrollTo(0, 0); }}>Start a new Blueprint</button>
                </p>
              </section>
            )}
          </main>
          {travel && <Travel from={travel.from} to={travel.to} vehicle={vehicle} />}
          {menu && (
            <div className="sheet-back no-print" onClick={() => setMenu(false)}>
              <div className="sheet" role="dialog" aria-label="Chapters" onClick={(e) => e.stopPropagation()}>
                <span className="label" style={{ display: 'block', margin: '0 12px 12px' }}>Your journey</span>
                {CHAPTERS.map((c) => (
                  <button key={c.n} type="button" className={`row${view === c.n ? ' current' : ''}`} disabled={c.n > bp.unlocked || !bp.chapters[c.n - 1]} onClick={() => { setMenu(false); open(c.n); }}>
                    <span className="n">{c.n}</span><span className="t">{c.title.join(' ')}</span>
                  </button>
                ))}
                <button type="button" className={`row${view === 10 ? ' current' : ''}`} disabled={bp.unlocked < 10} onClick={() => { setMenu(false); open(10); }}>
                  <span className="n" /><span className="t">Welcome home</span>
                </button>
                <p className="quiet" style={{ margin: '16px 12px 0' }}>A chapter opens when you press Continue at the end of the one before it.</p>
                <div className="sheet-links">
                  <Link className="btn btn-gold" href="/print" onClick={leave}>{CLOSING.download}</Link>
                  <Link className="btn btn-ghost" href="/notes" onClick={leave}>My notes</Link>
                </div>
                <div className="vehicle-pick small" role="radiogroup" aria-label="Change your vehicle">
                  {VEHICLES.map((v) => (
                    <button key={v.id} type="button" role="radio" aria-checked={vehicle === v.id} aria-label={v.label} className={vehicle === v.id ? 'on' : ''} onClick={() => pickVehicle(v.id)}><Vehicle kind={v.id} size={34} /></button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
