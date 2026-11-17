// Calls the Claude API (server only), then validates every piece of text against the engine's facts.
// On a mismatch it asks once more. If a card still mismatches, that card keeps its neutral fallback text:
// a wrong sentence is never shown.
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { BlueprintFacts } from '../engine';
import type { NameNumbers } from '../engine/numerology';
import { THEMES, type Theme } from '../content/library';
import { ROCKEFELLIA_OPENER } from '../content/copy';
import { cuspSentences, homeSentence, type Chapter, type Card, type SoulTheme } from '../reading/build';
import { SIGNS } from '../engine/zodiac';
import { SYSTEM_PROMPT, buildPartRequest, buildThemesRequest, buildWorkRequest } from './prompts';
import { problemsFor, generalProblems } from './validate';

const OutputSchema = z.object({
  cards: z.array(z.object({
    id: z.string(),
    paragraphs: z.array(z.string()),
    items: z.array(z.object({ id: z.string(), text: z.string() })),
    tags: z.array(z.string()),
  })),
  life_themes: z.array(z.object({ name: z.string(), evidence: z.string() })),
  synthesis: z.array(z.string()),
  journal: z.array(z.string()),
});
export type AiOutput = z.infer<typeof OutputSchema>;

export type CallResult = { ok: true; out: AiOutput } | { ok: false; reason: 'no-key' | 'busy' | 'refused' | 'error' };

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

async function callModel(user: string, problems?: string[]): Promise<CallResult> {
  if (!aiConfigured()) return { ok: false, reason: 'no-key' };
  client ??= new Anthropic({ maxRetries: 2, timeout: 50_000 });
  const content = problems?.length
    ? `${user}\n\nYour previous draft had these problems. Fix every one of them and return the complete JSON again:\n${problems.map((p) => `- ${p}`).join('\n')}`
    : user;
  try {
    const res = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      // If a safety classifier declines the request, the API re-runs it on its default fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      // Thinking off and medium effort: these are short writing tasks, and the loading screen is waiting.
      thinking: { type: 'between_tools' },
      output_config: { effort: 'medium', format: zodOutputFormat(OutputSchema) },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content }],
    });
    if (res.stop_reason === 'refusal') return { ok: false, reason: 'refused' };
    if (!res.parsed_output) return { ok: false, reason: 'error' };
    return { ok: true, out: res.parsed_output };
  } catch (err) {
    // Never log request content: it can include a first name or journal text.
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      console.error('[ai] the API key was rejected');
      return { ok: false, reason: 'no-key' };
    }
    if (err instanceof Anthropic.RateLimitError) return { ok: false, reason: 'busy' };
    if (err instanceof Anthropic.APIError) {
      console.error(`[ai] API error ${err.status ?? ''} ${err.name}`);
      return { ok: false, reason: err.status && err.status >= 500 ? 'busy' : 'error' };
    }
    console.error('[ai] unexpected error', err instanceof Error ? err.name : 'unknown');
    return { ok: false, reason: 'error' };
  }
}

/** Light, deterministic clean-up of wording (never of facts). */
export function clean(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ ,/g, ',')
    .trim();
}

/** A list item is shown as "Label: text". If the AI repeats the label at the start of the text, drop the repeat. */
export function stripLead(text: string, lead?: string): string {
  if (!lead) return text;
  const names = [lead, lead.replace(/ center$/i, ''), lead.split(',')[0]].map((n) => n.trim()).filter(Boolean);
  let out = text;
  for (const n of names) {
    const re = new RegExp(`^(?:the\\s+)?${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s+center)?\\s*[:,.\\-]\\s*`, 'i');
    if (re.test(out)) { out = out.replace(re, ''); break; }
  }
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : text;
}

export interface CardPatch { id: string; paragraphs?: string[]; items?: { id: string; text: string }[]; tags?: Theme[] }
export interface PartResult {
  status: 'ai' | 'fallback' | 'unavailable' | 'busy';
  cards: CardPatch[];
  synthesis?: string[];
  journal?: string[];
  lifeThemes?: { name: string; evidence: string }[];
  /** How many pieces were rejected by validation and kept their fallback text. */
  rejected: number;
}

