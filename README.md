# Zeeshan Malik · portfolio (review draft)

A single-page portfolio built around one idea: **exploring an embedded system**. The hero is a circuit board whose components are the site's sections, and every section borrows from the same instrument language: memory addresses, datasheets, scopes, and block diagrams.

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

- **The board is the navigation.** Processor → About, Memory → Experience, I/O → Projects, Debug → Lab, Comms → Contact. Hovering or focusing a part lights its copper traces; selecting it shows where it leads. "Inspect system" separates the board into three layers (substrate, copper, components) with labels that stand up off the board.
- **One signal colour.** Graphite surfaces, warm off-white type, a restrained cyan for live signals, amber only for status and draft labels.
- **Type.** Hanken Grotesk for reading, Instrument Serif italics for editorial accents, IBM Plex Mono for technical labels.
- **Each section has its own instrument.** Experience is a memory map, Approach is a schematic list and a parts list, the Lab is a bench with probe channels, About is a datasheet page, Contact is a comms panel.

## Interactive features

| Feature | Where | Notes |
|---|---|---|
| Interactive circuit board | Hero | Pointer parallax and moving light (desktop), trace illumination, numbered hotspots, selection readout, legend with the same five controls, Escape to clear |
| Inspect system (exploded view) | Hero toolbar, command palette | 3D layer separation with standing labels; flat fallback without 3D support |
| Project explorer | Projects | Area filters with counts, keyword search, live result count, empty state |
| Case studies | Projects | Native modal dialog, deep links (`#projects/<slug>`), section index that tracks your reading, expandable architecture diagram with selectable blocks, decision panels, prev/next |
| Experience timeline | Experience | Time-axis bars, memory-map rows (arrow keys / Home / End), detail panel; accordion on phones; deep links (`#experience/<role>`) |
| Signal lab | Lab → CH1 | Frequency, sample rate, noise, waveform, reconstruction mode; live scope + DFT; Nyquist/aliasing readouts; Pause, Reset |
| Task scheduler | Lab → CH2 | Rate-monotonic vs earliest-deadline-first, per-task period and cost, utilization vs RM bound, deadline misses, Pause, Reset |
| Architecture explorer | Lab → CH3 | Clickable sensor → controller → comms → host diagram; telemetry and command paths |
| Command palette | `Ctrl/⌘ K`, `/`, or the Search button | Sections, projects, roles, lab instruments, links, actions; full keyboard support |
| Section tracking | Top bar, right rail | Sliding indicator, address readout, scroll-progress line, pin-header rail |
| Startup sequence | First visit | About 1.5 s, once per session, skipped by any key or click, never shown with reduced motion or a deep link |

All lab instruments are labelled `Interactive demo · Simulated data.` The architecture explorer is labelled `Placeholder demonstration · Awaiting Zeeshan approval.`

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
- Reduced motion: no parallax, trace pulses, or startup sequence; instruments start paused (Run still works); reveals are instant.
- Content is never hidden behind animation: reveals fall back to visible after 1.2 s, and a `<noscript>` block lists the supplied experience and LinkedIn.
- The lab code loads only when you scroll near it. Animation pauses when its section is off-screen (canvas loops, CSS pulses, board effects).
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
    Nav.tsx                Top bar + right rail
    CommandPalette.tsx     Ctrl/⌘ K palette
    CaseStudy.tsx          Case-study dialog
    FlowDiagram.tsx        Expandable block diagram
    StatusTag.tsx          Approval / simulated-data labels
    Slots.tsx              Highlights [bracketed] gaps
    Boot.tsx, Footer.tsx, SectionHeader.tsx, LinkButton.tsx
  sections/                Hero, Projects, Experience, Approach, Lab, About, Contact
  lab/                     SignalLab, SchedulerLab, ArchExplorer (lazy-loaded)
  styles/                  tokens, base, ui, hero, sections, lab, overlays
docs/CONTENT-CHECKLIST.md  What Zeeshan needs to confirm
```
