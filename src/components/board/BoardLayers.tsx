import { memo } from "react";
import { AUX, CPU, CPU_PINS, NETS, VIAS, VB, type NetId } from "./geometry";

/* Three stacked SVG layers that share one viewBox. They are separated
   in depth for the "Inspect system" exploded view. All decorative:
   the accessible controls are HTML buttons layered on top.          */

const vb = `0 0 ${VB.w} ${VB.h}`;
const BOARD_PATH = "M54 30H946L970 54V626L946 650H54L30 626V54Z";

/* ── L1: substrate, silkscreen, mounting holes ─────────────── */
export const Substrate = memo(function Substrate() {
  return (
    <svg viewBox={vb} className="layer-svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pcbGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#152022" />
          <stop offset="0.55" stopColor="#0f1718" />
          <stop offset="1" stopColor="#0b1112" />
        </linearGradient>
        <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="rgba(95,212,204,0.045)" strokeWidth="2" />
        </pattern>
      </defs>
      <path d={BOARD_PATH} fill="url(#pcbGrad)" stroke="rgba(237,231,220,0.14)" strokeWidth="1.5" />
      <path d={BOARD_PATH} fill="url(#hatch)" />
      {/* inner keep-out outline */}
      <path d="M66 44H934L956 66V614L934 636H66L44 614V66Z" fill="none" stroke="rgba(237,231,220,0.06)" strokeDasharray="2 6" />
      {/* mounting holes */}
      {[
        [70, 70],
        [930, 70],
        [70, 610],
        [930, 610],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="17" fill="none" stroke="#7d6d48" strokeWidth="5" opacity="0.7" />
          <circle cx={x} cy={y} r="11" fill="#070909" />
        </g>
      ))}
      {/* fiducials */}
      {[
        [118, 612],
        [884, 230],
      ].map(([x, y]) => (
        <g key={`f${x}`}>
          <circle cx={x} cy={y} r="7" fill="none" stroke="rgba(237,231,220,0.18)" />
          <circle cx={x} cy={y} r="3" fill="#9c8656" />
        </g>
      ))}
      {/* silkscreen */}
      <g className="silk" fill="var(--silk)" fontFamily="IBM Plex Mono, monospace">
        <text x="404" y="440" fontSize="12">U1</text>
        <text x="200" y="140" fontSize="12">U2</text>
        <text x="900" y="420" fontSize="12">J1</text>
        <text x="622" y="596" fontSize="12">J1B</text>
        <text x="146" y="540" fontSize="12">J2 · SWD</text>
        <text x="700" y="52" fontSize="12">M1</text>
        <text x="96" y="660" fontSize="10" opacity="0.6" letterSpacing="2">ZM-01 · REV A · 2026</text>
        <text x="560" y="660" fontSize="10" opacity="0.6" letterSpacing="2">CODE · SIGNALS · PHYSICAL WORLD</text>
        <text x="830" y="606" fontSize="10">PWR</text>
        <text x="830" y="636" fontSize="10">SYS</text>
      </g>
      {/* courtyard outlines */}
      <g fill="none" stroke="rgba(237,231,220,0.2)" strokeWidth="1" strokeDasharray="4 4">
        <rect x={CPU.x - 22} y={CPU.y - 22} width={CPU.s + 44} height={CPU.s + 44} rx="4" />
        <rect x="180" y="146" width="130" height="214" rx="4" />
        <rect x="136" y="546" width="94" height="48" rx="4" />
      </g>
    </svg>
  );
});

