import { useEffect, useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "../hooks";
import { StatusTag } from "../components/StatusTag";

type Policy = "rm" | "edf";
interface Task {
  id: string;
  name: string;
  period: number;
  cost: number;
}

const DEFAULT_TASKS: Task[] = [
  { id: "t1", name: "Sensor read", period: 6, cost: 2 },
  { id: "t2", name: "Control loop", period: 9, cost: 3 },
  { id: "t3", name: "Telemetry", period: 16, cost: 3 },
];
const HORIZON = 48;
const COLORS = ["var(--sig)", "var(--fg-2)", "var(--amber)"];

interface Result {
  timeline: (number | null)[]; // task index running at each tick
  releases: { t: number; task: number }[];
  misses: { t: number; task: number }[];
}

/** Preemptive single-CPU scheduler. Deadline = period; a job that misses is dropped. */
export function simulate(tasks: Task[], policy: Policy, horizon = HORIZON): Result {
  const jobs: { task: number; remaining: number; deadline: number }[] = [];
  const timeline: (number | null)[] = [];
  const releases: Result["releases"] = [];
  const misses: Result["misses"] = [];
  for (let t = 0; t < horizon; t++) {
    // deadline check, then releases
    for (let j = jobs.length - 1; j >= 0; j--) {
      if (jobs[j].deadline <= t && jobs[j].remaining > 0) {
        misses.push({ t: jobs[j].deadline, task: jobs[j].task });
        jobs.splice(j, 1);
      }
    }
    tasks.forEach((k, i) => {
      if (t % k.period === 0) {
        jobs.push({ task: i, remaining: k.cost, deadline: t + k.period });
        releases.push({ t, task: i });
      }
    });
    let pick = -1;
    jobs.forEach((j, idx) => {
      if (pick < 0) return void (pick = idx);
      const a = jobs[pick];
      const better =
        policy === "rm"
          ? tasks[j.task].period < tasks[a.task].period || (tasks[j.task].period === tasks[a.task].period && j.task < a.task)
          : j.deadline < a.deadline || (j.deadline === a.deadline && j.task < a.task);
      if (better) pick = idx;
    });
    if (pick >= 0) {
      const j = jobs[pick];
      timeline.push(j.task);
      j.remaining -= 1;
      if (j.remaining === 0) jobs.splice(pick, 1);
    } else timeline.push(null);
  }
  jobs.forEach((j) => {
    if (j.deadline === horizon && j.remaining > 0) misses.push({ t: horizon, task: j.task });
  });
  return { timeline, releases, misses };
}

/** Real-time scheduling playground. Simulated data only. */
export function SchedulerLab() {
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [policy, setPolicy] = useState<Policy>("rm");
  const reduce = useReducedMotion();
  const [running, setRunning] = useState(!reduce);
  const [tick, setTick] = useState(reduce ? HORIZON : 0);
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref);

  const res = useMemo(() => simulate(tasks, policy), [tasks, policy]);
  const U = tasks.reduce((s, k) => s + k.cost / k.period, 0);
  const n = tasks.length;
  const rmBound = n * (Math.pow(2, 1 / n) - 1);

  useEffect(() => {
    if (!running || !onScreen) return;
    const id = window.setInterval(() => {
      setTick((t) => (t >= HORIZON ? 0 : t + 1));
    }, 180);
    return () => window.clearInterval(id);
  }, [running, onScreen]);

  const update = (i: number, key: "period" | "cost", v: number) =>
    setTasks((ts) =>
      ts.map((k, j) => {
        if (j !== i) return k;
        const next = { ...k, [key]: v };
        if (next.cost > next.period) next.cost = next.period;
        return next;
      }),
    );

  const reset = () => {
    setTasks(DEFAULT_TASKS);
    setPolicy("rm");
    setTick(reduce ? HORIZON : 0);
    setRunning(!reduce);
  };

  const CW = 20;
  const RH = 40;
  const LW = 120;
  const W = LW + HORIZON * CW;
  const rows = tasks.length + 1;
  const H = rows * RH + 26;
  const shownMisses = res.misses.filter((m) => m.t <= tick);
  const verdict =
    policy === "rm"
      ? U <= rmBound
        ? "Guaranteed (U ≤ RM bound)"
        : U <= 1
          ? "Not guaranteed by the bound; check the trace"
          : "Overloaded (U > 1)"
      : U <= 1
        ? "Schedulable (EDF, U ≤ 1)"
        : "Overloaded (U > 1)";

  return (
    <div className="lab-panel sched" ref={ref}>
      <div className="lab-panel__head">
        <div>
          <h3 className="lab-panel__title">Real-time task scheduler</h3>
          <p className="lab-panel__sub">
            Three periodic tasks share one CPU. The scheduler picks which ready job runs each millisecond; a job that is
            still unfinished at its deadline counts as a miss.
          </p>
        </div>
        <StatusTag kind="simulated" />
      </div>

      <div className="sched__grid">
        <div className="sched__chart">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="sched__svg"
            role="img"
            aria-label={`Simulated schedule over ${HORIZON} milliseconds using ${
              policy === "rm" ? "rate-monotonic" : "earliest-deadline-first"
            } scheduling. Utilization ${(U * 100).toFixed(0)} percent. ${res.misses.length} deadline misses.`}
          >
            {tasks.map((k, i) => (
              <g key={k.id} className="lane">
                <rect x={0} y={i * RH + RH / 2 - 4} width={8} height={8} rx={2} style={{ fill: COLORS[i] }} />
                <text x={16} y={i * RH + RH / 2 + 4}>
                  {k.name}
                </text>
              </g>
            ))}
            <text x={16} y={tasks.length * RH + RH / 2 + 4} className="lane lane--cpu">
              CPU
            </text>
            <g transform={`translate(${LW} 0)`}>
              {Array.from({ length: HORIZON + 1 }, (_, t) => (
                <line key={t} x1={t * CW} x2={t * CW} y1={0} y2={rows * RH} className={t % 4 === 0 ? "g g--major" : "g"} />
              ))}
              <line x1={0} x2={HORIZON * CW} y1={tasks.length * RH} y2={tasks.length * RH} className="g g--major" />
              {Array.from({ length: HORIZON / 4 + 1 }, (_, i) => (
                <text key={i} x={i * 4 * CW + 2} y={rows * RH + 16} className="tl">
                  {i * 4}
                </text>
              ))}
              {res.timeline.map((ti, t) =>
                ti === null ? null : (
                  <g key={t} className={t < tick ? "run is-done" : "run"}>
                    <rect x={t * CW + 1} y={ti * RH + 9} width={CW - 2} height={RH - 18} rx="2" style={{ fill: COLORS[ti] }} />
                    <rect x={t * CW + 1} y={tasks.length * RH + 9} width={CW - 2} height={RH - 18} rx="2" style={{ fill: COLORS[ti] }} />
                  </g>
                ),
              )}
              {res.releases.map((r) => (
                <path key={`r${r.t}-${r.task}`} d={`M${r.t * CW} ${r.task * RH + RH - 6}V${r.task * RH + 4}m-3 4 3-4 3 4`} className="rel" />
              ))}
              {shownMisses.map((m) => (
                <g key={`m${m.t}-${m.task}`} className="miss">
                  <circle cx={m.t * CW} cy={m.task * RH + RH / 2} r="7" />
                  <path d={`M${m.t * CW - 3} ${m.task * RH + RH / 2 - 3}l6 6m0-6-6 6`} />
                </g>
              ))}
              <line x1={tick * CW} x2={tick * CW} y1={0} y2={rows * RH} className="playhead" />
            </g>
          </svg>
        </div>

        <div className="sched__controls">
          <div className="sched__pol">
          <fieldset className="seg">
            <legend className="ctl__lbl">Policy</legend>
            {(
              [
                ["rm", "Rate-monotonic"],
                ["edf", "Earliest deadline"],
              ] as const
            ).map(([v, l]) => (
              <label key={v} className="seg__opt">
                <input type="radio" name="sched-pol" value={v} checked={policy === v} onChange={() => setPolicy(v)} />
                <span>{l}</span>
              </label>
            ))}
          </fieldset>
          <div className="ctl__btns">
            <button type="button" className="btn btn--sig btn--sm" aria-pressed={!running} onClick={() => setRunning((r) => !r)}>
              {running ? "Pause" : "Run"}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
              Reset
            </button>
          </div>
          </div>

          {tasks.map((k, i) => (
            <fieldset key={k.id} className="task">
              <legend>
                <i style={{ background: COLORS[i] }} aria-hidden="true" />
                {k.name}
              </legend>
              <div className="ctl">
                <label htmlFor={`${k.id}-p`} className="ctl__lbl">
                  Period <output className="mono">{k.period} ms</output>
                </label>
                <input id={`${k.id}-p`} type="range" min={3} max={24} value={k.period} onChange={(e) => update(i, "period", +e.target.value)} />
              </div>
              <div className="ctl">
                <label htmlFor={`${k.id}-c`} className="ctl__lbl">
                  Execution time <output className="mono">{k.cost} ms</output>
                </label>
                <input id={`${k.id}-c`} type="range" min={1} max={Math.min(8, k.period)} value={k.cost} onChange={(e) => update(i, "cost", +e.target.value)} />
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <dl className="readouts readouts--row" aria-live="polite">
        <div>
          <dt className="mono">Time</dt>
          <dd className="mono">t = {tick} ms</dd>
        </div>
        <div className={U > 1 ? "is-warn" : ""}>
          <dt className="mono">CPU utilization</dt>
          <dd className="mono">{(U * 100).toFixed(1)} %</dd>
        </div>
        <div>
          <dt className="mono">RM bound (n = 3)</dt>
          <dd className="mono">{(rmBound * 100).toFixed(1)} %</dd>
        </div>
        <div className={res.misses.length ? "is-warn" : "is-ok"}>
          <dt className="mono">Deadline misses</dt>
          <dd className="mono">{res.misses.length} in 48 ms</dd>
        </div>
        <div className="readouts__wide">
          <dt className="mono">Verdict</dt>
          <dd>{verdict}</dd>
        </div>
      </dl>

      <p className="lab-panel__explain">
        <strong>What you’re seeing:</strong> each row is a task; small arrows mark job releases, filled blocks are execution,
        and the bottom row is the CPU. Rate-monotonic gives the shortest period the highest priority; earliest-deadline-first
        always runs the job due soonest. Push utilization past 100% and the red markers show deadlines being missed.
      </p>
    </div>
  );
}
