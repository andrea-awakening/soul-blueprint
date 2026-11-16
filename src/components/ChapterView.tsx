'use client';
// One chapter: title, primer, Learn More, reading cards, Putting It Together, journal prompts.
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Chapter, Card } from '../reading/build';
import type { PlacementId } from '../engine/placements';
import { CHAPTERS, NOTICE, HIGHLIGHT_COLORS } from '../content/copy';
import { guideFor } from '../content/guides';
import type { Blueprint } from './store';
import { RichText, JournalBox, Reveal } from './Reader';
import { ZodiacWheel, Orbs, CentersDiagram, Timeline, Constellation, elementCounts, modalityCounts } from './Viz';

const AcgMap = dynamic(() => import('./AcgMap'), { ssr: false, loading: () => <div className="map" /> });

function Symbol({ card }: { card: Card }) {
  if (!card.symbol) return null;
  if (card.symbolStyle === 'mono') return <span className="glyph mono-glyph" aria-hidden="true">{card.symbol}</span>;
  if (/^[A-Z]{2}$/.test(card.symbol)) return <span className="glyph label-glyph" aria-hidden="true">{card.symbol}</span>;
  // U+FE0E asks for the text form of the symbol, never an emoji.
  return <span className="glyph" aria-hidden="true">{card.symbol + '︎'}</span>;
}

function Visual({ card, bp, active, print, wheelRef }: { card: Card; bp: Blueprint; active: PlacementId | null; print: boolean; wheelRef?: React.RefObject<HTMLDivElement | null> }) {
  const f = bp.facts;
  switch (card.viz) {
    case 'wheel':
      return <div className="wheel-wrap" ref={wheelRef} id="wheel"><ZodiacWheel chart={f.western} active={active} /></div>;
    case 'elements':
      return <Orbs counts={elementCounts(f)} />;
    case 'modalities':
      return <Orbs counts={modalityCounts(f)} three />;
    case 'centers': {
      const hd = f.humanDesign;
      const defined = hd.timeKnown ? hd.chart.definedCenters : hd.stable.definedCenters;
      const channels = hd.timeKnown ? hd.chart.channels : hd.stable.channels;
      return defined ? <CentersDiagram defined={defined} channels={channels ?? []} /> : null;
    }
    case 'map':
      return f.astrocartography && !print ? <AcgMap lines={f.astrocartography.lines} groups={f.astrocartography.groups} /> : null;
    case 'timeline':
      return <Timeline events={f.cycles.events} approximate={f.cycles.approximate} />;
    case 'constellation':
      return bp.themes?.length ? <Constellation themes={bp.themes} /> : null;
    default:
      return null;
  }
}

function CardView({ card, bp, active, print, wheelRef }: { card: Card; bp: Blueprint; active: PlacementId | null; print: boolean; wheelRef?: React.RefObject<HTMLDivElement | null> }) {
  return (
    <Reveal as="article" className={`card${card.kind === 'note' ? ' plain' : ''}${card.sources ? ' theme-card' : ''}`} data-planet={card.planetId}>
      <div className="card-head">
        <Symbol card={card} />
        <div>
          <h3 className="card-title">{card.headline}</h3>
          {card.meta && <div className="meta">{card.meta}</div>}
        </div>
      </div>
      {card.overview && <span className="overview">{card.overview}</span>}
      <Visual card={card} bp={bp} active={active} print={print} wheelRef={wheelRef} />
      {card.paragraphs.map((p, i) => (
        <p key={i}><RichText block={`${card.id}:p${i}`} text={p} /></p>
      ))}
      {card.list && card.list.items.length > 0 && (
        <ul className="sublist">
          {card.list.label && <li className="label sublist-label" style={{ listStyle: 'none' }}>{card.list.label}</li>}
          {card.list.items.map((it) => (
            <li key={it.id}>
              <span className="lead">{it.lead}{it.text ? ': ' : ''}</span>
              <RichText block={`${card.id}:i:${it.id}`} text={it.text} />
            </li>
          ))}
        </ul>
      )}
      {card.sources && <div className="sources"><span className="label">Where it comes from</span><br />{card.sources}</div>}
      {card.prompts && card.prompts.length > 0 && (
        <div className="sublist" style={{ paddingLeft: 0 }}>
          <span className="label sublist-label">From your lived experience</span>
          {card.prompts.map((p, i) => <JournalBox key={i} id={`${card.id}:${i}`} prompt={p} block={`${card.id}:q${i}`} />)}
        </div>
      )}
      {card.note && <p className="note-line">{card.note}</p>}
    </Reveal>
  );
}

interface Props {
  bp: Blueprint;
  chapter: Chapter;
  print?: boolean;
  first?: boolean;
  onContinue?: () => void;
  continueLabel?: string;
  busy?: boolean;
}

