import { identity } from "../content/site";
import { StatusTag } from "../components/StatusTag";
import { Board } from "../components/board/Board";
import { emit, EV } from "../lib";
import { MOD_KEY } from "../components/Nav";

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-name">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <p className="hero__pos mono">
            <span className="hero__pos-text">{identity.positioning.text}</span>
          </p>
          <StatusTag status={identity.positioning.status} className="hero__tag" />

          <h1 id="hero-name" className="hero__name">
            {identity.name}
          </h1>

          <p className="hero__headline serif">{identity.headline.text}</p>
          <StatusTag status={identity.headline.status} className="hero__tag" />

          <p className="hero__intro">{identity.intro.text}</p>
          <StatusTag status={identity.intro.status} className="hero__tag" />

          <div className="hero__ctas">
            <a className="btn btn--primary" href="#projects">
              View projects
            </a>
            <a className="btn btn--ghost" href="#experience">
              Experience
            </a>
            <a className="btn btn--ghost" href="#contact">
              Contact
            </a>
          </div>

          <p className="hero__kbd mono">
            <button type="button" className="kbd-btn" onClick={() => emit(EV.palette)}>
              <kbd>{MOD_KEY}</kbd>
              <kbd>K</kbd>
              <span>search the site</span>
            </button>
          </p>
        </div>

        <div className="hero__board">
          <Board />
        </div>
      </div>
    </section>
  );
}
