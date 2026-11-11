# Zeeshan Malik · portfolio (review draft)

A single-page portfolio drawn as an **engineering drawing set**. Each section is a numbered sheet, the hero is a real-time 3D mapping drone with balloons and a bill of materials, and the lab is a live LiDAR mapping simulation, and every part of the drone leads to a sheet. Light ("paper") and dark ("graphite") themes.

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
- **The drone is the navigation.** A real-time 3D model (three.js, physically based materials, studio lighting, soft shadows) in a hard-edged defence-hardware style: faceted matte hull, blade arms, octagonal nacelles, a gimbal camera ball. Flight controller → About, Blackbox logger → Experience, Gimbal camera → Projects, Debug port → LiDAR lab, Telemetry radio → Contact. Hovering a part x-rays the hull and lights its wiring; drag to orbit. "Inspect system" tears the airframe down: hull lifts, arms slide out, avionics stack apart, battery drops, wiring stretches between parts. The SVG drawing shows instantly and stays if WebGL is unavailable.
- **Light and dark.** A toggle in the sidebar (or the phone strip, or the command palette) switches between graphite and drafting paper. The choice is remembered; first visits follow the device setting. The oscilloscope stays a dark instrument screen in both.
- **Small touches.** Sheet icons in the index and palette, a copy-link button on every sheet title, a status strip under the drone (view, selection, rotors, theme), channel icons on the contact pinout, a revision date in the title block from the build date, a quadrotor favicon and a preflight-check startup sequence.
- **Type.** IBM Plex throughout, like a datasheet: Plex Sans Condensed for titles, Plex Sans for reading, Plex Mono for labels.
- **Colour.** Graphite, warm off-white, cyan for linework and live signal, amber only for status and draft labels.

## Interactive features

| Feature | Where | Notes |
|---|---|---|
| Interactive 3D drone | Sheet 01 | Drag to orbit, hover to x-ray and light wiring, click a part or balloon to select, BOM table with the same five controls, "Go to sheet" readout, status strip, Escape to clear; SVG fallback |
| Inspect system (teardown) | Sheet 01, command palette | Animated 3D teardown with every part labelled; reassembles on a second press or Escape |
| Light / dark mode | Sidebar, phone strip, command palette | Remembered per browser; defaults to the device setting; no flash on load |
| Copy link to a sheet | Every sheet title | Copies a direct link; confirms with a check mark |
| Drawing register | Sheet 02 | Area filters with counts, keyword search, live count, empty state |
| Case studies | Sheet 02 | Native modal dialog, deep links (`#projects/<slug>`), section index that tracks reading, expandable architecture diagram, decision panels, prev/next |
| Logic-analyzer experience | Sheet 03 | One channel per role, high while active; A/B cursors mark the selected role; decode panel; arrow keys / Home / End; deep links (`#experience/<role>`) |
| Example system figure | Sheet 04 | Clickable sensor → controller → comms → host diagram with telemetry and command paths (placeholder demonstration) |
| LiDAR mapping lab | Sheet 05 | A 16/32/64-channel spinning LiDAR on a drone flies a generated city; every ray is traced against the scene, registered with the drone pose and voxel-fused (20 cm) into a growing point cloud. Colour by height, intensity, range or class; orbit, chase or top-down camera; flight speed, point size, laser fan and flight path toggles; live HUD (points, rays/s, pose, FPS); Pause, Reset |
| Connector pinout | Sheet 07 | LinkedIn connected; email, GitHub and résumé shown as NC (not connected) until supplied |
| Command palette | `Ctrl/⌘ K`, `/`, or Search | Sections, projects, roles, links, actions; full keyboard support |
| Startup sequence | First visit | About 1.5 s, once per session, skipped by any key or click, never with reduced motion or a deep link |

The LiDAR lab is labelled `Interactive demo · Simulated data.` The example system figure is labelled `Placeholder demonstration · Awaiting Zeeshan approval.`

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
| What each drone part links to | `boardMap` |
| Portrait | put the photo in `public/` and set `about.portrait.src` (e.g. `"./zeeshan.jpg"`) |
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
- Every drone balloon, diagram node, and filter is a real `<button>`; the bill of materials offers the same actions as plain buttons.
- Dialogs use native `<dialog>` (focus is trapped, Escape closes, focus returns to what opened it). Browser Back also closes a case study.
- Reduced motion: no parallax, trace pulses, rotor spin or startup sequence; the LiDAR lab starts paused and the drone does not orbit or spin (both still work on request); reveals are instant.
- Content is never hidden behind animation: reveals fall back to visible after 1.2 s, and a `<noscript>` block lists the supplied experience and LinkedIn.
- The 3D drone loads after first paint (when the browser is idle; skipped with Save-Data). The LiDAR lab loads only when you scroll near it. Both share one deferred three.js chunk, cap pixel ratio, and stop rendering when off-screen or when the tab is hidden. Animation pauses when its section is off-screen (canvas loops, CSS pulses, board effects).
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
  theme.ts                 Light/dark switching
  hooks/                   useHash, useMediaQuery, useInView
  components/
    board/                 Hero: Board.tsx (interactions, balloons), SVG fallback drawing (geometry.ts, BoardLayers.tsx)
    drone3d/               3D drone: DroneScene.ts (model, materials, teardown), textures.ts, Drone3D.tsx (lazy wrapper)
    Icons.tsx              Line icons (sheets, contact channels, theme)
    Nav.tsx                Sidebar sheet index + title block, phone strip, drawing frame
    CommandPalette.tsx     Ctrl/⌘ K palette
    CaseStudy.tsx          Case-study dialog
    FlowDiagram.tsx        Expandable block diagram
    StatusTag.tsx          Approval / simulated-data labels
    Slots.tsx              Highlights [bracketed] gaps
    Boot.tsx, Footer.tsx, SectionHeader.tsx, LinkButton.tsx
  sections/                Hero, Projects, Experience, Approach, Lab, About, Contact
  lab/                     LidarLab.tsx + lidar/ (world.ts = city + ray tracer, LidarScene.ts = renderer), ArchExplorer (example figure)
  styles/                  tokens, base, ui, hero, sections, lab, overlays
docs/CONTENT-CHECKLIST.md  What Zeeshan needs to confirm
```
