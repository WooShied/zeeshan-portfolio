/**
 * Content types. Components only read these shapes, so content can change
 * without touching any visual code.
 *
 * Every piece of copy that Zeeshan has not confirmed carries a `status`:
 *   "placeholder" → draft or inferred. Shows "Placeholder · Awaiting Zeeshan approval" beside it.
 *   "supplied"    → came from a supplied source (LinkedIn). Shown as fact, no label.
 *   "approved"    → Zeeshan confirmed this specific item. Label disappears for that item only.
 */
export type Status = "placeholder" | "supplied" | "approved";

/** A piece of text with its own approval status. */
export interface Copy {
  text: string;
  status: Status;
}

/** A link that may not exist yet. `href: null` renders as a clearly unavailable item. */
export interface LinkItem {
  id: string;
  label: string;
  href: string | null;
  /** Shown when href is null, e.g. "Email not supplied yet". */
  unavailableNote?: string;
  status: Status;
}

export interface Role {
  id: string;
  company: string;
  title: string;
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM" or "present" */
  end: string;
  employmentType: string;
  /** null when no location was supplied. */
  location: string | null;
  workplace?: string;
  /** Draft description. Keep the [bracketed] gaps until Zeeshan fills them. */
  description: Copy;
}

export interface SkillGroup {
  id: string;
  name: string;
  items: string[];
  status: Status;
}

export interface Principle {
  id: string;
  title: string;
  body: string;
  status: Status;
}

export interface DiagramNode {
  id: string;
  label: string;
  sub: string;
  /** Grid column (0-based, left to right). */
  col: number;
  /** Grid row (0-based, top to bottom). */
  row: number;
  detail: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label: string;
}

export interface Decision {
  title: string;
  detail: string;
}

export interface Project {
  /** Used in deep links: #projects/<slug> */
  slug: string;
  title: string;
  /** "illustrative" shows the "not a verified Zeeshan project" banner. */
  kind: "illustrative" | "verified";
  status: Status;
  index: string;
  summary: string;
  /** Filter tags. Must match ids in `projectFilters`. */
  tags: string[];
  problem: string;
  contribution: string;
  architecture: {
    caption: string;
    nodes: DiagramNode[];
    edges: DiagramEdge[];
  };
  stack: { hardware: string[]; software: string[] };
  constraints: string[];
  decisions: Decision[];
  validation: string;
  results: string;
  lessons: string;
  links: LinkItem[];
}

export interface FilterDef {
  id: string;
  label: string;
}

export interface ArchNode {
  id: string;
  label: string;
  kind: string;
  role: string;
  /** Position in the 1000 × 420 diagram space. */
  x: number;
  y: number;
}

export interface ArchPath {
  id: string;
  label: string;
  description: string;
  /** Ordered node ids. */
  nodes: string[];
  /** Link labels between consecutive nodes. */
  links: string[];
}
