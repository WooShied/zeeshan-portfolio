/**
 * Procedural city block and an analytic ray tracer for the simulated LiDAR.
 * Units are metres; y is up. Everything here is synthetic.
 */

export const CLS = { ground: 0, building: 1, vegetation: 2, vehicle: 3, pole: 4 } as const;
export type Cls = (typeof CLS)[keyof typeof CLS];

interface PrimBase {
  cls: Cls;
  refl: number;
  /** 2D bounding circle for per-column culling */
  cx: number;
  cz: number;
  r: number;
}
interface Box extends PrimBase {
  k: 0;
  x0: number;
  y0: number;
  z0: number;
  x1: number;
  y1: number;
  z1: number;
}
interface Sphere extends PrimBase {
  k: 1;
  cy: number;
  rad: number;
  sy: number; // vertical squash (ellipsoid canopies)
}
interface Cyl extends PrimBase {
  k: 2;
  rad: number;
  y0: number;
  y1: number;
}
export type Prim = Box | Sphere | Cyl;

export interface Hit {
  t: number;
  nx: number;
  ny: number;
  nz: number;
  cls: Cls;
  refl: number;
}

/** Small deterministic RNG so the city is the same on every visit. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, cls: Cls, refl: number): Box => ({
  k: 0,
  x0,
  y0,
  z0,
  x1,
  y1,
  z1,
  cls,
  refl,
  cx: (x0 + x1) / 2,
  cz: (z0 + z1) / 2,
  r: Math.hypot(x1 - x0, z1 - z0) / 2,
});

export const EXTENT = 78;

export function buildCity(seed = 7): Prim[] {
  const R = rng(seed);
  const prims: Prim[] = [];
  const cross = (z: number) => Math.abs(z) < 10; // the cross street

  // Buildings along both sides of the main street (x) and the cross street (z)
  for (const side of [-1, 1]) {
    let z = -EXTENT + 4;
    while (z < EXTENT - 6) {
      const w = 8 + R() * 10;
      if (cross(z) || cross(z + w)) {
        z += 4;
        continue;
      }
      const depth = 9 + R() * 12;
      const h = 6 + R() * 20;
      const xa = side * 10.5;
      const xb = side * (10.5 + depth);
      prims.push(box(Math.min(xa, xb), 0, z, Math.max(xa, xb), h, z + w, CLS.building, 0.55 + R() * 0.25));
      if (R() < 0.45) {
        // setback tower
        const inset = 1.5 + R() * 2;
        const xc = side * (10.5 + inset);
        const xd = side * (10.5 + depth - inset);
        prims.push(box(Math.min(xc, xd), h, z + inset, Math.max(xc, xd), h + 4 + R() * 10, z + w - inset, CLS.building, 0.6));
      }
      if (R() < 0.35) {
        // rooftop plant
        const px = side * (10.5 + depth * (0.3 + R() * 0.4));
        prims.push(box(px - 1.2, h, z + w / 2 - 1.5, px + 1.2, h + 1.6, z + w / 2 + 1.5, CLS.building, 0.4));
      }
      z += w + 1.5 + R() * 3;
    }
  }
  // Cross-street frontages
  for (const sideZ of [-1, 1]) {
    for (const sideX of [-1, 1]) {
      const z0 = sideZ * 11;
      const z1 = sideZ * (11 + 8 + R() * 6);
      const x0 = sideX * 34;
      const x1 = sideX * (34 + 14 + R() * 12);
      prims.push(box(Math.min(x0, x1), 0, Math.min(z0, z1), Math.max(x0, x1), 8 + R() * 14, Math.max(z0, z1), CLS.building, 0.6));
    }
  }

  // Street trees, poles and parked cars on the main street
  for (const side of [-1, 1]) {
    for (let z = -EXTENT + 6; z < EXTENT - 4; z += 7 + R() * 5) {
      if (cross(z)) continue;
      const roll = R();
      const x = side * 8.6;
      if (roll < 0.5) {
        const h = 3 + R() * 1.5;
        prims.push({ k: 2, cls: CLS.vegetation, refl: 0.35, cx: x, cz: z, r: 0.3, rad: 0.24, y0: 0, y1: h });
        const cr = 1.7 + R() * 1.0;
        prims.push({ k: 1, cls: CLS.vegetation, refl: 0.3, cx: x, cz: z, r: cr, cy: h + cr * 0.6, rad: cr, sy: 0.8 + R() * 0.3 });
      } else if (roll < 0.68) {
        prims.push({ k: 2, cls: CLS.pole, refl: 0.9, cx: x - side * 0.5, cz: z, r: 0.2, rad: 0.12, y0: 0, y1: 7.5 });
        prims.push(box(x - side * 0.5 - 0.1, 7.3, z - 0.1, x - side * 0.5 - side * 2.2 + 0.1 * side, 7.5, z + 0.1, CLS.pole, 0.9));
      }
    }
    // cars
    for (let z = -EXTENT + 8; z < EXTENT - 8; z += 5.2 + R() * 6) {
      if (cross(z) || R() < 0.3) continue;
      const x = side * 5.6;
      const l = 4.2 + R() * 0.6;
      prims.push(box(x - 0.95, 0.25, z, x + 0.95, 1.05, z + l, CLS.vehicle, 0.8));
      prims.push(box(x - 0.85, 1.05, z + l * 0.25, x + 0.85, 1.6, z + l * 0.75, CLS.vehicle, 0.5));
    }
  }
  // A low wall and a bus shelter for variety
  prims.push(box(-9.2, 0, 22, -9, 1.1, 40, CLS.building, 0.5));
  prims.push(box(7.6, 0, -30, 9.4, 2.6, -26, CLS.building, 0.7));
  return prims;
}

/** Ground height: a gentle camber plus very small noise. */
export function groundY(x: number, z: number) {
  const road = Math.max(0, 1 - Math.abs(x) / 9) * 0.06; // crown of the road
  const kerb = Math.abs(x) > 7 && Math.abs(x) < 10 && Math.abs(z) > 10 ? 0.15 : 0;
  return road + kerb + Math.sin(x * 0.11 + z * 0.07) * 0.08;
}

