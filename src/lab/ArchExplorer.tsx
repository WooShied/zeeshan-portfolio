import { useMemo, useState } from "react";
import { archNodes, archPaths } from "../content/site";
import { StatusTag } from "../components/StatusTag";

const W = 1000;
const H = 420;
const NODE_W = 150;
const NODE_H = 76;

/**
 * Example device architecture. Select a node to see its role and light
 * every data path through it, or pick a path directly.
 */
export function ArchExplorer() {
  const [node, setNode] = useState<string | null>("mcu");
  const [path, setPath] = useState<string | null>(null);

  const byId = useMemo(() => Object.fromEntries(archNodes.map((n) => [n.id, n])), []);

  // Paths lit by the current selection.
  const litPaths = path ? [path] : node ? archPaths.filter((p) => p.nodes.includes(node)).map((p) => p.id) : [];

  // One drawn segment per path hop; shared hops get parallel lanes.
  const segments = archPaths.flatMap((p, pi) =>
    p.nodes.slice(0, -1).map((from, i) => {
      const to = p.nodes[i + 1];
      const a = byId[from];
      const b = byId[to];
      const shared = archPaths.some(
        (q) => q.id !== p.id && q.nodes.some((x, k) => k < q.nodes.length - 1 && ((x === from && q.nodes[k + 1] === to) || (x === to && q.nodes[k + 1] === from))),
      );
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const off = shared ? (pi === 0 ? -9 : 9) : 0;
      // perpendicular offset that stays on the same side regardless of direction
      const sign = dx < 0 || (dx === 0 && dy < 0) ? -1 : 1;
      const ox = (-dy / len) * off * sign;
      const oy = (dx / len) * off * sign;
      return {
        key: `${p.id}-${i}`,
        path: p.id,
        d: `M${a.x + ox} ${a.y + oy}L${b.x + ox} ${b.y + oy}`,
        label: p.links[i],
        lx: (a.x + b.x) / 2 + (shared ? 0 : -dy / len * 18),
        ly: (a.y + b.y) / 2 + (shared ? (pi === 0 ? -18 : 30) : dx / len * 4 - 6),
      };
    }),
  );

  const current = node ? byId[node] : null;
  const onPaths = current ? archPaths.filter((p) => p.nodes.includes(current.id)) : [];

  return (
    <div className="lab-panel arch">
      <div className="lab-panel__head">
        <div>
          <h3 className="lab-panel__title">System architecture explorer</h3>
          <p className="lab-panel__sub">
            An example device: a sensor, a controller, a communication interface and a host application. Select a block to
            trace its data paths.
          </p>
        </div>
        <StatusTag kind="demo" />
      </div>

      <div className="arch__paths" role="group" aria-label="Highlight a data path">
        {archPaths.map((p) => (
          <button
            key={p.id}
            type="button"
            className="chip"
            aria-pressed={path === p.id}
            onClick={() => {
              setPath((c) => (c === p.id ? null : p.id));
              setNode(null);
            }}
          >
            {p.label} path
          </button>
        ))}
      </div>

      <div className="arch__scroll">
        <div className="arch__canvas" style={{ aspectRatio: `${W} / ${H}` }}>
          <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="arch__svg">
            {segments.map((s) => {
              const lit = litPaths.includes(s.path);
              return (
                <g key={s.key} className={`arch__seg arch__seg--${s.path}${lit ? " is-lit" : ""}`}>
                  <path d={s.d} className="arch__wire" />
                  <path d={s.d} className="arch__pulse" pathLength={100} />
                  <text x={s.lx} y={s.ly} textAnchor="middle">
                    {s.label}
                  </text>
                </g>
              );
            })}
          </svg>
          {archNodes.map((n) => {
            const lit = litPaths.some((pid) => archPaths.find((p) => p.id === pid)!.nodes.includes(n.id));
            return (
              <button
                key={n.id}
                type="button"
                className="arch__node"
                data-lit={lit || undefined}
                aria-pressed={node === n.id}
                style={{
                  left: `${((n.x - NODE_W / 2) / W) * 100}%`,
                  top: `${((n.y - NODE_H / 2) / H) * 100}%`,
                  width: `${(NODE_W / W) * 100}%`,
                  height: `${(NODE_H / H) * 100}%`,
                }}
                onClick={() => {
                  setNode((c) => (c === n.id ? null : n.id));
                  setPath(null);
                }}
              >
                <span className="arch__kind mono">{n.kind}</span>
                <span className="arch__label">{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="arch__detail" aria-live="polite">
        {path ? (
          (() => {
            const p = archPaths.find((x) => x.id === path)!;
            return (
              <>
                <p className="arch__dk mono">{p.label} path</p>
                <p>{p.description}</p>
                <ol className="arch__hops mono">
                  {p.nodes.map((id, i) => (
                    <li key={id}>
                      {byId[id].label}
                      {i < p.links.length ? <span className="arch__via"> —{p.links[i]}→ </span> : null}
                    </li>
                  ))}
                </ol>
              </>
            );
          })()
        ) : current ? (
          <>
            <p className="arch__dk mono">
              {current.kind} · {current.label}
            </p>
            <p>{current.role}</p>
            <p className="arch__on mono">
              On {onPaths.length ? onPaths.map((p) => p.label.toLowerCase()).join(" and ") : "no"} path
              {onPaths.length === 1 ? "" : "s"}
            </p>
          </>
        ) : (
          <p className="arch__hint">Select a block or a path.</p>
        )}
      </div>
    </div>
  );
}
