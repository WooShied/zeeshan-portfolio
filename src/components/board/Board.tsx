import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { boardMap, sections } from "../../content/site";
import { EV, goToSection } from "../../lib";
import { useFinePointer, useInView, useReducedMotion } from "../../hooks";
import { ANCHORS, COMP_NET, VB } from "./geometry";
import { AvionicsLayer, FrameLayer, ShellLayer } from "./BoardLayers";
import { ArrowIcon } from "../LinkButton";
import { useTheme } from "../../theme";
import type { PartId, ScreenPoint } from "../drone3d/DroneScene";

const Drone3D = lazy(() => import("../drone3d/Drone3D"));

type CompId = (typeof boardMap)[number]["id"];

/** How high each label stands above its part in the CSS exploded view. */
const LIFT: Record<string, number> = { cpu: 40, mem: 26, io: 34, dbg: 26, rf: 30 };
/** Preferred balloon direction (screen space) for parts near the centre. */
const DIR: Record<string, [number, number]> = { cpu: [-0.85, -0.55], mem: [1, -0.15], io: [-0.3, 1], dbg: [-1, 0.1], rf: [0.2, -1] };

const LAYERS = [
  { key: "L1", name: "Frame & battery" },
  { key: "L2", name: "Avionics & wiring" },
  { key: "L3", name: "Canopy & rotors" },
];

/**
 * The hero drone. A lit 3D model loads after first paint (the SVG drawing
 * shows until then, and stays if WebGL is unavailable). Hover or focus a
 * part to x-ray the shell and light its wiring, select it to read where it
 * leads, or "Inspect system" to tear the airframe down. Every action is also
 * available from the bill of materials.
 */
