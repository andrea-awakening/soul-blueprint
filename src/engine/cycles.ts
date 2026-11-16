// Life cycles: the exact dates a planet returns to where it was at birth (every pass is listed).
import { BODY, calc, angDiff, norm360, dateFromJd } from './swe';

export type CycleKind = 'Jupiter return' | 'Saturn return' | 'Chiron return' | 'Nodal return' | 'Uranus opposition';

export interface CycleEvent {
  kind: CycleKind;
  /** 1st, 2nd... occurrence of this cycle in the life. */
  number: number;
  /** ISO dates (UTC) of every exact pass. A retrograde loop can give three or more. */
  passes: string[];
  ageAtFirstPass: number;
  status: 'past' | 'now' | 'upcoming';
}

/** Age windows (in years) to search. Generous on purpose: every real pass falls well inside them. */
const CONFIG: { kind: CycleKind; body: number; offset: number; windows: [number, number][]; groupGapYears: number; stepDays: number }[] = [
  { kind: 'Jupiter return', body: BODY.jupiter, offset: 0, windows: [[10, 90]], groupGapYears: 6, stepDays: 2 },
  { kind: 'Saturn return', body: BODY.saturn, offset: 0, windows: [[26, 33], [55, 63], [84, 90]], groupGapYears: 15, stepDays: 2 },
  { kind: 'Chiron return', body: BODY.chiron, offset: 0, windows: [[46, 54]], groupGapYears: 25, stepDays: 2 },
  { kind: 'Nodal return', body: BODY.trueNode, offset: 0, windows: [[17, 20.2], [35.6, 38.8], [54.2, 57.4], [72.8, 76]], groupGapYears: 9, stepDays: 1 },
  { kind: 'Uranus opposition', body: BODY.uranus, offset: 180, windows: [[35, 48]], groupGapYears: 40, stepDays: 2 },
];

/** Every moment the body crosses the target longitude inside one age window. */
function crossings(jdBirth: number, body: number, target: number, fromYears: number, toYears: number, stepDays: number): number[] {
  const out: number[] = [];
  const end = jdBirth + toYears * 365.25;
  let prevJd = jdBirth + fromYears * 365.25;
  let prev = angDiff(calc(prevJd, body).lon, target);
  for (let jd = prevJd + stepDays; jd <= end; jd += stepDays) {
    const cur = angDiff(calc(jd, body).lon, target);
    if (Math.abs(cur) < 30 && Math.abs(prev) < 30 && cur * prev <= 0 && cur !== prev) {
      let lo = prevJd;
      let hi = jd;
      let flo = prev;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        const fm = angDiff(calc(mid, body).lon, target);
        if (fm * flo <= 0) hi = mid;
        else { lo = mid; flo = fm; }
      }
      out.push((lo + hi) / 2);
    }
    prev = cur;
    prevJd = jd;
  }
  return out;
}

export function computeCycles(jdBirth: number, nowMs: number): CycleEvent[] {
  const events: CycleEvent[] = [];
  const nowJd = nowMs / 86400000 + 2440587.5;
  for (const cfg of CONFIG) {
    const natal = calc(jdBirth, cfg.body).lon;
    const target = norm360(natal + cfg.offset);
    const hits = cfg.windows.flatMap(([from, to]) => crossings(jdBirth, cfg.body, target, from, to, cfg.stepDays));
    // Group passes that belong to the same return (close together in time).
    const groups: number[][] = [];
    for (const jd of hits) {
      const last = groups[groups.length - 1];
      if (last && jd - last[0] < cfg.groupGapYears * 365.25) last.push(jd);
      else groups.push([jd]);
    }
    groups.forEach((g, i) => {
      const first = g[0];
      const lastPass = g[g.length - 1];
      const status: CycleEvent['status'] = lastPass < nowJd - 30 ? 'past' : first > nowJd + 30 ? 'upcoming' : 'now';
      events.push({
        kind: cfg.kind,
        number: i + 1,
        passes: g.map((jd) => dateFromJd(jd).toISOString().slice(0, 10)),
        ageAtFirstPass: Math.round(((first - jdBirth) / 365.25) * 10) / 10,
        status,
      });
    });
  }
  return events.sort((a, b) => (a.passes[0] < b.passes[0] ? -1 : 1));
}
