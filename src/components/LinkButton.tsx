import type { LinkItem } from "../content/types";

export const ArrowIcon = ({ className = "lb__icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
    <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** External link, or a clearly unavailable item when no URL is supplied yet. */
export function LinkButton({ link }: { link: LinkItem }) {
  if (!link.href) {
    return (
      <span className="lb lb--off">
        <span className="lb__label">{link.label}</span>
        <span className="lb__note mono">{link.unavailableNote ?? "Not supplied yet"}</span>
      </span>
    );
  }
  return (
    <a className="lb" href={link.href} target="_blank" rel="noopener noreferrer">
      <span className="lb__label">{link.label}</span>
      <ArrowIcon />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
