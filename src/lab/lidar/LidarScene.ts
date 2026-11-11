import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CLS, EXTENT, buildCity, columnCandidates, flightPose, groundY, rng, trace, turbo, type Hit, type Prim } from "./world";

export type ColorMode = "height" | "intensity" | "range" | "class";
export type ViewMode = "orbit" | "chase" | "top";

export interface LidarSettings {
  beams: 16 | 32 | 64;
  color: ColorMode;
  view: ViewMode;
  pointSize: number;
  speed: number; // m/s
  showBeams: boolean;
  showPath: boolean;
}

export interface LidarStats {
  mapPoints: number;
  raysPerSec: number;
  fps: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  coverage: number;
}

const MAX_MAP = 900_000;
const H_STEPS = 720; // azimuth steps per revolution (0.5°)
const REV_HZ = 10;
const MAX_RANGE = 62;
const VOXEL = 0.2;
const FOV_UP = (12 * Math.PI) / 180;
const FOV_DOWN = (-34 * Math.PI) / 180;

const CLASS_RGB: Record<number, [number, number, number]> = {
  [CLS.ground]: [0.42, 0.4, 0.36],
  [CLS.building]: [0.37, 0.83, 0.8],
  [CLS.vegetation]: [0.45, 0.82, 0.38],
  [CLS.vehicle]: [0.95, 0.69, 0.29],
  [CLS.pole]: [0.95, 0.93, 0.88],
};

const mapVert = /* glsl */ `
  attribute vec3 color;
  attribute float birth;
  uniform float uTime;
  uniform float uSize;
  uniform float uPR;
  varying vec3 vColor;
  varying float vFresh;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float fresh = exp(-max(0.0, uTime - birth) * 2.2);
    vFresh = fresh;
    float dist = -mv.z;
    gl_PointSize = clamp(uSize * uPR * (34.0 / dist) * (1.0 + fresh * 0.9), 1.0, 14.0 * uPR);
    float fog = smoothstep(170.0, 30.0, dist);
    vColor = color * mix(0.16, 1.0, fog);
  }
`;
const mapFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vFresh;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    vec3 col = vColor * (1.0 + vFresh * 1.6) + vec3(0.6, 1.0, 0.97) * vFresh * 0.35;
    gl_FragColor = vec4(col, 1.0);
  }
`;
const liveVert = /* glsl */ `
  attribute vec3 color;
  uniform float uSize;
  uniform float uPR;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uSize * 1.5 * uPR * (34.0 / -mv.z), 1.5, 16.0 * uPR);
    vColor = color;
  }
`;
const liveFrag = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * a, 1.0);
  }
`;

/**
 * Simulated spinning LiDAR on a drone flying through a procedural city.
 * Every return is ray-traced against the scene, registered with the known
 * pose and voxel-deduplicated into a growing map. Simulated data only.
 */
