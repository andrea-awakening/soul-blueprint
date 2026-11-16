import { describe, it, expect } from 'vitest';
import { computeBlueprint } from '../src/engine';
import { astroProblems, hdProblems, mayanProblems, numerologyProblems, chineseProblems, generalProblems, cardAstroScope, problemsFor } from '../src/ai/validate';
import { buildChapters, computeSoulThemes } from '../src/reading/build';
import { clean } from '../src/ai/generate';
import fixtures from '../src/accuracy/fixtures.json';

const b = fixtures.charts[1].birth; // Reference B: Sun Libra h5, Moon Capricorn h8, Gemini rising, Projector 1/3, 8 Kawoq
const get = (time: string | null) => {
  const r = computeBlueprint({ date: b.date, time, place: { name: b.place, lat: b.lat, lon: b.lon, tz: b.tz }, nowMs: Date.UTC(2026, 10, 16) });
  if (r.status !== 'ok') throw new Error('no chart');
  return r.facts;
};
const facts = get(b.time);
const unknown = get(null);

describe('AI text validator', () => {
  it('accepts placements that match the engine', () => {
    expect(astroProblems('Your Moon in Capricorn suggests restraint. With your Capricorn Moon and Libra Sun, and Gemini Rising, you learn by talking.', facts)).toEqual([]);
    expect(astroProblems('Your Moon in the 8th house runs deep.', facts)).toEqual([]);
  });
  it('rejects a wrong sign, in either word order', () => {
    expect(astroProblems('Your Moon in Aquarius suggests distance.', facts).length).toBe(1);
    expect(astroProblems('Your Scorpio Moon runs deep.', facts).length).toBe(1);
    expect(astroProblems('Leo Rising gives you presence.', facts).length).toBe(1);
  });
  it('rejects a wrong house', () => {
    expect(astroProblems('Your Sun in the 7th house seeks partners.', facts).length).toBe(1);
  });
  it('keeps a placement card to its own sign and house', () => {
    const ch1 = buildChapters(facts, null)[0];
    const sun = ch1.cards.find((c) => c.id === 'c1-sun')!;
    expect(astroProblems('Balance and beauty. In the 5th house, you create.', facts, cardAstroScope(sun, facts))).toEqual([]);
    expect(astroProblems('This has a Scorpio flavour.', facts, cardAstroScope(sun, facts)).length).toBe(1);
    expect(astroProblems('In the 9th house, you travel.', facts, cardAstroScope(sun, facts)).length).toBe(1);
  });
  it('rejects any house or hidden angle when the birth time is unknown', () => {
    expect(astroProblems('In the 5th house, you create.', unknown).length).toBe(1);
    expect(astroProblems('Your Ascendant in Gemini is quick.', unknown).length).toBe(1);
  });
  it('checks Human Design type, gates, channels, profile and authority', () => {
    expect(hdProblems('As a 1/3 Projector with Splenic authority, Gate 18 and Channel 18-58 matter.', facts)).toEqual([]);
    expect(hdProblems('As a Generator you respond.', facts).length).toBe(1);
    expect(hdProblems('Gate 34 gives you power.', facts).length).toBe(1);
    expect(hdProblems('Your 6/2 profile.', facts).length).toBe(1);
    expect(hdProblems('Your Emotional authority needs time.', facts).length).toBe(1);
    expect(hdProblems('Channel 34-57 is yours.', facts).length).toBe(1);
  });
  it('checks Mayan names and tone, and blocks Dreamspell terms', () => {
    expect(mayanProblems('You are 8 Kawoq, born in the E trecena. Tone 8 brings wholeness.', facts)).toEqual([]);
    expect(mayanProblems("Your nawal is Q'anil.", facts).length).toBe(1);
    expect(mayanProblems('Tone 5 is about work.', facts).length).toBe(1);
    expect(mayanProblems('Your Galactic Tone is 8.', facts).length).toBeGreaterThan(0);
    expect(mayanProblems('You are a Blue Storm.', facts).length).toBeGreaterThan(0);
    expect(mayanProblems('You are Kin 99, a Seed.', facts).length).toBeGreaterThan(0);
  });
  it('checks numerology and Chinese zodiac', () => {
    expect(numerologyProblems('Your Life Path 1 leads. Your Birthday number is 9.', facts, null)).toEqual([]);
    expect(numerologyProblems('Your Life Path 7 seeks.', facts, null).length).toBe(1);
    expect(numerologyProblems('Your Expression 5 roams.', facts, null).length).toBe(1);
    expect(chineseProblems('Born in the year of the Horse, a Metal Horse.', facts)).toEqual([]);
    expect(chineseProblems('Born in the year of the Dragon.', facts).length).toBe(1);
    expect(chineseProblems('You are a Fire Horse.', facts).length).toBe(1);
  });
  it('blocks emojis, banned phrases, predictions and personal stories', () => {
    expect(generalProblems('You may find this is likely true for you.')).toEqual([]);
    expect(generalProblems('This is a game-changer ✨').length).toBe(2);
    expect(generalProblems('You will meet someone in June.').length).toBe(1);
    expect(generalProblems("You'll level up.").length).toBe(2);
    expect(generalProblems('When I was in corporate, I learned this.').length).toBe(1);
    expect(generalProblems('You are destined for greatness.').length).toBe(1);
  });
  it('allows the astrological symbols themselves', () => {
    expect(generalProblems('☉ ☽ ⚷ ⚸ ☊ ☋ ⊗')).toEqual([]);
  });
  it('cleans dashes and markdown without touching facts', () => {
    expect(clean('Warm — and direct. **Bold**')).toBe('Warm, and direct. Bold');
  });
});

