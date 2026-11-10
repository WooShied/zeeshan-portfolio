# Zeeshan Malik · portfolio (review draft)

A single-page portfolio drawn as an **engineering drawing set**. Each section is a numbered sheet, the hero is a circuit board with dimension lines and a bill of materials, and every part of the board leads to a sheet.

This is a **review draft**. Anything Zeeshan hasn't confirmed carries a visible amber label, `Placeholder · Awaiting Zeeshan approval`, right next to it. The checklist of everything he needs to confirm is in [docs/CONTENT-CHECKLIST.md](docs/CONTENT-CHECKLIST.md).

## Run it

Requires Node 18+ (tested on Node 26).

```bash
npm install
```

```bash
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

```bash
npm run build
```

`build` type-checks, then writes static files to `dist/`. Any static host works (Netlify, Vercel, GitHub Pages, Cloudflare Pages). No environment variables, no backend, no cookies, no analytics, no forms. `public/robots.txt` and a `noindex` meta tag keep the draft out of search engines. Remove both when Zeeshan approves launch.

## Visual concept

- **A drawing set, not a dashboard.** Square corners, hairline rules, tick-marked section rules, a dot-grid drafting background and a zone-ruled frame. No rounded cards, pills or glows.
- **Sheet index + title block.** On desktop, a left sidebar lists the seven sheets on a vertical bus whose lit length follows scroll; a title block shows the current sheet, title and revision. On phones, a compact strip shows `03/07 Experience` with an Index sheet.
- **The board is the navigation.** Processor → About, Memory → Experience, I/O → Projects, Debug → Signal lab, Comms → Contact. Numbered balloons and a bill-of-materials table do the same job. "Inspect system" separates the board into substrate, copper and component layers.
- **Type.** IBM Plex throughout, like a datasheet: Plex Sans Condensed for titles, Plex Sans for reading, Plex Mono for labels.
- **Colour.** Graphite, warm off-white, cyan for linework and live signal, amber only for status and draft labels.

## Interactive features

| Feature | Where | Notes |
|---|---|---|
| Interactive circuit board | Sheet 01 | Pointer tilt and light (desktop), trace illumination, numbered balloons, BOM table with the same five controls, "Go to sheet" readout, Escape to clear |
| Inspect system (exploded view) | Sheet 01, command palette | 3D layer separation with standing labels and a layer key; flat fallback without 3D support |
| Drawing register | Sheet 02 | Area filters with counts, keyword search, live count, empty state |
| Case studies | Sheet 02 | Native modal dialog, deep links (`#projects/<slug>`), section index that tracks reading, expandable architecture diagram, decision panels, prev/next |
| Logic-analyzer experience | Sheet 03 | One channel per role, high while active; A/B cursors mark the selected role; decode panel; arrow keys / Home / End; deep links (`#experience/<role>`) |
| Example system figure | Sheet 04 | Clickable sensor → controller → comms → host diagram with telemetry and command paths (placeholder demonstration) |
| Signal lab | Sheet 05 | One instrument: frequency, sample rate, noise, waveform, reconstruction; live scope + DFT; Nyquist/aliasing readouts; Pause, Reset |
| Connector pinout | Sheet 07 | LinkedIn connected; email, GitHub and résumé shown as NC (not connected) until supplied |
| Command palette | `Ctrl/⌘ K`, `/`, or Search | Sections, projects, roles, links, actions; full keyboard support |
| Startup sequence | First visit | About 1.5 s, once per session, skipped by any key or click, never with reduced motion or a deep link |

The signal lab is labelled `Interactive demo · Simulated data.` The example system figure is labelled `Placeholder demonstration · Awaiting Zeeshan approval.`

## Editing content

**All words, links, and approval statuses live in one file: [`src/content/site.ts`](src/content/site.ts).** Components only read from it, so you never need to touch layout code to change content.

