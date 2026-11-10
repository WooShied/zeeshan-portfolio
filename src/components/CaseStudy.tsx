import { useEffect, useRef, useState } from "react";
import { projects } from "../content/site";
import { StatusTag } from "./StatusTag";
import { Slots } from "./Slots";
import { FlowDiagram } from "./FlowDiagram";
import { LinkButton } from "./LinkButton";

const PARTS = [
  { id: "problem", label: "Problem & context" },
  { id: "contribution", label: "Personal contribution" },
  { id: "architecture", label: "System architecture" },
  { id: "stack", label: "Hardware & software" },
  { id: "decisions", label: "Constraints & decisions" },
  { id: "validation", label: "Validation" },
  { id: "results", label: "Results & lessons" },
  { id: "links", label: "Links" },
];

/**
 * Case-study reader in a native modal <dialog> (focus is trapped and
 * restored, Escape closes). The URL carries the slug, so every case
 * study can be linked to directly: #projects/<slug>.
 */
export function CaseStudy({
  slug,
  onClose,
  onNavigate,
}: {
  slug: string | null;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [part, setPart] = useState("problem");
  const idx = projects.findIndex((p) => p.slug === slug);
  const p = idx >= 0 ? projects[idx] : null;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p && !d.open) {
      d.showModal();
      document.documentElement.classList.add("has-modal");
    }
    if (!p && d.open) {
      d.close();
      document.documentElement.classList.remove("has-modal");
    }
  }, [p]);

  // New project: back to the top of the reader, focus the title.
  useEffect(() => {
    if (!p) return;
    bodyRef.current?.scrollTo({ top: 0 });
    setPart("problem");
    const t = ref.current?.querySelector<HTMLElement>(".cs__title");
    t?.focus({ preventScroll: true });
  }, [p]);

  // Track which part of the case study is being read.
  useEffect(() => {
    const root = bodyRef.current;
    if (!root || !p) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setPart(e.target.getAttribute("data-part") ?? "problem");
        });
      },
      { root, rootMargin: "-20% 0px -70% 0px" },
    );
    root.querySelectorAll("[data-part]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [p]);

  useEffect(() => () => document.documentElement.classList.remove("has-modal"), []);

  const jump = (id: string) => {
    const body = bodyRef.current;
    const el = body?.querySelector<HTMLElement>(`[data-part="${id}"]`);
    if (!el || !body) return;
    const top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 24;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    body.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    setPart(id);
  };

  const prev = idx > 0 ? projects[idx - 1] : null;
  const next = idx >= 0 && idx < projects.length - 1 ? projects[idx + 1] : null;

  return (
    <dialog
      ref={ref}
      className="cs"
      aria-labelledby="cs-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {p ? (
        <div className="cs__frame">
          <header className="cs__head">
            <button type="button" className="btn btn--ghost btn--sm cs__back" onClick={onClose}>
              <svg viewBox="0 0 16 16" aria-hidden="true" className="btn__icon">
                <path d="M13 8H3M7 4 3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Back to projects
            </button>
            <p className="cs__crumb mono" aria-hidden="true">
              projects / {p.slug}
            </p>
            <button type="button" className="cs__x" onClick={onClose} aria-label="Close case study">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="cs__body" ref={bodyRef}>
            <div className="cs__intro">
              <p className="cs__idx mono">{p.index} · Case study</p>
              <h2 id="cs-title" className="cs__title" tabIndex={-1}>
                {p.title}
              </h2>
              {p.kind === "illustrative" ? <StatusTag kind="illustrative" /> : <StatusTag status={p.status} />}
              <p className="cs__sum">{p.summary}</p>
            </div>

            <div className="cs__layout">
              <nav className="cs__toc" aria-label="Case study sections">
                <ol>
                  {PARTS.map((s, i) => (
                    <li key={s.id}>
                      <button type="button" aria-current={part === s.id ? "true" : undefined} onClick={() => jump(s.id)}>
                        <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>

              <div className="cs__content">
                <section data-part="problem" className="cs__part" aria-labelledby="csp-problem">
                  <h3 id="csp-problem">Problem &amp; context</h3>
                  <p>
                    <Slots text={p.problem} />
                  </p>
                </section>

                <section data-part="contribution" className="cs__part" aria-labelledby="csp-contribution">
                  <h3 id="csp-contribution">Personal contribution</h3>
                  <p>
                    <Slots text={p.contribution} />
                  </p>
                </section>

                <section data-part="architecture" className="cs__part" aria-labelledby="csp-architecture">
                  <h3 id="csp-architecture">System architecture</h3>
                  <FlowDiagram key={p.slug} nodes={p.architecture.nodes} edges={p.architecture.edges} caption={p.architecture.caption} />
                </section>

                <section data-part="stack" className="cs__part" aria-labelledby="csp-stack">
                  <h3 id="csp-stack">Hardware &amp; software stack</h3>
                  <dl className="cs__stack">
                    <div>
                      <dt className="mono">Hardware</dt>
                      {p.stack.hardware.map((h) => (
                        <dd key={h}>
                          <Slots text={h} />
                        </dd>
                      ))}
                    </div>
                    <div>
                      <dt className="mono">Software</dt>
                      {p.stack.software.map((s) => (
                        <dd key={s}>
                          <Slots text={s} />
                        </dd>
                      ))}
                    </div>
                  </dl>
                </section>

                <section data-part="decisions" className="cs__part" aria-labelledby="csp-decisions">
                  <h3 id="csp-decisions">Constraints &amp; engineering decisions</h3>
                  <ul className="cs__constraints">
                    {p.constraints.map((c) => (
                      <li key={c}>
                        <Slots text={c} />
                      </li>
                    ))}
                  </ul>
                  {p.decisions.map((d) => (
                    <details key={d.title} className="cs__decision">
                      <summary>
                        <span>
                          <Slots text={d.title} />
                        </span>
                      </summary>
                      <p>
                        <Slots text={d.detail} />
                      </p>
                    </details>
                  ))}
                </section>

                <section data-part="validation" className="cs__part" aria-labelledby="csp-validation">
                  <h3 id="csp-validation">Validation approach</h3>
                  <p>
                    <Slots text={p.validation} />
                  </p>
                </section>

                <section data-part="results" className="cs__part" aria-labelledby="csp-results">
                  <h3 id="csp-results">Results &amp; lessons</h3>
                  <dl className="cs__rl">
                    <div>
                      <dt className="mono">Results</dt>
                      <dd>
                        <Slots text={p.results} />
                      </dd>
                    </div>
                    <div>
                      <dt className="mono">Lessons</dt>
                      <dd>
                        <Slots text={p.lessons} />
                      </dd>
                    </div>
                  </dl>
                </section>

                <section data-part="links" className="cs__part" aria-labelledby="csp-links">
                  <h3 id="csp-links">Repository, demo &amp; documentation</h3>
                  <div className="cs__links">
                    {p.links.map((l) => (
                      <LinkButton key={l.id} link={l} />
                    ))}
                  </div>
                </section>

                <nav className="cs__pager" aria-label="Other case studies">
                  {prev ? (
                    <button type="button" className="cs__pg" onClick={() => onNavigate(prev.slug)}>
                      <span className="mono">← Previous</span>
                      {prev.title}
                    </button>
                  ) : (
                    <span />
                  )}
                  {next ? (
                    <button type="button" className="cs__pg cs__pg--next" onClick={() => onNavigate(next.slug)}>
                      <span className="mono">Next →</span>
                      {next.title}
                    </button>
                  ) : null}
                </nav>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
