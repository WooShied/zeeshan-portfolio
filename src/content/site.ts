/**
 * ─────────────────────────────────────────────────────────────
 *  ALL EDITABLE CONTENT FOR THE SITE LIVES IN THIS FILE.
 * ─────────────────────────────────────────────────────────────
 *
 * How approval works (see README "Approving content"):
 *   status: "placeholder"  → shows "Placeholder · Awaiting Zeeshan approval"
 *   status: "approved"     → label removed for that item only
 *   status: "supplied"     → fact from a supplied source (LinkedIn)
 *
 * Approve items one at a time. Approving one paragraph does not approve
 * anything else. Everything in this file ships to the browser, so never
 * put private notes here.
 */
import type {
  ArchNode,
  ArchPath,
  Copy,
  FilterDef,
  LinkItem,
  Principle,
  Project,
  Role,
  SkillGroup,
} from "./types";

/* ── Labels (exact wording requested for the review draft) ── */
export const labels = {
  placeholder: "Placeholder · Awaiting Zeeshan approval",
  illustrativeProject: "Illustrative project placeholder · Not a verified Zeeshan project.",
  simulated: "Interactive demo · Simulated data.",
  placeholderDemo: "Placeholder demonstration · Awaiting Zeeshan approval.",
  supplied: "Source: LinkedIn",
};

/* ── Identity ─────────────────────────────────────────────── */
export const identity = {
  name: "Zeeshan Malik",
  initials: "ZM",
  /** Draft positioning line. */
  positioning: {
    text: "Robotics · Embedded Systems · Software Engineering",
    status: "placeholder",
  } as Copy,
  /** Draft headline. */
  headline: {
    text: "Code, signals, and the physical world.",
    status: "placeholder",
  } as Copy,
  /** Draft hero introduction. */
  intro: {
    text: "Software engineer working where code meets hardware: robotics, embedded systems, and the tools that test them. Currently a Robotics Test & Data Engineer at FieldAI.",
    status: "placeholder",
  } as Copy,
};

/* ── Links ────────────────────────────────────────────────────
 * LinkedIn is the working contact route. Set an href (and status
 * "approved") to switch on email, GitHub or a résumé.             */
export const links: LinkItem[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/zeeshan-malik-a67049180/",
    status: "supplied",
  },
  {
    id: "email",
    label: "Email",
    href: null,
    unavailableNote: "Email not supplied yet",
    status: "placeholder",
  },
  {
    id: "github",
    label: "GitHub",
    href: null,
    unavailableNote: "GitHub not supplied yet",
    status: "placeholder",
  },
  {
    id: "resume",
    label: "Résumé (PDF)",
    href: null,
    unavailableNote: "Résumé not supplied yet",
    status: "placeholder",
  },
];

/* ── About ────────────────────────────────────────────────── */
export const about = {
  paragraphs: [
    {
      text: "I’m interested in building reliable software that connects computation to the physical world. My interests span robotics, embedded systems, device communication, and the tools used to test and understand complex systems.",
      status: "placeholder",
    },
  ] as Copy[],
  /** Short facts shown beside the About text. Only supplied facts. */
  facts: [
    { label: "Current role", value: "Robotics Test & Data Engineer, FieldAI", status: "supplied" },
    { label: "Recent", value: "Robotics Software Engineering Intern, Trovador", status: "supplied" },
    { label: "Founded", value: "Mission Mirage · INTERmiNgle (co-founder)", status: "supplied" },
    { label: "Based in", value: "[Location to confirm]", status: "placeholder" },
    { label: "Education", value: "[Education to add]", status: "placeholder" },
  ] as { label: string; value: string; status: Copy["status"] }[],
};

/* ── Experience (supplied from LinkedIn) ──────────────────────
 * Titles, companies, employment types and dates are exactly as
 * supplied. Descriptions are draft templates; fill the [brackets]. */
