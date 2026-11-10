/**
 * Drone geometry for the hero (viewBox 1000 × 680, top view, nose up).
 * The airframe is an X quad; avionics sit in the body under a canopy.
 */
export const VB = { w: 1000, h: 680 };
export const C = { x: 500, y: 340 };

export type NetId = "mem" | "io" | "dbg" | "rf" | "esc";

/** Motor centres: front-left, front-right, rear-left, rear-right. */
export const MOTORS = [
  { x: 240, y: 130, dir: "ccw" },
  { x: 760, y: 130, dir: "cw" },
  { x: 240, y: 550, dir: "cw" },
  { x: 760, y: 550, dir: "ccw" },
] as const;

export const PROP_R = 104;

/** Point a fraction t of the way from the body centre to a motor. */
export function along(m: { x: number; y: number }, t: number) {
  return { x: C.x + (m.x - C.x) * t, y: C.y + (m.y - C.y) * t };
}

/** Unit vector and perpendicular for an arm. */
export function armAxes(m: { x: number; y: number }) {
  const dx = m.x - C.x;
  const dy = m.y - C.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  return { ux, uy, px: -uy, py: ux, len };
}

/** Rectangle polygon along an arm from t0 to t1, half-width w. */
export function armPoly(m: { x: number; y: number }, t0: number, t1: number, w: number) {
  const a = along(m, t0);
  const b = along(m, t1);
  const { px, py } = armAxes(m);
  const pts = [
    [a.x + px * w, a.y + py * w],
    [b.x + px * w, b.y + py * w],
    [b.x - px * w, b.y - py * w],
    [a.x - px * w, a.y - py * w],
  ];
  return pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
}

const r = (n: number, start: number, step: number) => Array.from({ length: n }, (_, i) => start + i * step);

/** ESC boards sit 52% of the way out each arm. */
export const ESC_T = 0.52;

/** Wiring, drawn on the avionics layer. Each net starts at the flight controller. */
export const NETS: Record<NetId, string[]> = {
  // FC → camera (front)
  io: r(3, 488, 12).map((x) => `M${x} 296V238`),
  // FC → blackbox logger (right)
  mem: r(3, 318, 12).map((y) => `M546 ${y}H584`),
  // FC → debug USB port (left)
  dbg: r(3, 330, 10).map((y) => `M454 ${y}H398`),
  // FC → telemetry radio (rear) and its antenna leads
  rf: [...r(3, 488, 12).map((x) => `M${x} 384V430`), "M478 462L428 528", "M522 462L572 528"],
  // FC corners → ESCs → motors (three phases each)
  esc: MOTORS.flatMap((m) => {
    const corner = { x: C.x + Math.sign(m.x - C.x) * 44, y: C.y + Math.sign(m.y - C.y) * 44 };
    const e = along(m, ESC_T);
    const { ux, uy, px, py, len } = armAxes(m);
    const end = { x: m.x - ux * 34, y: m.y - uy * 34 };
    void len;
    const feed = `M${corner.x} ${corner.y}L${(e.x - ux * 22).toFixed(1)} ${(e.y - uy * 22).toFixed(1)}`;
    const phases = [-6, 0, 6].map((o) => {
      const s = { x: e.x + ux * 22 + px * o, y: e.y + uy * 22 + py * o };
      const t = { x: end.x + px * o, y: end.y + py * o };
      return `M${s.x.toFixed(1)} ${s.y.toFixed(1)}L${t.x.toFixed(1)} ${t.y.toFixed(1)}`;
    });
    return [feed, ...phases];
  }),
};

/** Balloon positions (in open space) and the point each leader line touches. */
export const ANCHORS: Record<string, { x: number; y: number; tx: number; ty: number }> = {
  cpu: { x: 700, y: 262, tx: 546, ty: 304 },
  mem: { x: 700, y: 410, tx: 630, ty: 348 },
  io: { x: 500, y: 128, tx: 500, ty: 186 },
  dbg: { x: 296, y: 340, tx: 374, ty: 340 },
  rf: { x: 500, y: 592, tx: 500, ty: 466 },
};

/** Which net lights up for each component. */
export const COMP_NET: Record<string, NetId | "all"> = {
  cpu: "all",
  mem: "mem",
  io: "io",
  dbg: "dbg",
  rf: "rf",
};
