import { useEffect, useRef, useState } from "react";
import { identity, sections } from "../content/site";
import { emit, EV } from "../lib";

/** Which section is in the middle of the viewport. */
export function useActiveSection() {
  const [current, setCurrent] = useState<string>("top");
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setCurrent(e.target.id);
        });
      },
      { rootMargin: "-42% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return current;
}

/** Scroll progress 0…1 written to a CSS variable on the given element (no re-render). */
function useProgressVar(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ref.current?.style.setProperty("--progress", String(max > 0 ? window.scrollY / max : 0));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD_KEY = isMac ? "⌘" : "Ctrl";
const TOTAL = String(sections.length).padStart(2, "0");

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

/**
 * Drawing-sheet chrome. Desktop: a left sidebar with the sheet index
 * (a vertical bus whose lit length follows scroll) and a title block.
 * Small screens: a compact top strip with an index sheet.
 */
export function Nav() {
  const current = useActiveSection();
  const [open, setOpen] = useState(false);
  const sideRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  useProgressVar(sideRef);
  useProgressVar(barRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const sec = sections.find((s) => s.id === current) ?? sections[0];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="side" ref={sideRef}>
        <a href="#top" className="side__brand" aria-label={`${identity.name}, back to top`}>
          <span className="side__mark mono" aria-hidden="true">
            {identity.initials}
          </span>
          <span className="side__who">
            <span className="side__name">{identity.name}</span>
            <span className="side__dwg mono">DWG {identity.initials}-01 · Portfolio</span>
          </span>
        </a>

        <nav className="index" aria-label="Sections">
          <p className="index__k mono">Sheet index</p>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={current === s.id ? "true" : undefined}>
                  <span className="index__node" aria-hidden="true" />
                  <span className="index__num mono">{s.sheet}</span>
                  <span className="index__label">{s.short}</span>
                </a>
              </li>
            ))}
          </ol>
          <span className="index__bus" aria-hidden="true" />
        </nav>

        <button type="button" className="side__search" onClick={() => emit(EV.palette)}>
          <SearchIcon />
          <span>Search</span>
          <kbd className="mono">{MOD_KEY} K</kbd>
        </button>

        <dl className="tblock mono" aria-label="Current sheet">
          <div className="tblock__wide">
            <dt>Title</dt>
            <dd key={sec.id} className="tblock__title">
              {sec.label}
            </dd>
          </div>
          <div>
            <dt>Sheet</dt>
            <dd>
              {sec.sheet} / {TOTAL}
            </dd>
          </div>
          <div>
            <dt>Rev</dt>
            <dd className="tblock__rev">A · Draft</dd>
          </div>
        </dl>
      </aside>

      {/* Small-screen strip */}
      <header className="mbar" ref={barRef}>
        <a href="#top" className="mbar__brand" aria-label={`${identity.name}, back to top`}>
          <span className="side__mark mono" aria-hidden="true">
            {identity.initials}
          </span>
        </a>
        <p className="mbar__sheet mono" aria-hidden="true">
          <span className="mbar__num">
            {sec.sheet}/{TOTAL}
          </span>
          <span key={sec.id} className="mbar__title">
            {sec.short}
          </span>
        </p>
        <button type="button" className="mbar__btn" onClick={() => emit(EV.palette)} aria-label="Search the site">
          <SearchIcon />
        </button>
        <button
          ref={menuBtn}
          type="button"
          className="mbar__btn mbar__btn--txt"
          aria-expanded={open}
          aria-controls="sheet-index"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Index"}
        </button>
        <span className="mbar__progress" aria-hidden="true" />

        <nav id="sheet-index" className="msheet" hidden={!open} aria-label="Sections (index)">
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={current === s.id ? "true" : undefined} onClick={() => setOpen(false)}>
                  <span className="mono msheet__num">{s.sheet}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>
    </>
  );
}

/** Decorative drawing border with zone rulers (wide screens only). */
export function Frame() {
  const cols = Array.from({ length: 8 }, (_, i) => i + 1);
  const rows = ["A", "B", "C", "D", "E", "F"];
  return (
    <div className="frame" aria-hidden="true">
      <div className="frame__top mono">
        {cols.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className="frame__right mono">
        {rows.map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
    </div>
  );
}