export class LidarScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);
  private controls: OrbitControls;
  private clock = new THREE.Clock();
  private raf = 0;
  private paused = false;
  private disposed = false;
  private interacting = false;

  private prims: Prim[];
  private cands: Prim[] = [];
  private hit: Hit = { t: 0, nx: 0, ny: 1, nz: 0, cls: 0, refl: 0 };
  private noise = rng(99);

  // map storage (+ per-point features so colour modes can be switched)
  private mapGeo = new THREE.BufferGeometry();
  private mapPos = new Float32Array(MAX_MAP * 3);
  private mapCol = new Float32Array(MAX_MAP * 3);
  private mapBirth = new Float32Array(MAX_MAP);
  private fH = new Float32Array(MAX_MAP);
  private fI = new Float32Array(MAX_MAP);
  private fR = new Float32Array(MAX_MAP);
  private fC = new Uint8Array(MAX_MAP);
  private mapCount = 0;
  private mapHead = 0;
  private voxels = new Set<number>();
  private dirtyFrom = -1;
  private dirtyTo = -1;
  private mapMat: THREE.ShaderMaterial;

  // live revolution
  private liveGeo = new THREE.BufferGeometry();
  private livePos = new Float32Array(H_STEPS * 64 * 3);
  private liveCol = new Float32Array(H_STEPS * 64 * 3);
  private liveMat: THREE.ShaderMaterial;

  // laser fan (most recent columns)
  private fanCols = 10;
  private fanGeo = new THREE.BufferGeometry();
  private fanPos = new Float32Array(this.fanCols * 64 * 2 * 3);
  private fanCol = new Float32Array(this.fanCols * 64 * 2 * 3);
  private fanLines: THREE.LineSegments;
  private fanHead = 0;

  private drone = new THREE.Group();
  private rotor: THREE.Object3D[] = [];
  private pathGeo = new THREE.BufferGeometry();
  private pathPos = new Float32Array(1200 * 3);
  private pathCount = 0;
  private pathLine: THREE.Line;
  private rings: THREE.Group;

  private u = -Math.PI / 2;
  private az = 0;
  private colAcc = 0;
  private time = 0;
  private raysWindow = 0;
  private statT = 0;
  private frames = 0;
  private lastStats: LidarStats = { mapPoints: 0, raysPerSec: 0, fps: 0, x: 0, y: 0, z: 0, yaw: 0, coverage: 0 };
  private zoom = 1.15;

  constructor(
    private host: HTMLElement,
    private s: LidarSettings,
    private opts: { reduce: boolean; coarse: boolean; onStats: (st: LidarStats) => void },
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setClearColor(0x05080a, 1);
    this.renderer.domElement.className = "lidar__canvas";
    host.appendChild(this.renderer.domElement);
    this.scene.fog = new THREE.FogExp2(0x05080a, 0.006);

    this.prims = buildCity();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = 1.45;
    this.controls.autoRotate = !opts.reduce;
    this.controls.autoRotateSpeed = 0.35;
    this.controls.addEventListener("start", () => (this.interacting = true));
    this.controls.addEventListener("end", () => (this.interacting = false));
    if (opts.coarse) {
      this.controls.enableRotate = false;
      this.renderer.domElement.style.touchAction = "pan-y";
    }
    this.camera.position.set(-38, 34, -52);
    this.controls.target.set(0, 4, -40);

    this.buildStatic();

    // map points
    this.mapGeo.setAttribute("position", new THREE.BufferAttribute(this.mapPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.mapGeo.setAttribute("color", new THREE.BufferAttribute(this.mapCol, 3).setUsage(THREE.DynamicDrawUsage));
    this.mapGeo.setAttribute("birth", new THREE.BufferAttribute(this.mapBirth, 1).setUsage(THREE.DynamicDrawUsage));
    this.mapGeo.setDrawRange(0, 0);
    this.mapMat = new THREE.ShaderMaterial({
      vertexShader: mapVert,
      fragmentShader: mapFrag,
      uniforms: { uTime: { value: 0 }, uSize: { value: s.pointSize }, uPR: { value: this.renderer.getPixelRatio() } },
    });
    const mapPts = new THREE.Points(this.mapGeo, this.mapMat);
    mapPts.frustumCulled = false;
    this.scene.add(mapPts);

    // live scan
    this.liveGeo.setAttribute("position", new THREE.BufferAttribute(this.livePos, 3).setUsage(THREE.DynamicDrawUsage));
    this.liveGeo.setAttribute("color", new THREE.BufferAttribute(this.liveCol, 3).setUsage(THREE.DynamicDrawUsage));
    this.liveMat = new THREE.ShaderMaterial({
      vertexShader: liveVert,
      fragmentShader: liveFrag,
      uniforms: { uSize: { value: s.pointSize }, uPR: { value: this.renderer.getPixelRatio() } },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });
    const live = new THREE.Points(this.liveGeo, this.liveMat);
    live.frustumCulled = false;
    this.scene.add(live);

    // laser fan
    this.fanGeo.setAttribute("position", new THREE.BufferAttribute(this.fanPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.fanGeo.setAttribute("color", new THREE.BufferAttribute(this.fanCol, 3).setUsage(THREE.DynamicDrawUsage));
    this.fanLines = new THREE.LineSegments(
      this.fanGeo,
      new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }),
    );
    this.fanLines.frustumCulled = false;
    this.scene.add(this.fanLines);

    // flight path
    this.pathGeo.setAttribute("position", new THREE.BufferAttribute(this.pathPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.pathLine = new THREE.Line(this.pathGeo, new THREE.LineBasicMaterial({ color: 0xf2b04a, transparent: true, opacity: 0.85 }));
    this.pathLine.frustumCulled = false;
    this.scene.add(this.pathLine);

    this.rings = this.buildRings();
    this.scene.add(this.rings);
    this.scene.add(this.drone);

    // Pre-scan a little so the first frame already shows a map.
    for (let i = 0; i < 70; i++) this.step(1 / 30, false);
    this.flushMap();

    this.resize();
    this.loop();
  }

  /* ── Static scene dressing ──────────────────────────────── */

  private buildStatic() {
    const grid = new THREE.GridHelper(EXTENT * 2.4, 48, 0x1d4a47, 0x10201f);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.55;
    grid.position.y = -0.02;
    this.scene.add(grid);

    // the sensor platform: a small dark quad with a glowing LiDAR head
    const dark = new THREE.MeshBasicMaterial({ color: 0x1a2124 });
    const edge = new THREE.LineBasicMaterial({ color: 0x5fd4cc, transparent: true, opacity: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 1.6), dark);
    this.drone.add(body);
    this.drone.add(new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), edge));
    for (const [x, z] of [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 1.6), dark);
      arm.position.set(x * 0.6, 0, z * 0.6);
      arm.rotation.y = Math.atan2(x, z);
      this.drone.add(arm);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.62, 0.68, 40),
        new THREE.MeshBasicMaterial({ color: 0x5fd4cc, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x * 1.15, 0.12, z * 1.15);
      this.drone.add(ring);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.08), new THREE.MeshBasicMaterial({ color: 0x9fe8e2 }));
      blade.position.set(x * 1.15, 0.14, z * 1.15);
      this.drone.add(blade);
      this.rotor.push(blade);
    }
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.26, 24), new THREE.MeshBasicMaterial({ color: 0x5fd4cc }));
    head.position.y = -0.3;
    this.drone.add(head);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTexture(), color: 0x5fd4cc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    glow.scale.set(5, 5, 5);
    glow.position.y = -0.3;
    this.drone.add(glow);
  }

  private buildRings() {
    const g = new THREE.Group();
    for (const r of [10, 20, 30, 45, 60]) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r - 0.06, r + 0.06, 128),
        new THREE.MeshBasicMaterial({ color: 0x5fd4cc, transparent: true, opacity: r === 60 ? 0.28 : 0.14, side: THREE.DoubleSide, depthWrite: false }),
      );
      ring.rotation.x = -Math.PI / 2;
      g.add(ring);
    }
    return g;
  }

  /* ── Simulation ─────────────────────────────────────────── */

  /** Advance the flight and fire every LiDAR column due in dt seconds. */
  private step(dt: number, render = true) {
    const pathLen = 58 * 2 * 2; // rough metres per full cycle of u
    this.u += (this.s.speed * dt) / (pathLen / (Math.PI * 2));
    const pose = flightPose(this.u);
    this.drone.position.set(pose.x, pose.y, pose.z);
    this.drone.rotation.y = pose.yaw;
    this.drone.rotation.z = Math.sin(this.u * 2) * 0.12;
    this.rings.position.set(pose.x, groundY(pose.x, pose.z) + 0.03, pose.z);

    // trajectory
    if (this.pathCount < 1200) this.pathCount++;
    else this.pathPos.copyWithin(0, 3);
    const i = (this.pathCount - 1) * 3;
    this.pathPos[i] = pose.x;
    this.pathPos[i + 1] = pose.y;
    this.pathPos[i + 2] = pose.z;

    const B = this.s.beams;
    this.colAcc += H_STEPS * REV_HZ * dt;
    const cols = Math.floor(this.colAcc);
    this.colAcc -= cols;
    const ox = pose.x;
    const oy = pose.y - 0.3;
    const oz = pose.z;

    for (let c = 0; c < cols; c++) {
      this.az = (this.az + 1) % H_STEPS;
      const a = (this.az / H_STEPS) * Math.PI * 2;
      const dx = Math.sin(a);
      const dz = Math.cos(a);
      columnCandidates(this.prims, ox, oz, dx, dz, MAX_RANGE, this.cands);
      const fanSlot = this.fanHead;
      if (render && c >= cols - 1) this.fanHead = (this.fanHead + 1) % this.fanCols;
      for (let b = 0; b < B; b++) {
        const el = FOV_DOWN + ((FOV_UP - FOV_DOWN) * b) / (B - 1);
        const ce = Math.cos(el);
        const rx = dx * ce;
        const ry = Math.sin(el);
        const rz = dz * ce;
        const li = (this.az * 64 + b) * 3;
        const ok = trace(this.cands, ox, oy, oz, rx, ry, rz, MAX_RANGE, this.hit);
        this.raysWindow++;
        if (!ok) {
          this.liveCol[li] = this.liveCol[li + 1] = this.liveCol[li + 2] = 0;
          continue;
        }
        const t = this.hit.t + gauss(this.noise) * 0.025;
        const px = ox + rx * t;
        let py = oy + ry * t;
        const pz = oz + rz * t;
        if (this.hit.cls === CLS.ground) py = groundY(px, pz);
        const inc = Math.abs(this.hit.nx * rx + this.hit.ny * ry + this.hit.nz * rz);
        const inten = Math.min(1, this.hit.refl * (0.35 + 0.75 * inc) + gauss(this.noise) * 0.03);

        // live revolution: bright cyan-white, brighter when close
        this.livePos[li] = px;
        this.livePos[li + 1] = py;
        this.livePos[li + 2] = pz;
        const k = 0.35 + 0.65 * (1 - t / MAX_RANGE);
        this.liveCol[li] = 0.55 * k;
        this.liveCol[li + 1] = 1.0 * k;
        this.liveCol[li + 2] = 0.95 * k;

        if (render && c === cols - 1 && b % 2 === 0) this.writeFan(fanSlot, b, ox, oy, oz, px, py, pz, t);
        if (t > 1.2) this.addPoint(px, py, pz, inten, t, this.hit.cls);
      }
    }
    this.time += dt;
  }

  private writeFan(slot: number, b: number, ox: number, oy: number, oz: number, px: number, py: number, pz: number, t: number) {
    const i = (slot * 64 + b) * 6;
    this.fanPos[i] = ox;
    this.fanPos[i + 1] = oy;
    this.fanPos[i + 2] = oz;
    this.fanPos[i + 3] = px;
    this.fanPos[i + 4] = py;
    this.fanPos[i + 5] = pz;
    const k = 0.45 * (1 - t / MAX_RANGE);
    this.fanCol[i] = 0;
    this.fanCol[i + 1] = 0.05;
    this.fanCol[i + 2] = 0.05;
    this.fanCol[i + 3] = 0.37 * k;
    this.fanCol[i + 4] = 0.83 * k;
    this.fanCol[i + 5] = 0.8 * k;
  }

  private addPoint(x: number, y: number, z: number, inten: number, range: number, cls: number) {
    const ix = Math.floor(x / VOXEL);
    const iy = Math.floor(y / VOXEL);
    const iz = Math.floor(z / VOXEL);
    const key = ix * 73856093 + iy * 19349663 + iz * 83492791;
    if (this.voxels.has(key)) return;
    this.voxels.add(key);
    const n = this.mapHead;
    this.mapPos[n * 3] = x;
    this.mapPos[n * 3 + 1] = y;
    this.mapPos[n * 3 + 2] = z;
    this.mapBirth[n] = this.time;
    this.fH[n] = y;
    this.fI[n] = inten;
    this.fR[n] = range;
    this.fC[n] = cls;
    this.colorPoint(n);
    if (this.dirtyFrom < 0 || n < this.dirtyFrom) this.dirtyFrom = n;
    if (n > this.dirtyTo) this.dirtyTo = n;
    this.mapHead = (this.mapHead + 1) % MAX_MAP;
    if (this.mapCount < MAX_MAP) this.mapCount++;
  }

  private colorPoint(n: number) {
    let r: number;
    let g: number;
    let b: number;
    switch (this.s.color) {
      case "height":
        [r, g, b] = turbo(this.fH[n] / 24);
        break;
      case "range":
        [r, g, b] = turbo(1 - this.fR[n] / MAX_RANGE);
        break;
      case "intensity": {
        const v = this.fI[n];
        r = 0.08 + v * 0.75;
        g = 0.12 + v * 0.95;
        b = 0.14 + v * 0.9;
        break;
      }
      default:
        [r, g, b] = CLASS_RGB[this.fC[n]];
    }
    this.mapCol[n * 3] = r;
    this.mapCol[n * 3 + 1] = g;
    this.mapCol[n * 3 + 2] = b;
  }

  private flushMap() {
    if (this.dirtyFrom < 0) return;
    const geo = this.mapGeo;
    for (const name of ["position", "color", "birth"] as const) {
      const attr = geo.getAttribute(name) as THREE.BufferAttribute;
      const size = attr.itemSize;
      attr.clearUpdateRanges();
      attr.addUpdateRange(this.dirtyFrom * size, (this.dirtyTo - this.dirtyFrom + 1) * size);
      attr.needsUpdate = true;
    }
    geo.setDrawRange(0, this.mapCount);
    this.dirtyFrom = this.dirtyTo = -1;
  }

  /* ── Public API ─────────────────────────────────────────── */

  update(next: LidarSettings) {
    const recolor = next.color !== this.s.color;
    this.s = next;
    this.mapMat.uniforms.uSize.value = next.pointSize;
    this.liveMat.uniforms.uSize.value = next.pointSize;
    this.fanLines.visible = next.showBeams;
    this.pathLine.visible = next.showPath;
    if (recolor) {
      for (let n = 0; n < this.mapCount; n++) this.colorPoint(n);
      const c = this.mapGeo.getAttribute("color") as THREE.BufferAttribute;
      c.clearUpdateRanges();
      c.needsUpdate = true;
    }
    if (next.beams < 64) {
      // clear beams no longer fired from the live ring
      for (let a = 0; a < H_STEPS; a++)
        for (let b = next.beams; b < 64; b++) {
          const li = (a * 64 + b) * 3;
          this.liveCol[li] = this.liveCol[li + 1] = this.liveCol[li + 2] = 0;
        }
    }
    if (this.paused) this.renderOnce();
  }

  reset() {
    this.voxels.clear();
    this.mapCount = 0;
    this.mapHead = 0;
    this.mapGeo.setDrawRange(0, 0);
    this.liveCol.fill(0);
    this.fanCol.fill(0);
    this.pathCount = 0;
    this.u = -Math.PI / 2;
    this.time = 0;
    for (let i = 0; i < 40; i++) this.step(1 / 30, false);
    this.flushMap();
    this.markLive();
    if (this.paused) this.renderOnce();
  }

  zoomBy(f: number) {
    this.zoom = Math.min(2.4, Math.max(0.45, this.zoom * f));
    if (this.paused) this.renderOnce();
  }

  setRunning(run: boolean) {
    this.simRunning = run;
  }
  private simRunning = true;

  setPaused(p: boolean) {
    if (p === this.paused) return;
    this.paused = p;
    if (!p) {
      this.clock.getDelta();
      this.loop();
    } else cancelAnimationFrame(this.raf);
  }

  resize() {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.paused) this.renderOnce();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.controls.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((x) => x.dispose());
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /* ── Frame loop ─────────────────────────────────────────── */

  private markLive() {
    for (const name of ["position", "color"] as const) {
      const a = this.liveGeo.getAttribute(name) as THREE.BufferAttribute;
      a.needsUpdate = true;
    }
    for (const name of ["position", "color"] as const) {
      const a = this.fanGeo.getAttribute(name) as THREE.BufferAttribute;
      a.needsUpdate = true;
    }
    (this.pathGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    this.pathGeo.setDrawRange(0, this.pathCount);
  }

  private placeCamera(dt: number) {
    const p = this.drone.position;
    const k = Math.min(1, dt * 2.5);
    if (this.s.view === "chase") {
      const yaw = this.drone.rotation.y;
      const want = new THREE.Vector3(p.x - Math.sin(yaw) * 18 * this.zoom, p.y + 9 * this.zoom, p.z - Math.cos(yaw) * 18 * this.zoom);
      this.camera.position.lerp(want, k);
      this.controls.target.lerp(new THREE.Vector3(p.x + Math.sin(yaw) * 10, p.y - 2, p.z + Math.cos(yaw) * 10), k);
      this.controls.enabled = false;
      this.camera.lookAt(this.controls.target);
      return;
    }
    if (this.s.view === "top") {
      const want = new THREE.Vector3(p.x, 95 * this.zoom, p.z + 0.01);
      this.camera.position.lerp(want, k);
      this.controls.target.lerp(new THREE.Vector3(p.x, 0, p.z), k);
      this.controls.enabled = false;
      this.camera.lookAt(this.controls.target);
      return;
    }
    // orbit: follow the drone, keep the user's angle, apply zoom
    this.controls.enabled = true;
    const tgt = new THREE.Vector3(p.x * 0.6, 4, p.z * 0.85);
    const before = this.controls.target.clone();
    this.controls.target.lerp(tgt, k * 0.6);
    this.camera.position.add(this.controls.target.clone().sub(before));
    const off = this.camera.position.clone().sub(this.controls.target);
    const want = 62 * this.zoom;
    off.setLength(off.length() + (want - off.length()) * k);
    this.camera.position.copy(this.controls.target).add(off);
    this.controls.autoRotate = !this.opts.reduce && !this.interacting;
    this.controls.update();
  }

  private renderOnce() {
    this.placeCamera(1);
    this.renderer.render(this.scene, this.camera);
  }

  private loop = () => {
    if (this.paused || this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.simRunning) {
      // laser fan afterglow: older sweep columns fade out
      for (let i = 0; i < this.fanCol.length; i++) this.fanCol[i] *= 0.84;
      this.step(dt);
      this.flushMap();
      this.markLive();
      for (const r of this.rotor) r.rotation.y += dt * 40;
    }
    this.mapMat.uniforms.uTime.value = this.time;
    this.placeCamera(dt);
    this.renderer.render(this.scene, this.camera);

    // stats a few times a second
    this.frames++;
    this.statT += dt;
    if (this.statT > 0.4) {
      const p = this.drone.position;
      this.lastStats = {
        mapPoints: this.mapCount,
        raysPerSec: this.simRunning ? Math.round(this.raysWindow / this.statT) : 0,
        fps: Math.round(this.frames / this.statT),
        x: p.x,
        y: p.y,
        z: p.z,
        yaw: ((this.drone.rotation.y * 180) / Math.PI + 360) % 360,
        coverage: Math.min(1, this.mapCount / 700000),
      };
      this.opts.onStats(this.lastStats);
      this.raysWindow = 0;
      this.frames = 0;
      this.statT = 0;
    }
  };
}

function gauss(r: () => number) {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
