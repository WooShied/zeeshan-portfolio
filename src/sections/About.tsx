import { about, identity } from "../content/site";
import { SectionHeader } from "../components/SectionHeader";
import { StatusTag } from "../components/StatusTag";
import { Slots } from "../components/Slots";

/** About, laid out like the first page of a component datasheet. */
export function About() {
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="wrap">
        <SectionHeader id="about" title="About" />

        <div className="ds" data-reveal>
          <div className="ds__head mono" aria-hidden="true">
            <span>{identity.initials}-01 · Datasheet</span>
            <span>Rev A · Draft</span>
          </div>
          <div className="ds__grid">
            <div className="ds__text">
              <p className="ds__section mono">1 · General description</p>
              {about.paragraphs.map((p, i) => (
                <div key={i} className="ds__para">
                  <p className="ds__lead">{p.text}</p>
                  <StatusTag status={p.status} />
                </div>
              ))}
            </div>

            <aside className="ds__facts" aria-labelledby="facts-title">
              <figure className="ds__portrait">
                {about.portrait.src ? (
                  <img src={about.portrait.src} alt={about.portrait.alt} loading="lazy" />
                ) : (
                  <figcaption className="ds__portrait-note mono">Portrait to be supplied</figcaption>
                )}
              </figure>
              <p id="facts-title" className="ds__section mono">
                2 · Key facts
              </p>
              <dl>
                {about.facts.map((f) => (
                  <div key={f.label} className="ds__fact">
                    <dt className="mono">{f.label}</dt>
                    <dd>
                      <Slots text={f.value} />
                      {f.status === "supplied" ? (
                        <span className="ds__src mono">LinkedIn</span>
                      ) : (
                        <StatusTag status={f.status} />
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
