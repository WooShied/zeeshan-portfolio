import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { batteryLabel, blurDiscTexture, carbonTexture, radialTexture, stencilTexture } from "./textures";

export type PartId = "cpu" | "mem" | "io" | "dbg" | "rf";
export type ScreenPoint = { x: number; y: number; visible: boolean };
type Theme = "dark" | "light";

interface Options {
  reduce: boolean;
  coarse: boolean;
  theme: Theme;
  onHover: (id: PartId | null) => void;
  onSelect: (id: PartId) => void;
  /** Called every rendered frame with each part's projected anchor (px, relative to host). */
  onFrame: (pts: Record<PartId, ScreenPoint>, centre: { x: number; y: number }) => void;
}

/** An object that moves between its assembled and exploded position. */
interface Movable {
  obj: THREE.Object3D;
  home: THREE.Vector3;
  off: THREE.Vector3;
}

const SIG = new THREE.Color("#5fd4cc");

/**
 * A photoreal quadrotor built from primitives with physically based
 * materials. Parts can be highlighted (x-raying the shell and lighting
 * their wiring) and the whole airframe can be torn down into an
 * exploded view. Rendering pauses whenever the host is off-screen.
 */
export class DroneScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private drone = new THREE.Group();
  private clock = new THREE.Clock();
  private raf = 0;
  private paused = false;
  private disposed = false;

  private movables: Movable[] = [];
  private explode = 0;
  private explodeTarget = 0;
  private active: PartId | null = null;
  private hovered: PartId | null = null;
  private partMats = new Map<PartId, THREE.MeshStandardMaterial[]>();
  private partGlow = new Map<PartId, number>();
  private anchors = new Map<PartId, { obj: THREE.Object3D; local: THREE.Vector3 }>();
  private pickables: THREE.Object3D[] = [];

  private props: { obj: THREE.Object3D; dir: number; disc: THREE.Mesh }[] = [];
  private spin = 0;
  private lidarHead!: THREE.Object3D;
  private shellMat!: THREE.MeshPhysicalMaterial;
  private glassMats: THREE.MeshPhysicalMaterial[] = [];
  private shellOpacity = 1;
  private shadowMat!: THREE.ShadowMaterial;
  private aoMat!: THREE.MeshBasicMaterial;

  private wires: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; net: PartId | "esc"; ends: () => [THREE.Vector3, THREE.Vector3]; lift: number }[] = [];
  private wiresDirty = true;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private downAt: { x: number; y: number } | null = null;
  private interacting = false;
  private tmp = new THREE.Vector3();

  constructor(
    private host: HTMLElement,
    private opts: Options,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = "drone3d__canvas";
    host.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    this.camera.position.set(5.4, 2.7, 4.6);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.55, 0);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.55;
    this.controls.minPolarAngle = 0.7;
    this.controls.maxPolarAngle = 1.48;
    this.controls.autoRotate = !opts.reduce;
    this.controls.autoRotateSpeed = 0.45;
    // On touch screens the page must keep scrolling: no drag-rotate.
    if (opts.coarse) {
      this.controls.enableRotate = false;
      this.renderer.domElement.style.touchAction = "pan-y";
    }

    this.buildLights();
    this.buildDrone();
    this.scene.add(this.drone);
    this.setTheme(opts.theme);
    this.bindPointer();
    this.resize();
    this.loop();
  }

  /* ── Scene ─────────────────────────────────────────────── */

  private buildLights() {
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3.5, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.radius = 6;
    key.shadow.bias = -0.0004;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x9fe8e2, 1.1);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x223030, 0.35));

    // Shadow catcher + soft contact shadow (works on either theme background).
    this.shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), this.shadowMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.aoMat = new THREE.MeshBasicMaterial({ map: radialTexture("rgba(0,0,0,0.55)", "rgba(0,0,0,0)"), transparent: true, depthWrite: false });
    const ao = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), this.aoMat);
    ao.rotation.x = -Math.PI / 2;
    ao.position.y = 0.002;
    this.scene.add(ao);
  }

  private buildDrone() {
    /* Materials: matte charcoal hull, dark composite, restrained metal. */
    const carbonTex = carbonTexture();
    const hull = (this.shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x15171a,
      roughness: 0.48,
      metalness: 0.35,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.55,
      flatShading: true,
      transparent: true,
      opacity: 1,
    }));
    const armMat = new THREE.MeshPhysicalMaterial({ color: 0x131518, roughness: 0.5, metalness: 0.35, clearcoat: 0.35, clearcoatRoughness: 0.4, flatShading: true });
    const nacelleMat = new THREE.MeshStandardMaterial({ color: 0x101214, roughness: 0.45, metalness: 0.5, flatShading: true });
    const metal = new THREE.MeshStandardMaterial({ color: 0x8d9296, metalness: 1, roughness: 0.32 });
    const carbon = new THREE.MeshPhysicalMaterial({ map: carbonTex, roughness: 0.45, metalness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    const pcb = new THREE.MeshStandardMaterial({ color: 0x0e2b26, roughness: 0.42, metalness: 0.15 });
    const chip = new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 0.35, metalness: 0.2 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd2a94e, metalness: 1, roughness: 0.22 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x030405, roughness: 0.03, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.4 });

    const cast = <T extends THREE.Object3D>(o: T) => {
      o.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      return o;
    };
    const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      return o;
    };
    const add = (o: THREE.Object3D, off: [number, number, number] = [0, 0, 0]) => {
      cast(o);
      this.drone.add(o);
      this.movables.push({ obj: o, home: o.position.clone(), off: new THREE.Vector3(...off) });
      return o;
    };
    const part = (id: PartId, g: THREE.Group, anchor: THREE.Vector3, proxySize?: number) => {
      const mats: THREE.MeshStandardMaterial[] = [];
      g.traverse((c) => {
        const m = c as THREE.Mesh;
        if (!m.isMesh || Array.isArray(m.material)) return;
        const own = (m.material as THREE.MeshStandardMaterial).clone();
        own.userData.baseEmissive = own.emissiveIntensity ?? 0;
        own.userData.baseColor = own.emissive ? own.emissive.clone() : new THREE.Color(0);
        m.material = own;
        mats.push(own);
        m.userData.part = id;
        this.pickables.push(m);
      });
      if (proxySize) {
        const proxy = new THREE.Mesh(new THREE.BoxGeometry(proxySize, proxySize, proxySize), new THREE.MeshBasicMaterial());
        proxy.visible = false;
        proxy.position.copy(anchor);
        proxy.userData.part = id;
        g.add(proxy);
        this.pickables.push(proxy);
      }
      this.partMats.set(id, mats);
      this.partGlow.set(id, 0);
      this.anchors.set(id, { obj: g, local: anchor });
    };
    /** Extrude a top-view outline (x, z) into a chamfered slab. Outline z is world z. */
    const slab = (pts: [number, number][], depth: number, chamfer: number) => {
      const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
      const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: chamfer * 0.8, bevelSize: chamfer, bevelSegments: 1, curveSegments: 1 });
      g.rotateX(-Math.PI / 2);
      g.computeVertexNormals();
      return g;
    };
    const mirror = (half: [number, number][]) => [...half, ...half.slice(1, -1).reverse().map(([x, z]) => [-x, z] as [number, number])];

    /* Internals: battery, ESC, flight controller, logger, radio board */
    const label = batteryLabel();
    const battSide = new THREE.MeshStandardMaterial({ map: label, roughness: 0.55 });
    const battPlain = new THREE.MeshStandardMaterial({ color: 0x1b1e20, roughness: 0.6 });
    const batt = new THREE.Group();
    batt.position.set(0, 0.45, -0.1);
    batt.add(new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.12, 0.92, 3, 0.03), [battSide, battSide, battPlain, battPlain, battPlain, battPlain]));
    add(batt, [0, -0.62, 0]);

    const esc = new THREE.Group();
    esc.position.set(0, 0.555, 0.05);
    esc.add(mesh(new RoundedBoxGeometry(0.5, 0.025, 0.5, 2, 0.01), pcb));
    for (let k = 0; k < 8; k++) esc.add(mesh(new THREE.BoxGeometry(0.07, 0.02, 0.05), chip, -0.18 + (k % 4) * 0.12, 0.022, k < 4 ? 0.15 : -0.15));
    add(esc, [0, 0.1, 0]);

    const fc = new THREE.Group();
    fc.position.set(0, 0.64, 0.05);
    fc.add(mesh(new RoundedBoxGeometry(0.46, 0.025, 0.46, 2, 0.01), pcb.clone()));
    fc.add(mesh(new THREE.BoxGeometry(0.14, 0.025, 0.14), chip, 0, 0.025, 0));
    fc.add(mesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), chip, 0.13, 0.02, 0.1));
    for (let k = 0; k < 5; k++) fc.add(mesh(new THREE.BoxGeometry(0.025, 0.01, 0.01), gold, -0.12 + k * 0.06, 0.018, 0.2));
    fc.add(mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshStandardMaterial({ color: 0x5fd4cc, emissive: 0x5fd4cc, emissiveIntensity: 2 }), 0.16, 0.025, -0.16));
    add(fc, [0, 0.42, 0]);
    part("cpu", fc, new THREE.Vector3(0, 0.04, 0));

    const log = new THREE.Group();
    log.position.set(0.32, 0.6, -0.42);
    log.add(mesh(new RoundedBoxGeometry(0.2, 0.02, 0.28, 2, 0.006), pcb.clone()));
    log.add(mesh(new THREE.BoxGeometry(0.12, 0.01, 0.15), new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.5 }), 0, 0.015, 0.02));
    log.add(mesh(new THREE.BoxGeometry(0.12, 0.011, 0.04), new THREE.MeshStandardMaterial({ color: 0xf2b04a, roughness: 0.5 }), 0, 0.016, -0.04));
    add(log, [0.62, 0.3, 0]);
    part("mem", log, new THREE.Vector3(0, 0.02, 0), 0.26);

    /* Hull: one chamfered, faceted body with a raised spine */
    const hullOutline = mirror([
      [0, 1.12],
      [0.14, 1.0],
      [0.4, 0.5],
      [0.6, 0.12],
      [0.6, -0.36],
      [0.44, -0.84],
      [0.2, -1.02],
      [0, -0.96],
    ]);
    const shell = new THREE.Group();
    shell.position.set(0, 0.46, 0);
    shell.add(new THREE.Mesh(slab(hullOutline, 0.1, 0.13), hull));
    const spine = mesh(
      slab(
        mirror([
          [0, 0.7],
          [0.1, 0.5],
          [0.2, -0.05],
          [0.16, -0.6],
          [0, -0.72],
        ]),
        0.02,
        0.05,
      ),
      hull,
      0,
      0.23,
      0,
    );
    shell.add(spine);
    // panel lines and stencil markings
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x0c0d0e, transparent: true });
    this.glassMats.push(lineMat as unknown as THREE.MeshPhysicalMaterial);
    for (const z of [0.34, -0.3]) shell.add(mesh(new THREE.BoxGeometry(0.86, 0.004, 0.008), lineMat, 0, 0.207, z));
    const stencil = new THREE.MeshBasicMaterial({ map: stencilTexture(), transparent: true, depthWrite: false });
    this.glassMats.push(stencil as unknown as THREE.MeshPhysicalMaterial);
    const decal = mesh(new THREE.PlaneGeometry(0.44, 0.22), stencil, 0.36, 0.209, -0.5);
    decal.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    shell.add(decal);
    // sensor "eyes": two chevron slits at the chin
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x5fd4cc, emissive: 0x5fd4cc, emissiveIntensity: 2.2 });
    for (const s of [-1, 1]) {
      const eye = mesh(new THREE.BoxGeometry(0.22, 0.016, 0.02), eyeMat, s * 0.17, 0.08, 0.88);
      eye.rotation.y = s * -0.62;
      eye.rotation.z = s * 0.12;
      shell.add(eye);
    }
    const tail = mesh(new THREE.BoxGeometry(0.22, 0.02, 0.015), new THREE.MeshStandardMaterial({ color: 0xf2b04a, emissive: 0xf2b04a, emissiveIntensity: 1.6 }), 0, 0.12, -1.06);
    shell.add(tail);
    add(shell, [0, 1.1, 0]);

    /* Arms: thick faceted blades, motor nacelles, rotors, feet */
    const motors: [number, number, number][] = [
      [1.42, 1.22, 1], // front-right
      [-1.42, 1.22, -1], // front-left
      [1.38, -1.3, -1], // rear-right
      [-1.38, -1.3, 1], // rear-left
    ];
    const blurTex = blurDiscTexture();
    const propMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.45, metalness: 0.3 });
    const blade = new THREE.Shape();
    blade.moveTo(0.05, -0.028);
    blade.lineTo(0.42, -0.06);
    blade.lineTo(0.7, -0.035);
    blade.lineTo(0.74, 0.012);
    blade.lineTo(0.64, 0.03);
    blade.lineTo(0.05, 0.028);
    const bladeGeo = new THREE.ExtrudeGeometry(blade, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
    bladeGeo.rotateX(-Math.PI / 2);

    for (const [mx, mz, dir] of motors) {
      const L = Math.hypot(mx, mz);
      const arm = new THREE.Group();
      arm.rotation.y = -Math.atan2(mz, mx);
      arm.position.set(0, 0.47, 0);
      // arm blade in its own frame: +x points to the motor
      const armGeo = slab(
        [
          [0.3, 0.17],
          [L - 0.3, 0.1],
          [L - 0.12, 0.13],
          [L - 0.12, -0.13],
          [L - 0.3, -0.1],
          [0.3, -0.17],
        ].map(([x, z]) => [x, z] as [number, number]),
        0.05,
        0.035,
      );
      arm.add(new THREE.Mesh(armGeo, armMat));
      const inlay = mesh(new THREE.BoxGeometry(L * 0.55, 0.006, 0.07), carbon, L * 0.48, 0.09, 0);
      arm.add(inlay);

      // nacelle (octagonal) with a foot underneath
      const nacelle = new THREE.Group();
      nacelle.position.set(L, 0, 0);
      nacelle.add(mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.2, 8), nacelleMat, 0, 0.06, 0));
      nacelle.add(mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.06, 8), nacelleMat, 0, 0.19, 0));
      nacelle.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 32), metal, 0, 0.245, 0));
      const foot = mesh(
        new THREE.ExtrudeGeometry(
          new THREE.Shape([new THREE.Vector2(-0.1, 0), new THREE.Vector2(0.1, 0), new THREE.Vector2(0.03, -0.42), new THREE.Vector2(-0.02, -0.42)]),
          { depth: 0.03, bevelEnabled: false },
        ),
        nacelleMat,
        0.02,
        -0.02,
        -0.015,
      );
      foot.rotation.y = Math.PI / 2;
      foot.rotation.z = -0.25;
      nacelle.add(foot);
      // nav light on the outboard face
      const front = mz > 0;
      const ledCol = front ? 0x5fd4cc : 0xf2b04a;
      nacelle.add(mesh(new THREE.BoxGeometry(0.02, 0.03, 0.08), new THREE.MeshStandardMaterial({ color: ledCol, emissive: ledCol, emissiveIntensity: 2.6 }), 0.2, 0.06, 0));
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: radialTexture(front ? "rgba(95,212,204,0.85)" : "rgba(242,176,74,0.85)"),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      glow.scale.set(0.14, 0.14, 0.14);
      glow.position.set(0.22, 0.06, 0);
      nacelle.add(glow);
      arm.add(nacelle);

      // two-blade rotor and motion-blur disc
      const prop = new THREE.Group();
      prop.position.set(L, 0.3, 0);
      for (let b = 0; b < 2; b++) {
        const holder = new THREE.Group();
        holder.rotation.y = b * Math.PI;
        const bl = new THREE.Mesh(bladeGeo, propMat);
        bl.rotation.x = dir * 0.16;
        holder.add(bl);
        prop.add(holder);
      }
      prop.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.05, 8), propMat));
      prop.add(mesh(new THREE.ConeGeometry(0.05, 0.07, 8), metal, 0, 0.055, 0));
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(0.76, 64),
        new THREE.MeshBasicMaterial({ map: blurTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(L, 0.3, 0);
      arm.add(prop, disc);
      this.props.push({ obj: prop, dir, disc });

      cast(arm);
      disc.castShadow = false;
      glow.castShadow = false;
      this.drone.add(arm);
      const out = new THREE.Vector3(mx, 0, mz).normalize().multiplyScalar(0.45);
      this.movables.push({ obj: arm, home: arm.position.clone(), off: out });
      this.movables.push({ obj: prop, home: prop.position.clone(), off: new THREE.Vector3(0, 0.55, 0) });
      this.movables.push({ obj: disc, home: disc.position.clone(), off: new THREE.Vector3(0, 0.55, 0) });
    }

    /* EO/IR gimbal ball under the nose (part: io) */
    const gimbal = new THREE.Group();
    gimbal.position.set(0, 0.3, 0.6);
    gimbal.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 8), nacelleMat, 0, 0.08, 0));
    const yaw = new THREE.Group();
    const yoke = mesh(new THREE.BoxGeometry(0.34, 0.05, 0.08), nacelleMat, 0, 0.02, 0);
    yaw.add(yoke);
    for (const s of [-1, 1]) yaw.add(mesh(new THREE.BoxGeometry(0.03, 0.2, 0.09), nacelleMat, s * 0.16, -0.07, 0));
    const ball = mesh(new THREE.SphereGeometry(0.135, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0x2a2d30, roughness: 0.45, metalness: 0.4, clearcoat: 0.6 }), 0, -0.1, 0);
    yaw.add(ball);
    const lensWin = mesh(new THREE.CircleGeometry(0.075, 40), glass, 0, -0.1, 0.136);
    yaw.add(lensWin);
    yaw.add(mesh(new THREE.TorusGeometry(0.078, 0.006, 8, 40), new THREE.MeshStandardMaterial({ color: 0x5fd4cc, emissive: 0x5fd4cc, emissiveIntensity: 1 }), 0, -0.1, 0.134));
    yaw.add(mesh(new THREE.CircleGeometry(0.03, 24), glass, 0.08, -0.06, 0.112).rotateY(0.6));
    gimbal.add(yaw);
    this.lidarHead = yaw;
    add(gimbal, [0, -0.35, 0.45]);
    part("io", gimbal, new THREE.Vector3(0, -0.1, 0.12));

    /* Debug port: flush service panel on the port side (part: dbg) */
    const usb = new THREE.Group();
    usb.position.set(-0.6, 0.53, 0.0);
    usb.add(mesh(new RoundedBoxGeometry(0.03, 0.12, 0.22, 2, 0.008), nacelleMat));
    usb.add(mesh(new RoundedBoxGeometry(0.02, 0.035, 0.09, 2, 0.012), metal, -0.016, 0, 0));
    usb.add(mesh(new THREE.BoxGeometry(0.02, 0.012, 0.05), chip, -0.022, 0, 0));
    add(usb, [-0.6, 0.15, 0]);
    part("dbg", usb, new THREE.Vector3(-0.03, 0, 0), 0.26);

    /* Telemetry radio: board inside, swept blade antenna on the spine (part: rf) */
    const rx = new THREE.Group();
    rx.position.set(0, 0.62, -0.62);
    rx.add(mesh(new RoundedBoxGeometry(0.24, 0.02, 0.16, 2, 0.006), pcb.clone()));
    const fin = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.3, 0), new THREE.Vector2(0.1, 0.28), new THREE.Vector2(0.02, 0.28)]);
    const finMesh = mesh(new THREE.ExtrudeGeometry(fin, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1 }), nacelleMat, -0.01, 0.08, 0.12);
    finMesh.rotation.y = Math.PI / 2;
    rx.add(finMesh);
    add(rx, [0, 0.95, -0.55]);
    part("rf", rx, new THREE.Vector3(0, 0.25, 0.02), 0.3);

    /* Wiring: rebuilt whenever parts move, so it stretches in the teardown */
    const W = (net: PartId | "esc", from: THREE.Object3D, fromLocal: THREE.Vector3, to: THREE.Object3D, toLocal: THREE.Vector3, lift = 0.1) => {
      const mat = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.5, metalness: 0.2, emissive: SIG, emissiveIntensity: 0 });
      const m = new THREE.Mesh(new THREE.BufferGeometry(), mat);
      m.castShadow = true;
      this.drone.add(m);
      const ends = (): [THREE.Vector3, THREE.Vector3] => [this.localPoint(from, fromLocal), this.localPoint(to, toLocal)];
      this.wires.push({ mesh: m, mat, net, ends, lift });
    };
    W("io", fc, new THREE.Vector3(0, 0.02, 0.22), gimbal, new THREE.Vector3(0, 0.1, 0));
    W("mem", fc, new THREE.Vector3(0.2, 0.02, -0.18), log, new THREE.Vector3(-0.08, 0.01, 0.05));
    W("dbg", fc, new THREE.Vector3(-0.22, 0.02, 0), usb, new THREE.Vector3(0.02, 0, 0));
    W("rf", fc, new THREE.Vector3(0, 0.02, -0.22), rx, new THREE.Vector3(0, 0.01, 0.06));
    this.drone.children
      .filter((c) => c instanceof THREE.Group && (c as THREE.Group).children.some((k) => k instanceof THREE.Group && k.position.x > 1))
      .forEach((arm) => {
        const nacelle = (arm as THREE.Group).children.find((k) => k instanceof THREE.Group && k.position.x > 1 && k.position.y < 0.2)!;
        for (const o of [-0.035, 0, 0.035]) W("esc", esc, new THREE.Vector3(0, 0.02, o), nacelle, new THREE.Vector3(-0.17, 0.06, o), 0.04);
      });
  }

  /** A point on an object expressed in the drone's local frame. */
  private localPoint(o: THREE.Object3D, p: THREE.Vector3) {
    const w = o.localToWorld(p.clone());
    return this.drone.worldToLocal(w);
  }

  private rebuildWires() {
    this.drone.updateMatrixWorld(true);
    for (const w of this.wires) {
      const [a, b] = w.ends();
      const mid = a.clone().lerp(b, 0.5);
      mid.y += w.lift + this.explode * 0.08;
      const curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.6), mid, b.clone().lerp(mid, 0.6), b]);
      w.mesh.geometry.dispose();
      w.mesh.geometry = new THREE.TubeGeometry(curve, 28, w.net === "esc" ? 0.009 : 0.014, 6, false);
    }
  }

  /* ── Interaction ───────────────────────────────────────── */

  private bindPointer() {
    const el = this.renderer.domElement;
    el.addEventListener("pointermove", this.onMove);
    el.addEventListener("pointerdown", this.onDown);
    el.addEventListener("pointerup", this.onUp);
    el.addEventListener("pointerleave", this.onLeave);
    el.addEventListener("pointerenter", this.onEnter);
    this.controls.addEventListener("start", this.onStart);
    this.controls.addEventListener("end", this.onEnd);
  }

  private onStart = () => {
    this.interacting = true;
  };
  private onEnd = () => {
    this.interacting = false;
  };
  private onEnter = () => {
    this.controls.autoRotate = false;
  };
  private onLeave = () => {
    this.controls.autoRotate = !this.opts.reduce;
    if (this.hovered) {
      this.hovered = null;
      this.opts.onHover(null);
    }
  };

  private pick(e: PointerEvent): PartId | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    return (hits[0]?.object.userData.part as PartId) ?? null;
  }

  private onMove = (e: PointerEvent) => {
    if (this.opts.coarse || this.interacting) return;
    const id = this.pick(e);
    this.renderer.domElement.style.cursor = id ? "pointer" : "grab";
    if (id !== this.hovered) {
      this.hovered = id;
      this.opts.onHover(id);
    }
  };
  private onDown = (e: PointerEvent) => {
    this.downAt = { x: e.clientX, y: e.clientY };
  };
  private onUp = (e: PointerEvent) => {
    if (!this.downAt) return;
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    this.downAt = null;
    if (moved > 6) return;
    const id = this.pick(e);
    if (id) this.opts.onSelect(id);
  };

  /* ── Public API ────────────────────────────────────────── */

  setActive(id: PartId | null) {
    this.active = id;
  }

  setInspect(on: boolean) {
    this.explodeTarget = on ? 1 : 0;
    if (this.opts.reduce) {
      this.explode = this.explodeTarget;
      this.applyExplode();
    }
  }

  setPaused(p: boolean) {
    if (p === this.paused) return;
    this.paused = p;
    if (!p) {
      this.clock.getDelta();
      this.loop();
    } else cancelAnimationFrame(this.raf);
  }

  setTheme(t: Theme) {
    const light = t === "light";
    this.shellMat.color.set(light ? 0x33373b : 0x2a2d30);
    this.shadowMat.opacity = light ? 0.22 : 0.45;
    this.aoMat.opacity = light ? 0.55 : 0.9;
    this.renderer.toneMappingExposure = light ? 0.95 : 1.0;
  }

  resize() {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the whole airframe in frame on narrow hosts
    this.camera.fov = 30;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    const el = this.renderer.domElement;
    el.removeEventListener("pointermove", this.onMove);
    el.removeEventListener("pointerdown", this.onDown);
    el.removeEventListener("pointerup", this.onUp);
    el.removeEventListener("pointerleave", this.onLeave);
    el.removeEventListener("pointerenter", this.onEnter);
    this.controls.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((x) => x.dispose());
    });
    this.renderer.dispose();
    el.remove();
  }

  /* ── Frame loop ────────────────────────────────────────── */

  private applyExplode() {
    const e = this.ease(this.explode);
    for (const m of this.movables) m.obj.position.copy(m.home).addScaledVector(m.off, e);
    this.wiresDirty = true;
  }

  private ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private loop = () => {
    if (this.paused || this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    const reduce = this.opts.reduce;

    // teardown tween
    if (this.explode !== this.explodeTarget) {
      const step = dt / 1.1;
      this.explode = this.explodeTarget > this.explode ? Math.min(1, this.explode + step) : Math.max(0, this.explode - step);
      this.applyExplode();
    }
    if (this.wiresDirty) {
      this.rebuildWires();
      this.wiresDirty = false;
    }

    // hover, rotors, sensor
    if (!reduce) this.drone.position.y = 0.32 + Math.sin(t * 1.4) * 0.03 + this.explode * 0.35;
    else this.drone.position.y = 0.32 + this.explode * 0.35;
    const targetSpin = reduce ? 0 : this.explode > 0.5 ? 2.5 : 16;
    this.spin += (targetSpin - this.spin) * Math.min(1, dt * 2);
    for (const p of this.props) {
      p.obj.rotation.y += this.spin * dt * p.dir;
      (p.disc.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp((this.spin - 6) / 10, 0, 1) * 0.85;
    }
    if (!reduce) this.lidarHead.rotation.y = Math.sin(t * 0.6) * 0.5;

    // highlights: active part glows, its wiring lights, the shell goes clear
    const lit = this.active;
    for (const [id, mats] of this.partMats) {
      const target = lit === id ? 1 : 0;
      const g = this.partGlow.get(id)! + (target - this.partGlow.get(id)!) * Math.min(1, dt * 8);
      this.partGlow.set(id, g);
      for (const m of mats) {
        const base = (m.userData.baseEmissive as number) ?? 0;
        if (g > 0.01) {
          m.emissive.copy(SIG);
          m.emissiveIntensity = Math.max(base, g * 0.55);
        } else {
          m.emissive.copy(m.userData.baseColor as THREE.Color);
          m.emissiveIntensity = base;
        }
      }
    }
    for (const w of this.wires) {
      const on = lit === "cpu" || w.net === lit;
      w.mat.emissiveIntensity += ((on ? 2.2 : 0) - w.mat.emissiveIntensity) * Math.min(1, dt * 8);
    }
    const shellTarget = this.explode > 0.5 ? 0.92 : lit ? 0.14 : 1;
    this.shellOpacity += (shellTarget - this.shellOpacity) * Math.min(1, dt * 7);
    this.shellMat.opacity = this.shellOpacity;
    this.shellMat.depthWrite = this.shellOpacity > 0.95;
    for (const g of this.glassMats) g.opacity = Math.min(0.92, this.shellOpacity);

    // camera: keep the airframe framed at any aspect, and pull back for the teardown
    const dist = this.fitDistance(2.3 + this.explode * 0.5);
    const off = this.camera.position.clone().sub(this.controls.target);
    off.setLength(off.length() + (dist - off.length()) * Math.min(1, dt * 3));
    this.controls.target.y += (0.55 + this.explode * 0.7 - this.controls.target.y) * Math.min(1, dt * 3);
    this.camera.position.copy(this.controls.target).add(off);
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
    this.emitPositions();
  };

  /** Distance at which a sphere of radius r fits the view both ways. */
  private fitDistance(r: number) {
    const v = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const h = Math.atan(Math.tan(v) * this.camera.aspect);
    return Math.max(r / Math.sin(v), r / Math.sin(h)) * 0.92;
  }

  private emitPositions() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    const out = {} as Record<PartId, ScreenPoint>;
    for (const [id, a] of this.anchors) {
      a.obj.localToWorld(this.tmp.copy(a.local));
      this.tmp.project(this.camera);
      out[id] = { x: (this.tmp.x * 0.5 + 0.5) * w, y: (-this.tmp.y * 0.5 + 0.5) * h, visible: this.tmp.z < 1 };
    }
    this.drone.localToWorld(this.tmp.set(0, 0.6, 0));
    this.tmp.project(this.camera);
    this.opts.onFrame(out, { x: (this.tmp.x * 0.5 + 0.5) * w, y: (-this.tmp.y * 0.5 + 0.5) * h });
  }
}