interface Ctx { chapter: Chapter; facts: BlueprintFacts; names: NameNumbers | null }

const SIGN_WORD = new RegExp(`\\b(${SIGNS.join('|')})\\b`);

const placementOf = (card: Card, ctx: Ctx) => ctx.facts.western.placements.find((p) => p.id === card.planetId);

function checkCard(card: Card, raw: AiOutput['cards'][number], ctx: Ctx): { patch: CardPatch; problems: string[] } {
  let paragraphs = raw.paragraphs.map(clean).filter(Boolean);
  const items = raw.items
    .map((i) => ({ id: i.id, text: stripLead(clean(i.text), card.list?.items.find((x) => x.id === i.id)?.lead) }))
    // Aspect lines under a placement come from their own request, never from the placement card.
    .filter((i) => i.text && card.kind !== 'placement' && card.list?.items.some((x) => x.id === i.id));
  const problems: string[] = [];
  const needsText = card.kind === 'placement' || (card.paragraphs.length > 0 && !card.list);
  if (needsText && !paragraphs.length) problems.push('has no text');
  if (paragraphs.some((p) => p.length > 1400)) problems.push('a paragraph is far too long');
  if (card.kind === 'placement' && paragraphs.join(' ').split(/\s+/).length > (placementOf(card, ctx)?.cusp ? 145 : 130)) problems.push('is too long: a placement card is about 85 words, at most 95 (115 with cusp sentences)');
  const text = [...paragraphs, ...items.map((i) => i.text)].join('\n');
  problems.push(...problemsFor(text, ctx.chapter.n, ctx.facts, ctx.names, card));

  // Deterministic guarantees, so these never depend on the AI remembering.
  // The chart ruler card always opens with the fixed sentence that explains how the ruler was found.
  if (card.id === 'c1-ruler' && paragraphs.length) paragraphs = [card.paragraphs[0], ...paragraphs.filter((p) => p !== card.paragraphs[0])];
  if (card.id === 'c1-rockefellia' && paragraphs.length && !paragraphs[0].startsWith(ROCKEFELLIA_OPENER)) paragraphs[0] = `${ROCKEFELLIA_OPENER} ${paragraphs[0]}`;
  const placement = ctx.facts.western.placements.find((p) => p.id === card.planetId);
  if (placement?.domicile && !placement.possibleSigns && paragraphs.length && !/home sign/i.test(paragraphs.join(' '))) paragraphs[0] = `${paragraphs[0]} ${homeSentence(placement)}`;
  if (placement?.cusp && paragraphs.length) {
    const joined = paragraphs.join(' ');
    const missingSign = placement.cusp.neighborSign && !joined.includes(placement.cusp.neighborSign);
    const missingHouse = placement.cusp.neighborHouse && !new RegExp(`\\b${placement.cusp.neighborHouse}(?:st|nd|rd|th) house`).test(joined);
    if (missingSign || missingHouse) paragraphs = [...paragraphs, cuspSentences({ ...placement, cusp: { neighborSign: missingSign ? placement.cusp.neighborSign : undefined, neighborHouse: missingHouse ? placement.cusp.neighborHouse : undefined } })];
  }
  const tags = card.system && card.source ? ([...new Set(raw.tags)].filter((t) => (THEMES as readonly string[]).includes(t)).slice(0, 3) as Theme[]) : undefined;
  return { patch: { id: card.id, paragraphs: paragraphs.length ? paragraphs : undefined, items: items.length ? items : undefined, tags }, problems };
}

function checkAspects(raw: AiOutput['cards'][number] | undefined, ctx: Ctx): { patch: CardPatch; problems: string[] } {
  const valid = new Set(ctx.chapter.cards.flatMap((c) => c.list?.items.map((i) => i.id) ?? []).filter((id) => id.startsWith('asp-')));
  const problems: string[] = [];
  const items: { id: string; text: string }[] = [];
  for (const it of raw?.items ?? []) {
    if (!valid.has(it.id)) continue;
    const text = clean(it.text).replace(/\.$/, '') + '.';
    const p = generalProblems(text);
    if (SIGN_WORD.test(text) || /\bhouse\b/i.test(text)) p.push('names a sign or house');
    if (text.split(/\s+/).length > 16) p.push('is too long: about 10 words');
    if (p.length) problems.push(`${it.id}: ${p.join('; ')}`);
    else items.push({ id: it.id, text: text.charAt(0).toLowerCase() + text.slice(1) });
  }
  return { patch: { id: 'aspects', items }, problems };
}

