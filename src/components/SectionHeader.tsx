import type { ReactNode } from "react";
import { sections } from "../content/site";

/** Drawing-style section header: sheet number, kicker, condensed title, tick rule. */
export function SectionHeader({ id, title, lede }: { id: string; title: ReactNode; lede?: ReactNode }) {
  const s = sections.find((x) => x.id === id);
  const total = String(sections.length).padStart(2, "0");
  return (
    <header className="sh" data-reveal>
      <div className="sh__meta mono">
        <span className="sh__sheet">
          Sheet {s?.sheet} / {total}
        </span>
        <span className="sh__kicker">{s?.kicker}</span>
      </div>
      <div className="sh__rule" aria-hidden="true" />
      <h2 id={`${id}-title`} className="sh__title">
        {title}
      </h2>
      {lede ? <div className="sh__lede">{lede}</div> : null}
    </header>
  );
}
