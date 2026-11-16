'use client';
// Reading helpers: highlightable text, tap-for-definition terms, and autosaving journal boxes.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { HIGHLIGHT_COLORS, type HighlightColor } from '../content/copy';
import { termsForChapter, type Term } from '../content/glossary';
import type { Highlight } from './store';

interface Piece { block: string; start: number; end: number; text: string }
type Menu = { kind: 'new'; pieces: Piece[]; x: number; y: number } | { kind: 'edit'; id: string; x: number; y: number } | null;

interface ReaderCtx {
  chapter: number;
  highlights: Highlight[];
  journal: Record<string, string>;
  setJournal: (id: string, text: string) => void;
  interactive: boolean;
  termRe: RegExp | null;
  termMap: Map<string, Term>;
  justId: string | null;
  openTerm: (term: Term, el: HTMLElement) => void;
  closeTerm: () => void;
  openMark: (id: string, el: HTMLElement) => void;
}

const Ctx = createContext<ReaderCtx | null>(null);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildTermRe(terms: Term[]): RegExp | null {
  if (!terms.length) return null;
  const alts = terms.map((t) => {
    const first = t.term[0];
    // A term written in lower case may also start a sentence. A capitalised term only matches as written.
    return first === first.toLowerCase() && first !== first.toUpperCase() ? `[${first}${first.toUpperCase()}]${esc(t.term.slice(1))}` : esc(t.term);
  });
  return new RegExp(`(?<![\\p{L}\\p{N}'’])(?:${alts.join('|')})(?![\\p{L}\\p{N}])`, 'gu');
}

interface Props {
  chapter: number;
  highlights: Highlight[];
  journal: Record<string, string>;
  interactive: boolean;
  onHighlights: (next: Highlight[]) => void;
  onJournal: (id: string, text: string) => void;
  children: ReactNode;
}

