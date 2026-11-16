import { readInput, compute, allow, tooMany } from '@/server/session';
import { computeSoulThemes, type Chapter } from '@/reading/build';
import { generatePart, generateThemes, generateWork, aiConfigured } from '@/ai/generate';
import { THEMES, type Theme } from '@/content/library';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Tags the AI gave earlier (stored in the browser) are applied to the server's own rebuilt cards, so a theme can only ever cite a source that really exists. */
function applyTags(chapters: Chapter[], tags: unknown): void {
  if (!tags || typeof tags !== 'object') return;
  const map = tags as Record<string, unknown>;
  for (const ch of chapters) {
    for (const card of ch.cards) {
      const t = map[card.id];
      if (!card.system || !card.source || !Array.isArray(t)) continue;
      card.tags = [...new Set(t)].filter((x): x is Theme => typeof x === 'string' && (THEMES as readonly string[]).includes(x)).slice(0, 3);
    }
  }
}

// Writes the words for one part of one chapter. The chart is recalculated here from the birth data,
// so the AI only ever receives facts the engine produced.
export async function POST(req: Request) {
  if (!allow(req, 'chapter', 150)) return tooMany();
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const input = readInput(body);
  const chapterN = Number(body?.chapter);
  const part = typeof body?.part === 'string' ? body.part : 'a';
  if (!input || !Number.isInteger(chapterN) || chapterN < 1 || chapterN > 9) return Response.json({ status: 'error', message: 'Bad request.' }, { status: 400 });
  try {
    const res = compute(input);
    if (res.status !== 'ok' || !('chapters' in res)) return Response.json({ status: 'fallback', cards: [], rejected: 0 });
    // Work on a copy, so cached chapters are never changed by one visitor's tags.
    const chapters: Chapter[] = structuredClone(res.chapters);
    if (chapterN <= 7) {
      if (!aiConfigured()) return Response.json({ status: 'unavailable', cards: [], rejected: 0 });
      return Response.json(await generatePart(chapters[chapterN - 1], part, res.facts, input.names, input.firstName));
    }
    applyTags(chapters, body?.tags);
    const themes = computeSoulThemes(chapters);
    if (!aiConfigured()) return Response.json({ status: 'unavailable', cards: [], rejected: 0, themes });
    if (chapterN === 8) return Response.json({ ...(await generateThemes(themes, res.facts, input.names, input.firstName)), themes });
    const journal = Array.isArray(body?.journal)
      ? (body.journal as unknown[])
          .filter((j): j is { prompt: string; answer: string } => !!j && typeof j === 'object' && typeof (j as Record<string, unknown>).prompt === 'string' && typeof (j as Record<string, unknown>).answer === 'string')
          .map((j) => ({ prompt: j.prompt.slice(0, 300), answer: j.answer.slice(0, 1200) }))
          .slice(0, 30)
      : [];
    return Response.json({ ...(await generateWork(themes, journal, res.facts, input.names, input.firstName)), themes });
  } catch (err) {
    console.error('[chapter] failed:', err instanceof Error ? err.name : 'unknown error');
    return Response.json({ status: 'fallback', cards: [], rejected: 0 });
  }
}
