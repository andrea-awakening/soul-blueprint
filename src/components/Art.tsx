'use client';
// Line art in the brand colors: the four vehicles, chapter icons, the heart, section ornaments,
// the Human Design vehicle diagram, the journey map, the progress track and the sparkle layer.
// Everything is drawn here as SVG or canvas. No emojis, no image files.
import { useEffect, useRef, type CSSProperties } from 'react';
import { CHAPTERS, OVERVIEW, type VehicleId } from '../content/copy';

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** The traveller's vehicle, facing right. */
export function Vehicle({ kind, size = 40, className = '', style }: { kind: VehicleId; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg className={`vehicle ${className}`} viewBox="0 0 48 32" width={size} height={(size * 32) / 48} style={style} aria-hidden="true">
      {kind === 'horse' && (
        <g {...line}>
          <path d="M13 15 C18 11.5 26 12 30 14 L34 6 L36 3.5 L36.8 6.5 L41.5 10 L40.5 12.2 L35.8 11.6 L33.2 17 C32.4 20.6 28.5 22 24.5 21.6 L18 21.6 C15 21.4 13 19 13 15 Z" />
          <path d="M16.5 21.3 L15 29.5 M20.5 21.6 L21.5 29.5 M27.5 21.5 L26.5 29.5 M31.6 19.6 L34 29" />
          <path d="M13 15 C9.4 15 7.6 18.6 8.6 23" />
          <path d="M33.4 7.4 L31.2 12.4" />
        </g>
      )}
      {kind === 'boat' && (
        <g {...line}>
          <path d="M6 20.5 H42 L37.5 27 H10.5 Z" />
          <path d="M24 20.5 V3.5" />
          <path d="M26 5.5 L37 17.5 H26 Z" />
          <path d="M22 8.5 L13.5 17.5 H22 Z" />
          <path d="M3 30.5 q3.5 -2.6 7 0 t7 0 t7 0 t7 0 t7 0 t7 0" opacity="0.6" />
        </g>
      )}
      {kind === 'plane' && (
        <g {...line}>
          <path d="M5 17.5 C5 15.4 8 14.4 12 14.4 H34 C39.4 14.4 43.5 16.2 43.5 18.2 C43.5 19.8 40 20.4 36 20.4 H10 C7 20.4 5 19.4 5 17.5 Z" />
          <path d="M9.5 14.4 L6.5 6.5 H10.5 L16 14.4" />
          <path d="M23 18.4 L16 28 H21 L31.5 18.4" />
          <path d="M24 14.4 L20.5 9 H24 L30 14.4" opacity="0.7" />
          <path d="M35 17.2 h3.2" />
        </g>
      )}
      {kind === 'ufo' && (
        <g {...line}>
          <path d="M16.5 13.2 C16.5 6.4 31.5 6.4 31.5 13.2" />
          <ellipse cx="24" cy="15.8" rx="18" ry="4.6" />
          <path d="M13 16.2 h0.1 M20 17.6 h0.1 M28 17.6 h0.1 M35 16.2 h0.1" strokeWidth="2.4" />
          <path d="M18 21 L14 30 M30 21 L34 30 M24 21.4 V30" opacity="0.55" />
        </g>
      )}
    </svg>
  );
}

