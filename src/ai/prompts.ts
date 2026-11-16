// What the AI is told. It receives facts the engine produced, plus these style rules. Nothing else.
import { THEMES } from '../content/library';
import type { Chapter, Card, SoulTheme } from '../reading/build';
import { CHAPTERS } from '../content/copy';

const RULES = `You write the words for Soul Blueprint, a guided reading for people who are curious about themselves and know little or nothing about astrology.

The facts in the user message were calculated by a deterministic engine. You explain them. You never calculate.

Hard rules. They apply to every piece of text you write.
1. Use only the placements, signs, houses, degrees, numbers, gates, channels, names, dates and places given in the input. Never mention any placement, sign, house, number, gate, date or place that is not in the input. Do not add planets, asteroids, aspects, or "ruling planets" that were not provided.
2. If a field is missing from the input, it is unknown or hidden. Do not write about it and do not hint at what it might be. If there is no house, do not mention houses at all.
3. Use hedged, non-deterministic wording: "likely", "may", "suggests", "can indicate", "often", "tends to". Never write "you will", "you'll", "you are destined", "destined to", or anything that predicts a specific event.
4. No medical, legal or financial advice. No predictions of specific events.
5. No emojis, no emoticons, no symbols used as decoration. Plain text only: no markdown, no asterisks, no headings, no bullet characters.
6. Never use these words or phrases: game-changer, level up, lightworker, just manifest, just think positive, hustle, grind, boss babe.
7. Never write as if you were Andrea or any real person. Never tell a personal story ("when I was...", "in my own life..."). Never say "I". No calls to action, no social handles, no selling.
8. Mayan chapter: this is the traditional K'iche' Maya count. Use the K'iche' names exactly as given. Never use Dreamspell terms: Kin, Galactic Tone, Galactic Signature, Seed, Skywalker, Worldbridger, wavespell, Blue Storm, or any colour-plus-name title.
9. Write to the reader as "you". Short sentences. Explain any jargon in plain words the first time it appears.
10. Never use an em dash. Use a comma, a period or a colon.
11. Return exactly the JSON structure asked for. Use the ids exactly as given. Every card id in the request must appear once in "cards".

Theme tags. Where the request asks for tags, choose up to 3 that truly fit that card, only from this fixed list, spelled exactly: ${THEMES.join(', ')}. If nothing fits, return an empty list.`;

const VOICE_A = `Voice for reading cards: the information voice.
- Clear, warm but neutral, second person. Nothing preachy. No hype.
- For a placement card, write 2 or 3 short paragraphs, 70 to 130 words in total:
  Paragraph 1, the sign: what this planet or point is like in this sign, often as a quick run of qualities ("relationships and connection, balance and fairness, beauty, diplomacy").
  Paragraph 2, the house (only if a house is given): start with "In the 5th house," (using the given number) and name concrete life areas and examples ("creating, performing, designing, mentoring").
  Weave in ONE sentence on the degree_theme if one is given, so it flows as part of the reading. Do not label it, and do not use the words "Sabian" or "degree symbol".
  You may end with one growth-edge sentence starting "Your growth comes from". Name growth edges honestly and without judgment, never as flaws.
- When true, note strength: if in_home_sign is true, say the planet is especially strong in its home sign. If is_chart_ruler is true, say it is the chart ruler and why that matters. If retrograde is true, explain it in one calm sentence.
- Cusps: if at_edge_of_sign is given, include this quiet sentence, adapted to the placement: "Your Mars sits right at the edge of Virgo, so you may feel some of that energy too." Then add one short line on that neighbouring sign. If at_edge_of_house is given, add one calm sentence that this house may be part of the picture too. Never present this as a warning.
- If must_open_with is given, the first paragraph must begin with exactly that sentence.
- If possible_signs is given instead of a sign, explain in one sentence why both are shown, then give one or two sentences for each sign. Do not pick one.
- Do not repeat the headline or the overview line. Start with substance.`;

const VOICE_B = `Voice for "Putting It Together", journal prompts, Soul Themes and Soul's Work: Andrea's voice.
- A wise friend who has been through the fire and came back with the map: warm, unfiltered, a little witchy, never preachy.
- Validate before elevate: name the hard thing first, normalise it, reframe it as a teacher, then point forward.
- Direct "you". Sacred words beside blunt, human words. An occasional rule of three. A poetic line, then the same idea said plainly.
- Phrases she uses, sparingly and only where they fit: soul gifts and lived experiences, soul-led life, alignment, come home to yourself, vibrate fully as yourself, alchemize pain into purpose.
- You are writing in her style. You are not her. No "I", no personal stories.`;

export const SYSTEM_PROMPT = `${RULES}\n\n${VOICE_A}\n\n${VOICE_B}`;

function cardPayload(c: Card) {
  return {
    id: c.id,
    headline: c.headline,
    ...(c.overview ? { overview_line: c.overview } : {}),
    ...(c.ai ?? {}),
    ...(c.list ? { list_items: c.list.items.map((i) => ({ id: i.id, label: i.lead })) } : {}),
    wants_tags: Boolean(c.system && c.source),
  };
}

