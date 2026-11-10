import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { useHash, useInView } from "../hooks";
import { scrollToId, setHash } from "../lib";

const LabPanels = lazy(() => import("../lab/LabPanels"));

export const LAB_TABS = [
  { id: "signal", label: "Signal sampling", probe: "CH1" },
  { id: "scheduler", label: "Task scheduler", probe: "CH2" },
  { id: "architecture", label: "Architecture", probe: "CH3" },
];

export function Lab() {
  const [tab, setTab] = useState("signal");
  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, "600px 0px", true);
  const hash = useHash();
  const selfSet = useRef(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Deep link: #lab/<tab>
  useEffect(() => {
    if (hash.section === "lab" && hash.sub && LAB_TABS.some((t) => t.id === hash.sub)) {
      setTab(hash.sub);
      if (selfSet.current) selfSet.current = false;
      else scrollToId("lab");
    }
  }, [hash]);

  const choose = (id: string) => {
    selfSet.current = true;
    setTab(id);
    setHash(`#lab/${id}`, "replace");
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % LAB_TABS.length;
    if (e.key === "ArrowLeft") n = (i - 1 + LAB_TABS.length) % LAB_TABS.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = LAB_TABS.length - 1;
    if (n < 0) return;
    e.preventDefault();
    choose(LAB_TABS[n].id);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[n]?.focus();
  };

  return (
    <section id="lab" className="section lab" aria-labelledby="lab-title" ref={ref}>
      <div className="wrap">
        <SectionHeader
          id="lab"
          addr="0x04"
          kicker="Debug · Interactive lab"
          title={
            <>
              Interactive <span className="serif">lab</span>
            </>
          }
          lede={
            <p>
              Three small instruments that run entirely in your browser. They demonstrate how this site behaves; they are not
              measurements from Zeeshan’s work.
            </p>
          }
        />

        <div className="bench" data-reveal>
          <div className="bench__tabs" role="tablist" aria-label="Lab instruments" ref={tabsRef}>
            {LAB_TABS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`lab-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="lab-panel"
                tabIndex={tab === t.id ? 0 : -1}
                className="bench__tab"
                onClick={() => choose(t.id)}
                onKeyDown={(e) => onKey(e, i)}
              >
                <span className="bench__probe mono">{t.probe}</span>
                {t.label}
              </button>
            ))}
          </div>
          <div className="bench__panel" role="tabpanel" id="lab-panel" aria-labelledby={`lab-tab-${tab}`}>
            {near ? (
              <Suspense fallback={<p className="bench__loading mono">Loading instrument…</p>}>
                <LabPanels tab={tab} />
              </Suspense>
            ) : (
              <p className="bench__loading mono">Instrument loads when this section is in view.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