export function ReaderProvider({ chapter, highlights, journal, interactive, onHighlights, onJournal, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const [pop, setPop] = useState<{ term: Term; x: number; y: number } | null>(null);
  const [justId, setJustId] = useState<string | null>(null);
  const terms = useMemo(() => termsForChapter(chapter), [chapter]);
  const termRe = useMemo(() => buildTermRe(terms), [terms]);
  const termMap = useMemo(() => new Map(terms.map((t) => [t.term.toLowerCase(), t])), [terms]);
  const hlRef = useRef(highlights);
  hlRef.current = highlights;

  // Selecting text opens the small color menu.
  useEffect(() => {
    if (!interactive) return;
    let timer: ReturnType<typeof setTimeout>;
    const read = () => {
      const sel = window.getSelection();
      const root = rootRef.current;
      if (!sel || sel.isCollapsed || !sel.rangeCount || !root) { setMenu((m) => (m?.kind === 'new' ? null : m)); return; }
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) return;
      const pieces: Piece[] = [];
      root.querySelectorAll<HTMLElement>('[data-block]').forEach((el) => {
        if (!range.intersectsNode(el)) return;
        const r = document.createRange();
        r.selectNodeContents(el);
        if (range.compareBoundaryPoints(Range.START_TO_START, r) > 0) r.setStart(range.startContainer, range.startOffset);
        if (range.compareBoundaryPoints(Range.END_TO_END, r) < 0) r.setEnd(range.endContainer, range.endOffset);
        const pre = document.createRange();
        pre.selectNodeContents(el);
        pre.setEnd(r.startContainer, r.startOffset);
        const start = pre.toString().length;
        const text = r.toString();
        if (text.trim().length < 2) return;
        pieces.push({ block: el.dataset.block!, start, end: start + text.length, text });
      });
      if (!pieces.length) { setMenu((m) => (m?.kind === 'new' ? null : m)); return; }
      const rect = range.getBoundingClientRect();
      const w = 252;
      const x = Math.max(8, Math.min(window.innerWidth - w - 8, rect.left + rect.width / 2 - w / 2));
      const below = rect.bottom + 14;
      const y = below + 64 > window.innerHeight ? Math.max(8, rect.top - 72) : below;
      setMenu({ kind: 'new', pieces, x, y });
    };
    const onChange = () => { clearTimeout(timer); timer = setTimeout(read, 320); };
    document.addEventListener('selectionchange', onChange);
    return () => { document.removeEventListener('selectionchange', onChange); clearTimeout(timer); };
  }, [interactive]);

  // Tapping anywhere else closes popovers.
  useEffect(() => {
    const close = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest?.('.term-pop, .term')) return;
      setPop(null);
      if (!t.closest?.('.hl-menu, mark')) setMenu((m) => (m?.kind === 'edit' ? null : m));
    };
    document.addEventListener('pointerdown', close);
    const onScroll = () => { setPop(null); setMenu((m) => (m?.kind === 'edit' ? null : m)); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('scroll', onScroll); };
  }, []);

  const choose = (color: HighlightColor) => {
    if (!menu) return;
    if (menu.kind === 'edit') {
      onHighlights(hlRef.current.map((h) => (h.id === menu.id ? { ...h, color } : h)));
      setJustId(menu.id);
    } else {
      const fresh: Highlight[] = menu.pieces.map((p, i) => ({ id: `${Date.now().toString(36)}-${i}`, chapter, block: p.block, start: p.start, end: p.end, color, text: p.text }));
      // A new highlight replaces any older one it overlaps in the same paragraph.
      const kept = hlRef.current.filter((h) => !fresh.some((f) => f.block === h.block && f.start < h.end && h.start < f.end));
      onHighlights([...kept, ...fresh]);
      setJustId(fresh[0]?.id ?? null);
      window.getSelection()?.removeAllRanges();
    }
    setMenu(null);
    setTimeout(() => setJustId(null), 1900);
  };
  const remove = () => {
    if (menu?.kind === 'edit') onHighlights(hlRef.current.filter((h) => h.id !== menu.id));
    else window.getSelection()?.removeAllRanges();
    setMenu(null);
  };

  const openTerm = useCallback((term: Term, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const w = Math.min(320, window.innerWidth - 32);
    const x = Math.max(16, Math.min(window.innerWidth - w - 16, r.left + r.width / 2 - w / 2));
    const y = r.bottom + 10 + 150 > window.innerHeight ? Math.max(12, r.top - 150) : r.bottom + 10;
    setPop({ term, x, y });
  }, []);
  const closeTerm = useCallback(() => setPop(null), []);
  const openMark = useCallback((id: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const w = 252;
    setMenu({ kind: 'edit', id, x: Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)), y: r.bottom + 12 + 64 > window.innerHeight ? Math.max(8, r.top - 72) : r.bottom + 12 });
  }, []);

  const value = useMemo<ReaderCtx>(
    () => ({ chapter, highlights, journal, setJournal: onJournal, interactive, termRe, termMap, justId, openTerm, closeTerm, openMark }),
    [chapter, highlights, journal, onJournal, interactive, termRe, termMap, justId, openTerm, closeTerm, openMark],
  );

  return (
    <Ctx.Provider value={value}>
      <div ref={rootRef}>{children}</div>
      {menu && interactive && (
        <div className="hl-menu" style={{ left: menu.x, top: menu.y }} role="menu" aria-label="Highlight colors" onPointerDown={(e) => e.preventDefault()}>
          {HIGHLIGHT_COLORS.map((c) => (
            <button key={c.id} type="button" title={c.label} aria-label={c.label} onClick={() => choose(c.id)}>
              <span className="dot" style={{ color: c.hex }} />
            </button>
          ))}
          <button type="button" title={menu.kind === 'edit' ? 'Remove highlight' : 'Cancel'} aria-label={menu.kind === 'edit' ? 'Remove highlight' : 'Cancel'} onClick={remove}>
            <span className="x">{'×'}</span>
          </button>
        </div>
      )}
      {pop && (
        <div className="term-pop" style={{ left: pop.x, top: pop.y }} role="tooltip">
          <b>{pop.term.term}</b>
          {pop.term.def}
        </div>
      )}
    </Ctx.Provider>
  );
}

