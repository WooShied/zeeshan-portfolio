import { identity } from "../content/site";

/** Footer as the drawing's title strip. */
export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <dl className="foot__strip mono">
          <div className="foot__name">
            <dt>Drawn for</dt>
            <dd>{identity.name}</dd>
          </div>
          <div>
            <dt>Drawing</dt>
            <dd>{identity.initials}-01</dd>
          </div>
          <div>
            <dt>Revision</dt>
            <dd>A · Review draft</dd>
          </div>
          <div className="foot__note">
            <dt>Notes</dt>
            <dd>Items marked “Placeholder · Awaiting Zeeshan approval” are draft. Interactive demos use simulated data.</dd>
          </div>
        </dl>
        <a className="foot__top mono" href="#top">
          Back to sheet 01 ↑
        </a>
      </div>
    </footer>
  );
}
