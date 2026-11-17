// What the AI is told. It receives facts the engine produced, plus these style rules. Nothing else.
import { THEMES } from '../content/library';
import type { Chapter, Card, SoulTheme } from '../reading/build';
import { CHAPTERS } from '../content/copy';

const RULES = `You write the words for Soul Blueprint, a guided reading for people who are curious about themselves and know little or nothing about astrology.

The facts in the user message were calculated by a deterministic engine. You explain them. You never calculate.

Hard rules. They apply to every piece of text you write.
1. Use only the placements, signs, houses, degrees, numbers, gates, channels, names, dates and places given in the input. Never mention any placement, sign, house, number, gate, date or place that is not in the input. Do not add planets, asteroids, aspects, or "ruling planets" that were not provided.
2. If a field is missing from the input, it is unknown or hidden. Do not write about it and do not hint at what it might be. If there is no house, do not mention houses at all.
3. Describe traits and patterns plainly and directly, as what the placement means: "Your Moon in Capricorn makes you slow to open up." Do not stack soft words. Use "can", "often" or "tends to" only where a plain statement would overclaim, and at most once per card. Never predict: never write "you will", "you'll", "you are destined", "destined to", or anything that foretells a specific event.
4. No medical, legal or financial advice. No predictions of specific events.
5. No emojis, no emoticons, no symbols used as decoration. Plain text only: no markdown, no asterisks, no headings, no bullet characters.
6. Never use these words or phrases: game-changer, level up, lightworker, just manifest, just think positive, hustle, grind, boss babe.
7. Never write as if you were Andrea or any real person. Never tell a personal story ("when I was...", "in my own life..."). Never say "I". No calls to action, no social handles, no selling.
8. Mayan chapter: this is the traditional K'iche' Maya count. Use the K'iche' names exactly as given. Never use Dreamspell terms: Kin, Galactic Tone, Galactic Signature, Seed, Skywalker, Worldbridger, wavespell, Blue Storm, or any colour-plus-name title.
9. Write to the reader as "you". Short sentences. Explain any jargon in plain words the first time it appears.
10. Never use an em dash. Use a comma, a period or a colon.
11. Return exactly the JSON structure asked for. Use the ids exactly as given. Every card id in the request must appear once in "cards".

Theme tags. Where the request asks for tags, choose up to 3 that truly fit that card, only from this fixed list, spelled exactly: ${THEMES.join(', ')}. If nothing fits, return an empty list.`;

const VOICE_A = `Voice for every reading card: the information voice. Say it plainly.
- State the information clearly, in the pattern "You are this way because of this placement." Let the reader decide what to do with it.
- No vague or mystical hinting, no metaphors, no poetic language, no rhetorical questions. Bad: "Chiron asks what your old pain can become." Good: "Chiron in Leo can point to a fear of being seen. Healing comes from letting yourself be visible."
- Get to the point in the first sentence. No filler, no warm-up, no restating the headline or the overview line.
- A placement card is about 85 words (75 to 95), in 2 short paragraphs:
  Paragraph 1, the sign: what this planet or point is like in this sign and what that makes the person like, in concrete terms.
  Paragraph 2, the house (only if a house is given): start with "In the 5th house," (using the given number) and name the concrete life areas where it shows up. If no house is given, paragraph 2 continues with how the sign shows up day to day.
  Work in ONE short sentence on the degree_theme if one is given, as part of the reading. Do not label it, and do not use the words "Sabian" or "degree symbol".
  End with one growth sentence starting "Your growth comes from". Name it honestly and without judgment.
- Home sign: if home_sign_sentence is given, include that exact sentence in paragraph 1. If is_chart_ruler is true, say in one sentence that this is the chart ruler, so it carries extra weight. If retrograde is true, explain it in one plain sentence.
- Cusps: if at_edge_of_sign is given, include this sentence, adapted to the placement: "Your Mars sits right at the edge of Virgo, so you may feel some of that energy too." Then add one short line on that neighbouring sign. If at_edge_of_house is given, add one sentence that this house may be part of the picture too. Never present this as a warning. These sentences may take the card up to 115 words.
- If must_open_with is given, the first paragraph must begin with exactly that sentence.
- If possible_signs is given instead of a sign, explain in one sentence why both are shown, then give one or two sentences for each sign. Do not pick one.`;

const VOICE_RECAP = `Voice for "Putting It Together" and journal prompts in chapters 1 to 8: clear, warm and direct. Still plain language. No poetry, no metaphors.
- "Putting It Together" is ONE short, impactful recap of 80 to 120 words. Combine all of this chapter's energies into one picture of a person: who they are when everything in the chapter is added together, and the themes they are meant to live and experience in this lifetime. It must add understanding. Do not walk back through the placements or facts one by one, and do not repeat sentences the reader has already seen. Name at most three facts from the chapter, and only to anchor the picture.
- Journal prompts are strategic and personal. Each one is built from this person's actual patterns (what repeats, what is concentrated, what is missing) and aims at helping them see how their patterns shape their purpose. Each prompt names the pattern it comes from, then asks one question. Examples of the standard: "With so much of your chart in the house of partnership, what do you think you're here to learn through relationships?" and, for a Capricorn-heavy chart, "What do you feel you're here to build that lasts?" Never write a generic reflection question that could be asked of anyone ("Which part resonated most?", "How does this make you feel?").`;

