# Content checklist for Zeeshan

Everything below is draft, inferred, or missing. Each item is labelled on the site until its `status` is changed in `src/content/site.ts` (see README → "Approving content"). Approve items one at a time.

## Positioning (hero)

- [ ] Positioning line: "Robotics · Embedded Systems · Software Engineering" (`identity.positioning`). Embedded systems is the requested design direction, not a confirmed specialization.
- [ ] Headline: "Code, signals, and the physical world." (`identity.headline`)
- [ ] Hero intro: "Software engineer working where code meets hardware: robotics, embedded systems, and the tools that test them. Currently a Robotics Test & Data Engineer at FieldAI." (`identity.intro`)

## About

- [ ] About paragraph (`about.paragraphs[0]`): "I'm interested in building reliable software that connects computation to the physical world…"
- [ ] Where he's based (`about.facts` → "Based in"). Not inferred from any employer location.
- [ ] Education (`about.facts` → "Education"), or remove the row.
- [ ] Portrait: supply a photo (a framed slot on the About sheet says "Portrait to be supplied").

## Experience (titles, companies, types and dates are as supplied; only descriptions need work)

For each role, replace the bracketed template and set `description.status: "approved"`:

- [ ] FieldAI · Robotics Test & Data Engineer
- [ ] Trovador · Robotics Software Engineering Intern
- [ ] Mission Mirage · Founder & Software Team Lead (location also not supplied)
- [ ] STEM ACADEMY IRVINE · Program Coordinator. Also confirm the company name's capitalization.
- [ ] INTERmiNgle · Co-Founder
- [ ] Confirm the supplied facts are still current (FieldAI end date shows "Present").

## Engineering approach (all four are draft)

- [ ] Measure before guessing
- [ ] Design for test
- [ ] Make failure legible
- [ ] Respect the interface

## Skills (all proposed; no levels or years shown)

- [ ] Programming: C, C++, Python
- [ ] Systems: Embedded Linux, Real-time systems
- [ ] Robotics: ROS 2, Sensor integration
- [ ] Interfaces: UART, SPI, I²C
- [ ] Engineering tools: Git, Automated testing, Debugging

## Projects (all three are illustrative structures, not his work)

For each project to keep: real title and summary, problem and context, personal contribution, architecture blocks, hardware and software stack, constraints, decisions, validation approach, verified results, lessons, and any repository, demo, or documentation links. Then set `kind: "verified"` and `status: "approved"`. Remove projects that don't apply.

- [ ] P-01 Sensor Acquisition & Telemetry
- [ ] P-02 Robotics Validation Harness
- [ ] P-03 Real-Time Task Scheduling Demo
- [ ] Do not link any project to an employer unless he states the connection.

## Contact and links

- [ ] LinkedIn URL is correct: https://www.linkedin.com/in/zeeshan-malik-a67049180/
- [ ] Email address (or leave unavailable)
- [ ] GitHub URL (or leave unavailable)
- [ ] Résumé PDF (or leave unavailable)

## Lab and example figure

- [ ] Keep the LiDAR mapping lab? (Labelled as simulated; makes no claims about his work.)
- [ ] Example system figure (Approach sheet): keep as a generic demonstration, replace with a system he actually built, or remove.

## Before launch

- [ ] Remove `public/robots.txt` "Disallow" and the `noindex` meta tag in `index.html`.
- [ ] Remove "(review draft)" from the page title in `index.html` and "A · Review draft" in `src/components/Footer.tsx` and `src/components/Nav.tsx`.
