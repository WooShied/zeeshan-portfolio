import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { identity, sections } from "../content/site";
import { emit, EV } from "../lib";

const NAV = sections.filter((s) => s.id !== "top");

/** Which section is in the middle of the viewport. Shared by the bar and the rail. */
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

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD_KEY = isMac ? "⌘" : "Ctrl";

/**
 * Top bar: name, numbered section links with a sliding indicator,
 * an address readout of the current section, the command palette
 * button, and a scroll-progress signal line.
 */
export function Nav() {
  const current = useActiveSection();
  const [open, setOpen] = useState(false);
  const linksRef = useRef<HTMLUListElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      barRef.current?.style.setProperty("--progress", String(max > 0 ? window.scrollY / max : 0));
      barRef.current?.toggleAttribute("data-scrolled", window.scrollY > 8);
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
  }, []);

  useLayoutEffect(() => {
    const ul = linksRef.current;
    if (!ul) return;
    const measure = () => {
      const a = ul.querySelector<HTMLAnchorElement>('a[aria-current="true"]');
      setIndicator(a ? { x: a.offsetLeft, w: a.offsetWidth } : null);
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [current]);

  // Close the mobile sheet with Escape; lock nothing else.
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
    <header className="bar" ref={barRef}>
      <div className="bar__inner">
        <a href="#top" className="bar__brand" aria-label={`${identity.name}, back to top`}>
          <span className="bar__chip mono" aria-hidden="true">
            {identity.initials}
          </span>
          <span className="bar__name">{identity.name}</span>
        </a>

        <nav aria-label="Sections" className="bar__nav">
          <ul ref={linksRef}>
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} aria-current={current === n.id ? "true" : undefined}>
                  {n.label}
                </a>
              </li>
            ))}
            {indicator ? (
              <li
                className="bar__indicator"
                aria-hidden="true"
                style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w }}
              />
            ) : null}
          </ul>
        </nav>

        <div className="bar__right">
          <p className="bar__addr mono" aria-hidden="true">
            <span className="led-dot led-dot--on" />
            <span className="bar__addr-hex">{sec.addr}</span>
            <span className="bar__addr-name" key={sec.id}>
              {sec.label}
            </span>
          </p>
          <button type="button" className="bar__cmd" onClick={() => emit(EV.palette)} aria-label="Open command palette">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="bar__cmd-label">Search</span>
            <kbd className="mono">{MOD_KEY} K</kbd>
          </button>
          <button
            ref={menuBtn}
            type="button"
            className="bar__menu"
            aria-expanded={open}
            aria-controls="menu-sheet"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="bar__menu-lines" aria-hidden="true" />
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      <div className="bar__progress" aria-hidden="true" />

      <div id="menu-sheet" className="sheet" hidden={!open}>
        <nav aria-label="Sections (menu)">
          <ul>
            {sections.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} aria-current={current === n.id ? "true" : undefined} onClick={() => setOpen(false)}>
                  <span className="mono sheet__addr">{n.addr}</span>
                  {n.id === "top" ? "Top" : n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

/** Right-edge pin header: one pin per section, the current one lit. */
export function Rail() {
  const current = useActiveSection();
  return (
    <nav className="rail" aria-label="Section progress">
      <ol>
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={current === s.id ? "true" : undefined}>
              <span className="rail__pin" aria-hidden="true" />
              <span className="rail__label mono">
                {s.addr} {s.id === "top" ? "Top" : s.label}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
