import { lazy, Suspense, useEffect, useRef } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { useHash, useInView } from "../hooks";
import { scrollToId } from "../lib";

const LidarLab = lazy(() => import("../lab/LidarLab"));

/** One instrument on the bench: the LiDAR mapping demo, loaded when near. */
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
          title="LiDAR lab"
          lede={
            <p>
              A real-time mapping simulation that runs entirely in your browser: ray-traced LiDAR, pose registration and
              voxel fusion. It shows what this site can do; it is not data from Zeeshan’s work.
            </p>
          }
        />
        <div className="bench" data-reveal>
          {near ? (
            <Suspense fallback={<p className="bench__loading mono">Loading instrument…</p>}>
              <LidarLab />
            </Suspense>
          ) : (
            <p className="bench__loading mono">Instrument loads when this section is in view.</p>
          )}
        </div>
      </div>
    </section>
  );
}
