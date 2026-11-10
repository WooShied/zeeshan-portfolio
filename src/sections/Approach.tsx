import { principles, skills } from "../content/site";
import { SectionHeader } from "../components/SectionHeader";
import { StatusTag } from "../components/StatusTag";

/* Schematic symbols, one per principle. Decorative. */
const GLYPHS = [
  // probe / measure (oscilloscope-like)
  <path key="a" d="M4 24h8l4-14 6 24 5-16 4 6h13" />,
  // test point
  <g key="b">
    <circle cx="24" cy="18" r="6" />
    <path d="M24 24v14M14 38h20" />
  </g>,
  // diode (directional, legible failure)
  <g key="c">
    <path d="M4 24h14M30 24h14M18 14v20l12-10z" />
    <path d="M30 14v20" />
  </g>,
  // connector / interface
  <g key="d">
    <rect x="10" y="12" width="28" height="24" rx="3" />
    <path d="M16 20h2M22 20h2M28 20h2M16 28h2M22 28h2M28 28h2M4 24h6M38 24h6" />
  </g>,
];

export function Approach() {
  return (
    <section id="approach" className="section approach" aria-labelledby="approach-title">
      <div className="wrap">
        <SectionHeader
          id="approach"
          addr="0x03"
          kicker="Firmware · Approach & skills"
          title={
            <>
              How the work <span className="serif">gets done</span>
            </>
          }
          lede={
            <p>
              Draft engineering principles and proposed skill groups. Each one is marked until Zeeshan confirms it in his own
              words.
            </p>
          }
        />

        <ol className="principles">
          {principles.map((p, i) => (
            <li key={p.id} className="principle" data-reveal style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}>
              <span className="principle__num mono">{String(i + 1).padStart(2, "0")}</span>
              <svg className="principle__glyph" viewBox="0 0 48 48" aria-hidden="true">
                {GLYPHS[i % GLYPHS.length]}
              </svg>
              <div className="principle__txt">
                <h3 className="principle__title serif">{p.title}</h3>
                <p>{p.body}</p>
                <StatusTag status={p.status} />
              </div>
            </li>
          ))}
        </ol>

        <div className="skills" data-reveal>
          <div className="skills__head">
            <h3 className="skills__title">Proposed skills</h3>
            <p className="skills__note">
              Groups to confirm. No proficiency levels or years are shown, because none have been supplied.
            </p>
          </div>
          <ul className="bins">
            {skills.map((g, i) => (
              <li key={g.id} className="bin card">
                <p className="bin__ref mono" aria-hidden="true">
                  BIN {String.fromCharCode(65 + i)}
                </p>
                <h4 className="bin__name">{g.name}</h4>
                <ul className="bin__items" aria-label={`${g.name} skills`}>
                  {g.items.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <StatusTag status={g.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
