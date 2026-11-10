import { useEffect } from "react";
import { Nav, Rail } from "./components/Nav";
import { Boot } from "./components/Boot";
import { CommandPalette } from "./components/CommandPalette";
import { Footer } from "./components/Footer";
import { Hero } from "./sections/Hero";
import { Projects } from "./sections/Projects";
import { Experience } from "./sections/Experience";
import { Approach } from "./sections/Approach";
import { Lab } from "./sections/Lab";
import { About } from "./sections/About";
import { Contact } from "./sections/Contact";

/** Reveal [data-reveal] elements once. A timer guarantees nothing stays hidden. */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => io.observe(el));
    // Elements rendered later (layout switches on resize) are observed too.
    const mo = new MutationObserver((records) => {
      records.forEach((r) =>
        r.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          const found = n.matches("[data-reveal]") ? [n] : Array.from(n.querySelectorAll<HTMLElement>("[data-reveal]"));
          found.filter((el) => !el.classList.contains("is-in")).forEach((el) => io.observe(el));
        }),
      );
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

/** Cursor spotlight on cards: pointer position goes into CSS variables. */
function useSpotlight() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest?.(".card") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
}

/** Pause CSS animation inside sections that are off-screen. */
function useOffscreenPause() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) =>
      entries.forEach((e) => e.target.toggleAttribute("data-offscreen", !e.isIntersecting)),
    );
    document.querySelectorAll("main > section").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function App() {
  useReveal();
  useSpotlight();
  useOffscreenPause();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Boot />
      <Nav />
      <Rail />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Projects />
        <Experience />
        <Approach />
        <Lab />
        <About />
        <Contact />
      </main>
      <Footer />
      <CommandPalette />
    </>
  );
}