export function Board({ children }: { children?: ReactNode }) {
  const [selected, setSelected] = useState<CompId | null>(null);
  const [preview, setPreview] = useState<CompId | null>(null);
  const [inspect, setInspect] = useState(false);
  const [want3d, setWant3d] = useState(false);
  const [is3d, setIs3d] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const onScreen = useInView(rootRef);
  const theme = useTheme();

  const active = preview ?? selected;
  const lit = active ? COMP_NET[active] : null;
  const current = boardMap.find((c) => c.id === selected) ?? null;

  // Load the 3D model once the page has painted and the browser is idle.
  useEffect(() => {
    const save = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (save) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const start = () => setWant3d(true);
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start, { timeout: 1200 });
      return () => (window as Window & { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(start, 400);
    return () => window.clearTimeout(t);
  }, []);

  // Pointer parallax + light for the SVG fallback: CSS variables only.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !fine || reduce || is3d) return;
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
  }, [fine, reduce, is3d]);

  const toggleInspect = useCallback(() => setInspect((v) => !v), []);

  useEffect(() => {
    const on = () => {
      setInspect((v) => !v);
      document.getElementById("top")?.scrollIntoView({ block: "start" });
    };
    window.addEventListener(EV.inspect, on);
    return () => window.removeEventListener(EV.inspect, on);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (inspect) setInspect(false);
    else if (selected) setSelected(null);
  };

  const select = (id: CompId) => setSelected((cur) => (cur === id ? null : id));

  /** 3D mode: place balloons and leader lines from projected part positions. */
  const placeBalloons = useCallback((pts: Record<PartId, ScreenPoint>, centre: { x: number; y: number }) => {
    const stage = stageRef.current;
    if (!stage) return;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const svg = stage.querySelector<SVGSVGElement>(".leaders");
    svg?.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const reach = Math.max(46, Math.min(78, W * 0.09));
    for (const id of Object.keys(pts) as PartId[]) {
      const p = pts[id];
      let dx = p.x - centre.x;
      let dy = p.y - centre.y;
      const len = Math.hypot(dx, dy);
      // the flight controller sits on the centre line, so it always uses its preferred side
      if (len < 40 || id === "cpu") [dx, dy] = DIR[id];
      else {
        dx /= len;
        dy /= len;
      }
      const bx = Math.min(W - 18, Math.max(18, p.x + dx * reach));
      const by = Math.min(H - 18, Math.max(18, p.y + dy * reach));
      const hs = stage.querySelector<HTMLElement>(`.hs[data-id="${id}"]`);
      if (hs) {
        hs.style.left = `${bx.toFixed(1)}px`;
        hs.style.top = `${by.toFixed(1)}px`;
        hs.dataset.side = bx > W * 0.62 ? "left" : "right";
      }
      const g = svg?.querySelector(`.leader[data-id="${id}"]`);
      const line = g?.querySelector("line");
      const dot = g?.querySelector("circle");
      line?.setAttribute("x1", bx.toFixed(1));
      line?.setAttribute("y1", by.toFixed(1));
      line?.setAttribute("x2", p.x.toFixed(1));
      line?.setAttribute("y2", p.y.toFixed(1));
      dot?.setAttribute("cx", p.x.toFixed(1));
      dot?.setAttribute("cy", p.y.toFixed(1));
    }
  }, []);

  return (
    <div
      className="board"
      ref={rootRef}
      data-inspect={inspect || undefined}
      data-lit={lit ?? undefined}
      data-paused={!onScreen || undefined}
      data-3d={is3d || undefined}
      onKeyDown={onKeyDown}
    >
      <div className="hero-grid">
        <div className="hero-left">
          {children}

          <div className="board__panel">
            <p className="bom__k mono">Bill of materials</p>
            <div className="bom__head mono" aria-hidden="true">
              <span>Item</span>
              <span>Ref</span>
              <span>Part</span>
              <span>Sheet</span>
            </div>
            <ol className="bom" aria-label="Drone parts">
              {boardMap.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="bom__row"
                    aria-pressed={selected === c.id}
                    onClick={() => select(c.id)}
                    onPointerEnter={() => fine && setPreview(c.id)}
                    onPointerLeave={() => setPreview(null)}
                  >
                    <span className="bom__item mono" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="bom__ref mono">{c.ref}</span>
                    <span className="bom__part">
                      {c.name}
                      <span className="bom__to">{c.sectionLabel}</span>
                    </span>
                    <span className="bom__sheet mono">{sections.find((s) => s.id === c.section)?.sheet}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <figure className="board__fig">
          <div className="board__toolbar">
            <p className="board__hint mono">
              <span className="led-dot" aria-hidden="true" />
              {inspect ? "Teardown · parts separated" : is3d && fine ? "Drag to rotate · hover to trace" : fine ? "Hover to trace · click to select" : "Tap a numbered balloon"}
            </p>
            <button type="button" className="btn btn--sm" aria-pressed={inspect} onClick={toggleInspect}>
              <svg viewBox="0 0 16 16" aria-hidden="true" className="btn__icon">
                <path d="M2 6 8 3l6 3-6 3-6-3Zm0 4 6 3 6-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="miter" />
              </svg>
              {inspect ? "Reassemble" : "Inspect system"}
            </button>
          </div>

          <div className="stage-wrap">
            <span className="dim dim--h mono" aria-hidden="true">
              <span>520 · motor to motor</span>
            </span>
            <span className="dim dim--v mono" aria-hidden="true">
              <span>420</span>
            </span>
            <div className="stage" ref={stageRef}>
              {want3d ? (
                <Suspense fallback={null}>
                  <Drone3D
                    active={active as PartId | null}
                    inspect={inspect}
                    reduce={reduce}
                    coarse={!fine}
                    onHover={(id) => setPreview(id)}
                    onSelect={(id) => select(id)}
                    onFrame={placeBalloons}
                    onReady={setIs3d}
                  />
                </Suspense>
              ) : null}
              <div className="rig">
                <div className="layer layer--l1">
                  <FrameLayer />
                  <div className="sheen" aria-hidden="true" />
                </div>
                <div className="layer layer--l2" data-active={active ?? undefined}>
                  <AvionicsLayer />
                </div>
                <div className="layer layer--l3">
                  <ShellLayer />
                </div>
                <div className="layer layer--hs">
                  <svg className="leaders" viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="true">
                    {boardMap.map((c) => {
                      const a = ANCHORS[c.id];
                      return (
                        <g key={c.id} className="leader" data-id={c.id} data-active={active === c.id || undefined}>
                          <line x1={a.x} y1={a.y} x2={a.tx} y2={a.ty} />
                          <circle cx={a.tx} cy={a.ty} r="4" />
                        </g>
                      );
                    })}
                  </svg>
                  {boardMap.map((c, i) => {
                    const a = ANCHORS[c.id];
                    return (
                      <div
                        key={c.id}
                        className="hs"
                        data-id={c.id}
                        style={
                          is3d
                            ? ({ ["--lift" as string]: `${LIFT[c.id] ?? 30}px` } as React.CSSProperties)
                            : {
                                left: `${(a.x / VB.w) * 100}%`,
                                top: `${(a.y / VB.h) * 100}%`,
                                ["--lift" as string]: `${LIFT[c.id] ?? 30}px`,
                              }
                        }
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
          </div>

          <div className="readout" aria-live="polite">
            {current ? (
              <div className="readout__body" key={current.id}>
                <p className="readout__ref mono">
                  {current.ref} · {current.name}
                </p>
                <p className="readout__blurb">{current.blurb}</p>
                <button type="button" className="btn btn--sig btn--sm" onClick={() => goToSection(current.section)}>
                  Go to sheet {sections.find((s) => s.id === current.section)?.sheet} · {current.sectionLabel}
                  <ArrowIcon className="btn__icon btn__icon--r" />
                </button>
              </div>
            ) : (
              <ul className="status mono" aria-label="Viewer status">
                <li>
                  <span className="status__k">View</span>
                  <span className="status__v">{inspect ? "Teardown" : is3d ? "3D · live" : "Plan"}</span>
                </li>
                <li>
                  <span className="status__k">Selected</span>
                  <span className="status__v">None</span>
                </li>
                <li>
                  <span className="status__k">Rotors</span>
                  <span className="status__v">
                    <span className={`status__led${reduce ? "" : inspect ? " is-armed" : " is-idle"}`} aria-hidden="true" />
                    {reduce ? "Still" : inspect ? "Spooled down" : "Hover"}
                  </span>
                </li>
                <li>
                  <span className="status__k">Theme</span>
                  <span className="status__v">{theme === "light" ? "Paper" : "Graphite"}</span>
                </li>
              </ul>
            )}
          </div>
          <figcaption className="board__cap mono">Fig. 1 · ZM-Q1 mapping quadrotor · select a part or open the teardown</figcaption>
        </figure>
      </div>
    </div>
  );
}