const SHAPE = `Return JSON with exactly these keys:
- "cards": a list of { "id", "paragraphs": [strings], "items": [{ "id", "text" }], "tags": [strings] }
- "life_themes": a list of { "name", "evidence" }
- "synthesis": a list of paragraph strings
- "journal": a list of prompt strings
Use an empty list for anything this request does not ask for.`;

export interface PartRequest {
  user: string;
  cardIds: string[];
  wantsSynthesis: boolean;
  wantsJournal: boolean;
  wantsLifeThemes: boolean;
}

/** Builds the user message for one AI request. Returns null if this part has nothing to write. */
export function buildPartRequest(chapter: Chapter, part: string, firstName: string | null): PartRequest | null {
  const meta = CHAPTERS[chapter.n - 1];
  const cards = chapter.cards.filter((c) => c.part === part && c.ai);
  const lines: string[] = [`Chapter ${chapter.n}: "${meta.title.join(' ')}" (${meta.system}).`];
  if (firstName) lines.push(`The reader's first name is ${firstName}. You may use it once, in the synthesis only.`);

  if (chapter.n === 1 && part === 'e') {
    // One line per aspect. The same line is shown under both planets.
    const seen = new Map<string, { id: string; aspect: string; a: unknown; b: unknown }>();
    for (const c of chapter.cards) {
      for (const item of c.list?.items ?? []) {
        if (!item.id.startsWith('asp-') || seen.has(item.id)) continue;
        seen.set(item.id, { id: item.id, aspect: item.lead, a: c.headline, b: '' });
      }
    }
    if (!seen.size) return null;
    const placements = chapter.cards.filter((c) => c.kind === 'placement').map((c) => c.headline);
    lines.push(
      'Write one line for each aspect below, in the information voice.',
      'Each line is 8 to 16 words describing what this aspect tends to feel like or bring, like: "confidence, initiative and the ability to act on your ideas." Do not repeat the names of the planets or the aspect, and do not name any sign or house.',
      'Return one card with id "aspects" whose "items" list has one { id, text } per aspect. No tags.',
      `For context only, the chart has: ${placements.join('; ')}.`,
      `Aspects: ${JSON.stringify([...seen.values()].map((v) => ({ id: v.id, aspect: v.aspect })))}`,
      SHAPE,
    );
    return { user: lines.join('\n\n'), cardIds: ['aspects'], wantsSynthesis: false, wantsJournal: false, wantsLifeThemes: false };
  }

  if (chapter.n === 6) {
    // Places and lines are listed by the engine. The AI only writes the recap and prompts, and may not name any place.
    if (!cards.length) return null;
    lines.push(
      'The cities and lines for this chapter are listed separately by the engine. Do not write any card text: return an empty "cards" list. Do not name any city, country, region or place at all.',
      `The reader has these groups of lines on their map: ${cards.map((c) => c.headline).join('; ')}.`,
      'In Andrea\'s voice:',
      '"synthesis": the "Putting It Together" recap, 2 short paragraphs, 70 to 120 words in total, about how place can bring different parts of a person forward. Validate before you elevate.',
      '"journal": 3 journal prompts about places they have lived in, loved or felt pulled toward. Each ends with a question. Do not name any place.',
      SHAPE,
    );
    return { user: lines.join('\n\n'), cardIds: [], wantsSynthesis: true, wantsJournal: true, wantsLifeThemes: false };
  }
  if (!cards.length) return null;
  const isLast = chapter.n !== 1 || part === 'd';
  const wantsLifeThemes = chapter.n === 1 && part === 'd';

  lines.push('Write the text for each card below in the information voice. For each card return "paragraphs" (and "tags" only where wants_tags is true).');
  if (chapter.n === 1 && part !== 'd') lines.push('These are placement cards. Follow the placement card structure: 2 or 3 short paragraphs, 70 to 130 words per card.');
  if (chapter.n === 1 && part === 'd') {
    lines.push(
      'These are short summary cards. Write 1 or 2 short paragraphs (30 to 70 words) for each, explaining in plain words what the fact suggests. For the card "c1-bigthree" write one paragraph of 50 to 80 words that sketches the person from the Big Three and the strongest elements. For "c1-lifethemes" return an empty paragraphs list.',
      'Also return "life_themes": 3 or 4 named archetypes that the whole chart suggests, each { "name": like "The Communicator-Creator", "evidence": one sentence naming the exact placements from the list below that point to it }.',
    );
  }
  if (chapter.n === 2) lines.push('Use the vehicle language: Type = what kind of vehicle you are; Strategy = how to start the engine; Authority = your GPS; Centers = which parts of the engine run on their own fuel and which borrow fuel from people around you; Profile = your driving style. 40 to 90 words per card. Where a card has list_items, return one { id, text } per item in "items" (one or two sentences each) and keep "paragraphs" to a short lead-in or empty.');
  if (chapter.n === 3) lines.push('Frame the chapter as: the sacred energy you were born carrying, and the way it naturally moves through your life. 60 to 110 words per card. Name gifts and one growth edge, honestly and without judgment. Use the K\'iche\' names exactly as given.');
  if (chapter.n === 4) lines.push('50 to 90 words per card. Say what the number suggests in everyday life. If is_master_number is true, say calmly that it is a master number and what that asks.');
  if (chapter.n === 5) lines.push('50 to 100 words per card. Keep it light and warm.');
  if (chapter.n === 7) lines.push('For each cycle, write one paragraph of 40 to 80 words describing it as a chapter the soul planned: what that season tends to ask of a person. Do not mention any date, year or age that is not in the input, and do not predict events. Return an empty "items" list: the dates are shown separately.');

  lines.push(`Cards: ${JSON.stringify(cards.map(cardPayload))}`);

  if (chapter.n === 1 && part === 'd') {
    const placements = chapter.cards.filter((c) => c.kind === 'placement').map((c) => `${c.headline}${c.meta ? ` (${c.meta})` : ''}`);
    lines.push(`All placements in this chart, for life_themes, synthesis and journal prompts. Cite only these: ${placements.join('; ')}.`);
  }
  if (isLast) {
    lines.push(
      'Then, in Andrea\'s voice:',
      '"synthesis": the "Putting It Together" recap for this chapter, 2 or 3 short paragraphs, 90 to 150 words in total. Validate before you elevate.',
      `"journal": ${chapter.n === 3 ? '3' : '3 or 4'} journal prompts. Each is one or two sentences, ends with a question, and names the exact fact from this chapter it is about (for example "Your Capricorn Moon in the 8th house means you don't open up quickly. Who are the people you've let see your depth, and what made it feel safe?").`,
    );
  }
  lines.push(SHAPE);
  return { user: lines.join('\n\n'), cardIds: cards.map((c) => c.id), wantsSynthesis: isLast, wantsJournal: isLast, wantsLifeThemes };
}

