import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/hanken-grotesk/wght.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/hero.css";
import "./styles/sections.css";
import "./styles/lab.css";
import "./styles/overlays.css";
import App from "./App";

document.documentElement.classList.add("js");

// Safety net: never leave reveal-animated content hidden.
window.setTimeout(() => {
  document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) el.classList.add("is-in");
  });
}, 1200);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
