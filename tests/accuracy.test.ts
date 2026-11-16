import { describe, it, expect, afterAll } from 'vitest';
import { runAccuracy, summarize } from '../src/accuracy/run';

// Every reference value must match. A single failing row fails the test run, and a failing test run blocks the build.
describe('accuracy reference set', () => {
  const rows = runAccuracy();
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${r.chart} / ${r.group}`;
    groups.set(key, [...(groups.get(key) || []), r]);
  }
  for (const [key, list] of groups) {
    it(key, () => {
      const failures = list.filter((r) => !r.pass).map((r) => `${r.item}: expected ${r.expected}, got ${r.actual} (${r.diff})`);
      expect(failures).toEqual([]);
    });
  }
  afterAll(() => {
    if (!process.env.ACCURACY_SUMMARY) return;
    const lines: string[] = [];
    for (const [key, list] of groups) {
      const gaps = list.map((r) => /^([\d.]+)"$/.exec(r.diff)).filter(Boolean).map((m) => Number(m![1]));
      const fail = list.filter((r) => !r.pass).length;
      lines.push(`${fail ? 'FAIL' : 'pass'} ${String(list.length).padStart(3)} checks  ${key}${gaps.length ? `  (largest gap ${Math.max(...gaps).toFixed(1)} arcsec)` : ''}`);
    }
    console.log(lines.join('\n') + '\n' + JSON.stringify(summarize(rows)));
  });
});
