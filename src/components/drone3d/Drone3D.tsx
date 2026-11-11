import { useEffect, useRef } from "react";
import { DroneScene, type PartId, type ScreenPoint } from "./DroneScene";
import { getTheme } from "../../theme";

export type { PartId, ScreenPoint };

interface Props {
  active: PartId | null;
  inspect: boolean;
  reduce: boolean;
  coarse: boolean;
  onHover: (id: PartId | null) => void;
  onSelect: (id: PartId) => void;
  onFrame: (pts: Record<PartId, ScreenPoint>, centre: { x: number; y: number }) => void;
  onReady: (ok: boolean) => void;
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Lazy-loaded 3D drone. Falls back (onReady(false)) when WebGL is unavailable. */
export default function Drone3D(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<DroneScene | null>(null);
  const cb = useRef(props);
  cb.current = props;

  useEffect(() => {
    const el = host.current;
    if (!el || !webglAvailable()) {
      cb.current.onReady(false);
      return;
    }
    let s: DroneScene;
    try {
      s = new DroneScene(el, {
        reduce: cb.current.reduce,
        coarse: cb.current.coarse,
        theme: getTheme(),
        onHover: (id) => cb.current.onHover(id),
        onSelect: (id) => cb.current.onSelect(id),
        onFrame: (p, c) => cb.current.onFrame(p, c),
      });
    } catch {
      cb.current.onReady(false);
      return;
    }
    scene.current = s;
    s.setActive(cb.current.active);
    s.setInspect(cb.current.inspect);
    cb.current.onReady(true);

    const ro = new ResizeObserver(() => s.resize());
    ro.observe(el);
    let onScreen = true;
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      s.setPaused(!onScreen || document.hidden);
    });
    io.observe(el);
    const onVis = () => s.setPaused(!onScreen || document.hidden);
    document.addEventListener("visibilitychange", onVis);
    const onTheme = () => s.setTheme(getTheme());
    window.addEventListener("zm:theme", onTheme);
    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("zm:theme", onTheme);
      s.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => scene.current?.setActive(props.active), [props.active]);
  useEffect(() => scene.current?.setInspect(props.inspect), [props.inspect]);

  return <div className="drone3d" ref={host} aria-hidden="true" />;
}
