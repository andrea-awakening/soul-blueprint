// Everything a reader's device remembers: the calculated Blueprint, the written chapters, highlights and journal answers.
// It all lives in the browser's localStorage, keyed by the birth data. Nothing is sent to or kept on a server.
// Every read and write is wrapped in error handling, so the page still works when storage is blocked.
import type { BlueprintFacts } from '../engine';
import type { NameNumbers } from '../engine/numerology';
import type { Chapter, Card, SoulTheme } from '../reading/build';
import type { HighlightColor, VehicleId } from '../content/copy';
import { THEME_WORK } from '../content/work';
import { THEME_INFO } from '../content/library';
import { CHAPTERS } from '../content/copy';

export interface BirthInput {
  firstName: string;
  date: string;
  time: string | null;
  placeId: number;
  placeLabel: string;
  timeChoice?: 0 | 1;
  nameNumbers: NameNumbers | null;
}

export interface Highlight {
  id: string;
  chapter: number;
  block: string; // id of the paragraph it belongs to
  start: number;
  end: number;
  color: HighlightColor;
  text: string;
}

export interface Blueprint {
  v: 2;
  key: string;
  input: BirthInput;
  facts: BlueprintFacts;
  /** Index 0 = chapter 1. Chapters 8 and 9 are added when they are written. */
  chapters: Chapter[];
  /** Highest chapter unlocked (1-9). 10 = the closing is unlocked. */
  unlocked: number;
  /** Chapters that have been opened. Their wording is frozen from then on. */
  opened: number[];
  highlights: Highlight[];
  journal: Record<string, string>;
  /** The themes the engine counted for chapter 8. */
  themes?: SoulTheme[];
  ai: boolean;
  /** The chapter the reader was last on (1-9, or 10 for the closing). */
  at?: number;
  /** Free writing from the My Notes page. */
  notepad?: string;
}

// v2: the chapter layout changed with Update 1, so Blueprints saved by the first version are not reopened.
const PREFIX = 'sb:v2:';
const LAST = 'sb:v2:last';
const VEHICLE = 'sb:vehicle';
const RETURN = 'sb:return';

export function keyFor(input: Pick<BirthInput, 'date' | 'time' | 'placeId' | 'timeChoice'>): string {
  return `${input.date}|${input.time ?? 'unknown'}|${input.placeId}|${input.timeChoice ?? ''}`;
}

export function loadLast(): Blueprint | null {
  try {
    const key = window.localStorage.getItem(LAST);
    if (!key) return null;
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const bp = JSON.parse(raw) as Blueprint;
    return bp && bp.v === 2 && bp.facts && Array.isArray(bp.chapters) ? bp : null;
  } catch {
    return null;
  }
}

export function loadByInput(input: BirthInput): Blueprint | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + keyFor(input));
    if (!raw) return null;
    const bp = JSON.parse(raw) as Blueprint;
    return bp && bp.v === 2 ? bp : null;
  } catch {
    return null;
  }
}

/** Returns false if the device refused to store it (private window, storage full or blocked). */
export function save(bp: Blueprint): boolean {
  try {
    window.localStorage.setItem(PREFIX + bp.key, JSON.stringify(bp));
    window.localStorage.setItem(LAST, bp.key);
    return true;
  } catch {
    return false;
  }
}

export function forget(): void {
  try {
    window.localStorage.removeItem(LAST);
  } catch {
    /* nothing to do */
  }
}

// ---- merging AI text into a chapter ----
export interface CardPatch { id: string; paragraphs?: string[]; items?: { id: string; text: string }[]; tags?: string[] }
export interface PartResult {
  status: 'ai' | 'fallback' | 'unavailable' | 'busy' | 'error';
  cards: CardPatch[];
  synthesis?: string[];
  journal?: string[];
  lifeThemes?: { name: string; evidence: string }[];
  themes?: SoulTheme[];
}