function checkProse(list: string[], ctx: Ctx, opts: { questions?: boolean; min: number }): { ok: string[] | undefined; problems: string[] } {
  const cleaned = list.map(clean).filter(Boolean);
  const problems: string[] = [];
  const good: string[] = [];
  for (const t of cleaned) {
    const p = problemsFor(t, ctx.chapter.n, ctx.facts, ctx.names);
    if (opts.questions && !/\?\s*$/.test(t)) p.push('a journal prompt does not end with a question');
    if (p.length) problems.push(...p);
    else good.push(t);
  }
  return { ok: good.length >= opts.min && (opts.questions || good.length === cleaned.length) ? good : undefined, problems };
}

function evaluate(out: AiOutput, req: { cardIds: string[]; wantsSynthesis: boolean; wantsJournal: boolean; wantsLifeThemes: boolean }, ctx: Ctx) {
  const patches: CardPatch[] = [];
  const problems: string[] = [];
  let rejected = 0;
  for (const id of req.cardIds) {
    const raw = out.cards.find((c) => c.id === id);
    if (id === 'aspects') {
      const r = checkAspects(raw, ctx);
      patches.push(r.patch);
      problems.push(...r.problems);
      rejected += r.problems.length;
      continue;
    }
    const card = ctx.chapter.cards.find((c) => c.id === id);
    if (!card) continue;
    if (!raw) { problems.push(`card ${id} is missing`); rejected++; continue; }
    const r = checkCard(card, raw, ctx);
    if (r.problems.length) { problems.push(...r.problems.map((p) => `card ${id} ${p}`)); rejected++; }
    else patches.push(r.patch);
  }
  let synthesis: string[] | undefined;
  let journal: string[] | undefined;
  let lifeThemes: { name: string; evidence: string }[] | undefined;
  if (req.wantsSynthesis) {
    const r = checkProse(out.synthesis, ctx, { min: 1 });
    synthesis = r.ok;
    if (!r.ok) { problems.push(...r.problems.map((p) => `synthesis ${p}`), ...(r.problems.length ? [] : ['synthesis is missing'])); rejected++; }
  }
  if (req.wantsJournal) {
    const r = checkProse(out.journal, ctx, { questions: true, min: 3 });
    journal = r.ok?.slice(0, 4);
    if (!r.ok) { problems.push(...r.problems.map((p) => `journal ${p}`), ...(r.problems.length ? [] : ['journal needs at least 3 prompts'])); rejected++; }
  }
  if (req.wantsLifeThemes) {
    const good = out.life_themes
      .map((t) => ({ name: clean(t.name), evidence: clean(t.evidence) }))
      .filter((t) => t.name && t.evidence && !problemsFor(`${t.name}. ${t.evidence}`, 1, ctx.facts, ctx.names).length);
    if (good.length >= 3) lifeThemes = good.slice(0, 4);
    else { problems.push('life_themes must be 3 or 4 archetypes that cite only placements from the list, with the correct signs and houses'); rejected++; }
  }
  return { patches, synthesis, journal, lifeThemes, problems, rejected };
}

async function run(user: string, req: { cardIds: string[]; wantsSynthesis: boolean; wantsJournal: boolean; wantsLifeThemes: boolean }, ctx: Ctx): Promise<PartResult> {
  const first = await callModel(user);
  if (!first.ok) return { status: first.reason === 'no-key' ? 'unavailable' : first.reason === 'busy' ? 'busy' : 'fallback', cards: [], rejected: 0 };
  let ev = evaluate(first.out, req, ctx);
  if (ev.problems.length) {
    // Regenerate once, telling the model exactly what did not match.
    const second = await callModel(user, ev.problems.slice(0, 20));
    if (second.ok) {
      const ev2 = evaluate(second.out, req, ctx);
      if (ev2.rejected <= ev.rejected) ev = ev2;
    }
  }
  return { status: 'ai', cards: ev.patches, synthesis: ev.synthesis, journal: ev.journal, lifeThemes: ev.lifeThemes, rejected: ev.rejected };
}

