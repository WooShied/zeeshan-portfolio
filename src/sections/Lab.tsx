import { lazy, Suspense, useEffect, useRef } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { useHash, useInView } from "../hooks";
import { scrollToId } from "../lib";

const SignalLab = lazy(() => import("../lab/SignalLab"));

/** One instrument on the bench: the signal sampling demo, loaded when near. */
export function Lab() {
  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, "600px 0px", true);
  const hash = useHash();

  // Old deep links like #lab/signal still land here.
  useEffect(() => {
    if (hash.section === "lab" && hash.sub) scrollToId("lab");
  }, [hash]);

  return (
    <section id="lab" className="section lab" aria-labelledby="lab-title" ref={ref}>
      <div className="wrap">
        <SectionHeader
          id="lab"
          title="Signal lab"
          lede={
            <p>
              A small instrument that runs entirely in your browser. It shows how this site behaves; it is not a measurement
              from Zeeshan’s work.
            </p>
          }
        />
        <div className="bench" data-reveal>
          {near ? (
            <Suspense fallback={<p className="bench__loading mono">Loading instrument…</p>}>
              <SignalLab />
            </Suspense>
          ) : (
            <p className="bench__loading mono">Instrument loads when this section is in view.</p>
          )}
        </div>
      </div>
    </section>
  );
}