export function mergePart(chapter: Chapter, part: string, res: PartResult): Chapter {
  if (res.status !== 'ai') return chapter;
  const byId = new Map(res.cards.map((c) => [c.id, c]));
  const aspects = new Map((byId.get('aspects')?.items ?? []).map((i) => [i.id, i.text]));
  const cards = chapter.cards.map((card): Card => {
    let next = card;
    const patch = byId.get(card.id);
    if (patch) {
      const items = new Map((patch.items ?? []).map((i) => [i.id, i.text]));
      next = {
        ...next,
        paragraphs: patch.paragraphs?.length ? patch.paragraphs : next.paragraphs,
        tags: (patch.tags as Card['tags'] | undefined) ?? next.tags,
        list: next.list && items.size ? { ...next.list, items: next.list.items.map((it) => (items.has(it.id) ? { ...it, text: items.get(it.id)! } : it)) } : next.list,
      };
    }
    if (aspects.size && next.list) next = { ...next, list: { ...next.list, items: next.list.items.map((it) => (aspects.has(it.id) ? { ...it, text: aspects.get(it.id)! } : it)) } };
    if (card.id === 'c1-lifethemes' && res.lifeThemes?.length) {
      next = { ...next, list: { label: '', items: res.lifeThemes.map((t, i) => ({ id: `lt-${i}`, lead: t.name, text: t.evidence })) } };
    }
    return next;
  });
  return {
    ...chapter,
    cards,
    synthesis: res.synthesis?.length ? res.synthesis : chapter.synthesis,
    journal: res.journal?.length ? res.journal : chapter.journal,
    parts: { ...chapter.parts, [part]: 'ai' },
  };
}

/** All tags currently on the cards of chapters 1-5, to send with the Soul Themes request. */
export function collectTags(chapters: Chapter[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const ch of chapters.slice(0, 5)) for (const c of ch.cards) if (c.system && c.source) out[c.id] = c.tags;
  return out;
}

const themeTitle = (t: string) => `The ${t.split('/').map((w) => w.replace(/\b\w/g, (m) => m.toUpperCase())).join(' / ')}`;

export function buildThemesChapter(themes: SoulTheme[], res: PartResult | null): Chapter {
  const text = new Map((res?.status === 'ai' ? res.cards : []).map((c) => [c.id, c.paragraphs]));
  const cards: Card[] = [
    { id: 'c8-constellation', kind: 'themes', headline: 'Your Constellation', viz: 'constellation', paragraphs: ['Each star is a theme. Each thin line shows a system where it appears.'], tags: [] },
    ...themes.map((t, i): Card => ({
      id: `c8-theme-${i}`, kind: 'themes', headline: themeTitle(t.theme), meta: `Found in ${t.systems} systems`,
      paragraphs: text.get(`theme-${i}`)?.length ? text.get(`theme-${i}`)! : [THEME_INFO[t.theme]],
      sources: t.sources.map((s) => s.label).join(' · '), tags: [t.theme],
    })),
  ];
  if (!themes.length) cards.push({ id: 'c8-none', kind: 'note', headline: 'No repeating themes yet', paragraphs: ['No theme showed up in at least two systems of this Blueprint, so none is shown here instead of a guess.'], tags: [] });
  return {
    n: 8, cards,
    synthesis: res?.status === 'ai' && res.synthesis?.length ? res.synthesis : themes.length ? [`${themes.slice(0, 3).map((t) => themeTitle(t.theme)).join(', ')}. Different systems, different languages, and the same things kept showing up. That is not a coincidence to explain away. It is a pattern to live.`] : [],
    journal: res?.status === 'ai' && res.journal?.length ? res.journal : CHAPTERS[7].journalFallback,
    parts: { a: res?.status === 'ai' ? 'ai' : 'fallback' },
  };
}

