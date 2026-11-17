'use client';
// One chapter: title, primer, Learn More, reading cards, Putting It Together, journal prompts.
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Chapter, Card } from '../reading/build';
import type { PlacementId } from '../engine/placements';
import { CHAPTERS, NOTICE, HIGHLIGHT_COLORS, HIGHLIGHT_HELP, LEARN_MORE_INTRO, CLOSING } from '../content/copy';
import { guideFor } from '../content/guides';
import type { Blueprint } from './store';
import { RichText, JournalBox, Reveal } from './Reader';
import { ZodiacWheel, Orbs, CentersDiagram, Timeline, Constellation, elementCounts, modalityCounts } from './Viz';
import { ChapterIcon, Ornament, VehicleDiagram } from './Art';
import type { AcgGroupKey } from '../engine/astrocartography';

const AcgMap = dynamic(() => import('./AcgMap'), { ssr: false, loading: () => <div className="map" /> });

function Symbol({ card }: { card: Card }) {
  if (!card.symbol) return null;
  if (card.symbolStyle === 'mono') return <span className="glyph mono-glyph" aria-hidden="true">{card.symbol}</span>;
  if (/^[A-Z]{2}$/.test(card.symbol)) return <span className="glyph label-glyph" aria-hidden="true">{card.symbol}</span>;
  // U+FE0E asks for the text form of the symbol, never an emoji.
  return <span className="glyph" aria-hidden="true">{card.symbol + '︎'}</span>;
}

function Visual({ card, bp, active, print, wheelRef, groupCards }: { card: Card; bp: Blueprint; active: PlacementId | null; print: boolean; wheelRef?: React.RefObject<HTMLDivElement | null>; groupCards?: Card[] }) {
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
      return f.astrocartography && !print ? (
        <AcgMap
          lines={f.astrocartography.lines} groups={f.astrocartography.groups}
          explain={(key: AcgGroupKey) => {
            const g = groupCards?.find((c) => c.group === key);
            return g ? <div key={g.id} className="acg-card rise-quick"><h4 className="acg-title">{g.headline}</h4><CardBody card={g} /></div> : null;
          }}
        />
      ) : null;
    case 'timeline':
      return <Timeline events={f.cycles.events} approximate={f.cycles.approximate} />;
    case 'constellation':
      return bp.themes?.length ? <Constellation themes={bp.themes} /> : null;
    default:
      return null;
  }
}

function CardBody({ card }: { card: Card }) {
  return (
    <>
      {card.paragraphs.map((p, i) => (
        <p key={i}><RichText block={`${card.id}:p${i}`} text={p} /></p>
      ))}
      {card.list && card.list.items.length > 0 && (
        <ul className={`sublist${card.finale ? ' finale-list' : ''}`}>
          {card.list.label && <li className="label sublist-label" style={{ listStyle: 'none' }}>{card.list.label}</li>}
          {card.list.items.map((it) => (
            <li key={it.id}>
              <span className="lead">{it.lead}{it.text && !card.finale ? ': ' : ''}</span>
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
    </>
  );
}

function CardView({ card, bp, active, print, wheelRef, groupCards }: { card: Card; bp: Blueprint; active: PlacementId | null; print: boolean; wheelRef?: React.RefObject<HTMLDivElement | null>; groupCards?: Card[] }) {
  return (
    <>
      {card.section && (
        <div className="section-head">
          <Ornament />
          <h2 className="section gold">{card.section}</h2>
          {card.sectionNote && <p className="quiet">{card.sectionNote}</p>}
        </div>
      )}
      {card.finale && <Ornament className="before-finale" />}
      <Reveal as="article" className={`card${card.kind === 'note' ? ' plain' : ''}${card.sources ? ' theme-card' : ''}${card.finale ? ' finale' : ''}`} data-planet={card.planetId}>
        {card.finale && <span className="kicker finale-kicker">The heart of this chapter</span>}
        <div className="card-head">
          <Symbol card={card} />
          <div>
            <h3 className="card-title">{card.headline}</h3>
            {card.meta && <div className="meta">{card.meta}</div>}
          </div>
        </div>
        {card.overview && <span className="overview">{card.overview}</span>}
        <Visual card={card} bp={bp} active={active} print={print} wheelRef={wheelRef} groupCards={groupCards} />
        <CardBody card={card} />
      </Reveal>
    </>
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
  /** Called before leaving for the PDF page, so the reader can come straight back. */
  onLeave?: () => void;
}

export function ChapterView({ bp, chapter, print = false, first = false, onContinue, continueLabel, busy, onLeave }: Props) {
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
      <header className={`chapter-head opening${first ? ' first' : ''}`}>
        <ChapterIcon n={chapter.n} size={78} className="opening-icon" />
        <span className="kicker">Chapter {chapter.n} {'·'} {meta.system}</span>
        <h1 className="display gold">{meta.title[0]} <em>{meta.title[1]}</em></h1>
        <p className="lede" style={{ margin: '0 auto 18px' }}>{meta.subtitle}</p>
        {!print && <p className="transition-line">{greet ? `${greet} ` : ''}{meta.transition}</p>}
      </header>
      {chapter.topNote && <p className="top-note">{chapter.topNote}</p>}

      <Reveal className="primer">
        <span className="label" style={{ display: 'block', marginBottom: 12 }}>Before you read this</span>
        {meta.primer.map((p, i) => <p key={i} className={chapter.n === 1 && i === 2 ? 'example' : undefined}>{p}</p>)}
        {chapter.n === 2 && <VehicleDiagram />}
      </Reveal>

      {!print && (
        <details className="learn">
          <summary><span>Learn more: {guide.title}</span><span className="plus" aria-hidden="true">+</span></summary>
          <div className="learn-body">
            <p className="learn-intro">{LEARN_MORE_INTRO}</p>
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
        <div className="hl-help">
          <p className="quiet" style={{ marginBottom: 10 }}>{HIGHLIGHT_HELP}</p>
          <ul className="hl-legend">
            {HIGHLIGHT_COLORS.map((c) => <li key={c.id}><mark className={`hl-${c.id}`}>{c.label}</mark></li>)}
          </ul>
        </div>
      )}

      {chapter.cards.map((card) => {
        // On screen, each map category is shown under the map when its tab is chosen. In the PDF they are listed.
        if (card.group && !print) return null;
        return <CardView key={card.id} card={card} bp={bp} active={active} print={print} wheelRef={card.viz === 'wheel' ? wheelRef : undefined} groupCards={card.viz === 'map' ? chapter.cards.filter((c) => c.group) : undefined} />;
      })}

      {chapter.synthesis.length > 0 && <Ornament />}
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
          <button type="button" className="btn btn-gold" onClick={onContinue} disabled={busy}>{busy ? 'One moment' : continueLabel || 'Continue'}</button>
          <p style={{ margin: '18px 0 0' }}><Link className="link-btn" href="/print" onClick={onLeave}>{CLOSING.download}</Link></p>
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
