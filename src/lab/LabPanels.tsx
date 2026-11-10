import { SignalLab } from "./SignalLab";
import { SchedulerLab } from "./SchedulerLab";
import { ArchExplorer } from "./ArchExplorer";

/** Lazy-loaded chunk: the lab only downloads when the section is near. */
export default function LabPanels({ tab }: { tab: string }) {
  if (tab === "scheduler") return <SchedulerLab />;
  if (tab === "architecture") return <ArchExplorer />;
  return <SignalLab />;
}