const VOICE_B = `Voice for chapter 9, Your Soul's Work, only: Andrea's voice. Poetic language is welcome here.
- A wise friend who has been through the fire and came back with the map: warm, unfiltered, a little witchy, never preachy.
- Validate before elevate: name the hard thing first, normalise it, reframe it as a teacher, then point forward.
- Direct "you". Sacred words beside blunt, human words. An occasional rule of three. A poetic line, then the same idea said plainly.
- Phrases she uses, sparingly and only where they fit: soul gifts and lived experiences, soul-led life, alignment, come home to yourself, vibrate fully as yourself, alchemize pain into purpose.
- In chapter 9 only, use hedged wording for the directions: "could", "might", "one possibility".
- You are writing in her style. You are not her. No "I", no personal stories.`;

export const SYSTEM_PROMPT = `${RULES}\n\n${VOICE_A}\n\n${VOICE_RECAP}\n\n${VOICE_B}`;

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
      'Each line is about 10 words (7 to 12) saying plainly what this aspect gives the person, like: "confidence and the drive to act on ideas." It is shown right after the aspect name and a colon, so do not repeat the names of the planets or the aspect, and do not name any sign or house. Start with a lower-case word.',
      'Return one card with id "aspects" whose "items" list has one { id, text } per aspect. No tags.',
      `For context only, the chart has: ${placements.join('; ')}.`,
      `Aspects: ${JSON.stringify([...seen.values()].map((v) => ({ id: v.id, aspect: v.aspect })))}`,
      SHAPE,
    );
    return { user: lines.join('\n\n'), cardIds: ['aspects'], wantsSynthesis: false, wantsJournal: false, wantsLifeThemes: false };
  }

  if (chapter.n === 6) {
    // Lines, meanings and cities are listed by the engine. The AI writes only the recap and prompts,
    // and may name only the cities and countries given here.
    if (!cards.length) return null;
    lines.push(
      'The lines, their meanings and the cities near them are already shown to the reader by the engine. Do not write any card text: return an empty "cards" list.',
      'You may name only cities and countries that appear in the data below. You may group them under a broad region name (for example "Western Europe" or "the west coast of North America") when two or more of the listed places truly belong to it. Never name any other city or country.',
      `Groups of lines on this person's map, with the places near each line: ${JSON.stringify(cards.map((c) => c.ai))}`,
      '"synthesis": the "Putting It Together" recap, 80 to 120 words, one or two paragraphs. Find real patterns across the lines: where the lines of two groups fall in the same country or region, say so and say plainly what that suggests ("Your career and growth lines both run through Western Europe, which suggests..."). Then say where this person might thrive for career, for love and for rest, naming places from the data. If a group has no places listed, do not invent any.',
      '"journal": 3 journal prompts built from these actual lines and places (for example, a place where two groups overlap, or the contrast between where they rest and where they are seen). Each names the pattern, then ends with one question.',
      SHAPE,
    );
    return { user: lines.join('\n\n'), cardIds: [], wantsSynthesis: true, wantsJournal: true, wantsLifeThemes: false };
  }
  if (!cards.length) return null;
  const isLast = chapter.n !== 1 || part === 'd';
  const wantsLifeThemes = chapter.n === 1 && part === 'd';

  lines.push('Write the text for each card below in the information voice. For each card return "paragraphs" (and "tags" only where wants_tags is true).');
  if (chapter.n === 1 && part !== 'd') lines.push('These are placement cards. Follow the placement card structure: 2 short paragraphs, about 85 words per card. The first sentence states the main point.');
  if (chapter.n === 1 && part === 'd') {
    lines.push(
      'These are short summary cards. Write ONE short paragraph of 25 to 45 words for each, saying plainly what the fact means for this person. For "c1-bigthree" write one paragraph of 50 to 70 words that sketches the person from the Big Three and the strongest elements. For "c1-ruler", the sentence in already_shown_first is shown to the reader before your text, so do not repeat how the chart ruler was found: say what it means that this planet, in this sign and house, leads the chart. For "c1-lifethemes" return an empty paragraphs list.',
      'Also return "life_themes": 3 or 4 named archetypes that the whole chart suggests, each { "name": like "The Communicator-Creator", "evidence": one sentence naming the exact placements from the list below that point to it }.',
    );
  }
  if (chapter.n === 2) lines.push('Use the vehicle language: Type = what kind of vehicle you are; Strategy = how to start the engine; Authority = your GPS; Centers = which parts of the engine run on their own fuel and which borrow fuel from people around you; Profile = your driving style. 40 to 80 words per card: the big picture and every essential detail, nothing extra. Where a card has list_items, return one { id, text } per item in "items" (one or two sentences each) and keep "paragraphs" to a short lead-in or empty. Each item is shown after its own label and a colon, so never start an item by repeating its label or the name of the center, line or channel.');
  if (chapter.n === 3) lines.push('Frame the chapter as: the energy you were born carrying, and the way it moves through your life. 45 to 75 words per card: the big picture and the essential detail, nothing extra. Name the gifts and one growth edge, honestly and without judgment. Use the K\'iche\' names exactly as given. Do not add technical details such as a combined day name ("8 Aq\'ab\'al") or calendar mechanics.');
  if (chapter.n === 4) lines.push('40 to 70 words per card: what this number means for this person in everyday life, stated plainly. If is_master_number is true, say in one sentence that it is a master number and what that asks.');
  if (chapter.n === 5) lines.push('40 to 70 words per card. Plain, light and warm.');
  if (chapter.n === 7) lines.push('For each cycle, write one paragraph of 40 to 60 words saying plainly what this period asks of a person and what it is for. Do not mention any date, year or age that is not in the input, and do not predict events. Return an empty "items" list: the dates are shown separately.');

  lines.push(`Cards: ${JSON.stringify(cards.map(cardPayload))}`);

  if (chapter.n === 1 && part === 'd') {
    const placements = chapter.cards.filter((c) => c.kind === 'placement').map((c) => `${c.headline}${c.meta ? ` (${c.meta})` : ''}`);
    lines.push(`All placements in this chart, for life_themes, synthesis and journal prompts. Cite only these: ${placements.join('; ')}.`);
  }
  if (isLast) {
    lines.push(
      'Then, following the "Putting It Together" and journal prompt rules:',
      '"synthesis": the "Putting It Together" recap for this chapter: 80 to 120 words, one or two paragraphs. One picture of the person and the themes they are meant to live this lifetime. It must add understanding, not repeat the cards.',
      `"journal": ${chapter.n === 3 || chapter.n === 5 ? '3' : '3 or 4'} journal prompts. Each is one or two sentences and ends with a question. Each is built from a real pattern in this chapter's facts and helps the person see how that pattern shapes their purpose.`,
    );
  }
  lines.push(SHAPE);
  return { user: lines.join('\n\n'), cardIds: cards.map((c) => c.id), wantsSynthesis: isLast, wantsJournal: isLast, wantsLifeThemes };
}

