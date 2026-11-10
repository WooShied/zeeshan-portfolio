import { identity, links } from "../content/site";
import { SectionHeader } from "../components/SectionHeader";
import { ArrowIcon } from "../components/LinkButton";
import { StatusTag } from "../components/StatusTag";
import { LINK_ICON } from "../components/Icons";

/** Contact as a connector pinout: connected pins work, NC pins are not supplied yet. */
export function Contact() {
  const live = links.filter((l) => l.href);
  const first = identity.name.split(" ")[0];

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="wrap">
        <SectionHeader id="contact" title="Contact" />

        <div className="contact__grid" data-reveal>
          <div className="contact__main">
            <p className="contact__lead">LinkedIn is currently the contact channel listed for {first}.</p>
            <div className="contact__ctas">
              {live.map((l) => (
                <a key={l.id} className="btn btn--primary btn--lg" href={l.href!} target="_blank" rel="noopener noreferrer">
                  <span className="btn__lead">{LINK_ICON[l.id]?.()}</span>
                  Message on {l.label}
                  <ArrowIcon className="btn__icon btn__icon--r" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ))}
            </div>
            <p className="contact__note mono">No contact form: nothing on this page sends a message for you.</p>
          </div>

          <div className="pinout">
            <p className="block-k mono">Connector J3 · pinout</p>
            <table className="pinout__table">
              <thead>
                <tr className="mono">
                  <th scope="col">Pin</th>
                  <th scope="col">Channel</th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l, i) => (
                  <tr key={l.id} data-live={l.href ? "" : undefined}>
                    <td className="mono">{i + 1}</td>
                    <td>
                      <span className="pin__chan">
                        <span className="pin__ico">{LINK_ICON[l.id]?.()}</span>
                        {l.href ? (
                          <a href={l.href} target="_blank" rel="noopener noreferrer">
                            {l.label}
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        ) : (
                          l.label
                        )}
                      </span>
                    </td>
                    <td className="mono">
                      {l.href ? (
                        <span className="pin pin--on">Connected</span>
                      ) : (
                        <span className="pin">
                          NC <span className="pin__why">· {l.unavailableNote}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="pinout__note">NC = not connected. Email, GitHub and résumé appear here once supplied.</p>
            <StatusTag kind="placeholder" />
          </div>
        </div>
      </div>
    </section>
  );
}
