# Soul Blueprint

A mobile-first website. Someone enters their birth date, time and place (and optionally their full name) and receives a guided, chapter-by-chapter reading across Western astrology, Human Design, traditional Mayan astrology, numerology, the Chinese zodiac, astrocartography and life cycles, ending with the themes that repeat across every system.

## The one rule: AI never calculates, AI only explains

There are two layers that never mix.

1. **Calculation engine** (`src/engine`). Deterministic code, no AI. Every planetary number comes from the [Swiss Ephemeris](https://www.astro.com/swisseph/). The same input always gives the same output.
2. **Interpretation layer** (`src/ai`). The Claude API writes the words. It receives only facts the engine produced. Every response is checked against those facts (`src/ai/validate.ts`). On a mismatch it is regenerated once, and if it still mismatches, that card shows a neutral built-in text instead (`src/reading/build.ts`).

If something cannot be calculated (unknown birth time, date out of range), that part is shown in a limited form with a plain note. Nothing is ever guessed.

## Accuracy tests

`npm test` runs the reference set in `src/accuracy`. A failing test blocks the build, because `npm run build` runs the tests first. The same results are shown live at `/admin/tests`.

Expected values come from astro.com Data Sheets and Jovian Archive Human Design charts (two full reference charts), NASA JPL Horizons (planet positions for the edge-case births), the Hong Kong Observatory (Lunar New Year dates) and documented time-zone history.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Without an `ANTHROPIC_API_KEY` the site still works and shows the built-in neutral text. See `.env.example`.

## Privacy

No database. No birth data or names are stored or logged on the server. The full name is turned into numbers in the browser and never leaves the device. Highlights, journal answers and the generated reading are kept only in the reader's own browser (localStorage). The Claude API key is used on the server only.

## Where things are

| Folder | What it holds |
|---|---|
| `src/engine` | The calculation engine, one file per system |
| `src/accuracy`, `tests` | Reference values and the tests |
| `src/content` | All fixed wording, the glossary, reference guides and degree themes |
| `src/reading` | Turns facts into chapters and cards |
| `src/ai` | Prompts, the Claude API call, and the validator |
| `src/app`, `src/components` | The website |
| `ephe` | Swiss Ephemeris data files |
| `data` | City list, time-zone history, Lunar New Year table |
| `scripts` | One-time scripts that built the data files |

## Data and credits

- **Swiss Ephemeris** by Astrodienst AG, used under the GNU AGPL. That is why this code is public.
- **City list**: [GeoNames](https://www.geonames.org), CC BY 4.0.
- **Time-zone history**: the IANA Time Zone Database, including its `backzone` file for pre-1970 history.
- **Lunar New Year dates**: calculated with the Swiss Ephemeris and checked against the Hong Kong Observatory conversion tables.
- **Map outline**: Natural Earth, public domain.
- **Fonts**: Instrument Serif and Noto Sans Symbols 2, SIL Open Font License.

## License

GNU Affero General Public License v3.0 or later. See `LICENSE`.
