import { readInput, compute, allow, tooMany } from '@/server/session';
import { forBrowser } from '@/reading/build';
import { aiConfigured } from '@/ai/generate';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Calculates the chart. No AI is involved here, and nothing is stored or logged.
export async function POST(req: Request) {
  if (!allow(req, 'blueprint', 40)) return tooMany();
  const input = readInput(await req.json().catch(() => null));
  if (!input) return Response.json({ status: 'error', message: 'Please fill in your birth date and birth city.' }, { status: 400 });
  try {
    const res = compute(input);
    if (res.status !== 'ok' || !('chapters' in res)) return Response.json(res);
    return Response.json({ status: 'ok', facts: res.facts, chapters: res.chapters.map(forBrowser), ai: aiConfigured() });
  } catch (err) {
    console.error('[blueprint] calculation failed:', err instanceof Error ? err.message : 'unknown error');
    return Response.json({ status: 'error', message: 'The calculation could not be completed. Nothing was guessed. Please try again.' }, { status: 500 });
  }
}
