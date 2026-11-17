'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadLast, type Blueprint } from '@/components/store';
import { NotesSummary, Notepad } from '@/components/Notes';
import { Sparkles } from '@/components/Art';
import { CLOSING } from '@/content/copy';
import { Stardust } from '@/components/Viz';
import { NOTICE } from '@/content/copy';

export default function NotesPage() {
  const [bp, setBp] = useState<Blueprint | null | undefined>(undefined);
  useEffect(() => setBp(loadLast()), []);
  return (
    <>
      <Stardust />
      <Sparkles />
      <nav className="topbar no-print" aria-label="Notes">
        <div className="topbar-row">
          <Link className="link-btn" href="/">Back to my Blueprint</Link>
          {bp ? <Link className="link-btn" href="/print">{CLOSING.download}</Link> : <span />}
        </div>
      </nav>
      <main className="shell">
        <header className="chapter-head first">
          <span className="kicker">Everything you kept</span>
          <h1 className="display gold">My <em>Notes</em></h1>
        </header>
        <p className="top-note">{NOTICE}</p>
        {bp === null && <p className="empty">No Blueprint is saved on this device yet. <Link href="/">Begin here.</Link></p>}
        {bp && <Notepad bp={bp} />}
        {bp && <NotesSummary bp={bp} />}
        {bp && <div className="btn-row" style={{ justifyContent: 'center' }}><Link className="btn btn-gold" href="/">Back to where I was reading</Link></div>}
      </main>
    </>
  );
}
