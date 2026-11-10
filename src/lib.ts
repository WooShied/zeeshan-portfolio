import { timelineNow } from "./content/site";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-08" → "Aug 2026"; "present" → "Present". */
export function formatMonth(ym: string): string {
  if (ym === "present") return "Present";
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function formatRange(start: string, end: string): string {
  return `${formatMonth(start)} – ${formatMonth(end)}`;
}

/** Months since year 0, for placing roles on the timeline axis. */
export function monthIndex(ym: string): number {
  const v = ym === "present" ? timelineNow : ym;
  const [y, m] = v.split("-").map(Number);
  return y * 12 + (m - 1);
}

/** Value for <time dateTime>. */
export function dateTimeAttr(ym: string): string {
  return ym === "present" ? timelineNow : ym;
}

/* ── Hash routing ───────────────────────────────────────────
   Deep links look like #projects/sensor-telemetry or #lab/signal.
   setHash() updates the URL and tells listeners without scrolling. */
export const HASH_EVENT = "zm:hash";

export function readHash(): { section: string; sub: string | null } {
  const raw = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  const [section, sub] = raw.split("/");
  return { section: section || "", sub: sub || null };
}

export function setHash(hash: string, mode: "push" | "replace" = "push") {
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  if (mode === "push") window.history.pushState({ zm: true }, "", url);
  else window.history.replaceState({ zm: true }, "", url);
  window.dispatchEvent(new Event(HASH_EVENT));
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Smooth-scroll to a section (instant under reduced motion). */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

/** Go to a section: update the URL, scroll, and move focus to its heading. */
export function goToSection(id: string, sub?: string) {
  setHash(id === "top" ? "#top" : `#${id}${sub ? `/${sub}` : ""}`);
  scrollToId(id);
  const el = document.getElementById(id);
  const heading = el?.querySelector<HTMLElement>("h1, h2");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

/* ── Cross-component events ─────────────────────────────── */
export const EV = {
  palette: "zm:palette",
  inspect: "zm:inspect",
} as const;

export function emit(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
