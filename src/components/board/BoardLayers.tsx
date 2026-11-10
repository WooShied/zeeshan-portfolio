import { memo } from "react";
import { C, ESC_T, MOTORS, NETS, PROP_R, VB, along, armAxes, armPoly, type NetId } from "./geometry";

/* The hero drone as three stacked SVG layers sharing one viewBox. In
   "Inspect system" they separate in depth: canopy and rotors lift off,
   exposing the avionics, with the frame and battery below. All
   decorative: the accessible controls are HTML buttons layered on top.
   Colours come from CSS variables so both themes work.               */

const vb = `0 0 ${VB.w} ${VB.h}`;
const BODY = "M418 236H582L608 262V418L582 444H418L392 418V262Z";
const f = (n: number) => n.toFixed(1);

/* ── L1: frame, motor mounts, battery ────────────────────────── */
export const FrameLayer = memo(function FrameLayer() {
  return (
    <svg viewBox={vb} className="layer-svg" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="dShadow">
          <stop offset="0" style={{ stopColor: "var(--d-shadow)" }} />
          <stop offset="1" style={{ stopColor: "var(--d-shadow)", stopOpacity: 0 }} />
        </radialGradient>
        <pattern id="carbon" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="6" style={{ fill: "var(--d-edge)" }} opacity="0.25" />
        </pattern>
      </defs>
      <ellipse cx={C.x} cy={C.y + 18} rx="420" ry="300" fill="url(#dShadow)" opacity="0.7" />

      {/* arms */}
      {MOTORS.map((m, i) => (
        <g key={i}>
          <polygon points={armPoly(m, 0.12, 0.93, 18)} className="d-arm" />
          <polygon points={armPoly(m, 0.12, 0.93, 18)} fill="url(#carbon)" />
        </g>
      ))}

      {/* bottom plate */}
      <path d={BODY} className="d-plate" />
      <path d="M428 250H572L594 272V408L572 430H428L406 408V272Z" fill="none" className="d-hair" strokeDasharray="3 5" />

      {/* motor mounts */}
      {MOTORS.map((m, i) => (
        <g key={i}>
          <circle cx={m.x} cy={m.y} r="36" className="d-mount" />
          {[45, 135, 225, 315].map((a) => (
            <circle
              key={a}
              cx={m.x + Math.cos((a * Math.PI) / 180) * 24}
              cy={m.y + Math.sin((a * Math.PI) / 180) * 24}
              r="3"
              className="d-hole"
            />
          ))}
        </g>
      ))}

      {/* battery under the stack, with straps */}
      <rect x="436" y="258" width="128" height="164" rx="6" className="d-batt" />
      <rect x="424" y="292" width="152" height="12" className="d-strap" />
      <rect x="424" y="376" width="152" height="12" className="d-strap" />
      <text x="500" y="346" textAnchor="middle" className="d-text d-text--lg">
        LiPo
      </text>

      {/* silkscreen labels */}
      <text x="500" y="660" textAnchor="middle" className="d-text">
        ZM-Q1 · FRAME
      </text>
      <text x={C.x} y="62" textAnchor="middle" className="d-text">
        ▲ NOSE
      </text>
    </svg>
  );
});