export function buildThemesRequest(themes: SoulTheme[], firstName: string | null): string {
  return [
    'Chapter 8: "Your Soul Themes". These themes were counted by the engine across every system in this person\'s Blueprint. The sources listed are the only places they come from.',
    firstName ? `The reader's first name is ${firstName}. You may use it once, in the synthesis only.` : '',
    'In Andrea\'s voice, write for each theme one card: { "id": the theme id as given, "paragraphs": [one paragraph of 2 or 3 sentences describing how this theme tends to live in a person, and what it asks of them], "items": [], "tags": [] }. Do not list the sources in the paragraph: they are shown separately. You may mention one or two of that theme\'s own sources by their exact label.',
    'Then "synthesis": 2 short paragraphs (80 to 130 words) on what it means that these themes keep repeating across systems. And "journal": 3 prompts, each ending in a question. "life_themes" is an empty list.',
    `Themes: ${JSON.stringify(themes.map((t, i) => ({ id: `theme-${i}`, theme: t.theme, found_in_systems: t.systems, sources: t.sources.map((s) => `${s.label} (${s.system})`) })))}`,
    SHAPE,
  ].filter(Boolean).join('\n\n');
}

export function buildWorkRequest(themes: SoulTheme[], journal: { prompt: string; answer: string }[], firstName: string | null): string {
  return [
    'Chapter 9: "Your Soul\'s Work". Turn this person\'s top themes into 3 to 5 career directions, framed as possibilities to explore, never as prescriptions.',
    firstName ? `The reader's first name is ${firstName}. You may use it once, in the synthesis only.` : '',
    'In Andrea\'s voice. For each direction return one card: { "id": "work-1", "work-2", ... in order, "paragraphs": [ exactly four strings in this order: (1) the name of the direction, 2 to 6 words, no full stop; (2) why it fits, 2 or 3 sentences that name the themes it draws on, using the theme names exactly as given; (3) what it could look like day to day, 2 or 3 concrete sentences; (4) a single empty string ], "items": [ exactly two lived-experience prompts as { "id": "p1" / "p2", "text": a question such as "When have people come to you for exactly this, even before you saw it as a gift?" } ], "tags": [] }.',
    'Use hedged wording: "could", "might", "one possibility". No income claims, no financial advice, no promises.',
    journal.length
      ? 'The person wrote these reflections while reading. Let them shape which directions you choose and how you describe them. Never quote more than a few words back, and never mention anything they did not write.'
      : 'The person wrote no journal reflections, so use only the themes.',
    'Then "synthesis": one short closing paragraph (50 to 90 words) about soul gifts plus lived experiences being the raw material of their work. "journal" and "life_themes" are empty lists.',
    `Themes: ${JSON.stringify(themes.map((t) => ({ theme: t.theme, sources: t.sources.map((s) => s.label) })))}`,
    journal.length ? `Reflections: ${JSON.stringify(journal)}` : '',
    SHAPE,
  ].filter(Boolean).join('\n\n');
}
