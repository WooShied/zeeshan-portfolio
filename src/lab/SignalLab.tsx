import { useCallback, useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "../hooks";
import { StatusTag } from "../components/StatusTag";

type Wave = "sine" | "square" | "triangle";

const DEFAULTS = { freq: 5, fs: 40, noise: 0.1, wave: "sine" as Wave, hold: "linear" as "linear" | "zoh" };
const WINDOW_S = 1; // visible time window, seconds

function waveAt(wave: Wave, f: number, t: number) {
  const ph = (f * t) % 1;
  if (wave === "sine") return Math.sin(2 * Math.PI * f * t);
  if (wave === "square") return ph < 0.5 ? 0.85 : -0.85;
  return 1 - 4 * Math.abs(((ph + 0.25) % 1) - 0.5);
}

/** Gaussian noise (Box–Muller). */
function gauss() {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

/** Apparent frequency after sampling at fs (folded into 0 … fs/2). */
export function aliasOf(f: number, fs: number) {
  return Math.abs(f - fs * Math.round(f / fs));
}

function readVar(el: Element, name: string) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/**
 * Oscilloscope-style sampling demo. Everything is computed in the browser:
 * the analog signal, noisy samples, the reconstruction, and a DFT of the
 * samples. Simulated data only.
 */
export function SignalLab() {
  const [p, setP] = useState(DEFAULTS);
  const reduce = useReducedMotion();
  const [running, setRunning] = useState(!reduce);
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const onScreen = useInView(wrapRef);
  const tRef = useRef(0);
  const pRef = useRef(p);
  pRef.current = p;
  const [canvasOk] = useState(() => !!document.createElement("canvas").getContext);

  const draw = useCallback(() => {
    const scope = scopeRef.current;
    const spec = specRef.current;
    if (!scope || !spec) return;
    const { freq, fs, noise, wave, hold } = pRef.current;
    const t0 = tRef.current;
    const css = {
      fg: readVar(scope, "--fg") || "#ede7dc",
      sig: readVar(scope, "--sig") || "#5fd4cc",
      amber: readVar(scope, "--amber") || "#f2b04a",
      line: "rgba(237,231,220,0.08)",
      line2: "rgba(237,231,220,0.18)",
    };

    for (const c of [scope, spec]) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
      c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* ── Scope ── */
    const g = scope.getContext("2d")!;
    const W = scope.clientWidth;
    const H = scope.clientHeight;
    g.clearRect(0, 0, W, H);
    // graticule: 10 × 8 divisions
    g.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      g.strokeStyle = i === 5 ? css.line2 : css.line;
      g.beginPath();
      g.moveTo(Math.round((i / 10) * W) + 0.5, 0);
      g.lineTo(Math.round((i / 10) * W) + 0.5, H);
      g.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      g.strokeStyle = i === 4 ? css.line2 : css.line;
      g.beginPath();
      g.moveTo(0, Math.round((i / 8) * H) + 0.5);
      g.lineTo(W, Math.round((i / 8) * H) + 0.5);
      g.stroke();
    }
    const yOf = (v: number) => H / 2 - v * (H * 0.36);
    const xOf = (t: number) => ((t - t0) / WINDOW_S) * W;

    // analog reference
    g.strokeStyle = "rgba(237,231,220,0.45)";
    g.lineWidth = 1.5;
    g.beginPath();
    const steps = Math.max(200, Math.round(W));
    for (let i = 0; i <= steps; i++) {
      const t = t0 + (i / steps) * WINDOW_S;
      const v = waveAt(wave, freq, t);
      i ? g.lineTo(xOf(t), yOf(v)) : g.moveTo(xOf(t), yOf(v));
    }
    g.stroke();

    // samples aligned to the absolute sample grid
    const ts = 1 / fs;
    const n0 = Math.ceil(t0 / ts);
    const n1 = Math.floor((t0 + WINDOW_S) / ts);
    const samples: { t: number; v: number }[] = [];
    for (let n = n0; n <= n1; n++) {
      const t = n * ts;
      samples.push({ t, v: waveAt(wave, freq, t) + noise * gauss() });
    }

    // reconstruction
    g.strokeStyle = css.amber;
    g.lineWidth = 2;
    g.shadowColor = css.amber;
    g.shadowBlur = 6;
    g.beginPath();
    samples.forEach((s, i) => {
      const x = xOf(s.t);
      const y = yOf(s.v);
      if (i === 0) g.moveTo(x, y);
      else if (hold === "zoh") {
        g.lineTo(x, yOf(samples[i - 1].v));
        g.lineTo(x, y);
      } else g.lineTo(x, y);
    });
    if (hold === "zoh" && samples.length) g.lineTo(W, yOf(samples[samples.length - 1].v));
    g.stroke();
    g.shadowBlur = 0;

    // sample stems + points
    g.strokeStyle = "rgba(95,212,204,0.35)";
    g.lineWidth = 1;
    samples.forEach((s) => {
      const x = xOf(s.t);
      g.beginPath();
      g.moveTo(x, yOf(0));
      g.lineTo(x, yOf(s.v));
      g.stroke();
    });
    g.fillStyle = css.sig;
    samples.forEach((s) => {
      g.beginPath();
      g.arc(xOf(s.t), yOf(s.v), samples.length > 120 ? 1.8 : 3, 0, Math.PI * 2);
      g.fill();
    });

    /* ── Spectrum: DFT magnitude of the samples, 0 … fs/2 ── */
    const s = spec.getContext("2d")!;
    const SW = spec.clientWidth;
    const SH = spec.clientHeight;
    s.clearRect(0, 0, SW, SH);
    const N = samples.length;
    const bins = Math.floor(N / 2);
    const mags: number[] = [];
    for (let k = 0; k <= bins; k++) {
      let re = 0;
      let im = 0;
      for (let n = 0; n < N; n++) {
        const a = (2 * Math.PI * k * n) / N;
        re += samples[n].v * Math.cos(a);
        im -= samples[n].v * Math.sin(a);
      }
      mags.push((2 * Math.sqrt(re * re + im * im)) / Math.max(N, 1));
    }
    const nyq = fs / 2;
    const fx = (f: number) => 8 + (f / nyq) * (SW - 16);
    s.strokeStyle = css.line;
    for (let i = 0; i <= 4; i++) {
      const x = 8 + (i / 4) * (SW - 16);
      s.beginPath();
      s.moveTo(Math.round(x) + 0.5, 0);
      s.lineTo(Math.round(x) + 0.5, SH - 14);
      s.stroke();
    }
    const barW = Math.max(2, Math.min(10, (SW - 16) / Math.max(bins, 1) - 2));
    mags.forEach((m, k) => {
      const f = (k * fs) / Math.max(N, 1);
      const h = Math.min(1, m) * (SH - 26);
      s.fillStyle = css.sig;
      s.globalAlpha = 0.35 + 0.65 * Math.min(1, m);
      s.fillRect(fx(f) - barW / 2, SH - 14 - h, barW, h);
    });
    s.globalAlpha = 1;
    // marker at the apparent frequency
    const fa = aliasOf(freq, fs);
    s.strokeStyle = css.amber;
    s.setLineDash([3, 3]);
    s.beginPath();
    s.moveTo(fx(fa), 4);
    s.lineTo(fx(fa), SH - 14);
    s.stroke();
    s.setLineDash([]);
    s.fillStyle = "rgba(237,231,220,0.6)";
    s.font = "10px 'IBM Plex Mono', monospace";
    s.textAlign = "left";
    s.fillText("0 Hz", 8, SH - 2);
    s.textAlign = "right";
    s.fillText(`${nyq.toFixed(nyq < 10 ? 1 : 0)} Hz (fs/2)`, SW - 8, SH - 2);
  }, []);

  // Animation loop: only while running and on screen.
  useEffect(() => {
    if (!canvasOk) return;
    if (!running || !onScreen) {
      draw();
      return;
    }
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tRef.current += dt * 0.25; // slowed time so the trace is readable
      acc += dt;
      if (acc > 1 / 30) {
        acc = 0;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, onScreen, draw, canvasOk]);

  // Redraw on control changes and resizes while paused.
  useEffect(() => {
    if (canvasOk) draw();
  }, [p, draw, canvasOk]);
  useEffect(() => {
    if (!canvasOk || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => draw());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [draw, canvasOk]);

  const reset = () => {
    setP(DEFAULTS);
    tRef.current = 0;
    setRunning(!reduce);
  };

  const nyq = p.fs / 2;
  const aliased = p.freq > nyq;
  const fa = aliasOf(p.freq, p.fs);
  const ratio = p.fs / p.freq;

  return (
    <div className="lab-panel sig" ref={wrapRef}>
      <div className="lab-panel__head">
        <div>
          <h3 className="lab-panel__title">Signal sampling &amp; aliasing</h3>
          <p className="lab-panel__sub">
            A microcontroller only sees a signal at its sample instants. Sample too slowly and a fast signal reappears as a
            slower one.
          </p>
        </div>
        <StatusTag kind="simulated" />
      </div>

      <div className="sig__grid">
        <div className="sig__screens">
          <div className="scope">
            <div className="scope__bar mono">
              <span>CH1 · 1 V/div</span>
              <span>{(WINDOW_S * 100).toFixed(0)} ms/div</span>
              <span className={running ? "scope__run" : "scope__stop"}>{running ? "RUN" : "STOP"}</span>
            </div>
            {canvasOk ? (
              <canvas
                ref={scopeRef}
                className="scope__canvas"
                role="img"
                aria-label={`Simulated ${p.wave} wave at ${p.freq} hertz sampled at ${p.fs} hertz with noise ${p.noise} volts. ${
                  aliased ? `Aliased: appears as ${fa.toFixed(1)} hertz.` : "No aliasing."
                }`}
              />
            ) : (
              <p className="scope__fallback">Canvas is unavailable in this browser. The readouts beside this panel still update.</p>
            )}
            <ul className="scope__legend mono" aria-hidden="true">
              <li>
                <i className="k k--ref" /> Analog signal
              </li>
              <li>
                <i className="k k--smp" /> Samples
              </li>
              <li>
                <i className="k k--rec" /> Reconstruction
              </li>
            </ul>
          </div>
          <div className="spec">
            <p className="spec__k mono">Spectrum of samples (DFT)</p>
            {canvasOk ? <canvas ref={specRef} className="spec__canvas" aria-hidden="true" /> : null}
          </div>
        </div>

        <div className="sig__controls">
          <div className="ctl">
            <label htmlFor="sig-f" className="ctl__lbl">
              Signal frequency <output className="mono">{p.freq} Hz</output>
            </label>
            <input id="sig-f" type="range" min={1} max={40} step={1} value={p.freq} onChange={(e) => setP({ ...p, freq: +e.target.value })} />
          </div>
          <div className="ctl">
            <label htmlFor="sig-fs" className="ctl__lbl">
              Sampling rate <output className="mono">{p.fs} Hz</output>
            </label>
            <input id="sig-fs" type="range" min={4} max={160} step={1} value={p.fs} onChange={(e) => setP({ ...p, fs: +e.target.value })} />
          </div>
          <div className="ctl">
            <label htmlFor="sig-n" className="ctl__lbl">
              Noise (σ) <output className="mono">{p.noise.toFixed(2)} V</output>
            </label>
            <input id="sig-n" type="range" min={0} max={0.6} step={0.01} value={p.noise} onChange={(e) => setP({ ...p, noise: +e.target.value })} />
          </div>

          <fieldset className="seg">
            <legend className="ctl__lbl">Waveform</legend>
            {(["sine", "square", "triangle"] as Wave[]).map((w) => (
              <label key={w} className="seg__opt">
                <input type="radio" name="sig-wave" value={w} checked={p.wave === w} onChange={() => setP({ ...p, wave: w })} />
                <span>{w}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="seg">
            <legend className="ctl__lbl">Reconstruction</legend>
            {(
              [
                ["linear", "Linear"],
                ["zoh", "Zero-order hold"],
              ] as const
            ).map(([v, l]) => (
              <label key={v} className="seg__opt">
                <input type="radio" name="sig-hold" value={v} checked={p.hold === v} onChange={() => setP({ ...p, hold: v })} />
                <span>{l}</span>
              </label>
            ))}
          </fieldset>

          <div className="ctl__btns">
            <button type="button" className="btn btn--sig btn--sm" aria-pressed={!running} onClick={() => setRunning((r) => !r)}>
              {running ? "Pause" : "Run"}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
              Reset
            </button>
          </div>

          <dl className="readouts" aria-live="polite">
            <div>
              <dt className="mono">Nyquist limit</dt>
              <dd className="mono">{nyq.toFixed(1)} Hz</dd>
            </div>
            <div>
              <dt className="mono">Samples / cycle</dt>
              <dd className="mono">{ratio.toFixed(1)}</dd>
            </div>
            <div>
              <dt className="mono">Apparent freq.</dt>
              <dd className="mono">{fa.toFixed(1)} Hz</dd>
            </div>
            <div className={aliased ? "is-warn" : "is-ok"}>
              <dt className="mono">Status</dt>
              <dd className="mono">{aliased ? "ALIASING" : ratio < 4 ? "MARGINAL" : "OK"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="lab-panel__explain">
        <strong>What you’re seeing:</strong> the pale line is the “true” analog signal; teal dots are what an ADC would record
        at the chosen rate, with Gaussian noise added; the amber line is the signal rebuilt from those samples. Push the
        signal past half the sampling rate (the Nyquist limit) and the amber line slows down: that is aliasing, and the
        spectrum marker shows the false frequency.
      </p>
    </div>
  );
}