/* ── L2: avionics and wiring ──────────────────────────────── */
export const AvionicsLayer = memo(function AvionicsLayer() {
  return (
    <svg viewBox={vb} className="layer-svg" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="lens" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#bff6f1" />
          <stop offset="0.35" stopColor="#1f6662" />
          <stop offset="1" stopColor="#081616" />
        </radialGradient>
      </defs>

      {/* wiring nets (lit on hover/selection) */}
      {(Object.keys(NETS) as NetId[]).map((net, n) => (
        <g key={net} className="net" data-net={net}>
          {NETS[net].map((d, i) => (
            <g key={d}>
              <path className="net__base" d={d} />
              <path className="net__pulse" d={d} pathLength={100} style={{ animationDelay: `${-(i * 0.35 + n * 0.9)}s` }} />
            </g>
          ))}
        </g>
      ))}

      {/* ESCs on each arm */}
      {MOTORS.map((m, i) => {
        const e = along(m, ESC_T);
        const { ux, uy } = armAxes(m);
        const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
        return (
          <g key={i} transform={`translate(${f(e.x)} ${f(e.y)}) rotate(${f(ang)})`}>
            <rect x="-24" y="-13" width="48" height="26" rx="2" className="d-chip" />
            <rect x="-8" y="-6" width="16" height="12" className="d-ic" />
            <text x="0" y="22" textAnchor="middle" className="d-text d-text--sm d-text--chip">
              ESC{i + 1}
            </text>
          </g>
        );
      })}

      {/* Flight controller */}
      <g className="comp" data-comp="cpu">
        <rect className="comp__body d-chip" x="454" y="294" width="92" height="92" rx="3" />
        {[
          [462, 302],
          [538, 302],
          [462, 378],
          [538, 378],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="3.5" className="d-hole d-hole--ring" />
        ))}
        <rect x="481" y="321" width="38" height="38" className="d-ic" />
        {Array.from({ length: 6 }, (_, k) => (
          <g key={k} className="d-pin">
            <rect x={484 + k * 6} y="316" width="2.4" height="5" />
            <rect x={484 + k * 6} y="359" width="2.4" height="5" />
            <rect x="476" y={324 + k * 6} width="5" height="2.4" />
            <rect x="519" y={324 + k * 6} width="5" height="2.4" />
          </g>
        ))}
        <text x="500" y="376" textAnchor="middle" className="d-text d-text--sm d-text--chip">
          FC
        </text>
        <rect className="comp__ring" x="444" y="284" width="112" height="112" />
      </g>

      {/* Blackbox logger */}
      <g className="comp" data-comp="mem">
        <rect className="comp__body d-chip" x="584" y="302" width="46" height="56" rx="2" />
        <rect x="592" y="312" width="30" height="22" className="d-metal" />
        <rect x="596" y="316" width="22" height="4" className="d-hole" />
        <text x="607" y="350" textAnchor="middle" className="d-text d-text--sm d-text--chip">
          LOG
        </text>
        <rect className="comp__ring" x="576" y="294" width="62" height="72" />
      </g>

      {/* Camera payload (nose) */}
      <g className="comp" data-comp="io">
        <rect className="comp__body d-chip" x="472" y="214" width="56" height="28" rx="3" />
        <circle cx="500" cy="204" r="19" className="d-metal" />
        <circle cx="500" cy="204" r="14" fill="url(#lens)" />
        <circle cx="495" cy="199" r="3" fill="#ffffff" opacity="0.55" />
        <rect className="comp__ring" x="466" y="178" width="68" height="70" />
      </g>

      {/* Debug USB port */}
      <g className="comp" data-comp="dbg">
        <rect className="comp__body d-metal" x="374" y="324" width="26" height="32" rx="2" />
        <rect x="380" y="331" width="10" height="18" rx="2" className="d-hole" />
        <rect className="comp__ring" x="364" y="316" width="44" height="48" />
      </g>

      {/* Telemetry radio + antennas */}
      <g className="comp" data-comp="rf">
        <path d="M478 462L428 528M522 462L572 528" className="d-antenna" />
        <circle cx="428" cy="528" r="6" className="d-tip" />
        <circle cx="572" cy="528" r="6" className="d-tip" />
        <rect className="comp__body d-chip" x="464" y="430" width="72" height="36" rx="2" />
        <text x="500" y="453" textAnchor="middle" className="d-text d-text--sm d-text--chip">
          RX · TLM
        </text>
        <rect className="comp__ring" x="418" y="422" width="164" height="114" />
      </g>
    </svg>
  );
});

/* ── L3: canopy, motor bells, rotors, nav lights ──────────── */
export const ShellLayer = memo(function ShellLayer() {
  const blade = `M0 0C18-9 64-15 ${PROP_R} -5C${PROP_R + 4} 0 ${PROP_R} 6 ${PROP_R - 8} 6C60 9 20 9 0 0Z`;
  return (
    <svg viewBox={vb} className="layer-svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* canopy shell */}
      <g className="canopy">
        <path
          d="M432 250C468 238 532 238 568 250L594 296V398C594 428 572 448 540 452H460C428 448 406 428 406 398V296Z"
          className="d-canopy"
        />
        <path d="M432 250C468 238 532 238 568 250L594 296V398C594 428 572 448 540 452H460C428 448 406 428 406 398V296Z" fill="url(#glass)" />
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M${478 + k * 16} 410V432`} className="d-vent" />
        ))}
        <text x="500" y="282" textAnchor="middle" className="d-text d-text--sm">
          ZM-Q1
        </text>
      </g>

      {/* rotors */}
      {MOTORS.map((m, i) => (
        <g key={i} transform={`translate(${m.x} ${m.y})`}>
          <circle r={PROP_R} className="d-disc" />
          <g className={`prop prop--${m.dir}`}>
            <path d={blade} className="d-blade" />
            <path d={blade} className="d-blade" transform="rotate(180)" />
          </g>
          <circle r="25" className="d-bell" />
          <circle r="16" className="d-bell-in" />
          <circle r="6" className="d-cap" />
          <text y={-PROP_R - 10} textAnchor="middle" className="d-text d-text--sm">
            M{i + 1} · {m.dir.toUpperCase()}
          </text>
        </g>
      ))}

      {/* navigation lights: cyan at the nose, amber at the tail */}
      {MOTORS.map((m, i) => {
        const p = along(m, 0.74);
        return <circle key={i} cx={f(p.x)} cy={f(p.y)} r="5" className={`led ${i < 2 ? "led--sig d-nav--front" : "led--amber d-nav--rear"}`} />;
      })}
    </svg>
  );
});