/** Chapters 1 to 7. */
export async function generatePart(chapter: Chapter, part: string, facts: BlueprintFacts, names: NameNumbers | null, firstName: string | null): Promise<PartResult> {
  const req = buildPartRequest(chapter, part, firstName);
  if (!req) return { status: 'fallback', cards: [], rejected: 0 };
  return run(req.user, req, { chapter, facts, names });
}

/** Chapter 8: descriptions for the themes the engine counted. */
export async function generateThemes(themes: SoulTheme[], facts: BlueprintFacts, names: NameNumbers | null, firstName: string | null): Promise<PartResult> {
  if (!themes.length) return { status: 'fallback', cards: [], rejected: 0 };
  const chapter: Chapter = {
    n: 8, synthesis: [], journal: [], parts: {},
    cards: themes.map((t, i) => ({ id: `theme-${i}`, kind: 'themes' as const, headline: t.theme, paragraphs: [t.description], tags: [] })),
  };
  return run(buildThemesRequest(themes, firstName), { cardIds: chapter.cards.map((c) => c.id), wantsSynthesis: true, wantsJournal: true, wantsLifeThemes: false }, { chapter, facts, names });
}

/** Chapter 9: career directions from the themes and any journal reflections. */
export async function generateWork(themes: SoulTheme[], journal: { prompt: string; answer: string }[], facts: BlueprintFacts, names: NameNumbers | null, firstName: string | null): Promise<PartResult> {
  if (!themes.length) return { status: 'fallback', cards: [], rejected: 0 };
  const ids = ['work-1', 'work-2', 'work-3', 'work-4', 'work-5'];
  const chapter: Chapter = {
    n: 9, synthesis: [], journal: [], parts: {},
    cards: ids.map((id) => ({ id, kind: 'themes' as const, headline: id, paragraphs: ['x'], list: { label: '', items: [{ id: 'p1', lead: '', text: '' }, { id: 'p2', lead: '', text: '' }] }, tags: [] })),
  };
  const first = await callModel(buildWorkRequest(themes, journal, firstName));
  if (!first.ok) return { status: first.reason === 'no-key' ? 'unavailable' : first.reason === 'busy' ? 'busy' : 'fallback', cards: [], rejected: 0 };
  const attempt = (out: AiOutput) => {
    const cards: CardPatch[] = [];
    const problems: string[] = [];
    for (const raw of out.cards) {
      if (!ids.includes(raw.id)) continue;
      const paragraphs = raw.paragraphs.map(clean);
      const items = raw.items.map((i) => ({ id: i.id, text: clean(i.text) })).filter((i) => i.text).slice(0, 2);
      const p = problemsFor([...paragraphs, ...items.map((i) => i.text)].join('\n'), 9, facts, names);
      if (paragraphs.filter(Boolean).length < 3) p.push('needs a name, why it fits and what it could look like');
      if (items.length < 2 || !items.every((i) => /\?\s*$/.test(i.text))) p.push('needs two lived-experience prompts that end with a question');
      if (p.length) problems.push(...p.map((x) => `card ${raw.id} ${x}`));
      else cards.push({ id: raw.id, paragraphs: paragraphs.slice(0, 3), items });
    }
    if (cards.length < 3) problems.push('at least 3 valid directions are needed');
    const syn = checkProse(out.synthesis, { chapter, facts, names }, { min: 1 });
    return { cards, problems, synthesis: syn.ok };
  };
  let a = attempt(first.out);
  if (a.problems.length) {
    const second = await callModel(buildWorkRequest(themes, journal, firstName), a.problems.slice(0, 20));
    if (second.ok) {
      const b = attempt(second.out);
      if (b.cards.length >= a.cards.length) a = b;
    }
  }
  if (a.cards.length < 3) return { status: 'fallback', cards: [], rejected: 1 };
  return { status: 'ai', cards: a.cards.slice(0, 5), synthesis: a.synthesis, rejected: 0 };
}
