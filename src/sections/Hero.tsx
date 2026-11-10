import { identity } from "../content/site";
import { StatusTag } from "../components/StatusTag";
import { Board } from "../components/board/Board";
import { emit, EV } from "../lib";
import { MOD_KEY } from "../components/Nav";

export function Hero() {
  const [first, ...rest] = identity.name.split(" ");
  return (
    <section id="top" className="hero" aria-labelledby="hero-name">
      <div className="wrap">
        <p className="hero__dwg mono">
          <span>DWG {identity.initials}-01</span>
          <span>Sheet 01 / 07</span>
          <span>General arrangement</span>
        </p>

        <div className="hero__head">
          <h1 id="hero-name" className="hero__name">
            <span>{first}</span> <span>{rest.join(" ")}</span>
          </h1>

          <div className="hero__lede">
            <div className="hero__item">
              <p className="hero__pos mono">{identity.positioning.text}</p>
              <StatusTag status={identity.positioning.status} />
            </div>
            <div className="hero__item">
              <p className="hero__headline">{identity.headline.text}</p>
              <StatusTag status={identity.headline.status} />
            </div>
            <div className="hero__item">
              <p className="hero__intro">{identity.intro.text}</p>
              <StatusTag status={identity.intro.status} />
            </div>
            <div className="hero__ctas">
              <a className="btn btn--primary" href="#projects">
                View projects
              </a>
              <a className="btn" href="#experience">
                Experience
              </a>
              <a className="btn" href="#contact">
                Contact
              </a>
              <button type="button" className="kbd-btn" onClick={() => emit(EV.palette)}>
                <kbd>{MOD_KEY}</kbd>
                <kbd>K</kbd>
                <span>search</span>
              </button>
            </div>
          </div>
        </div>

        <Board />
      </div>
    </section>
  );
}