/* ── L2: copper (traces, pads, vias) ─────────────────────────── */
export const Copper = memo(function Copper() {
  return (
    <svg viewBox={vb} className="layer-svg" aria-hidden="true" focusable="false">
      <g className="aux" fill="none" stroke="var(--copper)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {AUX.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
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
      {/* edge fingers (J1) */}
      <g className="pads">
        {Array.from({ length: 9 }, (_, j) => (
          <rect key={j} x="925" y={433 + j * 16} width="40" height="10" rx="2" fill="var(--pad)" />
        ))}
      </g>
      {/* RF pads */}
      {Array.from({ length: 5 }, (_, j) => (
        <rect key={`rp${j}`} x="684" y={95 + j * 16} width="16" height="10" rx="1.5" fill="var(--pad)" opacity="0.85" />
      ))}
      {/* vias */}
      <g>
        {VIAS.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="5.5" fill="#6f6141" />
            <circle cx={x} cy={y} r="2.4" fill="#070909" />
          </g>
        ))}
      </g>
      {/* RF antenna meander */}
      <path
        d="M905 70V82H945V96H905V110H945V124H905V138H945V152H905V166H945V180"
        fill="none"
        stroke="var(--copper-2)"
        strokeWidth="4"
        strokeLinejoin="round"
        className="antenna"
      />
    </svg>
  );
});

/* ── L3: components ─────────────────────────────────────────── */
function QfpPins() {
  const { x, y, s } = CPU;
  const len = 10;
  return (
    <g fill="#a5916a">
      {CPU_PINS.map((o) => (
        <g key={o}>
          <rect x={x + o - 2} y={y - len} width="4" height={len} />
          <rect x={x + o - 2} y={y + s} width="4" height={len} />
          <rect x={x - len} y={y + o - 2} width={len} height="4" />
          <rect x={x + s} y={y + o - 2} width={len} height="4" />
        </g>
      ))}
    </g>
  );
}

