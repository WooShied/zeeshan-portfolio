import { RefObject, useEffect, useState } from "react";
import { HASH_EVENT, readHash } from "../lib";

/** Current #section/sub, updated on back/forward, link clicks and setHash(). */
export function useHash() {
  const [hash, setHashState] = useState(() => readHash());
  useEffect(() => {
    const update = () => setHashState(readHash());
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    window.addEventListener(HASH_EVENT, update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
      window.removeEventListener(HASH_EVENT, update);
    };
  }, []);
  return hash;
}

export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");

/** True while the element is on screen (used to pause animation off-screen). */
export function useInView(ref: RefObject<Element>, rootMargin = "0px", once = false): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, once]);
  return inView;
}
