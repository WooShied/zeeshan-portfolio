/**
 * Board geometry for the hero (viewBox 1000 × 680).
 * Traces are generated as 45° PCB-style buses so parallel lines keep
 * even spacing through their bends.
 */
export const VB = { w: 1000, h: 680 };

export type NetId = "mem" | "io" | "dbg" | "rf";

const SHIFT = 16 * 0.414; // keeps 45° bends parallel at 16 px pitch

/** Horizontal-first bus: run along x, 45° jog, finish along x. */
function busH(x1: number, ys1: number[], x2: number, ys2: number[], xm0: number, shift: number) {
  return ys1.map((y1, i) => {
    const y2 = ys2[i];
    const dy = Math.abs(y2 - y1);
    const sx = Math.sign(x2 - x1);
    const xm = xm0 + i * shift;
    return `M${x1} ${y1}H${xm.toFixed(1)}L${(xm + sx * dy).toFixed(1)} ${y2}H${x2}`;
  });
}

/** Vertical-first bus: run along y, 45° jog, finish along y. */
function busV(xs1: number[], y1: number, xs2: number[], y2: number, ym0: number, shift: number) {
  return xs1.map((x1, i) => {
    const x2 = xs2[i];
    const dx = Math.abs(x2 - x1);
    const sy = Math.sign(y2 - y1);
    const ym = ym0 + i * shift;
    return `M${x1} ${y1}V${ym.toFixed(1)}L${x2} ${(ym + sy * dx).toFixed(1)}V${y2}`;
  });
}

const range = (n: number, start: number, step: number) => Array.from({ length: n }, (_, i) => start + i * step);
const C = 10; // chamfer size

/** CPU body: 170 × 170, 18 pins per side at 8 px pitch. */
export const CPU = { x: 415, y: 245, s: 170 };
export const CPU_PINS = range(18, 17, 8);

export const NETS: Record<NetId, string[]> = {
  // CPU left → memory right pins
  mem: busH(405, range(5, 262, 16), 300, range(5, 214, 16), 380, -SHIFT),
  // CPU right → edge fingers, plus CPU bottom → USB-C
  io: [
    ...busH(595, range(4, 342, 16), 925, range(4, 470, 16), 700, -SHIFT),
    ...busV(range(4, 520, 16), 425, range(4, 666, 16), 604, 444, -SHIFT),
  ],
  // CPU bottom-left → debug header (down, left, down)
  dbg: range(4, 432, 16).map((x0, i) => {
    const yh = 466 + i * 16;
    const xt = 150 + i * 16;
    return `M${x0} 425V${yh - C}L${x0 - C} ${yh}H${xt + C}L${xt} ${yh + C}V552`;
  }),
  // CPU top → RF module pads (up, right)
  rf: range(5, 504, 16).map((x0, i) => {
    const yh = 100 + i * 16;
    return `M${x0} 235V${yh + C}L${x0 + C} ${yh}H690`;
  }),
};

/** Dim decorative routing that never lights up. */
export const AUX = [
  "M405 358H360L330 388V470",
  "M405 374H368L344 398V430H300",
  "M405 390H376L360 406",
  "M595 262H640L668 234V200",
  "M595 278H648L680 246H760",
  "M595 294H656L690 260V230",
  "M440 235V200L420 180H330",
  "M456 235V210L440 194H360",
  "M472 235V220",
  "M300 310H330L350 330",
  "M300 326H322L340 344V360",
  "M760 470V440L790 410H860",
  "M90 300H150L170 280V200",
  "M90 320H160L190 350",
  "M820 600V560L840 540",
  "M260 600H330L360 570H420",
  "M620 560H600L590 570V610",
  "M880 330V380L860 400",
];

export const VIAS: [number, number][] = [
  [330, 470], [300, 430], [360, 406], [668, 200], [760, 246], [690, 230], [330, 180], [360, 194],
  [472, 220], [350, 330], [340, 360], [860, 410], [170, 200], [190, 350], [840, 540], [420, 570],
  [590, 610], [860, 400], [120, 440], [640, 470], [560, 470], [250, 410], [880, 250], [600, 200],
  [120, 140], [540, 600], [780, 560], [300, 560], [380, 120], [620, 120],
];

/** Hotspot anchor points (viewBox coords). */
export const ANCHORS: Record<string, { x: number; y: number }> = {
  cpu: { x: 556, y: 274 },
  mem: { x: 245, y: 182 },
  io: { x: 945, y: 504 },
  dbg: { x: 182, y: 569 },
  rf: { x: 866, y: 94 },
};

/** Which net lights up for each component. */
export const COMP_NET: Record<string, NetId | "all"> = {
  cpu: "all",
  mem: "mem",
  io: "io",
  dbg: "dbg",
  rf: "rf",
};