export const Parts = memo(function Parts() {
  return (
    <svg viewBox={vb} className="layer-svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="chip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#23292a" />
          <stop offset="1" stopColor="#111415" />
        </linearGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5d6566" />
          <stop offset="0.5" stopColor="#3a4142" />
          <stop offset="1" stopColor="#262b2c" />
        </linearGradient>
        <pattern id="perf" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="1.6" fill="rgba(0,0,0,0.35)" />
        </pattern>
        <radialGradient id="ledAmber">
          <stop offset="0" stopColor="#ffd28a" />
          <stop offset="1" stopColor="#f2b04a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ledSig">
          <stop offset="0" stopColor="#b8fff9" />
          <stop offset="1" stopColor="#5fd4cc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* U1 processor */}
      <g className="comp" data-comp="cpu">
        <QfpPins />
        <rect className="comp__body" x={CPU.x} y={CPU.y} width={CPU.s} height={CPU.s} rx="8" fill="url(#chip)" />
        <rect x={CPU.x + 1} y={CPU.y + 1} width={CPU.s - 2} height={CPU.s - 2} rx="7" fill="none" stroke="rgba(255,255,255,0.07)" />
        <rect x={CPU.x + 34} y={CPU.y + 34} width={CPU.s - 68} height={CPU.s - 68} rx="4" fill="none" stroke="rgba(237,231,220,0.07)" />
        <circle cx={CPU.x + 18} cy={CPU.y + 18} r="5" fill="rgba(237,231,220,0.16)" />
        <text x="500" y="324" textAnchor="middle" fill="rgba(237,231,220,0.75)" fontFamily="IBM Plex Mono, monospace" fontSize="17" letterSpacing="3">
          ZM·01
        </text>
        <text x="500" y="346" textAnchor="middle" fill="rgba(237,231,220,0.38)" fontFamily="IBM Plex Mono, monospace" fontSize="10" letterSpacing="2">
          PROCESSOR
        </text>
        <rect className="comp__ring" x={CPU.x - 16} y={CPU.y - 16} width={CPU.s + 32} height={CPU.s + 32} rx="14" />
      </g>

      {/* U2 memory (TSOP) */}
      <g className="comp" data-comp="mem">
        <g fill="#a5916a">
          {Array.from({ length: 12 }, (_, k) => (
            <g key={k}>
              <rect x="190" y={164 + k * 16} width="10" height="4" />
              <rect x="290" y={164 + k * 16} width="10" height="4" />
            </g>
          ))}
        </g>
        <rect className="comp__body" x="200" y="150" width="90" height="200" rx="5" fill="url(#chip)" />
        <path d="M233 150a12 12 0 0 0 24 0" fill="#0b0d0e" />
        <text x="245" y="256" textAnchor="middle" fill="rgba(237,231,220,0.6)" fontFamily="IBM Plex Mono, monospace" fontSize="12" letterSpacing="3" transform="rotate(-90 245 256)">
          MEMORY
        </text>
        <rect className="comp__ring" x="182" y="140" width="126" height="220" rx="12" />
      </g>

      {/* J1 I/O: USB-C receptacle (edge fingers are copper on L2) */}
      <g className="comp" data-comp="io">
        <rect className="comp__body" x="646" y="604" width="92" height="52" rx="10" fill="url(#metal)" />
        <rect x="664" y="626" width="56" height="16" rx="8" fill="#0a0c0c" />
        <rect x="672" y="632" width="40" height="4" rx="2" fill="#7d6d48" />
        <rect className="comp__ring" x="915" y="424" width="58" height="160" rx="10" />
        <rect className="comp__ring" x="638" y="596" width="108" height="68" rx="14" />
      </g>

      {/* J2 debug header 2 × 5 */}
      <g className="comp" data-comp="dbg">
        <rect className="comp__body" x="140" y="550" width="86" height="40" rx="4" fill="#0b0d0e" stroke="rgba(237,231,220,0.12)" />
        {Array.from({ length: 5 }, (_, c) =>
          [560, 578].map((y) => (
            <g key={`${c}-${y}`}>
              <rect x={150 + c * 16 - 5} y={y - 5} width="10" height="10" rx="1.5" fill="#a5916a" />
              <rect x={150 + c * 16 - 2} y={y - 2} width="4" height="4" fill="#5b4f35" />
            </g>
          )),
        )}
        <rect className="comp__ring" x="128" y="538" width="110" height="64" rx="12" />
      </g>

      {/* M1 communications module (shield can) */}
      <g className="comp" data-comp="rf">
        <rect className="comp__body" x="700" y="64" width="196" height="122" rx="8" fill="url(#metal)" />
        <rect x="700" y="64" width="196" height="122" rx="8" fill="url(#perf)" />
        <rect x="712" y="76" width="172" height="98" rx="5" fill="none" stroke="rgba(255,255,255,0.08)" />
        <text x="798" y="130" textAnchor="middle" fill="rgba(237,231,220,0.7)" fontFamily="IBM Plex Mono, monospace" fontSize="13" letterSpacing="3">
          COMMS
        </text>
        <text x="798" y="148" textAnchor="middle" fill="rgba(237,231,220,0.35)" fontFamily="IBM Plex Mono, monospace" fontSize="9" letterSpacing="2">
          TX · RX
        </text>
        <rect className="comp__ring" x="688" y="54" width="268" height="142" rx="14" />
      </g>

      {/* Passives and misc (decorative) */}
      <g>
        {/* crystal */}
        <rect x="330" y="440" width="44" height="22" rx="11" fill="url(#metal)" />
        {/* decoupling caps */}
        {[
          [392, 222],
          [598, 222],
          [392, 428],
          [612, 446],
          [330, 120],
          [612, 120],
          [120, 420],
          [880, 250],
          [880, 350],
          [776, 520],
          [520, 520],
        ].map(([x, y], i) => (
          <g key={i}>
            <rect x={x - 8} y={y - 5} width="16" height="10" rx="1.5" fill="#6a5a3e" />
            <rect x={x - 4} y={y - 5} width="8" height="10" fill={i % 3 === 0 ? "#2c2a24" : "#3b3326"} />
          </g>
        ))}
        {/* regulator */}
        <rect x="800" y="290" width="54" height="40" rx="3" fill="url(#chip)" />
        <rect x="806" y="276" width="42" height="14" fill="#a5916a" opacity="0.85" />
        {/* LEDs */}
        <rect x="806" y="596" width="16" height="12" rx="2" fill="#2a2418" />
        <circle className="led led--amber" cx="814" cy="602" r="12" fill="url(#ledAmber)" />
        <rect x="806" y="626" width="16" height="12" rx="2" fill="#162423" />
        <circle className="led led--sig" cx="814" cy="632" r="12" fill="url(#ledSig)" />
      </g>
    </svg>
  );
});
