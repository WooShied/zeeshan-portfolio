import { useCallback, useEffect, useRef, useState } from "react";
import { boardMap } from "../../content/site";
import { EV, goToSection } from "../../lib";
import { useFinePointer, useInView, useReducedMotion } from "../../hooks";
import { ANCHORS, COMP_NET, VB } from "./geometry";
import { Copper, Parts, Substrate } from "./BoardLayers";
import { ArrowIcon } from "../LinkButton";

type CompId = (typeof boardMap)[number]["id"];

const LAYERS = [
  { key: "L1", name: "Substrate & silkscreen" },
  { key: "L2", name: "Copper · signal routing" },
  { key: "L3", name: "Components" },
];

/**
 * The hero circuit board. Hover/focus a component to trace its signals,
 * select it to read where it leads, or open "Inspect system" to separate
 * the layers. Every action is also available from the legend below the board.
 */
export function Board() {
  const [selected, setSelected] = useState<CompId | null>(null);
  const [preview, setPreview] = useState<CompId | null>(null);
  const [inspect, setInspect] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const onScreen = useInView(rootRef);

  const active = preview ?? selected;
  const lit = active ? COMP_NET[active] : null;
  const current = boardMap.find((c) => c.id === selected) ?? null;

  // Pointer parallax + light: CSS variables only, no re-render.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !fine || reduce) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      stage.style.setProperty("--px", px.toFixed(3));
      stage.style.setProperty("--py", py.toFixed(3));
      stage.style.setProperty("--lx", `${((px + 1) * 50).toFixed(1)}%`);
      stage.style.setProperty("--ly", `${((py + 1) * 50).toFixed(1)}%`);
    };
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      px = 0;
      py = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduce]);

  const toggleInspect = useCallback(() => setInspect((v) => !v), []);

  // Command palette / shortcuts can toggle inspect mode.
  useEffect(() => {
    const on = () => {
      setInspect((v) => !v);
      document.getElementById("top")?.scrollIntoView({ block: "start" });
    };
    window.addEventListener(EV.inspect, on);
    return () => window.removeEventListener(EV.inspect, on);
  }, []);

  // Escape: exit inspect first, then clear the selection.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (inspect) setInspect(false);
    else if (selected) setSelected(null);
  };

  const select = (id: CompId) => setSelected((cur) => (cur === id ? null : id));

  return (
    <div
      className="board"
      ref={rootRef}
      data-inspect={inspect || undefined}
      data-lit={lit ?? undefined}
      data-paused={!onScreen || undefined}
      onKeyDown={onKeyDown}
    >
      <div className="board__toolbar">
        <p className="board__hint mono">
          <span className="led-dot" aria-hidden="true" />
          {inspect ? "Exploded view · 3 layers" : fine ? "Hover to trace · click to select" : "Tap a numbered pin"}
        </p>
        <button type="button" className="btn btn--ghost btn--sm" aria-pressed={inspect} onClick={toggleInspect}>
          <svg viewBox="0 0 16 16" aria-hidden="true" className="btn__icon">
            <path d="M2 6 8 3l6 3-6 3-6-3Zm0 4 6 3 6-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          {inspect ? "Exit inspect" : "Inspect system"}
        </button>
      </div>

      <div className="stage" ref={stageRef}>
        <div className="rig">
          <div className="layer layer--l1">
            <Substrate />
            <div className="sheen" aria-hidden="true" />
          </div>
          <div className="layer layer--l2">
            <Copper />
          </div>
          <div className="layer layer--l3" data-active={active ?? undefined}>
            <Parts />
          </div>
          <div className="layer layer--hs">
            {boardMap.map((c, i) => {
              const a = ANCHORS[c.id];
              return (
                <div
                  key={c.id}
                  className="hs"
                  style={{ left: `${(a.x / VB.w) * 100}%`, top: `${(a.y / VB.h) * 100}%` }}
                  data-active={active === c.id || undefined}
                >
                  <button
                    type="button"
                    className="hs__btn"
                    aria-pressed={selected === c.id}
                    aria-label={`${c.ref} ${c.name}: ${c.sectionLabel}`}
                    onClick={() => select(c.id)}
                    onPointerEnter={() => fine && setPreview(c.id)}
                    onPointerLeave={() => setPreview(null)}
                    onFocus={() => setPreview(c.id)}
                    onBlur={() => setPreview(null)}
                  >
                    <span className="hs__num mono" aria-hidden="true">
                      {i + 1}
                    </span>
                  </button>
                  <span className="hs__label" aria-hidden="true">
                    <span className="mono hs__ref">{c.ref}</span>
                    <span className="hs__name">{c.name}</span>
                    <span className="mono hs__to">→ {c.sectionLabel}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <ol className="stack-key mono" aria-hidden={!inspect}>
          {[...LAYERS].reverse().map((l) => (
            <li key={l.key}>
              <span className="stack-key__k">{l.key}</span>
              {l.name}
            </li>
          ))}
        </ol>
      </div>

      {/* Readout: what the selected component leads to. */}
      <div className="readout" aria-live="polite">
        {current ? (
          <div className="readout__body" key={current.id}>
            <p className="readout__ref mono">
              <span className="led-dot led-dot--on" aria-hidden="true" />
              {current.ref} · {current.name}
            </p>
            <p className="readout__blurb">{current.blurb}</p>
            <button type="button" className="btn btn--sig btn--sm" onClick={() => goToSection(current.section)}>
              Open {current.sectionLabel}
              <ArrowIcon className="btn__icon btn__icon--r" />
            </button>
          </div>
        ) : (
          <p className="readout__idle">
            Each component maps to a part of the portfolio. Select one on the board or from the legend.
          </p>
        )}
      </div>

      {/* Legend: the same five components as plain, accessible controls. */}
      <ol className="legend" aria-label="Board components">
        {boardMap.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              className="legend__item"
              aria-pressed={selected === c.id}
              onClick={() => select(c.id)}
              onPointerEnter={() => fine && setPreview(c.id)}
              onPointerLeave={() => setPreview(null)}
            >
              <span className="legend__num mono" aria-hidden="true">
                {i + 1}
              </span>
              <span className="legend__txt">
                <span className="legend__name">{c.name}</span>
                <span className="legend__to mono">
                  {c.ref} → {c.sectionLabel}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
