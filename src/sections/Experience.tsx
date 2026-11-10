import { useEffect, useRef, useState } from "react";
import { experience, timelineNow } from "../content/site";
import type { Role } from "../content/types";
import { SectionHeader } from "../components/SectionHeader";
import { StatusTag } from "../components/StatusTag";
import { Slots } from "../components/Slots";
import { useHash } from "../hooks";
import { dateTimeAttr, formatMonth, formatRange, monthIndex, scrollToId, setHash } from "../lib";

const MIN = Math.min(...experience.map((r) => monthIndex(r.start))) - 2; // lead-in so every rising edge shows
const MAX = monthIndex(timelineNow) + 1;
const SPAN = MAX - MIN;
const pos = (m: number) => (m - MIN) / SPAN;

function RoleDetail({ role, ch }: { role: Role; ch: number }) {
  return (
    <div className="decode" key={role.id}>
      <p className="decode__k mono">
        Decode · D{ch} · {formatRange(role.start, role.end)}
      </p>
      <div className="decode__grid">
        <div>
          <h3 className="decode__company">{role.company}</h3>
          <p className="decode__title">{role.title}</p>
          <StatusTag kind="supplied" />
        </div>
        <dl className="decode__facts">
          <div>
            <dt className="mono">Dates</dt>
            <dd>
              <time dateTime={dateTimeAttr(role.start)}>{formatMonth(role.start)}</time> –{" "}
              <time dateTime={dateTimeAttr(role.end)}>{formatMonth(role.end)}</time>
            </dd>
          </div>
          <div>
            <dt className="mono">Type</dt>
            <dd>{role.employmentType}</dd>
          </div>
          <div>
            <dt className="mono">Location</dt>
            <dd>
              {role.location ?? <span className="muted">Location not supplied</span>}
              {role.workplace ? <span className="muted"> · {role.workplace}</span> : null}
            </dd>
          </div>
        </dl>
        <div className="decode__desc">
          <p className="decode__dk mono">Description · draft template</p>
          <p>
            <Slots text={role.description.text} />
          </p>
          <StatusTag status={role.description.status} />
        </div>
      </div>
    </div>
  );
}

/**
 * Experience as a logic-analyzer capture: one channel per role, high while
 * the role was active. Rows are tabs (arrow keys, Home, End); the decode
 * panel below shows the selected role in full.
 */
export function Experience() {
  const [selected, setSelected] = useState(experience[0].id);
  const rowsRef = useRef<HTMLDivElement>(null);
  const hash = useHash();
  const selfSet = useRef(false);

  useEffect(() => {
    if (hash.section === "experience" && hash.sub && experience.some((r) => r.id === hash.sub)) {
      setSelected(hash.sub);
      if (selfSet.current) selfSet.current = false;
      else scrollToId("experience");
    }
  }, [hash]);

  const choose = (id: string) => {
    selfSet.current = true;
    setSelected(id);
    setHash(`#experience/${id}`, "replace");
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    let n = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % experience.length;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + experience.length) % experience.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = experience.length - 1;
    if (n < 0) return;
    e.preventDefault();
    choose(experience[n].id);
    rowsRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[n]?.focus();
  };

  const selIdx = experience.findIndex((r) => r.id === selected);
  const sel = experience[selIdx];
  const a = pos(monthIndex(sel.start));
  const b = Math.min(1, pos(monthIndex(sel.end) + 1));

  // Quarter ticks, labelled at each new year.
  const ticks: { p: number; label?: string }[] = [];
  for (let m = MIN; m <= MAX; m++) {
    if (m % 3 === 0) ticks.push({ p: pos(m), label: m % 12 === 0 ? String(m / 12) : undefined });
  }

  return (
    <section id="experience" className="section experience" aria-labelledby="experience-title">
      <div className="wrap">
        <SectionHeader
          id="experience"
          title="Experience"
          lede={
            <p>
              Five roles as supplied from LinkedIn, captured like logic-analyzer channels: each line goes high while the role
              was active. Titles, companies, types and dates are exact; descriptions are templates to complete.
            </p>
          }
        />

        <div className="la" data-reveal>
          <div className="la__bar mono" aria-hidden="true">
            <span>Capture · {experience.length} channels</span>
            <span>
              {formatMonth(formatSortedStart())} → {formatMonth(timelineNow)}
            </span>
          </div>

          <div className="la__axis" aria-hidden="true">
            <span />
            <div className="la__ticks">
              {ticks.map((t, i) => (
                <span key={i} className={t.label ? "is-year" : ""} style={{ left: `${t.p * 100}%` }}>
                  {t.label ? <em className="mono">{t.label}</em> : null}
                </span>
              ))}
            </div>
          </div>

          <div className="la__rows" role="tablist" aria-orientation="vertical" aria-label="Roles" ref={rowsRef}>
            {experience.map((r, i) => {
              const s = pos(monthIndex(r.start)) * 1000;
              const e = Math.min(1, pos(monthIndex(r.end) + 1)) * 1000;
              const present = r.end === "present";
              const d = `M0 30H${s.toFixed(1)}V8H${e.toFixed(1)}${present ? "" : "V30H1000"}`;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  id={`xp-tab-${r.id}`}
                  aria-selected={selected === r.id}
                  aria-controls="xp-panel"
                  tabIndex={selected === r.id ? 0 : -1}
                  className="la__row"
                  onClick={() => choose(r.id)}
                  onKeyDown={(ev) => onKey(ev, i)}
                >
                  <span className="la__label">
                    <span className="la__ch mono">D{i}</span>
                    <span className="la__who">
                      <span className="la__company">{r.company}</span>
                      <span className="la__role">{r.title}</span>
                      <span className="la__dates mono">
                        {formatRange(r.start, r.end)} · {r.employmentType}
                      </span>
                    </span>
                  </span>
                  <svg className="la__wave" viewBox="0 0 1000 38" preserveAspectRatio="none" aria-hidden="true">
                    <path d={d} vectorEffect="non-scaling-stroke" />
                  </svg>
                </button>
              );
            })}

            {/* Measurement cursors on the selected channel */}
            <span className="la__cursor" style={{ ["--p" as string]: a }} aria-hidden="true">
              <em className="mono">A</em>
            </span>
            <span className="la__cursor" style={{ ["--p" as string]: b }} aria-hidden="true">
              <em className="mono">B</em>
            </span>
          </div>

          <div className="la__panel" role="tabpanel" id="xp-panel" aria-labelledby={`xp-tab-${selected}`}>
            <RoleDetail role={sel} ch={selIdx} />
          </div>
        </div>
      </div>
    </section>
  );
}

function formatSortedStart() {
  return experience.map((r) => r.start).sort()[0];
}
