'use client';
// The quiet visuals: stardust, the zodiac wheel, element orbs, the nine centers, the life timeline and the constellation.
import { useEffect, useRef } from 'react';
import type { BlueprintFacts } from '../engine';
import type { WesternChart } from '../engine/western';
import type { PlacementId } from '../engine/placements';
import type { CycleEvent } from '../engine/cycles';
import type { SoulTheme } from '../reading/build';
import { SIGN_SYMBOLS } from '../engine/zodiac';

/** Faint drifting stardust behind everything. Skipped entirely when the device asks for reduced motion. */
export function Stardust() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const count = Math.min(70, Math.round((window.innerWidth * window.innerHeight) / 16000));
    const stars = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.1, a: 0.12 + Math.random() * 0.4, p: Math.random() * 6.28, vx: (Math.random() - 0.5) * 0.000028, vy: -0.00001 - Math.random() * 0.00003 }));
    const size = () => { w = canvas.width = window.innerWidth * dpr; h = canvas.height = window.innerHeight * dpr; };
    size();
    window.addEventListener('resize', size);
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.x = (s.x + s.vx * dt + 1) % 1;
        s.y = (s.y + s.vy * dt + 1) % 1;
        const tw = 0.6 + 0.4 * Math.sin(now * 0.0006 + s.p);
        ctx.beginPath();
        ctx.fillStyle = `rgba(189, 211, 226, ${s.a * tw})`;
        ctx.arc(s.x * w, s.y * h, s.r * dpr, 0, 6.2832);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} className="stardust" aria-hidden="true" />;
}

const RAD = Math.PI / 180;

/** Thin-line zodiac wheel. It draws itself, and the planet whose card is being read glows. */
export function ZodiacWheel({ chart, active, mini = false }: { chart: WesternChart; active: PlacementId | null; mini?: boolean }) {
  const asc = chart.placements.find((p) => p.id === 'asc')?.lon ?? 0;
  const pos = (lon: number, r: number): [number, number] => {
    const t = (180 + (lon - asc)) * RAD;
    return [100 + r * Math.cos(t), 100 - r * Math.sin(t)];
  };
  // Spread glyphs that would sit on top of each other: neighbours closer than MIN degrees are grouped,
  // and each group is laid out evenly around its own middle, keeping the true order.
  const MIN = 9;
  const sortedBodies = chart.placements.filter((p) => !['asc', 'mc', 'dc', 'ic'].includes(p.id)).map((p) => ({ id: p.id, lon: p.lon, at: p.lon, symbol: p.symbol })).sort((x, y) => x.lon - y.lon);
  // Start just after the widest empty stretch, so no group straddles the starting point.
  let widest = 0;
  let startAt = 0;
  sortedBodies.forEach((body, i) => {
    const next = sortedBodies[(i + 1) % sortedBodies.length];
    const gap = (((next.lon - body.lon) % 360) + 360) % 360;
    if (gap > widest) { widest = gap; startAt = (i + 1) % sortedBodies.length; }
  });
  const bodies = [...sortedBodies.slice(startAt), ...sortedBodies.slice(0, startAt)];
  const base = bodies[0]?.lon ?? 0;
  const unwrapped = bodies.map((body) => (((body.lon - base) % 360) + 360) % 360);
  const groups: { from: number; to: number; mid: number }[] = [];
  unwrapped.forEach((u, i) => {
    groups.push({ from: i, to: i, mid: u });
    while (groups.length > 1) {
      const cur = groups[groups.length - 1];
      const prev = groups[groups.length - 2];
      const prevEnd = prev.mid + ((prev.to - prev.from) * MIN) / 2;
      const curStart = cur.mid - ((cur.to - cur.from) * MIN) / 2;
      if (curStart - prevEnd >= MIN) break;
      const members = unwrapped.slice(prev.from, cur.to + 1);
      groups.splice(groups.length - 2, 2, { from: prev.from, to: cur.to, mid: members.reduce((sum, v) => sum + v, 0) / members.length });
    }
  });
  for (const g of groups) for (let i = g.from; i <= g.to; i++) bodies[i].at = base + g.mid - ((g.to - g.from) * MIN) / 2 + (i - g.from) * MIN;
  const angles = chart.timeKnown ? chart.placements.filter((p) => p.id === 'asc' || p.id === 'mc') : [];
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Your birth chart wheel">
      <circle className="wheel-line" pathLength={1} cx="100" cy="100" r="96" />
      <circle className="wheel-line" pathLength={1} cx="100" cy="100" r="80" style={{ animationDelay: '0.3s' }} />
      {!mini && <circle className="wheel-line" pathLength={1} cx="100" cy="100" r="52" style={{ animationDelay: '0.6s', opacity: 0.3 }} />}
      {Array.from({ length: 12 }, (_, i) => {
        const [x1, y1] = pos(i * 30, 80);
        const [x2, y2] = pos(i * 30, 96);
        const [sx, sy] = pos(i * 30 + 15, 88);
        return (
          <g key={i}>
            <line className="wheel-line" pathLength={1} x1={x1} y1={y1} x2={x2} y2={y2} style={{ animationDelay: `${0.5 + i * 0.08}s` }} />
            {!mini && <text className="wheel-sign" x={sx} y={sy}>{SIGN_SYMBOLS[i] + '︎'}</text>}
          </g>
        );
      })}
      {!mini && chart.cusps?.map((c, i) => {
        const [x1, y1] = pos(c, 80);
        const [x2, y2] = pos(c, i % 3 === 0 ? 0 : 52);
        return <line key={i} className="wheel-line" pathLength={1} x1={x1} y1={y1} x2={x2} y2={y2} style={{ animationDelay: `${1.2 + i * 0.06}s`, opacity: i % 3 === 0 ? 0.5 : 0.22 }} />;
      })}
      {!mini && angles.map((a) => {
        const [x, y] = pos(a.lon, 105);
        return <text key={a.id} className="wheel-tag" x={x} y={y}>{a.symbol}</text>;
      })}
      {bodies.map((b) => {
        const [x, y] = pos(b.at, 66);
        const on = active === b.id;
        return b.id === 'rockefellia'
          ? <text key={b.id} className={`wheel-planet${on ? ' on' : ''}`} x={x} y={y} style={{ fontFamily: 'var(--mono)', fontSize: mini ? 8 : 6.5, fontWeight: 700 }}>904</text>
          : <text key={b.id} className={`wheel-planet${on ? ' on' : ''}`} x={x} y={y} style={mini ? { fontSize: 15 } : undefined}>{b.symbol + '︎'}</text>;
      })}
    </svg>
  );
}

