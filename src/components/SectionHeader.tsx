import { useState, type ReactNode } from "react";
import { sections } from "../content/site";
import { IconCheck, IconLink } from "./Icons";

/** Drawing-style section header: sheet number, kicker, condensed title, tick rule, copy-link. */
export function SectionHeader({ id, title, lede }: { id: string; title: ReactNode; lede?: ReactNode }) {
  const s = sections.find((x) => x.id === id);
  const total = String(sections.length).padStart(2, "0");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.hash = id;
    }
  };

  return (
    <header className="sh" data-reveal>
      <div className="sh__meta mono">
        <span className="sh__sheet">
          Sheet {s?.sheet} / {total}
        </span>
        <span className="sh__kicker">{s?.kicker}</span>
      </div>
      <div className="sh__rule" aria-hidden="true" />
      <div className="sh__titlerow">
        <h2 id={`${id}-title`} className="sh__title">
          {title}
        </h2>
        <button
          type="button"
          className="sh__link"
          onClick={copy}
          data-copied={copied || undefined}
          aria-label={copied ? "Link copied" : `Copy link to ${s?.label ?? id}`}
          title={copied ? "Link copied" : "Copy link to this sheet"}
        >
          {copied ? <IconCheck /> : <IconLink />}
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
      {lede ? <div className="sh__lede">{lede}</div> : null}
    </header>
  );
}
