import { identity } from "../content/site";

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot__inner">
        <p className="foot__name">
          {identity.name}
          <span className="mono foot__rev">Review draft · Rev A</span>
        </p>
        <p className="foot__note">
          Items marked “Placeholder · Awaiting Zeeshan approval” are draft content. Interactive demos use simulated data.
        </p>
        <a className="foot__top mono" href="#top">
          Back to the board ↑
        </a>
      </div>
    </footer>
  );
}
