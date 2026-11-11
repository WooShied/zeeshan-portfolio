import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion, useFinePointer } from "../hooks";
import { StatusTag } from "../components/StatusTag";
import type { ColorMode, LidarScene, LidarSettings, LidarStats, ViewMode } from "./lidar/LidarScene";

const DEFAULTS: LidarSettings = {
  beams: 32,
  color: "height",
  view: "orbit",
  pointSize: 2.2,
  speed: 5,
  showBeams: true,
  showPath: true,
};

const LEGEND: Record<ColorMode, { label: string; stops: string; lo: string; hi: string }> = {
  height: { label: "Height", stops: "turbo", lo: "0 m", hi: "24 m" },
  range: { label: "Range", stops: "turbo-rev", lo: "62 m", hi: "0 m" },
  intensity: { label: "Intensity", stops: "inten", lo: "low", hi: "high" },
  class: { label: "Class", stops: "class", lo: "", hi: "" },
};

function webgl() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** The LiDAR mapping lab. Simulated data only. */
export default function LidarLab() {
  const host = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const engine = useRef<LidarScene | null>(null);
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const onScreen = useInView(wrap);
  const [s, setS] = useState<LidarSettings>(DEFAULTS);
  const [running, setRunning] = useState(!reduce);
  const [stats, setStats] = useState<LidarStats | null>(null);
  const [ok, setOk] = useState(true);
  const sRef = useRef(s);
  sRef.current = s;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (!webgl()) {
      setOk(false);
      return;
    }
    let disposed = false;
    import("./lidar/LidarScene").then(({ LidarScene }) => {
      if (disposed) return;
      try {
        const e = new LidarScene(el, sRef.current, { reduce, coarse: !fine, onStats: setStats });
        e.setRunning(!reduce);
        engine.current = e;
      } catch {
        setOk(false);
      }
    });
    const ro = new ResizeObserver(() => engine.current?.resize());
    ro.observe(el);
    return () => {
      disposed = true;
      ro.disconnect();
      engine.current?.dispose();
      engine.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => engine.current?.update(s), [s]);
  useEffect(() => engine.current?.setRunning(running), [running]);
  useEffect(() => {
    const vis = () => engine.current?.setPaused(!onScreen || document.hidden);
    vis();
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [onScreen]);

  const set = <K extends keyof LidarSettings>(k: K, v: LidarSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const reset = () => {
    setS(DEFAULTS);
    engine.current?.reset();
    setRunning(!reduce);
  };
  const leg = LEGEND[s.color];
  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="lab-panel lidar" ref={wrap}>
      <div className="lab-panel__head">
        <div>
          <h3 className="lab-panel__title">LiDAR mapping · live point cloud</h3>
          <p className="lab-panel__sub">
            A spinning LiDAR on a drone flies a city block. Every laser return is ray-traced, placed in the world using the
            drone’s pose, and fused into a 3D map as it flies.
          </p>
        </div>
        <StatusTag kind="simulated" />
      </div>

      <div className="lidar__screen">
        <div className="lidar__host" ref={host} aria-hidden="true" />
        {!ok ? (
          <p className="lidar__fallback">
            WebGL is not available in this browser, so the 3D point cloud can’t be drawn. The description below explains what
            it shows.
          </p>
        ) : null}

        <div className="lidar__hud lidar__hud--tl mono" aria-hidden="true">
          <p className="lidar__brand">
            <span className="led-dot led-dot--on" /> LIDAR · {s.beams} CH · 10 Hz · 0.5° AZ
          </p>
          <p>
            MAP <b>{stats ? fmt(stats.mapPoints) : "—"}</b> pts · VOXEL 0.20 m
          </p>
          <p>
            RAYS <b>{stats ? fmt(stats.raysPerSec) : "—"}</b> /s
          </p>
        </div>
        <div className="lidar__hud lidar__hud--tr mono" aria-hidden="true">
          <p>
            POSE {stats ? stats.x.toFixed(1) : "—"}, {stats ? stats.y.toFixed(1) : "—"}, {stats ? stats.z.toFixed(1) : "—"} m
          </p>
          <p>
            HDG {stats ? stats.yaw.toFixed(0).padStart(3, "0") : "—"}° · {stats ? stats.fps : "—"} FPS
          </p>
          <div className="lidar__cov" title="Map coverage">
            <span style={{ transform: `scaleX(${stats?.coverage ?? 0})` }} />
          </div>
        </div>
        <div className="lidar__legend mono" aria-hidden="true">
          <span className="lidar__legk">{leg.label}</span>
          {s.color === "class" ? (
            <span className="lidar__classes">
              <i style={{ background: "#6b665c" }} />
              Ground
              <i style={{ background: "#5fd4cc" }} />
              Building
              <i style={{ background: "#73d161" }} />
              Vegetation
              <i style={{ background: "#f2b04a" }} />
              Vehicle
              <i style={{ background: "#f2ede0" }} />
              Pole
            </span>
          ) : (
            <>
              <span>{leg.lo}</span>
              <span className={`lidar__ramp lidar__ramp--${leg.stops}`} />
              <span>{leg.hi}</span>
            </>
          )}
        </div>
        <div className="lidar__zoom">
          <button type="button" aria-label="Zoom in" onClick={() => engine.current?.zoomBy(0.8)}>
            +
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => engine.current?.zoomBy(1.25)}>
            −
          </button>
        </div>
        {fine && s.view === "orbit" ? <p className="lidar__drag mono">Drag to orbit</p> : null}
      </div>

      <div className="lidar__controls">
        <fieldset className="lidar__group">
          <legend className="ctl__lbl">Channels</legend>
          <div className="seg-bar">
            {([16, 32, 64] as const).map((b) => (
              <button key={b} type="button" className="seg-bar__btn" aria-pressed={s.beams === b} onClick={() => set("beams", b)}>
                {b}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="lidar__group">
          <legend className="ctl__lbl">Colour by</legend>
          <div className="seg-bar">
            {(["height", "intensity", "range", "class"] as ColorMode[]).map((c) => (
              <button key={c} type="button" className="seg-bar__btn" aria-pressed={s.color === c} onClick={() => set("color", c)}>
                {LEGEND[c].label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="lidar__group">
          <legend className="ctl__lbl">Camera</legend>
          <div className="seg-bar">
            {(
              [
                ["orbit", "Orbit"],
                ["chase", "Chase"],
                ["top", "Top-down"],
              ] as [ViewMode, string][]
            ).map(([v, l]) => (
              <button key={v} type="button" className="seg-bar__btn" aria-pressed={s.view === v} onClick={() => set("view", v)}>
                {l}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="ctl lidar__slider">
          <label htmlFor="lid-speed" className="ctl__lbl">
            Flight speed <output className="mono">{s.speed} m/s</output>
          </label>
          <input id="lid-speed" type="range" min={1} max={12} step={1} value={s.speed} onChange={(e) => set("speed", +e.target.value)} />
        </div>
        <div className="ctl lidar__slider">
          <label htmlFor="lid-size" className="ctl__lbl">
            Point size <output className="mono">{s.pointSize.toFixed(1)}</output>
          </label>
          <input
            id="lid-size"
            type="range"
            min={1}
            max={4.5}
            step={0.1}
            value={s.pointSize}
            onChange={(e) => set("pointSize", +e.target.value)}
          />
        </div>
        <div className="lidar__toggles">
          <label className="check">
            <input type="checkbox" checked={s.showBeams} onChange={(e) => set("showBeams", e.target.checked)} />
            <span>Laser fan</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={s.showPath} onChange={(e) => set("showPath", e.target.checked)} />
            <span>Flight path</span>
          </label>
        </div>
        <div className="ctl__btns">
          <button type="button" className="btn btn--sig btn--sm" aria-pressed={!running} onClick={() => setRunning((r) => !r)}>
            {running ? "Pause" : "Run"}
          </button>
          <button type="button" className="btn btn--sm" onClick={reset}>
            Reset map
          </button>
        </div>
      </div>

      <p className="lab-panel__explain">
        <strong>What you’re seeing:</strong> the bright ring is the current sweep; the faint lines are laser beams from the
        last few degrees of rotation. Each return is placed in world coordinates using the drone’s pose, then kept only if it
        lands in a new 20 cm voxel, so the map grows as new surfaces come into view instead of piling up duplicates. Fresh
        points flash before settling. More channels mean denser vertical coverage per sweep. The city, the sensor and the
        flight are all generated in your browser; nothing here is real sensor data.
      </p>
    </div>
  );
}
