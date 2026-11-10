import { principles, skills } from "../content/site";
import { SectionHeader } from "../components/SectionHeader";
import { StatusTag } from "../components/StatusTag";
import { ArchExplorer } from "../lab/ArchExplorer";

export function Approach() {
  return (
    <section id="approach" className="section approach" aria-labelledby="approach-title">
      <div className="wrap">
        <SectionHeader
          id="approach"
          title="Approach"
          lede={
            <p>
              Draft engineering notes, an example system, and proposed skills. Each item stays marked until Zeeshan confirms
              it in his own words.
            </p>
          }
        />

        <div className="notes" data-reveal>
          <h3 className="block-k mono">Notes</h3>
          <ol className="notes__list">
            {principles.map((p, i) => (
              <li key={p.id} className="note">
                <span className="note__num mono">{i + 1}.</span>
                <div className="note__txt">
                  <h4 className="note__title">{p.title}</h4>
                  <p>{p.body}</p>
                  <StatusTag status={p.status} />
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="figure-block" data-reveal>
          <ArchExplorer />
        </div>

        <div className="skills" data-reveal>
          <div className="skills__head">
            <h3 className="block-k mono">Proposed skills · parts list</h3>
            <p className="skills__note">Groups to confirm. No proficiency levels or years are shown, because none have been supplied.</p>
          </div>
          <div className="parts">
            <div className="parts__head mono" aria-hidden="true">
              <span>Bin</span>
              <span>Group</span>
              <span>Items</span>
              <span>Status</span>
            </div>
            <ul>
              {skills.map((g, i) => (
                <li key={g.id} className="part">
                  <span className="part__bin mono" aria-hidden="true">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <h4 className="part__name">{g.name}</h4>
                  <ul className="part__items" aria-label={`${g.name} skills`}>
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
      </div>
    </section>
  );
}
