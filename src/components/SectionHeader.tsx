import type { ReactNode } from "react";

export function SectionHeader({
  id,
  addr,
  kicker,
  title,
  lede,
  aside,
}: {
  id: string;
  addr: string;
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="sh" data-reveal>
      <p className="sh__kicker mono">
        <span className="sh__addr">{addr}</span>
        <span className="sh__rule" aria-hidden="true" />
        {kicker}
      </p>
      <div className="sh__row">
        <h2 id={`${id}-title`} className="sh__title">
          {title}
        </h2>
        {aside ? <div className="sh__aside">{aside}</div> : null}
      </div>
      {lede ? <div className="sh__lede">{lede}</div> : null}
    </header>
  );
}
