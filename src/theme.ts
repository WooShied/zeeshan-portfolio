import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "zm-theme";
const EVENT = "zm:theme";

/** Current theme from <html data-theme> (set before first paint by index.html). */
export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(t: Theme) {
  const root = document.documentElement;
  // Briefly animate colours, unless the visitor prefers reduced motion.
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("theme-anim");
    window.setTimeout(() => root.classList.remove("theme-anim"), 450);
  }
  root.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "light" ? "#f1ede4" : "#121314");
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* storage blocked: the choice lasts for this page view */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function toggleTheme() {
  setTheme(getTheme() === "light" ? "dark" : "light");
}

export function useTheme(): Theme {
  const [t, setT] = useState<Theme>(getTheme);
  useEffect(() => {
    const on = () => setT(getTheme());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return t;
}
