import { useEffect, useMemo, useRef, useState } from "react";
import { projectFilters, projects } from "../content/site";
import type { Project } from "../content/types";
import { SectionHeader } from "../components/SectionHeader";
import { StatusTag } from "../components/StatusTag";
import { CaseStudy } from "../components/CaseStudy";
import { useHash } from "../hooks";
import { scrollToId, setHash } from "../lib";

/** Tiny node strip that previews a project's architecture on its card. */
function MiniFlow({ p }: { p: Project }) {
  const row0 = p.architecture.nodes.filter((n) => n.row === 0).sort((a, b) => a.col - b.col);
  return (
    <div className="mini" aria-hidden="true">
      {row0.map((n, i) => (
        <span key={n.id} className="mini__item">
          <span className="mini__node mono">{n.label}</span>
          {i < row0.length - 1 ? <span className="mini__wire" /> : null}
        </span>
      ))}
    </div>
  );
}

export function Projects() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const hash = useHash();
  const openedByClick = useRef(false);
  const lastOpened = useRef<string | null>(null);

  const openSlug =
    hash.section === "projects" && hash.sub && projects.some((p) => p.slug === hash.sub) ? hash.sub : null;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length };
    projectFilters.forEach((f) => {
      if (f.id !== "all") c[f.id] = projects.filter((p) => p.tags.includes(f.id)).length;
    });
    return c;
  }, []);

  const visible = projects.filter((p) => {
    if (filter !== "all" && !p.tags.includes(filter)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [p.title, p.summary, ...p.tags].join(" ").toLowerCase().includes(q);
  });

  // A deep link straight to a case study: make sure the section is behind it.
  useEffect(() => {
    if (openSlug && !openedByClick.current) scrollToId("projects");
    if (openSlug) {
      lastOpened.current = openSlug;
      // Make sure the card behind the reader is visible, so focus can return to it.
      if (!visible.some((p) => p.slug === openSlug)) {
        setFilter("all");
        setQuery("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSlug]);

  const open = (slug: string) => {
    openedByClick.current = true;
    setHash(`#projects/${slug}`, "push");
  };

  const close = () => {
    if (openedByClick.current) {
      openedByClick.current = false;
      window.history.back();
    } else {
      setHash("#projects", "replace");
    }
  };

  // Return focus to the card that opened the case study.
  useEffect(() => {
    if (openSlug) return;
    openedByClick.current = false;
    if (!lastOpened.current) return;
    const btn = document.querySelector<HTMLButtonElement>(`[data-open="${lastOpened.current}"]`);
    btn?.focus({ preventScroll: true });
    btn?.closest("article")?.scrollIntoView({ block: "nearest" });
    lastOpened.current = null;
  }, [openSlug]);

  const filterLabel = projectFilters.find((f) => f.id === filter)?.label ?? "All";

  return (
    <section id="projects" className="section projects" aria-labelledby="projects-title">
      <div className="wrap">
        <SectionHeader
          id="projects"
          title="Projects"
          lede={
            <p>
              Each project is filed like a drawing: problem, contribution, architecture, constraints, validation and results.
              The three below are structures waiting for Zeeshan’s real work.
            </p>
          }
        />

        <div className="pfilters" data-reveal>
          <div className="seg-bar" role="group" aria-label="Filter projects by area">
            {projectFilters.map((f) => (
              <button
                key={f.id}
                type="button"
                className="seg-bar__btn"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                disabled={counts[f.id] === 0}
              >
                {f.label}
                <span className="seg-bar__count mono">{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <label className="field">
            <span className="sr-only">Search projects</span>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <input type="search" placeholder="Search projects" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        <p className="pfilters__status mono" aria-live="polite">
          {visible.length} of {projects.length} drawings · {filterLabel}
          {query ? ` · “${query}”` : ""}
        </p>

        <div className="register" data-reveal>
          <div className="register__head mono" aria-hidden="true">
            <span>Doc no.</span>
            <span>Title</span>
            <span>Areas</span>
            <span>Status</span>
          </div>
          {visible.length ? (
            <ul className="register__list">
              {visible.map((p, i) => (
                <li key={p.slug} className="reg" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="reg__doc mono">{p.index}</span>
                  <div className="reg__main">
                    <h3 id={`pc-${p.slug}`} className="reg__title">
                      {p.title}
                    </h3>
                    <p className="reg__sum">{p.summary}</p>
                    <MiniFlow p={p} />
                  </div>
                  <ul className="reg__areas mono" aria-label="Areas">
                    {p.tags.map((t) => (
                      <li key={t}>{projectFilters.find((f) => f.id === t)?.label}</li>
                    ))}
                  </ul>
                  <div className="reg__status">
                    {p.kind === "illustrative" ? <StatusTag kind="illustrative" /> : <StatusTag status={p.status} />}
                    <button type="button" className="btn btn--sm reg__open" data-open={p.slug} onClick={() => open(p.slug)}>
                      Open drawing
                      <span className="sr-only">: {p.title}</span>
                      <svg viewBox="0 0 16 16" aria-hidden="true" className="btn__icon btn__icon--r">
                        <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="pempty">
              <p>No drawings match that filter.</p>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      <CaseStudy slug={openSlug} onClose={close} onNavigate={(s) => setHash(`#projects/${s}`, "replace")} />
    </section>
  );
}
