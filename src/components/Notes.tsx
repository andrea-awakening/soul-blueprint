'use client';
// "My Notes": every highlight grouped by color (in reading order), plus every journal answer.
import { useEffect, useRef, useState } from 'react';
import type { Blueprint, Highlight } from './store';
import { journalEntries, save } from './store';
import { HIGHLIGHT_COLORS, CHAPTERS, NOTEPAD } from '../content/copy';

/** Position of every highlightable block in a chapter, so highlights can be listed in reading order. */
function blockOrder(bp: Blueprint): Map<string, { order: number; where: string }> {
  const map = new Map<string, { order: number; where: string }>();
  let n = 0;
  for (const ch of bp.chapters) {
    if (!ch) continue;
    const title = `Chapter ${ch.n} · ${CHAPTERS[ch.n - 1].title.join(' ')}`;
    for (const card of ch.cards) {
      card.paragraphs.forEach((_, i) => map.set(`${card.id}:p${i}`, { order: n++, where: `${title} · ${card.headline}` }));
      card.list?.items.forEach((it) => map.set(`${card.id}:i:${it.id}`, { order: n++, where: `${title} · ${card.headline}` }));
      card.prompts?.forEach((_, i) => map.set(`${card.id}:q${i}`, { order: n++, where: `${title} · ${card.headline}` }));
    }
    ch.synthesis.forEach((_, i) => map.set(`syn${ch.n}:p${i}`, { order: n++, where: `${title} · Putting it together` }));
    ch.journal.forEach((_, i) => map.set(`j${ch.n}:${i}`, { order: n++, where: `${title} · Journal prompt` }));
  }
  return map;
}

/** A free-writing area. It saves on this device as the reader types. */
export function Notepad({ bp }: { bp: Blueprint }) {
  const [value, setValue] = useState(bp.notepad ?? '');
  const [saved, setSaved] = useState(false);
  const latest = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flash = useRef<ReturnType<typeof setTimeout>>(undefined);
  const store = (text: string) => { bp.notepad = text; return save(bp); };
  // Leaving the page saves whatever was typed last.
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(flash.current); store(latest.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section className="journal notepad no-print">
      <span className="label" style={{ display: 'block', marginBottom: 8 }}>{NOTEPAD.title}</span>
      <p className="quiet" style={{ marginBottom: 14 }}>{NOTEPAD.hint}</p>
      <textarea
        value={value} aria-label={NOTEPAD.title} placeholder={NOTEPAD.placeholder} style={{ minHeight: 200 }}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          latest.current = v;
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            if (store(v)) { setSaved(true); clearTimeout(flash.current); flash.current = setTimeout(() => setSaved(false), 2200); }
          }, 500);
        }}
        onBlur={() => store(latest.current)}
      />
      <div className={`saved${saved ? ' on' : ''}`} aria-live="polite" style={{ marginBottom: 0 }}>{saved ? 'Saved' : ''}</div>
    </section>
  );
}

export function NotesSummary({ bp, print = false }: { bp: Blueprint; print?: boolean }) {
  const order = blockOrder(bp);
  const sorted = (list: Highlight[]) => list.slice().sort((a, b) => (order.get(a.block)?.order ?? 0) - (order.get(b.block)?.order ?? 0) || a.start - b.start);
  const entries = journalEntries(bp);
  const none = !bp.highlights.length && !entries.length;
  const pad = (bp.notepad ?? '').trim();
  return (
    <>
      {print && pad && (
        <section className="notes-group">
          <h3><i style={{ color: '#D4B26A' }} />{NOTEPAD.title}</h3>
          <div className="note-item"><p className="answer" style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{pad}</p></div>
        </section>
      )}
      {none && !(print && pad) && <p className="empty">No highlights or journal answers yet. Select any sentence in your Blueprint to highlight it, or write under a journal prompt.</p>}
      {HIGHLIGHT_COLORS.map((c) => {
        const list = sorted(bp.highlights.filter((h) => h.color === c.id));
        if (!list.length) return null;
        return (
          <section className="notes-group" key={c.id}>
            <h3><i style={{ color: c.hex }} />{c.label}</h3>
            {list.map((h) => (
              <div className="note-item" key={h.id}>
                <span className="mono where">{order.get(h.block)?.where ?? `Chapter ${h.chapter}`}</span>
                <mark className={`hl-${h.color}`}>{h.text}</mark>
              </div>
            ))}
          </section>
        );
      })}
      {entries.length > 0 && (
        <section className="notes-group">
          <h3><i style={{ color: '#BDD3E2' }} />Your reflections</h3>
          {entries.map((e, i) => (
            <div className="note-item" key={i}>
              <span className="mono where">Chapter {e.chapter} {'·'} {CHAPTERS[e.chapter - 1].title.join(' ')}</span>
              <p style={{ color: 'var(--soft)', fontSize: 15, marginBottom: 8 }}>{e.prompt}</p>
              <p className="answer" style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{e.answer}</p>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