/** Cull primitives to those a horizontal ray column could reach. */
export function columnCandidates(prims: Prim[], ox: number, oz: number, dx: number, dz: number, maxR: number, out: Prim[]) {
  out.length = 0;
  for (const p of prims) {
    const vx = p.cx - ox;
    const vz = p.cz - oz;
    const t = vx * dx + vz * dz;
    if (t < -p.r || t - p.r > maxR) continue;
    const d2 = vx * vx + vz * vz - t * t;
    if (d2 > p.r * p.r) continue;
    out.push(p);
  }
  return out;
}

/** Closest hit along a ray, or null. */
export function trace(cands: Prim[], ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxR: number, hit: Hit): boolean {
  let best = maxR;
  let found = false;
  // ground
  if (dy < -1e-4) {
    const t = -oy / dy;
    if (t < best) {
      best = t;
      found = true;
      hit.nx = 0;
      hit.ny = 1;
      hit.nz = 0;
      hit.cls = CLS.ground;
      hit.refl = 0.32;
    }
  }
  for (const p of cands) {
    if (p.k === 0) {
      // slab test, unrolled (no allocation per ray)
      let tmin = -Infinity;
      let tmax = Infinity;
      let axis = 0;
      let sign = 0;
      let t0: number;
      let t1: number;
      // x
      if (Math.abs(dx) < 1e-9) {
        if (ox < p.x0 || ox > p.x1) continue;
      } else {
        t0 = (p.x0 - ox) / dx;
        t1 = (p.x1 - ox) / dx;
        if (t0 > t1) {
          if (t1 > tmin) {
            tmin = t1;
            axis = 0;
            sign = 1;
          }
          if (t0 < tmax) tmax = t0;
        } else {
          if (t0 > tmin) {
            tmin = t0;
            axis = 0;
            sign = -1;
          }
          if (t1 < tmax) tmax = t1;
        }
        if (tmin > tmax) continue;
      }
      // y
      if (Math.abs(dy) < 1e-9) {
        if (oy < p.y0 || oy > p.y1) continue;
      } else {
        t0 = (p.y0 - oy) / dy;
        t1 = (p.y1 - oy) / dy;
        if (t0 > t1) {
          if (t1 > tmin) {
            tmin = t1;
            axis = 1;
            sign = 1;
          }
          if (t0 < tmax) tmax = t0;
        } else {
          if (t0 > tmin) {
            tmin = t0;
            axis = 1;
            sign = -1;
          }
          if (t1 < tmax) tmax = t1;
        }
        if (tmin > tmax) continue;
      }
      // z
      if (Math.abs(dz) < 1e-9) {
        if (oz < p.z0 || oz > p.z1) continue;
      } else {
        t0 = (p.z0 - oz) / dz;
        t1 = (p.z1 - oz) / dz;
        if (t0 > t1) {
          if (t1 > tmin) {
            tmin = t1;
            axis = 2;
            sign = 1;
          }
          if (t0 < tmax) tmax = t0;
        } else {
          if (t0 > tmin) {
            tmin = t0;
            axis = 2;
            sign = -1;
          }
          if (t1 < tmax) tmax = t1;
        }
        if (tmin > tmax) continue;
      }
      if (tmin > 0.05 && tmin < best) {
        best = tmin;
        found = true;
        hit.nx = axis === 0 ? sign : 0;
        hit.ny = axis === 1 ? sign : 0;
        hit.nz = axis === 2 ? sign : 0;
        hit.cls = p.cls;
        hit.refl = p.refl;
      }
    } else if (p.k === 1) {
      // ellipsoid (sphere squashed in y)
      const sy = p.sy;
      const lx = ox - p.cx;
      const ly = (oy - p.cy) / sy;
      const lz = oz - p.cz;
      const ddy = dy / sy;
      const a = dx * dx + ddy * ddy + dz * dz;
      const b = 2 * (lx * dx + ly * ddy + lz * dz);
      const c = lx * lx + ly * ly + lz * lz - p.rad * p.rad;
      const disc = b * b - 4 * a * c;
      if (disc > 0) {
        const t = (-b - Math.sqrt(disc)) / (2 * a);
        if (t > 0.05 && t < best) {
          best = t;
          found = true;
          const hx = lx + dx * t;
          const hy = ly + ddy * t;
          const hz = lz + dz * t;
          const n = Math.hypot(hx, hy, hz) || 1;
          hit.nx = hx / n;
          hit.ny = hy / n;
          hit.nz = hz / n;
          hit.cls = p.cls;
          hit.refl = p.refl;
        }
      }
    } else {
      // vertical cylinder
      const lx = ox - p.cx;
      const lz = oz - p.cz;
      const a = dx * dx + dz * dz;
      if (a < 1e-9) continue;
      const b = 2 * (lx * dx + lz * dz);
      const c = lx * lx + lz * lz - p.rad * p.rad;
      const disc = b * b - 4 * a * c;
      if (disc > 0) {
        const t = (-b - Math.sqrt(disc)) / (2 * a);
        const y = oy + dy * t;
        if (t > 0.05 && t < best && y >= p.y0 && y <= p.y1) {
          best = t;
          found = true;
          const hx = lx + dx * t;
          const hz = lz + dz * t;
          const n = Math.hypot(hx, hz) || 1;
          hit.nx = hx / n;
          hit.ny = 0;
          hit.nz = hz / n;
          hit.cls = p.cls;
          hit.refl = p.refl;
        }
      }
    }
  }
  hit.t = best;
  return found;
}

/** Flight path: down the main street, through the intersection and back, weaving. */
export function flightPose(u: number) {
  const z = Math.sin(u) * 58;
  const x = Math.sin(u * 2.0) * 4.5;
  const y = 7.5 + Math.sin(u * 3.0) * 1.6;
  // heading from the path derivative
  const dz = Math.cos(u) * 58;
  const dx = Math.cos(u * 2.0) * 9;
  return { x, y, z, yaw: Math.atan2(dx, dz) };
}

/** Polynomial approximation of the Turbo colormap. */
export function turbo(t: number): [number, number, number] {
  t = Math.min(1, Math.max(0, t));
  const r = 0.13572138 + t * (4.6153926 + t * (-42.66032258 + t * (132.13108234 + t * (-152.94239396 + t * 59.28637943))));
  const g = 0.09140261 + t * (2.19418839 + t * (4.84296658 + t * (-14.18503333 + t * (4.27729857 + t * 2.82956604))));
  const b = 0.1066733 + t * (12.64194608 + t * (-60.58204836 + t * (110.36276771 + t * (-89.90310912 + t * 27.34824973))));
  return [Math.min(1, Math.max(0, r)), Math.min(1, Math.max(0, g)), Math.min(1, Math.max(0, b))];
}
