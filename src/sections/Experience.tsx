import { useEffect, useRef, useState } from "react";
import { experience, timelineNow } from "../content/site";
import type { Role } from "../content/types";
import { SectionHeader } from "../components/SectionHeader";
import { StatusTag } from "../components/StatusTag";
import { Slots } from "../components/Slots";
import { useHash, useMediaQuery } from "../hooks";
import { dateTimeAttr, formatMonth, formatRange, monthIndex, scrollToId, setHash } from "../lib";

const addr = (i: number) => `0x${((i + 1) * 0x1000).toString(16).toUpperCase().padStart(4, "0")}`;

function RoleFacts({ role }: { role: Role }) {
  return (
    <dl className="role__facts">
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
          {role.workplace ? <span className="role__wp"> · {role.workplace}</span> : null}
        </dd>
      </div>
    </dl>
  );
}

function RoleDetail({ role, i, inline = false }: { role: Role; i: number; inline?: boolean }) {
  return (
    <div className="role">
      <p className="role__read mono" aria-hidden="true">
        <span className="led-dot led-dot--on" />
        READ {addr(i)} · 4 fields
      </p>
      {inline ? null : (
        <>
          <h3 className="role__company">{role.company}</h3>
          <p className="role__title">{role.title}</p>
        </>
      )}
      <StatusTag kind="supplied" />
      <RoleFacts role={role} />
      <div className="role__desc">
        <p className="role__desc-k mono">Description · draft template</p>
        <p>
          <Slots text={role.description.text} />
        </p>
        <StatusTag status={role.description.status} />
      </div>
    </div>
  );
}

/** Timeline axis: every role as a bar between its start and end month. */
function Axis({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const min = Math.min(...experience.map((r) => monthIndex(r.start)));
  const max = monthIndex(timelineNow) + 1;
  const span = max - min;
  const firstYear = Math.floor(min / 12) + 1;
  const years: number[] = [];
  for (let y = firstYear; y * 12 < max; y++) years.push(y);

  return (
    <div className="axis" aria-hidden="true">
      <div className="axis__years">
        {years.map((y) => (
          <span key={y} className="axis__year mono" style={{ left: `${((y * 12 - min) / span) * 100}%` }}>
            {y}
          </span>
        ))}
      </div>
      <div className="axis__rows">
        {experience.map((r) => {
          const s = monthIndex(r.start) - min;
          const e = monthIndex(r.end) + 1 - min;
          return (
            <div key={r.id} className="axis__row">
              <button
                type="button"
                tabIndex={-1}
                className="axis__bar"
                data-active={selected === r.id || undefined}
                data-present={r.end === "present" || undefined}
                style={{ left: `${(s / span) * 100}%`, width: `${((e - s) / span) * 100}%` }}
                onClick={() => onSelect(r.id)}
                title={`${r.company} · ${formatRange(r.start, r.end)}`}
              >
                <span className="axis__lbl mono">{r.company}</span>
              </button>
            </div>
          );
        })}
      </div>
      <span className="axis__now mono" style={{ left: `${((monthIndex(timelineNow) + 0.5 - min) / span) * 100}%` }}>
        now
      </span>
    </div>
  );
}

export function Experience() {
  const [selected, setSelected] = useState(experience[0].id);
  const wide = useMediaQuery("(min-width: 900px)");
  const tabsRef = useRef<HTMLDivElement>(null);
  const hash = useHash();
  const selfSet = useRef(false);

  // Deep link: #experience/<role-id>
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

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    let n = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % experience.length;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + experience.length) % experience.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = experience.length - 1;
    if (n < 0) return;
    e.preventDefault();
    choose(experience[n].id);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[n]?.focus();
  };

  const selIdx = experience.findIndex((r) => r.id === selected);
  const selRole = experience[selIdx];

  return (
    <section id="experience" className="section experience" aria-labelledby="experience-title">
      <div className="wrap">
        <SectionHeader
          id="experience"
          addr="0x02"
          kicker="Memory · Experience"
          title={
            <>
              Experience, <span className="serif">in order</span>
            </>
          }
          lede={
            <p>
              Five roles as supplied from LinkedIn. Titles, companies, types and dates are exact; descriptions are templates
              for Zeeshan to complete.
            </p>
          }
        />

        <div data-reveal>
          <Axis selected={selected} onSelect={choose} />
        </div>

        {wide ? (
          <div className="xp" data-reveal>
            <div className="xp__list" role="tablist" aria-orientation="vertical" aria-label="Roles" ref={tabsRef}>
              {experience.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  id={`xp-tab-${r.id}`}
                  aria-selected={selected === r.id}
                  aria-controls="xp-panel"
                  tabIndex={selected === r.id ? 0 : -1}
                  className="xrow"
                  onClick={() => choose(r.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  <span className="xrow__addr mono">{addr(i)}</span>
                  <span className="xrow__main">
                    <span className="xrow__company">{r.company}</span>
                    <span className="xrow__title">{r.title}</span>
                  </span>
                  <span className="xrow__meta mono">
                    <span>{formatRange(r.start, r.end)}</span>
                    <span className="xrow__type">{r.employmentType}</span>
                  </span>
                  <span className="xrow__bus" aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="xp__panel card" role="tabpanel" id="xp-panel" aria-labelledby={`xp-tab-${selected}`} tabIndex={0}>
              <RoleDetail key={selected} role={selRole} i={selIdx} />
            </div>
          </div>
        ) : (
          <ul className="xacc" data-reveal>
            {experience.map((r, i) => {
              const open = selected === r.id;
              return (
                <li key={r.id} className="xacc__item" data-open={open || undefined}>
                  <h3 className="xacc__h">
                    <button
                      type="button"
                      className="xrow"
                      aria-expanded={open}
                      aria-controls={`xacc-${r.id}`}
                      onClick={() => choose(r.id)}
                    >
                      <span className="xrow__addr mono">{addr(i)}</span>
                      <span className="xrow__main">
                        <span className="xrow__company">{r.company}</span>
                        <span className="xrow__title">{r.title}</span>
                      </span>
                      <span className="xrow__meta mono">
                        <span>{formatRange(r.start, r.end)}</span>
                        <span className="xrow__type">{r.employmentType}</span>
                      </span>
                      <span className="xacc__chev" aria-hidden="true" />
                    </button>
                  </h3>
                  <div id={`xacc-${r.id}`} className="xacc__panel" hidden={!open}>
                    <RoleDetail role={r} i={i} inline />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
