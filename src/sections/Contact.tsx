import { identity, links } from "../content/site";
import { SectionHeader } from "../components/SectionHeader";
import { ArrowIcon } from "../components/LinkButton";
import { StatusTag } from "../components/StatusTag";

export function Contact() {
  const live = links.filter((l) => l.href);
  const pending = links.filter((l) => !l.href);

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="wrap">
        <SectionHeader
          id="contact"
          addr="0x06"
          kicker="Comms · Contact"
          title={
            <>
              Open a <span className="serif">channel</span>
            </>
          }
        />

        <div className="contact__grid" data-reveal>
          <div className="contact__main card">
            <div className="wave" aria-hidden="true">
              <svg viewBox="0 0 400 60" preserveAspectRatio="none">
                <path d="M0 30 Q 25 0 50 30 T 100 30 T 150 30 T 200 30 T 250 30 T 300 30 T 350 30 T 400 30 T 450 30 T 500 30" />
              </svg>
            </div>
            <p className="contact__lead">LinkedIn is currently the contact channel listed for {identity.name.split(" ")[0]}.</p>
            <div className="contact__ctas">
              {live.map((l) => (
                <a key={l.id} className="btn btn--primary btn--lg" href={l.href!} target="_blank" rel="noopener noreferrer">
                  Message on {l.label}
                  <ArrowIcon className="btn__icon btn__icon--r" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ))}
            </div>
            <p className="contact__note mono">No contact form: nothing on this page sends a message for you.</p>
          </div>

          <div className="contact__side">
            <p className="contact__side-k mono">Other channels</p>
            <ul className="chan">
              {pending.map((l) => (
                <li key={l.id} className="chan__row">
                  <span className="chan__name">{l.label}</span>
                  <span className="chan__state mono">
                    <span className="led-dot" aria-hidden="true" />
                    {l.unavailableNote}
                  </span>
                </li>
              ))}
            </ul>
            <StatusTag kind="placeholder" />
          </div>
        </div>
      </div>
    </section>
  );
}