export function buildWorkChapter(themes: SoulTheme[], res: PartResult | null): Chapter {
  let cards: Card[];
  if (res?.status === 'ai' && res.cards.length >= 3) {
    cards = res.cards.map((c, i): Card => ({
      id: `c9-work-${i}`, kind: 'themes', headline: c.paragraphs?.[0] ?? `Direction ${i + 1}`, overview: 'A possibility to explore',
      paragraphs: (c.paragraphs ?? []).slice(1, 3), prompts: (c.items ?? []).map((x) => x.text), tags: [],
    }));
  } else {
    cards = themes.slice(0, 5).map((t, i): Card => ({
      id: `c9-work-${i}`, kind: 'themes', headline: THEME_WORK[t.theme].direction, overview: 'A possibility to explore',
      paragraphs: [
        `This grows out of your theme ${themeTitle(t.theme)}, which appears in ${t.sources.slice(0, 4).map((s) => s.label).join(', ')}.`,
        THEME_WORK[t.theme].day,
      ],
      prompts: THEME_WORK[t.theme].prompts, tags: [],
    }));
  }
  if (!cards.length) cards = [{ id: 'c9-none', kind: 'note', headline: 'Directions need themes', paragraphs: ['No repeating themes were found in this Blueprint, so no directions are suggested instead of a guess.'], tags: [] }];
  return {
    n: 9, cards,
    synthesis: res?.status === 'ai' && res.synthesis?.length ? res.synthesis : ['Your soul gifts and your lived experiences are the raw material. None of these directions is an instruction. Notice which one your body leans toward, and start there.'],
    journal: [],
    parts: { a: res?.status === 'ai' ? 'ai' : 'fallback' },
  };
}

export function journalEntries(bp: Blueprint): { chapter: number; prompt: string; answer: string }[] {
  const out: { chapter: number; prompt: string; answer: string }[] = [];
  for (const ch of bp.chapters) {
    ch.journal.forEach((prompt, i) => {
      const answer = (bp.journal[`${ch.n}:${i}`] || '').trim();
      if (answer) out.push({ chapter: ch.n, prompt, answer });
    });
    for (const card of ch.cards) {
      (card.prompts ?? []).forEach((prompt, i) => {
        const answer = (bp.journal[`${card.id}:${i}`] || '').trim();
        if (answer) out.push({ chapter: ch.n, prompt, answer });
      });
    }
  }
  return out;
}

// ---- the chosen vehicle ----
export function loadVehicle(): VehicleId | null {
  try {
    const v = window.localStorage.getItem(VEHICLE);
    return v === 'horse' || v === 'boat' || v === 'plane' || v === 'ufo' ? v : null;
  } catch {
    return null;
  }
}
export function saveVehicle(v: VehicleId): void {
  try { window.localStorage.setItem(VEHICLE, v); } catch { /* the choice simply lasts for this visit */ }
}

// ---- "go straight back to where I was reading" ----
export function rememberPlace(view: number): void {
  try { window.sessionStorage.setItem(RETURN, JSON.stringify({ view, y: Math.round(window.scrollY) })); } catch { /* not essential */ }
}
export function takePlace(): { view: number; y: number } | null {
  try {
    const raw = window.sessionStorage.getItem(RETURN);
    if (!raw) return null;
    window.sessionStorage.removeItem(RETURN);
    const p = JSON.parse(raw) as { view: number; y: number };
    return Number.isInteger(p.view) && typeof p.y === 'number' ? p : null;
  } catch {
    return null;
  }
}

// ---- estimated reading time ----
const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
/**
 * Minutes for each of the nine chapters: words at about 200 a minute, plus a minute for each journal prompt.
 * Text that the AI has not written yet is estimated from the length it is asked to write.
 */
export function estimateMinutes(chapters: Chapter[]): number[] {
  return CHAPTERS.map((meta, i) => {
    const ch = chapters[i];
    let w = meta.primer.reduce((n, p) => n + words(p), 0) + 20;
    let prompts = 3;
    if (!ch) {
      // Chapters 8 and 9 are written later: about five themes, or four directions with two prompts each.
      w += i === 7 ? 5 * 60 + 100 : 4 * 110 + 70;
      prompts = i === 7 ? 3 : 6;
    } else {
      for (const c of ch.cards) {
        const written = ch.parts[c.part ?? ''] === 'ai' || !c.part || c.part === 'none' || c.group;
        if (written) w += c.paragraphs.reduce((n, p) => n + words(p), 0) + (c.list?.items.reduce((n, it) => n + words(it.lead) + words(it.text), 0) ?? 0);
        else w += (c.kind === 'placement' ? 85 : 45) + (c.list?.items.length ?? 0) * 14;
      }
      w += 100;
      prompts = ch.journal.length || 3;
      if (!ch.cards.some((c) => c.part && c.part !== 'none')) { w -= 100; prompts = 0; }
    }
    return Math.max(1, Math.round(w / 200) + prompts);
  });
}
