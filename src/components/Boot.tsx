import { useEffect, useState } from "react";

const LINES = ["POWER RAILS ........ OK", "CLOCK 48 MHZ ....... LOCKED", "BUS SCAN ........... 5 DEVICES", "BOOT ............... PORTFOLIO"];

/**
 * A short power-on sequence (about 1.5 s). The page is already rendered
 * beneath it, any key or click skips it, it runs once per session, and
 * it never runs with reduced motion.
 */
export function Boot() {
  const [state, setState] = useState<"run" | "out" | "done">(() => {
    try {
      if (sessionStorage.getItem("zm-booted")) return "done";
    } catch {
      /* storage blocked: just run once */
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "done";
    if (window.location.hash && window.location.hash !== "#top") return "done";
    return "run";
  });

  useEffect(() => {
    if (state !== "run") return;
    try {
      sessionStorage.setItem("zm-booted", "1");
    } catch {
      /* ignore */
    }
    const skip = () => setState("out");
    const t = window.setTimeout(skip, 1500);
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("wheel", skip, { once: true, passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
    };
  }, [state]);

  useEffect(() => {
    if (state !== "out") return;
    const t = window.setTimeout(() => setState("done"), 600);
    return () => window.clearTimeout(t);
  }, [state]);

  if (state === "done") return null;
  return (
    <div className={`boot${state === "out" ? " boot--out" : ""}`} aria-hidden="true">
      <div className="boot__panel mono">
        {LINES.map((l, i) => (
          <p key={l} style={{ animationDelay: `${i * 0.22}s` }}>
            {l}
          </p>
        ))}
        <span className="boot__bar" />
        <button type="button" className="boot__skip" tabIndex={-1} onClick={() => setState("out")}>
          Skip
        </button>
      </div>
    </div>
  );
}
