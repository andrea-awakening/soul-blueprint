import { runAccuracy, summarize, type Row } from '@/accuracy/run';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Accuracy tests · Soul Blueprint' };

// The admin test page: runs the engine against every reference value, live, and shows expected vs actual.
export default function AccuracyPage() {
  let rows: Row[] = [];
  let crash = '';
  try {
    rows = runAccuracy();
  } catch (err) {
    crash = err instanceof Error ? err.message : 'unknown error';
  }
  const sum = summarize(rows);
  const charts = new Map<string, Row[]>();
  for (const r of rows) charts.set(r.chart, [...(charts.get(r.chart) || []), r]);
  const ok = !crash && sum.failed === 0 && sum.total > 0;
  return (
    <main className="admin">
      <span className="kicker">Admin</span>
      <h1 className="display">Accuracy <em>tests</em></h1>
      <p className="lede">Every row compares what the engine calculates with a trusted reference value. Positions must be within 1 arcminute. Everything else must match exactly.</p>
      <div className={`banner ${ok ? '' : 'bad'}`}>
        {crash ? <span className="fail">The test run crashed: {crash}</span> : (
          <>
            <strong className={ok ? 'pass' : 'fail'}>{ok ? 'All passing.' : `${sum.failed} failing.`}</strong>{' '}
            {sum.passed} of {sum.total} checks pass, across {charts.size - 1} reference births plus rule checks.
          </>
        )}
      </div>
      {[...charts.entries()].map(([chart, list]) => {
        const failed = list.filter((r) => !r.pass).length;
        return (
          <details key={chart} open={failed > 0}>
            <summary>
              <span className={failed ? 'fail' : 'pass'}>{failed ? `${failed} failing` : 'Pass'}</span> · {chart} <span className="mono">({list.length} checks)</span>
            </summary>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Group</th><th>What is checked</th><th>Expected</th><th>Engine</th><th>Difference</th><th>Result</th><th>Source of expected value</th></tr>
                </thead>
                <tbody>
                  {list.map((r, i) => (
                    <tr key={i}>
                      <td>{r.group}</td>
                      <td>{r.item}</td>
                      <td className="v">{r.expected}</td>
                      <td className="v">{r.actual}</td>
                      <td className="v">{r.diff}</td>
                      <td className={r.pass ? 'pass' : 'fail'}>{r.pass ? 'pass' : 'FAIL'}</td>
                      <td className="quiet">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </main>
  );
}