export const experience: Role[] = [
  {
    id: "fieldai",
    company: "FieldAI",
    title: "Robotics Test & Data Engineer",
    start: "2026-08",
    end: "present",
    employmentType: "Contract",
    location: "Irvine, California, United States",
    workplace: "On-site",
    description: {
      text: "Contributed to [system or workflow to confirm] through [personal responsibility to confirm], validated using [method to confirm].",
      status: "placeholder",
    },
  },
  {
    id: "trovador",
    company: "Trovador",
    title: "Robotics Software Engineering Intern",
    start: "2026-06",
    end: "2026-07",
    employmentType: "Internship",
    location: null,
    workplace: "Remote",
    description: {
      text: "Contributed to [system or workflow to confirm] through [personal responsibility to confirm], validated using [method to confirm].",
      status: "placeholder",
    },
  },
  {
    id: "mission-mirage",
    company: "Mission Mirage",
    title: "Founder & Software Team Lead",
    start: "2025-09",
    end: "2026-06",
    employmentType: "Full-time",
    location: null,
    description: {
      text: "Founded and led [team or product to confirm], responsible for [personal responsibility to confirm], with outcomes measured by [method to confirm].",
      status: "placeholder",
    },
  },
  {
    id: "stem-academy",
    company: "STEM ACADEMY IRVINE",
    title: "Program Coordinator",
    start: "2024-07",
    end: "2026-05",
    employmentType: "Part-time",
    location: "Irvine, California, United States",
    description: {
      text: "Coordinated [program or activity to confirm] through [personal responsibility to confirm].",
      status: "placeholder",
    },
  },
  {
    id: "intermingle",
    company: "INTERmiNgle",
    title: "Co-Founder",
    start: "2024-08",
    end: "2025-12",
    employmentType: "Full-time",
    location: "Los Angeles, California, United States",
    description: {
      text: "Co-founded [organization focus to confirm], responsible for [personal responsibility to confirm].",
      status: "placeholder",
    },
  },
];

/* ── Engineering approach (all draft) ─────────────────────── */
export const principles: Principle[] = [
  {
    id: "measure",
    title: "Measure before guessing",
    body: "Instrument the system first. A logic-analyzer capture or a timestamped log usually ends a debate faster than a theory does.",
    status: "placeholder",
  },
  {
    id: "test",
    title: "Design for test",
    body: "Build the harness alongside the feature, so a behaviour can be repeated, compared, and trusted on real hardware.",
    status: "placeholder",
  },
  {
    id: "failure",
    title: "Make failure legible",
    body: "Faults should leave evidence: clear states, useful logs, and data that explains what the robot saw when it went wrong.",
    status: "placeholder",
  },
  {
    id: "interfaces",
    title: "Respect the interface",
    body: "Timing, units and protocols are contracts. Write them down, check them at the boundary, and the rest of the system gets simpler.",
    status: "placeholder",
  },
];

/* ── Skills (all proposed; no levels, no years) ───────────── */
export const skills: SkillGroup[] = [
  { id: "programming", name: "Programming", items: ["C", "C++", "Python"], status: "placeholder" },
  { id: "systems", name: "Systems", items: ["Embedded Linux", "Real-time systems"], status: "placeholder" },
  { id: "robotics", name: "Robotics", items: ["ROS 2", "Sensor integration"], status: "placeholder" },
  { id: "interfaces", name: "Interfaces", items: ["UART", "SPI", "I²C"], status: "placeholder" },
  { id: "tools", name: "Engineering tools", items: ["Git", "Automated testing", "Debugging"], status: "placeholder" },
];

/* ── Projects ─────────────────────────────────────────────── */
export const projectFilters: FilterDef[] = [
  { id: "all", label: "All" },
  { id: "sensors", label: "Sensors & data" },
  { id: "testing", label: "Test & validation" },
  { id: "realtime", label: "Real-time" },
  { id: "robotics", label: "Robotics" },
  { id: "comms", label: "Communication" },
];

const TBC_LINKS = (prefix: string): LinkItem[] => [
  { id: `${prefix}-repo`, label: "Repository", href: null, unavailableNote: "Repository link not supplied", status: "placeholder" },
  { id: `${prefix}-demo`, label: "Demo", href: null, unavailableNote: "Demo not supplied", status: "placeholder" },
  { id: `${prefix}-docs`, label: "Documentation", href: null, unavailableNote: "Documentation not supplied", status: "placeholder" },
];