/** A small line illustration for each chapter's tool. */
export function ChapterIcon({ n, size = 64, className = '' }: { n: number; size?: number; className?: string }) {
  const body = (() => {
    switch (n) {
      case 1: // the chart wheel
        return (<><circle cx="32" cy="32" r="26" /><circle cx="32" cy="32" r="16" />{Array.from({ length: 12 }, (_, i) => { const a = (i * 30 * Math.PI) / 180; return <path key={i} d={`M${32 + 16 * Math.cos(a)} ${32 + 16 * Math.sin(a)} L${32 + 26 * Math.cos(a)} ${32 + 26 * Math.sin(a)}`} />; })}<circle cx="32" cy="32" r="2.2" fill="currentColor" /></>);
      case 2: // a small bodygraph
        return (<><path d="M32 6 L39 17 H25 Z" /><path d="M25 21 H39 L32 31 Z" /><rect x="26" y="34" width="12" height="9" /><path d="M32 46 L38 52 L32 58 L26 52 Z" /><path d="M32 17 V21 M32 31 V34 M32 43 V46" /><path d="M14 44 L22 40 V48 Z M50 44 L42 40 V48 Z" /></>);
      case 3: // a stepped temple
        return (<><path d="M8 52 H56 M12 52 V44 H52 V52 M18 44 V36 H46 V44 M24 36 V28 H40 V36 M28 28 V19 H36 V28" /><path d="M32 19 V12 M28 12 H36" /></>);
      case 4: // numbers
        return (<><circle cx="32" cy="32" r="25" /><text x="32" y="42" textAnchor="middle" fontSize="28" fontStyle="italic" fill="currentColor" stroke="none" style={{ fontFamily: 'var(--serif)' }}>9</text><path d="M32 4 v3 M32 57 v3 M4 32 h3 M57 32 h3" /></>);
      case 5: // a paw print
        return (<><ellipse cx="18" cy="26" rx="4.6" ry="6" /><ellipse cx="28" cy="17" rx="4.6" ry="6.2" /><ellipse cx="39" cy="18" rx="4.6" ry="6.2" /><ellipse cx="48" cy="28" rx="4.4" ry="5.8" /><path d="M22 46 C20 38 27 31 33 31 C40 31 46 38 43.5 46 C42 51 36 49 33 49 C29 49 23.5 51 22 46 Z" /></>);
      case 6: // a globe with a pin
        return (<><circle cx="30" cy="36" r="22" /><ellipse cx="30" cy="36" rx="9" ry="22" /><path d="M8 36 H52 M11.5 25 H48.5 M11.5 47 H48.5" /><path d="M48 6 C43.5 6 41 9.4 41 12.6 C41 17 48 24 48 24 C48 24 55 17 55 12.6 C55 9.4 52.5 6 48 6 Z" fill="var(--wine)" /><circle cx="48" cy="12.8" r="2" /></>);
      case 7: // an orbit
        return (<><ellipse cx="32" cy="32" rx="26" ry="13" transform="rotate(-24 32 32)" /><circle cx="32" cy="32" r="6" /><circle cx="54.5" cy="20.5" r="3" fill="currentColor" /><path d="M9 45 l-1.5 -6 M9 45 l6 -1" /></>);
      case 8: // a constellation
        return (<><path d="M10 44 L24 30 L36 38 L50 16 M36 38 L46 52" /><circle cx="10" cy="44" r="2.2" fill="currentColor" /><circle cx="24" cy="30" r="2.2" fill="currentColor" /><circle cx="36" cy="38" r="2.2" fill="currentColor" /><circle cx="46" cy="52" r="2.2" fill="currentColor" /><path d="M50 8 Q50 16 58 16 Q50 16 50 24 Q50 16 42 16 Q50 16 50 8 Z" fill="currentColor" /></>);
      default: // a compass star
        return (<><circle cx="32" cy="32" r="25" /><path d="M32 8 L36 28 L56 32 L36 36 L32 56 L28 36 L8 32 L28 28 Z" /><path d="M46 18 L37 27 M18 18 L27 27 M18 46 L27 37 M46 46 L37 37" opacity="0.6" /></>);
    }
  })();
  return <svg className={`ch-icon ${className}`} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true"><g {...line} strokeWidth={1.3}>{body}</g></svg>;
}