describe('built-in (fallback) reading', () => {
  const charts = [facts, unknown, ...fixtures.charts.map((c) => {
    const r = computeBlueprint({ date: c.birth.date, time: c.birth.time, place: { name: c.birth.place, lat: c.birth.lat, lon: c.birth.lon, tz: c.birth.tz }, nowMs: Date.UTC(2026, 10, 16) });
    if (r.status !== 'ok') throw new Error('no chart');
    return r.facts;
  })];
  it('never contradicts the engine, and contains no emoji, banned phrase or Dreamspell term', () => {
    for (const f of charts) {
      const names = { expression: 8, soulUrge: 6, personality: 11 };
      for (const ch of buildChapters(f, names)) {
        for (const card of ch.cards) {
          const text = [...card.paragraphs, ...(card.list?.items.map((i) => i.text) ?? []), card.note ?? ''].join('\n');
          expect({ card: card.id, problems: problemsFor(text, ch.n, f, names, card) }).toEqual({ card: card.id, problems: [] });
        }
        for (const t of [...ch.synthesis, ...ch.journal]) expect({ ch: ch.n, problems: problemsFor(t, ch.n, f, names) }).toEqual({ ch: ch.n, problems: [] });
      }
    }
  });
  it('shows every placement from the brief, in order, when the time is known', () => {
    const ids = buildChapters(facts, null)[0].cards.filter((c) => c.kind === 'placement').map((c) => c.id.replace('c1-', ''));
    expect(ids).toEqual(['sun', 'moon', 'asc', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'mc', 'dc', 'ic', 'rockefellia', 'chiron', 'lilith', 'fortune', 'northNode', 'southNode']);
  });
  it('hides what depends on the birth time when it is unknown', () => {
    const chapters = buildChapters(unknown, null);
    const ids = chapters[0].cards.map((c) => c.id);
    for (const hidden of ['c1-asc', 'c1-mc', 'c1-dc', 'c1-ic', 'c1-fortune']) expect(ids).not.toContain(hidden);
    expect(chapters[5].cards.map((c) => c.id)).toEqual(['c6-hidden']);
    expect(chapters[4].cards.find((c) => c.id === 'c5-hour')?.note).toBe('This depends on your exact birth time.');
  });
  it('finds Soul Themes only from sources that exist, in at least 2 systems', () => {
    const chapters = buildChapters(facts, { expression: 8, soulUrge: 6, personality: 11 });
    const themes = computeSoulThemes(chapters);
    expect(themes.length).toBeGreaterThanOrEqual(3);
    expect(themes.length).toBeLessThanOrEqual(5);
    const sources = new Set(chapters.flatMap((c) => c.cards.map((x) => x.source)));
    for (const t of themes) {
      expect(t.systems).toBeGreaterThanOrEqual(2);
      for (const s of t.sources) expect(sources.has(s.label)).toBe(true);
    }
  });
});