export function ChapterView({ bp, chapter, print = false, first = false, onContinue, continueLabel, busy }: Props) {
  const meta = CHAPTERS[chapter.n - 1];
  const guide = guideFor(chapter.n, bp.facts);
  const [active, setActive] = useState<PlacementId | null>(null);
  const [wheelGone, setWheelGone] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  // Each planet on the wheel glows while its card is being read.
  useEffect(() => {
    if (print || chapter.n !== 1 || typeof IntersectionObserver === 'undefined') return;
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.planet as PlacementId);
      },
      { rootMargin: '-42% 0px -42% 0px' },
    );
    root.querySelectorAll('[data-planet]').forEach((el) => io.observe(el));
    const wheel = wheelRef.current;
    const io2 = new IntersectionObserver((entries) => setWheelGone(!entries[0].isIntersecting && entries[0].boundingClientRect.top < 0));
    if (wheel) io2.observe(wheel);
    return () => { io.disconnect(); io2.disconnect(); };
  }, [print, chapter.n, chapter.cards.length]);

  const greet = bp.input.firstName && chapter.n === 1 ? `${bp.input.firstName}, this is your chart.` : null;

  return (
    <article ref={rootRef} className={print ? '' : 'rise'}>
      <header className={`chapter-head${first ? ' first' : ''}`}>
        <span className="kicker">Chapter {chapter.n} {'·'} {meta.system}</span>
        <h1 className="display">{meta.title[0]} <em>{meta.title[1]}</em></h1>
        <p className="lede" style={{ margin: '0 auto 18px' }}>{meta.subtitle}</p>
        {!print && <p className="transition-line">{greet ? `${greet} ` : ''}{meta.transition}</p>}
      </header>
      {chapter.topNote && <p className="top-note">{chapter.topNote}</p>}

      <Reveal className="primer">
        <span className="label" style={{ display: 'block', marginBottom: 12 }}>Before you read this</span>
        {meta.primer.map((p, i) => <p key={i}>{p}</p>)}
      </Reveal>

      {!print && (
        <details className="learn">
          <summary><span>Learn more: {guide.title}</span><span className="plus" aria-hidden="true">+</span></summary>
          <div className="learn-body">
            {guide.sections.map((s) => (
              <section key={s.heading}>
                <h4>{s.heading}</h4>
                {s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
                {s.rows && <dl>{s.rows.map(([t, d]) => (<div key={t}><dt>{t}</dt><dd>{d}</dd></div>))}</dl>}
              </section>
            ))}
          </div>
        </details>
      )}

      {!print && chapter.n === 1 && (
        <div style={{ textAlign: 'center', margin: '0 0 8px' }}>
          <p className="quiet" style={{ marginBottom: 8 }}>Select any sentence to highlight it.</p>
          <ul className="hl-legend">
            {HIGHLIGHT_COLORS.map((c) => <li key={c.id}><i style={{ background: c.hex, boxShadow: `0 0 10px ${c.hex}` }} />{c.label}</li>)}
          </ul>
        </div>
      )}

      {chapter.cards.map((card) => <CardView key={card.id} card={card} bp={bp} active={active} print={print} wheelRef={card.viz === 'wheel' ? wheelRef : undefined} />)}

      {chapter.synthesis.length > 0 && (
        <Reveal className="synthesis">
          <span className="label" style={{ display: 'block', marginBottom: 14 }}>Putting it together</span>
          {chapter.synthesis.map((p, i) => <p key={i}><RichText block={`syn${chapter.n}:p${i}`} text={p} /></p>)}
        </Reveal>
      )}

      {chapter.journal.length > 0 && (!print || chapter.journal.some((_, i) => (bp.journal[`${chapter.n}:${i}`] || '').trim())) && (
        <Reveal className="journal">
          <span className="label" style={{ display: 'block', marginBottom: 16 }}>Journal prompts {'·'} optional</span>
          {!print && chapter.n === 1 && <p className="notice">{NOTICE}</p>}
          {chapter.journal.map((prompt, i) =>
            print && !(bp.journal[`${chapter.n}:${i}`] || '').trim() ? null : <JournalBox key={`${chapter.n}:${i}`} id={`${chapter.n}:${i}`} prompt={prompt} block={`j${chapter.n}:${i}`} />,
          )}
        </Reveal>
      )}

      {!print && onContinue && (
        <div className="continue">
          <button type="button" className="btn" onClick={onContinue} disabled={busy}>{busy ? 'One moment' : continueLabel || 'Continue'}</button>
        </div>
      )}

      {!print && chapter.n === 1 && wheelGone && (
        <button type="button" className="mini-wheel no-print" aria-label="Back to your chart wheel" onClick={() => document.getElementById('wheel')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
          <ZodiacWheel chart={bp.facts.western} active={active} mini />
        </button>
      )}
    </article>
  );
}
