import type { ReactNode } from "react";

/* Small line icons drawn on a 20 × 20 grid, matching the drafting style. */
function Svg({ children, className = "ico" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconDrone = () => (
  <Svg>
    <rect x="7.5" y="7.5" width="5" height="5" />
    <path d="M7.5 7.5 5 5m7.5 2.5L15 5M7.5 12.5 5 15m7.5-2.5L15 15" />
    <circle cx="4" cy="4" r="2.4" />
    <circle cx="16" cy="4" r="2.4" />
    <circle cx="4" cy="16" r="2.4" />
    <circle cx="16" cy="16" r="2.4" />
  </Svg>
);

export const IconRegister = () => (
  <Svg>
    <rect x="4" y="3" width="10" height="13" />
    <path d="M6.5 6.5h5M6.5 9.5h5M6.5 12.5h3M16 6v11H7" />
  </Svg>
);

export const IconLogic = () => (
  <Svg>
    <path d="M2 7h3V3h5v4h8M2 16h6v-4h4v4h6" />
  </Svg>
);

export const IconNotes = () => (
  <Svg>
    <path d="M10 3 4.5 17M10 3l5.5 14M6.5 12h7" />
    <circle cx="10" cy="3" r="1" />
  </Svg>
);

export const IconScope = () => (
  <Svg>
    <rect x="2.5" y="4" width="15" height="11" />
    <path d="M4.5 10c1.2-4 2.4-4 3.6 0s2.4 4 3.6 0 2.4-4 3.6 0" />
    <path d="M7 17.5h6" />
  </Svg>
);

export const IconDatasheet = () => (
  <Svg>
    <path d="M5 2.5h7l3.5 3.5v11.5H5z" />
    <path d="M12 2.5V6h3.5M7.5 9.5h5M7.5 12h5M7.5 14.5h3" />
  </Svg>
);

export const IconAntenna = () => (
  <Svg>
    <path d="M10 9v9M7 18h6" />
    <circle cx="10" cy="7.5" r="1.4" />
    <path d="M6.5 4a5 5 0 0 0 0 7M13.5 4a5 5 0 0 1 0 7M4.2 2a8 8 0 0 0 0 11M15.8 2a8 8 0 0 1 0 11" />
  </Svg>
);

export const IconSun = () => (
  <Svg>
    <circle cx="10" cy="10" r="3.5" />
    <path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.8 1.8M14.2 14.2 16 16M4 16l1.8-1.8M14.2 5.8 16 4" />
  </Svg>
);

export const IconMoon = () => (
  <Svg>
    <path d="M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8Z" />
  </Svg>
);

export const IconLink = () => (
  <Svg>
    <path d="M8.5 11.5 11.5 8.5M7 9 5 11a2.8 2.8 0 0 0 4 4l2-2M13 11l2-2a2.8 2.8 0 0 0-4-4L9 7" />
  </Svg>
);

export const IconCheck = () => (
  <Svg>
    <path d="m4 10.5 4 4 8-9" />
  </Svg>
);

export const IconSearch = () => (
  <Svg>
    <circle cx="8.5" cy="8.5" r="5" />
    <path d="m12.5 12.5 4.5 4.5" />
  </Svg>
);

export const IconProfile = () => (
  <Svg>
    <rect x="2.5" y="2.5" width="15" height="15" />
    <path d="M6 9v5.5M6 6v.5M9 14.5V9m0 2.5c0-1.5 1-2.5 2.5-2.5S14 10 14 11.5v3" />
  </Svg>
);

export const IconMail = () => (
  <Svg>
    <rect x="2.5" y="4.5" width="15" height="11" />
    <path d="m2.5 5 7.5 6 7.5-6" />
  </Svg>
);

export const IconCode = () => (
  <Svg>
    <path d="M7 6 3 10l4 4M13 6l4 4-4 4M11 4 9 16" />
  </Svg>
);

export const IconDoc = () => (
  <Svg>
    <path d="M5 2.5h7l3.5 3.5v11.5H5z" />
    <path d="M10 8v6m-2.5-2.5L10 14l2.5-2.5" />
  </Svg>
);

/** Icon for each sheet, by section id. */
export const SECTION_ICON: Record<string, () => JSX.Element> = {
  top: IconDrone,
  projects: IconRegister,
  experience: IconLogic,
  approach: IconNotes,
  lab: IconScope,
  about: IconDatasheet,
  contact: IconAntenna,
};

/** Icon for each contact channel, by link id. */
export const LINK_ICON: Record<string, () => JSX.Element> = {
  linkedin: IconProfile,
  email: IconMail,
  github: IconCode,
  resume: IconDoc,
};
