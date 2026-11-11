import * as THREE from "three";

/** 2/2 twill carbon-fibre weave, drawn once on a canvas. */
export function carbonTexture(): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0d0f10";
  g.fillRect(0, 0, s, s);
  const n = 16;
  const t = s / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      // twill: tow direction alternates in diagonal runs of two
      const horiz = Math.floor((x + y) / 2) % 2 === 0;
      const grad = horiz ? g.createLinearGradient(x * t, y * t, x * t, y * t + t) : g.createLinearGradient(x * t, y * t, x * t + t, y * t);
      grad.addColorStop(0, "#15181a");
      grad.addColorStop(0.5, horiz ? "#3a3f44" : "#2a2e32");
      grad.addColorStop(1, "#121416");
      g.fillStyle = grad;
      g.fillRect(x * t + 0.5, y * t + 0.5, t - 1, t - 1);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Brushed-metal streaks for motor bells and the camera housing. */
export function brushedTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 64;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const v = 100 + Math.random() * 90;
    g.fillStyle = `rgba(${v},${v},${v},0.35)`;
    g.fillRect(Math.random() * w, Math.random() * h, 30 + Math.random() * 80, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Battery wrap label. */
export function batteryLabel(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1b1e20";
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#f2b04a";
  g.fillRect(0, 0, 18, 256);
  g.fillStyle = "#e8e2d6";
  g.font = "600 64px 'IBM Plex Sans Condensed', Arial Narrow, sans-serif";
  g.fillText("LiPo", 52, 112);
  g.font = "500 30px 'IBM Plex Mono', monospace";
  g.fillStyle = "#9a958b";
  g.fillText("ZM-Q1 · FLIGHT PACK", 52, 168);
  g.strokeStyle = "#5fd4cc";
  g.lineWidth = 3;
  g.strokeRect(52, 196, 220, 22);
  g.fillStyle = "#5fd4cc";
  g.fillRect(56, 200, 160, 14);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft radial disc used for prop motion blur and LED glows. */
export function radialTexture(inner = "rgba(255,255,255,0.9)", outer = "rgba(255,255,255,0)"): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Ring-shaped motion blur for spinning props (darker toward the tips). */
export function blurDiscTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 18, 128, 128, 128);
  grad.addColorStop(0, "rgba(40,44,48,0)");
  grad.addColorStop(0.2, "rgba(40,44,48,0.35)");
  grad.addColorStop(0.85, "rgba(40,44,48,0.18)");
  grad.addColorStop(0.97, "rgba(140,150,155,0.16)");
  grad.addColorStop(1, "rgba(40,44,48,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Stencilled hull markings (transparent background). */
export function stencilTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(225,222,214,0.78)";
  g.font = "700 92px 'IBM Plex Sans Condensed', Arial Narrow, sans-serif";
  g.fillText("ZM-Q1", 10, 110);
  g.font = "500 30px 'IBM Plex Mono', monospace";
  g.fillText("MAPPING · SN 0001", 14, 168);
  g.fillStyle = "rgba(242,176,74,0.9)";
  g.fillRect(14, 196, 120, 10);
  g.fillStyle = "rgba(225,222,214,0.5)";
  g.fillRect(142, 196, 220, 10);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