export function Orbs({ counts, three = false }: { counts: [string, number][]; three?: boolean }) {
  return (
    <div className={`orbs${three ? ' three' : ''}`}>
      {counts.map(([name, n]) => {
        const d = n ? 26 + n * 11 : 22;
        return (
          <div className="orb-cell" key={name}>
            <div className="orb-box"><div className={`orb${n ? '' : ' empty'}`} style={{ width: Math.min(d, 90), height: Math.min(d, 90) }} /></div>
            <span className="label">{name}</span>
            <span className="mono">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

const CENTER_POS: Record<string, { x: number; y: number; shape: 'up' | 'down' | 'sq' | 'dia' | 'left' | 'right' }> = {
  Head: { x: 100, y: 22, shape: 'up' }, Ajna: { x: 100, y: 58, shape: 'down' }, Throat: { x: 100, y: 98, shape: 'sq' }, G: { x: 100, y: 146, shape: 'dia' },
  Heart: { x: 136, y: 168, shape: 'up' }, Sacral: { x: 100, y: 214, shape: 'sq' }, 'Solar Plexus': { x: 160, y: 220, shape: 'left' }, Spleen: { x: 40, y: 220, shape: 'right' },
  Root: { x: 100, y: 262, shape: 'sq' },
};
function centerShape(shape: string, x: number, y: number, s = 15): string {
  switch (shape) {
    case 'up': return `M${x} ${y - s} L${x + s} ${y + s * 0.8} L${x - s} ${y + s * 0.8} Z`;
    case 'down': return `M${x} ${y + s} L${x + s} ${y - s * 0.8} L${x - s} ${y - s * 0.8} Z`;
    case 'dia': return `M${x} ${y - s} L${x + s} ${y} L${x} ${y + s} L${x - s} ${y} Z`;
    case 'left': return `M${x - s} ${y} L${x + s * 0.8} ${y - s} L${x + s * 0.8} ${y + s} Z`;
    case 'right': return `M${x + s} ${y} L${x - s * 0.8} ${y - s} L${x - s * 0.8} ${y + s} Z`;
    default: return `M${x - s * 0.85} ${y - s * 0.85} h${s * 1.7} v${s * 1.7} h${-s * 1.7} Z`;
  }
}

/** The nine centers: filled and glowing when defined, outlined when open. */
export function CentersDiagram({ defined, channels }: { defined: string[]; channels: { centers: [string, string] }[] }) {
  return (
    <div className="centers">
      <svg viewBox="-50 0 300 290" role="img" aria-label={`Defined centers: ${defined.join(', ') || 'none'}`}>
        {channels.map((c, i) => {
          const a = CENTER_POS[c.centers[0]];
          const b = CENTER_POS[c.centers[1]];
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--nantucket)" strokeWidth="2.2" opacity="0.8" />;
        })}
        {Object.entries(CENTER_POS).map(([name, p]) => {
          const on = defined.includes(name);
          return (
            <g key={name}>
              <path d={centerShape(p.shape, p.x, p.y)} fill={on ? 'var(--nantucket)' : 'var(--winetasting)'} stroke="var(--powder)" strokeWidth="0.8" opacity={on ? 1 : 0.75} style={on ? { filter: 'drop-shadow(0 0 7px rgba(183,209,234,0.75))' } : undefined} />
              <text x={name === 'Sacral' ? p.x - 22 : p.x + (p.x > 110 ? 22 : p.x < 90 ? -22 : 24)} y={name === 'Sacral' ? p.y - 16 : p.y + 2} textAnchor={p.x < 90 || name === 'Sacral' ? 'end' : 'start'} style={{ fontFamily: 'var(--sans)', fontSize: 6.5, letterSpacing: '0.14em', fill: 'var(--powder)', opacity: on ? 0.95 : 0.55, textTransform: 'uppercase' }}>{name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const fmt = (iso: string, approx: boolean) => {
  const [y, m, d] = iso.split('-').map(Number);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return approx ? `${month} ${y}` : `${month} ${d}, ${y}`;
};

/** A simple life timeline: past chapters dimmed, the current one glowing, upcoming ones outlined. */
export function Timeline({ events, approximate }: { events: CycleEvent[]; approximate: boolean }) {
  const firstUpcoming = events.findIndex((e) => e.status !== 'past');
  return (
    <ol style={{ listStyle: 'none', margin: '8px 0 0', padding: '0 0 0 6px', position: 'relative' }}>
      {events.map((e, i) => (
        <li key={`${e.kind}-${e.number}`} style={{ position: 'relative', padding: '0 0 16px 28px', opacity: e.status === 'past' ? 0.58 : 1 }}>
          {i < events.length - 1 && <span style={{ position: 'absolute', left: 5, top: 14, bottom: -4, width: 1, background: 'var(--hair)' }} />}
          <span style={{ position: 'absolute', left: 0, top: 7, width: 11, height: 11, borderRadius: '50%', background: e.status === 'upcoming' ? 'transparent' : 'var(--nantucket)', boxShadow: e.status === 'now' || i === firstUpcoming ? '0 0 14px var(--nantucket)' : 'inset 0 0 0 1px var(--powder)' }} />
          {i === firstUpcoming && <span className="label" style={{ display: 'block', color: 'var(--nantucket)', marginBottom: 2 }}>{e.status === 'now' ? 'Happening now' : 'Next'}</span>}
          <span style={{ color: 'var(--powder)' }}>{e.kind}</span>
          <span className="mono" style={{ display: 'block' }}>age {Math.round(e.ageAtFirstPass)} {'·'} {[...new Set(e.passes.map((p) => fmt(p, approximate)))].join(', ')}</span>
        </li>
      ))}
    </ol>
  );
}

const SYSTEMS = ['Western astrology', 'Human Design', 'Mayan astrology', 'Numerology', 'Chinese zodiac'];
const star = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

/** Soul Themes as a constellation: each theme is a star, with thin lines to the systems where it appears. */
export function Constellation({ themes }: { themes: SoulTheme[] }) {
  const sys = SYSTEMS.map((name, i) => {
    const t = (-90 + i * 72) * RAD;
    return { name, x: 160 + 128 * Math.cos(t), y: 150 + 118 * Math.sin(t) };
  });
  const stars = themes.map((t, i) => {
    const a = (-90 + (i * 360) / Math.max(themes.length, 1) + 36) * RAD;
    const r = themes.length === 1 ? 0 : 50;
    return { t, x: 160 + r * Math.cos(a), y: 150 + r * Math.sin(a) };
  });
  return (
    <div className="constellation">
      <svg viewBox="0 0 320 300" role="img" aria-label={`Your themes: ${themes.map((t) => t.theme).join(', ')}`}>
        {stars.flatMap((s, i) => [...new Set(s.t.sources.map((x) => x.system))].map((name) => {
          const to = sys.find((x) => x.name === name)!;
          return <line key={`${i}-${name}`} className="wheel-line" pathLength={1} x1={s.x} y1={s.y} x2={to.x} y2={to.y} style={{ animationDelay: `${0.4 + i * 0.35}s`, opacity: 0.4 }} />;
        }))}
        {sys.map((s) => (
          <g key={s.name}>
            <circle cx={s.x} cy={s.y} r="2.4" fill="var(--powder)" opacity="0.8" />
            <text className="star-sys" x={s.x} y={s.y + (s.y < 150 ? -9 : 13)}>{s.name}</text>
          </g>
        ))}
        {stars.map((s, i) => (
          <g key={i}>
            <path d={star(s.x, s.y, 11)} fill="var(--nantucket)" style={{ filter: 'drop-shadow(0 0 8px rgba(183,209,234,0.9))' }} />
            <text className="star-name" x={s.x} y={s.y + 22}>{s.t.theme.split('/')[0]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function elementCounts(facts: BlueprintFacts): [string, number][] {
  return (['fire', 'earth', 'air', 'water'] as const).map((e) => [e, facts.western.summary.elements[e].length]);
}
export function modalityCounts(facts: BlueprintFacts): [string, number][] {
  return (['cardinal', 'fixed', 'mutable'] as const).map((m) => [m, facts.western.summary.modalities[m].length]);
}