export const projects: Project[] = [
  {
    slug: "sensor-telemetry",
    index: "P-01",
    title: "Sensor Acquisition & Telemetry",
    kind: "illustrative",
    status: "placeholder",
    summary:
      "A proposed case-study structure for reading sensor data, transporting it, and visualizing system behavior.",
    tags: ["sensors", "comms"],
    problem:
      "[Problem and context to confirm] — e.g. what needed to be observed, on which device, and why existing data was not enough.",
    contribution: "[Personal contribution to confirm]",
    architecture: {
      caption: "Proposed data path. Every component name is a slot to confirm.",
      nodes: [
        { id: "sensor", label: "Sensor", sub: "[Sensor to confirm]", col: 0, row: 0, detail: "Which physical quantity is measured, at what range and rate. [To confirm]" },
        { id: "mcu", label: "Microcontroller", sub: "[Hardware to confirm]", col: 1, row: 0, detail: "Reads the sensor bus, timestamps samples and frames packets. [To confirm]" },
        { id: "link", label: "Transport", sub: "[Link to confirm]", col: 2, row: 0, detail: "How data leaves the device: serial, radio, or network. [To confirm]" },
        { id: "host", label: "Host app", sub: "[Software to confirm]", col: 3, row: 0, detail: "Decodes, stores and plots the stream. [To confirm]" },
        { id: "store", label: "Log store", sub: "[Format to confirm]", col: 3, row: 1, detail: "Where recordings live for later analysis. [To confirm]" },
      ],
      edges: [
        { from: "sensor", to: "mcu", label: "[bus]" },
        { from: "mcu", to: "link", label: "frames" },
        { from: "link", to: "host", label: "stream" },
        { from: "host", to: "store", label: "records" },
      ],
    },
    stack: { hardware: ["[Hardware to confirm]"], software: ["[Software stack to confirm]"] },
    constraints: ["[Sample rate requirement to confirm]", "[Power or bandwidth limit to confirm]"],
    decisions: [
      { title: "[Engineering decision to confirm]", detail: "[Why this option was chosen over the alternatives]" },
    ],
    validation: "[Validation approach to confirm] — e.g. comparison against a reference instrument.",
    results: "[Verified result to add]",
    lessons: "[Lesson to add]",
    links: TBC_LINKS("p1"),
  },
  {
    slug: "validation-harness",
    index: "P-02",
    title: "Robotics Validation Harness",
    kind: "illustrative",
    status: "placeholder",
    summary: "A proposed case-study structure for repeatable test scenarios, logs, and failure analysis.",
    tags: ["testing", "robotics"],
    problem: "[Problem and context to confirm] — e.g. which behaviour needed repeatable testing and what made it hard.",
    contribution: "[Personal contribution to confirm]",
    architecture: {
      caption: "Proposed test loop. Every component name is a slot to confirm.",
      nodes: [
        { id: "scenario", label: "Scenario", sub: "[Definition format to confirm]", col: 0, row: 0, detail: "A repeatable description of the test: inputs, environment, pass criteria. [To confirm]" },
        { id: "runner", label: "Test runner", sub: "[Tooling to confirm]", col: 1, row: 0, detail: "Executes the scenario against the robot or a simulation. [To confirm]" },
        { id: "robot", label: "Robot / sim", sub: "[Platform to confirm]", col: 2, row: 0, detail: "The system under test. [To confirm]" },
        { id: "logs", label: "Logs", sub: "[Log format to confirm]", col: 2, row: 1, detail: "Recorded topics, events and timings. [To confirm]" },
        { id: "report", label: "Failure analysis", sub: "[Report to confirm]", col: 3, row: 1, detail: "Turns a failed run into something a person can act on. [To confirm]" },
      ],
      edges: [
        { from: "scenario", to: "runner", label: "load" },
        { from: "runner", to: "robot", label: "drive" },
        { from: "robot", to: "logs", label: "record" },
        { from: "logs", to: "report", label: "analyse" },
      ],
    },
    stack: { hardware: ["[Hardware to confirm]"], software: ["[Software stack to confirm]"] },
    constraints: ["[Test environment limit to confirm]", "[Run time or repeatability target to confirm]"],
    decisions: [{ title: "[Engineering decision to confirm]", detail: "[Why this option was chosen]" }],
    validation: "[Validation approach to confirm]",
    results: "[Verified result to add]",
    lessons: "[Lesson to add]",
    links: TBC_LINKS("p2"),
  },
  {
    slug: "rt-scheduling",
    index: "P-03",
    title: "Real-Time Task Scheduling Demo",
    kind: "illustrative",
    status: "placeholder",
    summary: "A proposed interactive demonstration of task timing, priorities, and execution behavior.",
    tags: ["realtime"],
    problem: "[Problem and context to confirm] — e.g. what the demo should teach about deadlines and priorities.",
    contribution: "[Personal contribution to confirm]",
    architecture: {
      caption: "Proposed demo structure. The Interactive Lab on this page includes a simulated scheduler of this kind.",
      nodes: [
        { id: "tasks", label: "Task set", sub: "period · cost · priority", col: 0, row: 0, detail: "Each task has a period, an execution cost and a priority. [Parameters to confirm]" },
        { id: "sched", label: "Scheduler", sub: "[Policy to confirm]", col: 1, row: 0, detail: "Chooses which ready task runs at each tick. [To confirm]" },
        { id: "target", label: "Target", sub: "[Hardware or simulation to confirm]", col: 2, row: 0, detail: "Where the schedule actually executes. [To confirm]" },
        { id: "trace", label: "Timing trace", sub: "[Capture method to confirm]", col: 3, row: 0, detail: "Shows run, preempt and deadline events. [To confirm]" },
      ],
      edges: [
        { from: "tasks", to: "sched", label: "release" },
        { from: "sched", to: "target", label: "dispatch" },
        { from: "target", to: "trace", label: "events" },
      ],
    },
    stack: { hardware: ["[Hardware to confirm]"], software: ["[RTOS or framework to confirm]"] },
    constraints: ["[Timing constraint to confirm]"],
    decisions: [{ title: "[Engineering decision to confirm]", detail: "[Why this option was chosen]" }],
    validation: "[Validation approach to confirm]",
    results: "[Verified result to add]",
    lessons: "[Lesson to add]",
    links: TBC_LINKS("p3"),
  },
];

