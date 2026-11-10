import { useMemo, useState } from "react";
import type { DiagramEdge, DiagramNode } from "../content/types";
import { Slots } from "./Slots";

const COL_W = 268;
const ROW_H = 120;
const NODE_W = 184;
const NODE_H = 76;
const PAD = 24;

/**
 * Small block diagram for a case study. Nodes are real buttons; selecting
 * one lights its connections and shows its role below.
 */
export function FlowDiagram({ nodes, edges, caption }: { nodes: DiagramNode[]; edges: DiagramEdge[]; caption: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const cols = Math.max(...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...nodes.map((n) => n.row)) + 1;
  const W = cols * COL_W - (COL_W - NODE_W) + PAD * 2;
  const H = rows * ROW_H - (ROW_H - NODE_H) + PAD * 2;

  const pos = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => (m[n.id] = { x: PAD + n.col * COL_W, y: PAD + n.row * ROW_H }));
    return m;
  }, [nodes]);

  const paths = edges.map((e) => {
    const a = pos[e.from];
    const b = pos[e.to];
    let d: string;
    let lx: number;
    let ly: number;
    if (a.y === b.y) {
      d = `M${a.x + NODE_W} ${a.y + NODE_H / 2}H${b.x}`;
      lx = (a.x + NODE_W + b.x) / 2;
      ly = a.y + NODE_H / 2 - 8;
    } else if (a.x === b.x) {
      d = `M${a.x + NODE_W / 2} ${a.y + NODE_H}V${b.y}`;
      lx = a.x + NODE_W / 2 + 8;
      ly = (a.y + NODE_H + b.y) / 2 + 4;
    } else {
      const mx = a.x + NODE_W + (b.x - a.x - NODE_W) / 2;
      d = `M${a.x + NODE_W} ${a.y + NODE_H / 2}H${mx}V${b.y + NODE_H / 2}H${b.x}`;
      lx = mx + 8;
      ly = (a.y + b.y + NODE_H) / 2 + 4;
    }
    const lit = active !== null && (e.from === active || e.to === active);
    return { e, d, lx, ly, lit, anchor: a.x === b.x || a.y !== b.y ? "start" : "middle" };
  });

  const current = nodes.find((n) => n.id === active) ?? null;

  return (
    <figure className={`flow${expanded ? " flow--xl" : ""}`}>
      <div className="flow__bar">
        <figcaption className="flow__cap">{caption}</figcaption>
        <button type="button" className="btn btn--ghost btn--sm" aria-pressed={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Collapse diagram" : "Expand diagram"}
        </button>
      </div>
      <div className="flow__scroll">
        <div className="flow__canvas" style={{ aspectRatio: `${W} / ${H}`, minWidth: expanded ? `${Math.round(W * 1.15)}px` : undefined }}>
          <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="flow__svg">
            <defs>
              <marker id="flow-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 8 4 0 8Z" style={{ fill: "var(--line-3)" }} />
              </marker>
              <marker id="flow-arrow-lit" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 8 4 0 8Z" style={{ fill: "var(--sig)" }} />
              </marker>
            </defs>
            {paths.map((p) => (
              <g key={`${p.e.from}-${p.e.to}`} className={`flow__edge${p.lit ? " is-lit" : ""}`}>
                <path d={p.d} markerEnd={p.lit ? "url(#flow-arrow-lit)" : "url(#flow-arrow)"} />
                <path d={p.d} className="flow__pulse" pathLength={100} />
                <text x={p.lx} y={p.ly} textAnchor={p.anchor as "start" | "middle"}>
                  {p.e.label}
                </text>
              </g>
            ))}
          </svg>
          {nodes.map((n) => {
            const a = pos[n.id];
            return (
              <button
                key={n.id}
                type="button"
                className="flow__node"
                aria-pressed={active === n.id}
                style={{
                  left: `${(a.x / W) * 100}%`,
                  top: `${(a.y / H) * 100}%`,
                  width: `${(NODE_W / W) * 100}%`,
                  height: `${(NODE_H / H) * 100}%`,
                }}
                onClick={() => setActive((c) => (c === n.id ? null : n.id))}
              >
                <span className="flow__label">{n.label}</span>
                <span className="flow__sub mono">{n.sub}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flow__detail" aria-live="polite">
        {current ? (
          <p>
            <strong>{current.label}.</strong> <Slots text={current.detail} />
          </p>
        ) : (
          <p className="flow__hint">Select a block to see its role and light its connections.</p>
        )}
      </div>
    </figure>
  );
}
