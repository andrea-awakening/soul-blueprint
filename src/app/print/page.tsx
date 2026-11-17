'use client';
// The print-friendly layout behind "Download my Blueprint (PDF)": the full reading with highlights in their
// colors, then the My Notes summary and journal answers. The browser's "Save as PDF" turns it into a file.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadLast, type Blueprint } from '@/components/store';
import { ReaderProvider } from '@/components/Reader';
import { ChapterView } from '@/components/ChapterView';
import { NotesSummary } from '@/components/Notes';

const noop = () => {};

function when(bp: Blueprint): string {
  const [y, m, d] = bp.input.date.split('-').map(Number);
  const date = `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${d}, ${y}`;
  let time = 'birth time unknown';
  if (bp.input.time) {
    const [h, min] = bp.input.time.split(':').map(Number);
    time = `${h % 12 === 0 ? 12 : h % 12}:${String(min).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }
  return `${date} · ${time} · ${bp.input.placeLabel}`;
}

export default function PrintPage() {
  const [bp, setBp] = useState<Blueprint | null | undefined>(undefined);
  useEffect(() => setBp(loadLast()), []);
  useEffect(() => {
    if (!bp || new URLSearchParams(window.location.search).has('preview')) return;
    // Open the print dialog once the fonts are in, so the first thing the reader sees is "Save as PDF".
    const t = setTimeout(() => { void document.fonts?.ready.then(() => window.print()); }, 900);
    return () => clearTimeout(t);
  }, [bp]);
  if (bp === undefined) return null;
  if (bp === null) return <main className="shell center-screen"><p className="empty">No Blueprint is saved on this device yet. <Link href="/">Begin here.</Link></p></main>;
  const chapters = bp.chapters.filter((c, i) => c && i + 1 <= Math.max(bp.unlocked, 1));
  return (
    <>
      <nav className="topbar no-print" aria-label="Download">
        <div className="topbar-row">
          <Link className="link-btn" href="/">Back to my Blueprint</Link>
          <button type="button" className="link-btn" onClick={() => window.print()}>Save as PDF</button>
        </div>
      </nav>
      <main className="shell">
        <p className="top-note no-print">In the print window, choose "Save as PDF" as the destination. On a phone, tap Share, then Print, then pinch the preview open and share it to Files.</p>
        <header className="chapter-head first">
          <span className="kicker">Soul Blueprint</span>
          <h1 className="display">{bp.input.firstName ? `${bp.input.firstName}'s` : 'Your'} <em>Soul Blueprint</em></h1>
          <p className="mono">{when(bp)}</p>
        </header>
        {chapters.map((ch) => (
          <ReaderProvider key={ch.n} chapter={ch.n} highlights={bp.highlights.filter((h) => h.chapter === ch.n)} journal={bp.journal} interactive={false} onHighlights={noop} onJournal={noop}>
            <ChapterView bp={bp} chapter={ch} print />
          </ReaderProvider>
        ))}
        <header className="chapter-head">
          <span className="kicker">Everything you kept</span>
          <h1 className="display">My <em>Notes</em></h1>
        </header>
        <NotesSummary bp={bp} print />
        <p className="mono" style={{ textAlign: 'center', marginTop: 40 }}>Calculated with the Swiss Ephemeris {'·'} soul blueprint</p>
      </main>
    </>
  );
}