/** The small drawn heart after "Welcome home, beautiful". */
export function Heart({ size = 30 }: { size?: number }) {
  return (
    <svg className="heart" viewBox="0 0 24 24" width={size} height={size} role="img" aria-label="heart">
      <path d="M12 20.5 C5.4 15 2.5 11.2 2.5 7.6 C2.5 4.8 4.7 2.8 7.2 2.8 C9.2 2.8 11 4 12 5.8 C13 4 14.8 2.8 16.8 2.8 C19.3 2.8 21.5 4.8 21.5 7.6 C21.5 11.2 18.6 15 12 20.5 Z" fill="rgba(212,178,106,0.16)" stroke="var(--gold)" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

const star4 = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

/** A quiet divider between sections: a hairline with a glowing four-point star. */
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <svg className={`ornament ${className}`} viewBox="0 0 240 24" aria-hidden="true">
      <path d="M8 12 H96 M144 12 H232" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
      <path d={star4(120, 12, 9)} fill="currentColor" />
      <path d={star4(104, 12, 3)} fill="currentColor" opacity="0.6" />
      <path d={star4(136, 12, 3)} fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/** Human Design, explained as a vehicle. Numbers on the drawing match the list beside it. */
export function VehicleDiagram() {
  const parts: [string, string][] = [
    ['Type', 'the vehicle you are.'],
    ['Strategy', 'how you start the engine.'],
    ['Authority', 'your GPS for decisions.'],
    ['Centers', 'the parts of the engine. Defined centers run on their own fuel. Open centers borrow fuel from the people around you, and that is where you learn.'],
    ['Profile', 'your driving style.'],
  ];
  const dot = (n: number, x: number, y: number) => (
    <g key={n}>
      <circle cx={x} cy={y} r="10" fill="var(--wine)" stroke="var(--gold)" strokeWidth="1.2" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill="var(--gold)" style={{ fontFamily: 'var(--sans)' }}>{n}</text>
    </g>
  );
  return (
    <div className="vehicle-diagram">
      <svg viewBox="0 0 330 160" role="img" aria-label="A car with five numbered parts: 1 Type, the vehicle. 2 Strategy, how to start it. 3 Authority, the GPS. 4 Centers, the parts of the engine. 5 Profile, the driving style.">
        <g fill="none" stroke="var(--powder)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 118 V96 Q24 82 52 80 L92 77 Q118 46 164 46 H204 Q236 48 254 77 L290 84 Q306 88 306 104 V118 H262 M218 118 H112 M68 118 H22" />
          <path d="M106 77 Q126 55 164 54 H170 V77 Z M180 54 H203 Q225 56 240 77 H180 Z" opacity="0.75" />
          <circle cx="90" cy="118" r="21" /><circle cx="90" cy="118" r="8" opacity="0.6" />
          <circle cx="240" cy="118" r="21" /><circle cx="240" cy="118" r="8" opacity="0.6" />
          {/* engine block under the hood */}
          <rect x="262" y="88" width="26" height="15" rx="3" opacity="0.85" /><path d="M268 88 V84 M275 88 V84 M282 88 V84" opacity="0.85" />
          {/* steering wheel */}
          <circle cx="222" cy="68" r="7" opacity="0.9" /><path d="M222 61 V75 M215 68 H229" opacity="0.6" />
          {/* GPS pin above the roof */}
          <path d="M186 10 C180.5 10 177.5 14 177.5 17.8 C177.5 23 186 31 186 31 C186 31 194.5 23 194.5 17.8 C194.5 14 191.5 10 186 10 Z" stroke="var(--gold)" /><path d="M186 33 V44" strokeDasharray="2 3" opacity="0.6" />
          {/* key at the door */}
          <circle cx="140" cy="97" r="5" stroke="var(--gold)" /><path d="M145 97 H160 M155 97 V101 M159 97 V100" stroke="var(--gold)" />
          <path d="M8 139 H322" opacity="0.35" />
        </g>
        {dot(1, 52, 100)}{dot(2, 140, 118)}{dot(3, 208, 20)}{dot(4, 296, 70)}{dot(5, 222, 92)}
      </svg>
      <ol>
        {parts.map(([name, text], i) => (
          <li key={name}><span className="vd-n">{i + 1}</span><span><strong>{name}:</strong> {text}</span></li>
        ))}
      </ol>
    </div>
  );
}

/** The whole journey as one winding map: nine stops, then home. */
export function JourneyMap({ minutes, vehicle, at = 0 }: { minutes: number[]; vehicle: VehicleId; at?: number }) {
  const H = 96;
  const stops = [...CHAPTERS.map((c) => c.n), 10];
  const pt = (i: number): [number, number] => [i % 2 ? 46 : 22, H * i + 34];
  let d = '';
  stops.forEach((_, i) => {
    const [x, y] = pt(i);
    if (i === 0) d = `M${x} ${y}`;
    else { const [px, py] = pt(i - 1); d += ` C${px} ${py + H / 2} ${x} ${y - H / 2} ${x} ${y}`; }
  });
  const [vx, vy] = pt(at);
  return (
    <div className="jmap" style={{ height: H * stops.length }}>
      <svg viewBox={`0 0 70 ${H * stops.length}`} width="70" height={H * stops.length} aria-hidden="true">
        <path d={d} fill="none" stroke="var(--powder)" strokeWidth="1.2" strokeDasharray="2 7" strokeLinecap="round" opacity="0.6" />
        {stops.map((s, i) => { const [x, y] = pt(i); return s === 10 ? <path key={s} d={star4(x, y, 9)} fill="var(--gold)" /> : <circle key={s} cx={x} cy={y} r="5" fill="var(--wine)" stroke={i <= at ? 'var(--gold)' : 'var(--powder)'} strokeWidth="1.3" />; })}
      </svg>
      <span className="jmap-vehicle" style={{ left: vx, top: vy }}><Vehicle kind={vehicle} size={46} className="bob" /></span>
      <ol>
        {CHAPTERS.map((c, i) => (
          <li key={c.n} style={{ height: H }}>
            <ChapterIcon n={c.n} size={34} />
            <span className="jmap-text">
              <span className="jmap-name">{c.title.join(' ')}</span>
              <span className="jmap-gives">{c.gives}</span>
              <span className="mono">Stop {c.n} {'·'} about {minutes[i]} min</span>
            </span>
          </li>
        ))}
        <li style={{ height: H }}>
          <span style={{ width: 34 }} />
          <span className="jmap-text"><span className="jmap-name"><em>{OVERVIEW.home}</em></span><span className="jmap-gives">Where the map has been leading you.</span></span>
        </li>
      </ol>
    </div>
  );
}

/** A horizontal track with ten stops. The finished part glows and the vehicle rides on it. */
export function Track({ pct, vehicle, big = false, moving = false }: { pct: number; vehicle: VehicleId; big?: boolean; moving?: boolean }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <span className={`track${big ? ' big' : ''}${moving ? ' moving' : ''}`} aria-hidden="true">
      <span className="track-line" />
      <span className="track-fill" style={{ width: `${p}%` }} />
      {Array.from({ length: 10 }, (_, i) => <span key={i} className={`track-stop${(i / 9) * 100 <= p + 0.5 ? ' done' : ''}${i === 9 ? ' home' : ''}`} style={{ left: `${(i / 9) * 100}%` }} />)}
      <span className="track-vehicle" style={{ left: `${p}%` }}><Vehicle kind={vehicle} size={big ? 54 : 30} className={moving ? 'bob' : ''} /></span>
    </span>
  );
}

/** Ask the sparkle layer for a burst at a point on the screen. */
export function sparkleBurst(x: number, y: number, count = 26): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('sb:burst', { detail: { x, y, count } }));
}