/* ── System architecture explorer (placeholder demonstration) ── */
export const archNodes: ArchNode[] = [
  { id: "sensor", label: "IMU sensor", kind: "Sensor", x: 100, y: 110, role: "Measures acceleration and rotation, and reports it when the controller asks. Example only." },
  { id: "actuator", label: "Motor driver", kind: "Actuator", x: 100, y: 320, role: "Turns controller commands into motion. Included to show the command path. Example only." },
  { id: "mcu", label: "Controller", kind: "Microcontroller", x: 360, y: 215, role: "Polls the sensor, runs the control loop on a fixed period, and packs telemetry into frames. Example only." },
  { id: "comm", label: "Comms interface", kind: "Communication", x: 640, y: 215, role: "Carries frames between the device and the host, with framing and checksums. Example only." },
  { id: "host", label: "Host application", kind: "Host", x: 900, y: 215, role: "Decodes telemetry, plots it, and sends commands back down. Example only." },
];

export const archPaths: ArchPath[] = [
  {
    id: "telemetry",
    label: "Telemetry",
    description: "Sensor reading → controller → framed packet → host plot.",
    nodes: ["sensor", "mcu", "comm", "host"],
    links: ["SPI", "UART frames", "USB serial"],
  },
  {
    id: "command",
    label: "Command",
    description: "Host setpoint → framed packet → controller → actuator.",
    nodes: ["host", "comm", "mcu", "actuator"],
    links: ["USB serial", "UART frames", "PWM"],
  },
];

/* ── Hero board: which component maps to which section ─────── */
export const boardMap = [
  { id: "cpu", ref: "U1", name: "Processor", section: "about", sectionLabel: "About", blurb: "Who Zeeshan is and what he’s interested in." },
  { id: "mem", ref: "U2", name: "Memory", section: "experience", sectionLabel: "Experience", blurb: "Five roles, stored in order, read on demand." },
  { id: "io", ref: "J1", name: "I/O connectors", section: "projects", sectionLabel: "Projects", blurb: "Case studies: what goes in, what comes out." },
  { id: "dbg", ref: "J2", name: "Debug interface", section: "lab", sectionLabel: "Interactive Lab", blurb: "Probe a signal, a scheduler and a data path." },
  { id: "rf", ref: "M1", name: "Communications module", section: "contact", sectionLabel: "Contact", blurb: "Open a channel. LinkedIn is live." },
] as const;

/* ── Section list (navigation, command palette, rail) ──────── */
export const sections = [
  { id: "top", label: "Board", addr: "0x00" },
  { id: "projects", label: "Projects", addr: "0x01" },
  { id: "experience", label: "Experience", addr: "0x02" },
  { id: "approach", label: "Approach", addr: "0x03" },
  { id: "lab", label: "Lab", addr: "0x04" },
  { id: "about", label: "About", addr: "0x05" },
  { id: "contact", label: "Contact", addr: "0x06" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

/** Month used for "Present" on the timeline axis. Update occasionally. */
export const timelineNow = "2026-11";
