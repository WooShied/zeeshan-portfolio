import { useEffect, useMemo, useRef, useState } from "react";
import { experience, links, projects, sections } from "../content/site";
import { emit, EV, goToSection, setHash } from "../lib";
import { LAB_TABS } from "../sections/Lab";

interface Cmd {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  disabled?: boolean;
  run?: () => void;
}

function buildCommands(): Cmd[] {
  const cmds: Cmd[] = [];
  sections.forEach((s) =>
    cmds.push({
      id: `sec-${s.id}`,
      group: "Sections",
      label: s.id === "top" ? "Back to the board (top)" : s.label,
      hint: s.addr,
      keywords: "go navigate section",
      run: () => goToSection(s.id),
    }),
  );
  projects.forEach((p) =>
    cmds.push({
      id: `prj-${p.slug}`,
      group: "Projects",
      label: p.title,
      hint: p.index,
      keywords: `case study project ${p.tags.join(" ")}`,
      run: () => setHash(`#projects/${p.slug}`, "push"),
    }),
  );
  experience.forEach((r) =>
    cmds.push({
      id: `xp-${r.id}`,
      group: "Experience",
      label: `${r.title} · ${r.company}`,
      keywords: `role job experience ${r.employmentType}`,
      run: () => goToSection("experience", r.id),
    }),
  );
  LAB_TABS.forEach((t) =>
    cmds.push({
      id: `lab-${t.id}`,
      group: "Interactive lab",
      label: `Open ${t.label.toLowerCase()}`,
      hint: t.probe,
      keywords: "lab demo simulation instrument",
      run: () => goToSection("lab", t.id),
    }),
  );
  links.forEach((l) =>
    cmds.push({
      id: `lnk-${l.id}`,
      group: "Links",
      label: l.href ? `Open ${l.label}` : l.label,
      hint: l.href ? "external ↗" : l.unavailableNote,
      keywords: "link contact external",
      disabled: !l.href,
      run: l.href ? () => window.open(l.href!, "_blank", "noopener,noreferrer") : undefined,
    }),
  );
  cmds.push({
    id: "act-inspect",
    group: "Actions",
    label: "Inspect system (exploded board view)",
    keywords: "board hero 3d layers exploded",
    run: () => {
      setHash("#top", "replace");
      emit(EV.inspect);
    },
  });
  cmds.push({
    id: "act-copy",
    group: "Actions",
    label: "Copy link to this page",
    keywords: "share url clipboard",
    run: () => {
      navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    },
  });
  return cmds;
}

function score(c: Cmd, q: string) {
  if (!q) return 1;
  const hay = `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  let s = 0;
  for (const t of terms) {
    const i = hay.indexOf(t);
    if (i < 0) return 0;
    s += c.label.toLowerCase().startsWith(t) ? 3 : c.label.toLowerCase().includes(t) ? 2 : 1;
  }
  return s;
}

/**
 * Command palette: Ctrl/⌘ + K, "/" or the Search button. A native modal
 * dialog with a combobox and listbox; arrow keys move, Enter runs,
 * Escape closes and focus returns to where it was.
 */
export function CommandPalette() {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const all = useMemo(buildCommands, []);

  const results = useMemo(
    () =>
      all
        .map((c, i) => ({ c, s: score(c, q), i }))
        .filter((r) => r.s > 0)
        .sort((a, b) => (q ? b.s - a.s || a.i - b.i : a.i - b.i))
        .map((r) => r.c),
    [all, q],
  );
  const enabled = results.filter((c) => !c.disabled);

  // Open/close the native dialog.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      d.showModal();
      setQ("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // Global shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      const t = e.target as HTMLElement;
      const typing = t.closest("input, textarea, select, [contenteditable=true]");
      if (!typing && k === "/" && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onEv = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(EV.palette, onEv);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(EV.palette, onEv);
    };
  }, [open]);

  useEffect(() => setActive(0), [q]);

  // Keep the active option in view.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active, results]);

  const close = (restore = true) => {
    setOpen(false);
    if (restore) requestAnimationFrame(() => returnTo.current?.focus?.({ preventScroll: true }));
  };

  const run = (c: Cmd | undefined) => {
    if (!c || c.disabled || !c.run) return;
    close(false);
    // Let the dialog close before scrolling or moving focus.
    requestAnimationFrame(() => {
      c.run!();
      if (c.id === "act-copy") {
        setToast("Link copied");
        window.setTimeout(() => setToast(null), 1800);
      }
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(enabled.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(enabled.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(enabled[active]);
    }
  };

  const activeCmd = enabled[active];
  let lastGroup = "";

  return (
    <>
      <dialog
        ref={ref}
        className="pal"
        aria-label="Command palette"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="pal__box">
          <div className="pal__search">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls="pal-list"
              aria-autocomplete="list"
              aria-activedescendant={activeCmd ? `pal-${activeCmd.id}` : undefined}
              aria-label="Search sections, projects, roles and links"
              placeholder="Search sections, projects, roles, links…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="pal__esc mono" onClick={() => close()}>
              Esc
            </button>
          </div>

          <ul id="pal-list" ref={listRef} className="pal__list" role="listbox" aria-label="Results">
            {results.length === 0 ? (
              <li className="pal__empty" role="presentation">
                No matches for “{q}”.
              </li>
            ) : (
              results.map((c) => {
                const showGroup = c.group !== lastGroup && !q;
                lastGroup = c.group;
                const isActive = activeCmd?.id === c.id;
                return [
                  showGroup ? (
                    <li key={`g-${c.group}`} className="pal__group mono" role="presentation">
                      {c.group}
                    </li>
                  ) : null,
                  <li
                    key={c.id}
                    id={`pal-${c.id}`}
                    role="option"
                    aria-selected={isActive}
                    aria-disabled={c.disabled || undefined}
                    data-active={isActive || undefined}
                    className="pal__opt"
                    onPointerMove={() => {
                      if (!c.disabled) {
                        const i = enabled.indexOf(c);
                        if (i !== active) setActive(i);
                      }
                    }}
                    onClick={() => run(c)}
                  >
                    <span className="pal__lbl">
                      {q ? <span className="pal__grp mono">{c.group}</span> : null}
                      {c.label}
                    </span>
                    {c.hint ? <span className="pal__hint mono">{c.hint}</span> : null}
                  </li>,
                ];
              })
            )}
          </ul>

          <p className="pal__foot mono" aria-hidden="true">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> move
            </span>
            <span>
              <kbd>Enter</kbd> open
            </span>
            <span>
              <kbd>Esc</kbd> close
            </span>
          </p>
        </div>
      </dialog>
      <div className="toast mono" role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