/**
 * A soft sparkle trail behind the cursor on desktop, and a small sparkle where a finger taps on a phone.
 * Skipped entirely when the device asks for reduced motion.
 */
export function Sparkles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; gold: boolean }
    let parts: P[] = [];
    let raf = 0;
    let last = 0;
    let lx = -99;
    let ly = -99;
    let lt = 0;
    const size = () => { canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr; };
    size();
    const add = (x: number, y: number, spread: number, n: number, speed: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283;
        const v = speed * (0.3 + Math.random());
        parts.push({ x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.012, life: 0, max: 520 + Math.random() * 520, r: 1.6 + Math.random() * 2.6, gold: Math.random() < 0.6 });
      }
      if (parts.length > 220) parts = parts.slice(-220);
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    };
    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts = parts.filter((p) => (p.life += dt) < p.max);
      for (const p of parts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.00006 * dt;
        const k = 1 - p.life / p.max;
        const r = p.r * dpr * (0.5 + k * 0.7);
        const x = p.x * dpr;
        const y = p.y * dpr;
        ctx.globalAlpha = Math.min(1, k * 1.25) * 0.85;
        ctx.fillStyle = p.gold ? '#E7CD8E' : '#DCEBF6';
        ctx.beginPath();
        ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = parts.length ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now();
      if (now - lt < 34 || Math.hypot(e.clientX - lx, e.clientY - ly) < 9) return;
      lt = now; lx = e.clientX; ly = e.clientY;
      add(e.clientX, e.clientY, 6, 1, 0.02);
    };
    const down = (e: PointerEvent) => { if (e.pointerType !== 'mouse') add(e.clientX, e.clientY, 8, 5, 0.05); };
    const burst = (e: Event) => { const d = (e as CustomEvent).detail as { x: number; y: number; count: number }; add(d.x, d.y, 30, d.count, 0.16); };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('sb:burst', burst);
    window.addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down); window.removeEventListener('sb:burst', burst); window.removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} className="sparkles no-print" aria-hidden="true" />;
}