/** A run of text that can be highlighted and whose glossary terms can be tapped. */
export function RichText({ block, text }: { block: string; text: string }) {
  const ctx = useContext(Ctx);
  if (!ctx) return <>{text}</>;
  const hls = ctx.highlights.filter((h) => h.block === block && h.start < h.end && h.end <= text.length);
  const hits: { start: number; end: number; term: Term }[] = [];
  if (ctx.termRe) {
    const seen = new Set<string>();
    for (const m of text.matchAll(ctx.termRe)) {
      const term = ctx.termMap.get(m[0].toLowerCase());
      if (!term || seen.has(term.term)) continue; // first mention in each paragraph only
      seen.add(term.term);
      hits.push({ start: m.index!, end: m.index! + m[0].length, term });
    }
  }
  const cuts = [...new Set([0, text.length, ...hls.flatMap((h) => [h.start, h.end]), ...hits.flatMap((t) => [t.start, t.end])])].sort((a, b) => a - b);
  const out: ReactNode[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const [s, e] = [cuts[i], cuts[i + 1]];
    const str = text.slice(s, e);
    const hit = hits.find((t) => t.start <= s && t.end >= e);
    const hl = hls.find((h) => h.start <= s && h.end >= e);
    let node: ReactNode = str;
    if (hit) {
      node = (
        <span
          key={`t${s}`} className="term" role="button" tabIndex={ctx.interactive ? 0 : -1}
          onClick={(ev) => { ev.stopPropagation(); ctx.openTerm(hit.term, ev.currentTarget); }}
          onMouseEnter={(ev) => { if (window.matchMedia('(hover: hover)').matches) ctx.openTerm(hit.term, ev.currentTarget); }}
          onMouseLeave={() => { if (window.matchMedia('(hover: hover)').matches) ctx.closeTerm(); }}
          onKeyDown={(ev) => { if (ev.key === 'Enter') ctx.openTerm(hit.term, ev.currentTarget); }}
        >
          {str}
        </span>
      );
    }
    if (hl) {
      node = (
        <mark key={`h${s}`} className={`hl-${hl.color}${ctx.justId === hl.id ? ' just' : ''}`} onClick={(ev) => ctx.interactive && ctx.openMark(hl.id, ev.currentTarget)}>
          {node}
        </mark>
      );
    }
    out.push(hit || hl ? node : <span key={`s${s}`}>{str}</span>);
  }
  return <span data-block={block}>{out}</span>;
}

export function JournalBox({ id, prompt, block }: { id: string; prompt: string; block: string }) {
  const ctx = useContext(Ctx);
  const [value, setValue] = useState(ctx?.journal[id] ?? '');
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flash = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(flash.current); }, []);
  if (!ctx) return null;
  if (!ctx.interactive) {
    return (
      <div>
        <p className="prompt"><RichText block={block} text={prompt} /></p>
        {value.trim() ? <p className="answer">{value}</p> : null}
      </div>
    );
  }
  return (
    <div>
      <p className="prompt"><RichText block={block} text={prompt} /></p>
      <textarea
        value={value} aria-label={prompt} placeholder="Write freely. There's no right answer, only what's true for you right now."
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            ctx.setJournal(id, v);
            setSaved(true);
            clearTimeout(flash.current);
            flash.current = setTimeout(() => setSaved(false), 2200);
          }, 500);
        }}
        onBlur={() => ctx.setJournal(id, value)}
      />
      <div className={`saved${saved ? ' on' : ''}`} aria-live="polite">{saved ? 'Saved' : ''}</div>
    </div>
  );
}

/** Sections resolve from a soft blur as they scroll into view. */
export function Reveal({ children, className = '', as: Tag = 'div', ...rest }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' } & Record<string, unknown>) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } }, { threshold: 0.06 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const T = Tag as 'div';
  return <T ref={ref} className={`reveal${seen ? ' in' : ''} ${className}`} {...rest}>{children}</T>;
}
