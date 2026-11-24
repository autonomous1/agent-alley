# Bot task NN — <the question this run answers, imperative>

Read `agents/bot-developer-role.md` first. Then this file. Then the task's
**Knowledge base** sections — query them with `{{model_cli}} query section <layer>
<§N>`; the state model is the layer's model half, `*-kb.md` is the index, name the
half. Then the bot session's code only for the symbols in Files.

**Prohibitions:** `agents/AGENTS.md` (memory/skills, sibling repos); the run's
evidence is the live log + this file.
**Artifacts:** every log, trace, capture, and diff goes under `{{task_dir}}/logs/`
(`<NN>-<what>.log`, `<NN>-trace.json`); the analysis/report under
`{{task_dir}}/reports/`. Never the repo root. The report links the exact paths.
**Safety:** one long-lived session per trial; clean `close()`; wait before any
retry; never more than one bot in the live environment while the operator is
playing; never target the operator's pawn. Leftover seats are the known cause of a
full-server rejection and the stale-pawn confusion.

> **This is a run/prototype, not a code change.** The bot-developer measures,
> diagnoses, and recommends; the coder implements.
> Write the run's script under `{{drivers_dir}}/<name>.<ext>` — tracked and
> reviewable; the **Files** table names it. The script implements the behaviour
> itself, or imports it from the **proto fork** (a tracked copy of the package's
> source, reached with the runner's tree switch — the source keeps its canonical
> imports and the runner redirects them): it imports the plumbing, never the source
> tree's behaviour under test — a run that reports the source tree is a **production
> probe**, not a prototype. It is a rough probe, not a module: when
> it works repeatedly and the runs table shows it, the script plus its measurements
> is a **proof-of-concept for the designer**, who drafts the production task from it;
> the coder builds that. `{{task_dir}}/live/` is gitignored and is for raw captures
> only. A code change you discover goes in the report as a recommended task, with
> the evidence line that justifies it.

## Question

<The one hypothesis the run resolves, and the decision it informs. Make it
falsifiable: "does X happen when Y", "before A / after B". If there is no decision,
there is no task.>

**Knowledge base:** <the KB file(s) and section(s) this run depends on, with the
reason. Name one half, not both. Query them with `{{model_cli}} query section <layer>
<§N>` before the run; the slot is the entry point, not the limit — query any further
section the run needs. Do not edit the KB; the report's mechanism fit may cite them.
If this slot is missing or names no section, stop.>

## Setup

- **Host:** <the endpoint `{{live_url}}`; why>.
- **Auth/token:** <the bot token/scope (`{{token_env}}`); the operator's role —
  spectator or the other seat; the seats in use>.
- **Sessions:** <names, count, the same token; the clean-close rule>.
- **Scenario / order:** <the exact mission(s), the place, the target id, the
  arm-up; the timeout>.
- **Operator:** <watching as spectator/player; what they should look for; the
  map/3D>.

## Instrumentation

<The recorder and the log lines; the metrics (per shot/second, hp before/after,
distance/LOS, seat/pawn state, plan ms, tick p99); the exact artifact paths; the
format. If a metric is not logged, the conclusion cannot use it.>

## Baseline / comparison

<The previous result this run compares to; the change under test; the expected
direction.>

## Evidence

<The observables that make the run a success or failure, stated before the run: the
specific log line, the health frame, the seat count, the plan steps, the trace
field. Also the "no run" outcome: if the scenario does not occur in the timebox,
that is a result, not a failure.>

## Report

<The report must contain: the timeline (t, actor, event, detail); the metrics table;
the findings (numbered, each with a log/trace line); the mechanism fit (which
explanation the evidence supports and which it does not); the **POC hand-off**
(script path, the migration analysis — ordered operations, constants/guards and the
live-loop fix each encodes — what production must preserve, the failure modes, the
open questions) addressed to the designer; the recommendation (the next coder task or "no change").
The report is the deliverable, not the chat.>

## Safety and abort

<The stop conditions: the timebox; the dump not captured; the host down; the
operator leaves; the bot dies/reconnects; the stale seat. The abort action: close
cleanly, record the last log line, do not retry in a loop.>

## Out of scope

<The code changes (the coder's); the other scenarios; {{protected}}; the host
restarts; the long-running soak.>

## Files (read only these)

| File | Repo | Use |
|---|---|---|
| `agents/bot-developer-role.md` | {{repo}} | Read-only. The operator brief. |
| the KB file(s) named in Knowledge base | {{repo}} | Read-only. One row per file; `*-kb.md` is the split's index page. |
| <the bot session/CLI file> | {{repo}} | Read-only. The commands and the log fields. |
| <the host/arena file> | {{repo}} | Read-only. The accept path, the seat rule. |
| `{{drivers_dir}}/<name>.<ext>` | {{repo}} | **New.** The run's script (tracked, reviewable). |
| `{{task_dir}}/logs/<NN>-*` | {{repo}} | **New.** The raw evidence. |
| `{{task_dir}}/reports/<NN>-<slug>.md` | {{repo}} | **New.** The report. |

## Appendix: the exact commands and the log format

```bash
# the setup and the run; the token source; the operator's spectator state
# the recorder; the metrics; the cleanup
```

The log lines the report quotes verbatim (one per metric family): `<format>`.