| To change… | Edit in `site.ts` |
|---|---|
| Headline, positioning line, hero intro | `identity` |
| About paragraph and key facts | `about` |
| Roles (titles, dates, type, location, description) | `experience` |
| Engineering principles | `principles` |
| Skill groups | `skills` |
| Projects and case studies | `projects` (filters in `projectFilters`) |
| Email, GitHub, résumé, LinkedIn | `links` |
| Architecture explorer example | `archNodes`, `archPaths` |
| What each board component links to | `boardMap` |
| Sheet names, numbers and order | `sections` |
| "Present" on the timeline axis | `timelineNow` (update occasionally) |
| Wording of the labels themselves | `labels` |

Everything in `src/` ships to the browser. **Don't put private notes in `site.ts`.**

### Approving content

Every piece of copy that might need confirmation has a `status`:

| `status` | Shows | Use for |
|---|---|---|
| `"placeholder"` | amber `Placeholder · Awaiting Zeeshan approval` beside the item | draft or inferred content |
| `"approved"` | no label | content Zeeshan has confirmed |
| `"supplied"` | shown as fact (some places add a small "Source: LinkedIn") | facts from a supplied source |

Approval is **per item**. Approving the About paragraph doesn't approve the headline, and approving one skill group doesn't approve the others. Example:

```ts
// before
headline: { text: "Code, signals, and the physical world.", status: "placeholder" },
// after Zeeshan approves this exact line
headline: { text: "Code, signals, and the physical world.", status: "approved" },
```

**Experience descriptions.** Replace the bracketed template with real text, then set `status: "approved"`. Text in `[square brackets]` is highlighted as a missing field anywhere on the site, so leftover gaps stay visible.

**Projects.** The three projects are illustrative. To replace one with a real project, edit its fields, set `kind: "verified"` (this removes the "Illustrative project placeholder · Not a verified Zeeshan project." banner) and `status: "approved"`. Add links by setting `href` on its `links` entries. A link with `href: null` shows as clearly unavailable.

**Contact links.** To switch on email, GitHub, or a résumé, set `href` (for a résumé, put the PDF in `public/` and use `"./resume.pdf"`) and change `status` to `"approved"`. For email use `"mailto:name@example.com"`.

## Accessibility and performance

- Semantic sections with one `h1` and an `h2` per section; skip link; visible focus rings everywhere.
- Every board hotspot, diagram node, and filter is a real `<button>`; the board also has a plain legend with the same actions.
- Dialogs use native `<dialog>` (focus is trapped, Escape closes, focus returns to what opened it). Browser Back also closes a case study.
- Reduced motion: no parallax, trace pulses, or startup sequence; the signal lab starts paused (Run still works); reveals are instant.
- Content is never hidden behind animation: reveals fall back to visible after 1.2 s, and a `<noscript>` block lists the supplied experience and LinkedIn.
- The signal lab loads only when you scroll near it. Animation pauses when its section is off-screen (canvas loops, CSS pulses, board effects).
- No autoplay audio, no external requests at runtime; fonts are self-hosted.

## Project structure

```
index.html                 Page shell, meta, noscript fallback
public/                    favicon.svg, robots.txt (draft: disallow all)
src/
  content/site.ts          ← ALL editable content and approval statuses
  content/types.ts         Content shapes
  App.tsx, main.tsx        Section order, scroll reveals, spotlight, off-screen pausing
  lib.ts                   Dates, hash routing, events
  hooks/                   useHash, useMediaQuery, useInView
  components/
    board/                 Hero circuit board (geometry, SVG layers, interactions)
    Nav.tsx                Sidebar sheet index + title block, phone strip, drawing frame
    CommandPalette.tsx     Ctrl/⌘ K palette
    CaseStudy.tsx          Case-study dialog
    FlowDiagram.tsx        Expandable block diagram
    StatusTag.tsx          Approval / simulated-data labels
    Slots.tsx              Highlights [bracketed] gaps
    Boot.tsx, Footer.tsx, SectionHeader.tsx, LinkButton.tsx
  sections/                Hero, Projects, Experience, Approach, Lab, About, Contact
  lab/                     SignalLab (lazy-loaded), ArchExplorer (example system figure)
  styles/                  tokens, base, ui, hero, sections, lab, overlays
docs/CONTENT-CHECKLIST.md  What Zeeshan needs to confirm
```
