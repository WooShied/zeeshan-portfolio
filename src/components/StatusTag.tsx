import type { Status } from "../content/types";
import { labels } from "../content/site";

type Kind = "placeholder" | "illustrative" | "simulated" | "demo" | "supplied";

const TEXT: Record<Kind, string> = {
  placeholder: labels.placeholder,
  illustrative: labels.illustrativeProject,
  simulated: labels.simulated,
  demo: labels.placeholderDemo,
  supplied: labels.supplied,
};

/**
 * Visible approval / data-source label, placed beside the content it
 * describes. With a `status` prop it only renders for unapproved items.
 */
export function StatusTag({
  kind = "placeholder",
  status,
  className = "",
}: {
  kind?: Kind;
  status?: Status;
  className?: string;
}) {
  if (status === "approved") return null;
  if (status === "supplied" && kind === "placeholder") return null;
  const tone = kind === "simulated" ? "sim" : kind === "supplied" ? "src" : "draft";
  return (
    <span className={`tag tag--${tone} ${className}`.trim()}>
      <span className="tag__led" aria-hidden="true" />
      <span className="tag__text">{TEXT[kind]}</span>
    </span>
  );
}