export function buildThemesRequest(themes: SoulTheme[], firstName: string | null): string {
  return [
    'Chapter 8: "Your Soul Themes". These themes were counted by the engine across every system in this person\'s Blueprint. The sources listed are the only places they come from.',
    firstName ? `The reader's first name is ${firstName}. You may use it once, in the synthesis only.` : '',
    'In the information voice (plain, direct, no poetry), write for each theme one card: { "id": the theme id as given, "paragraphs": [one paragraph of 2 or 3 sentences saying plainly how this theme shows up in this person\'s life and what it asks of them], "items": [], "tags": [] }. Do not list the sources in the paragraph: they are shown separately. You may mention one or two of that theme\'s own sources by their exact label.',
    'Then "synthesis": the "Putting It Together" recap, 80 to 120 words: these themes combined into one picture of the person and what they are here to live. Do not explain the method again. And "journal": 3 prompts built from these exact themes (for example, two themes that pull against each other, or a theme found in every system), each ending in a question that connects the pattern to their purpose. "life_themes" is an empty list.',
    `Themes: ${JSON.stringify(themes.map((t, i) => ({ id: `theme-${i}`, theme: t.theme, found_in_systems: t.systems, sources: t.sources.map((s) => `${s.label} (${s.system})`) })))}`,
    SHAPE,
  ].filter(Boolean).join('\n\n');
}

export function buildWorkRequest(themes: SoulTheme[], journal: { prompt: string; answer: string }[], firstName: string | null): string {
  return [
    'Chapter 9: "Your Soul\'s Work". Turn this person\'s top themes into 3 to 5 career directions, framed as possibilities to explore, never as prescriptions.',
    firstName ? `The reader's first name is ${firstName}. You may use it once, in the synthesis only.` : '',
    'In Andrea\'s voice (the chapter 9 voice). For each direction return one card: { "id": "work-1", "work-2", ... in order, "paragraphs": [ exactly four strings in this order: (1) the name of the direction, 2 to 6 words, no full stop; (2) why it fits, 2 or 3 sentences that name the themes it draws on, using the theme names exactly as given; (3) what it could look like day to day, 2 or 3 concrete sentences; (4) a single empty string ], "items": [ exactly two lived-experience prompts as { "id": "p1" / "p2", "text": a question such as "When have people come to you for exactly this, even before you saw it as a gift?" } ], "tags": [] }.',
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
