'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadLast, type Blueprint } from '@/components/store';
import { NotesSummary } from '@/components/Notes';
import { Stardust } from '@/components/Viz';
import { NOTICE } from '@/content/copy';

export default function NotesPage() {
  const [bp, setBp] = useState<Blueprint | null | undefined>(undefined);
  useEffect(() => setBp(loadLast()), []);
  return (
    <>
      <Stardust />
      <nav className="topbar no-print" aria-label="Notes">
        <Link className="link-btn" href="/">Back to my Blueprint</Link>
        {bp ? <Link className="link-btn" href="/print">Download PDF</Link> : <span />}
      </nav>
      <main className="shell">
        <header className="chapter-head first">
          <span className="kicker">Everything you kept</span>
          <h1 className="display">My <em>Notes</em></h1>
        </header>
        <p className="top-note">{NOTICE}</p>
        {bp === null && <p className="empty">No Blueprint is saved on this device yet. <Link href="/">Begin here.</Link></p>}
        {bp && <NotesSummary bp={bp} />}
      </main>
    </>
  );
}
