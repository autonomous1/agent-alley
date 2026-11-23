# Task NN — <one-line title, imperative: "Extract X", "Add Y", "Fix Z">

Read `agents/AGENTS.md` first. Then this file. Then the KB sections named in
**Knowledge base**: `{{model_cli}} query section <layer> <§N>` (the map; do not edit
it). Then `query symbol <name>` for each symbol in the Files table and open the
source file it names — never read `agents/codemap.md`.

**Prohibitions:** `agents/AGENTS.md` (memory/skills, sibling repos).
**Codemap:** at most one exact-symbol search from the Files table, then open that
source file. Do not scroll or re-open `codemap.md`.

**Repos:** all paths in `./{{repo}}`, unless a row says otherwise. Do not change
{{protected}}. Do not read memory or skill bodies (see above).
**Node:** start shell commands with the prefix in the **Repo profile**.
**Artifacts:** logs, fail-first output, scoped test output, and codemap diffs go
under `{{task_dir}}/logs/` (name `<task>-<what>.log` / `<task>-codemap.diff`); the
report goes under `{{task_dir}}/reports/`; live traces under `{{task_dir}}/live/`.
Never write these to the repo root.

**Context to Inject:** <the exact files the user pastes into the coder's fresh
context window, together with this task file. One path per line, each with a
one-line reason; repo-relative, or absolute for a sibling repo. List only the files
the coder must read in full: the source under edit, its test file, and the specific
report/log/evidence. Do not list `agents/codemap.md` (symbol lookup only,
regenerated), generated files (`dist/`, codemap), or {{protected}}; `agents/AGENTS.md`
is injected by the runner, do not list it. Every source/test path here must also
appear in the Files table. If the task reproduces an existing failure, list the
reproduction script and its log here too. Also list the KB file(s) named in
**Knowledge base** as the fallback; the coder queries the named sections, not the
whole file.>

> **Changed in vX.Y:** <one sentence: what this task assumes from prior tasks, what
> it closes, what it defers. Delete the whole line for a clean task with no
> dependency.>

**Architecture note:** <cite the specific `ARCHITECTURE` paragraph, `@invariant`,
decision entry, or the **prototype/report** this task productionizes (a POC row, a
research report). If it can't cite one, the task is speculative — stop and
reconsider.>

**Rapid prototype solution:** <when this task productionizes a working driver, its
path — the coder ports it and does not re-derive. Delete the line for a fresh
task.>

**Knowledge base:** <the KB file(s) and section(s) this task touches, with the
reason. E.g. `<layer>-model.md` §13 (the state model) and `<layer>-flow.md` §5;
`<layer>-kb.md` §13. Name one half, not both: the section decides the file. Query
the named section with `{{model_cli}} query section <layer> <§N>` before the source;
open the file only if the query fails. The KB is the map, not a field dump; a stale
claim is a report note, not an edit. If this slot is missing or names no section,
stop.>

**Files to touch:** <paths with a one-line purpose each. This bounds the executor's
codemap scope; nothing outside this list is in scope.>

**Codemap delta:** <entries to add, move, or remove. "Remove" only for symbols that
had entries in the prior codemap — verify with `rg` before writing. Line-number
shifts are expected when comments are inserted; the rule is "no signature text
changes, no reordering, no removed symbols," not "no `:line` changes.">

**Headers and tags:** for every touched module that exports more than one symbol,
update or create its four-slot header (`ARCHITECTURE` / `Wiring` / `Order` /
`Invariants`); tag every new or changed export (`@invariant` with `(test: <name>)`
or a deferred `(test lands …)`, plus `@pre` / `@post` / `@why` / `@when` / `@see` /
`@internal`). See `agents/AGENTS.md` "Comment as contract".

**Test-must-fail-first:** <for a new invariant, the test that fails on current
`HEAD`, with the expected failure to paste in the report. For extractions, the
import-error fail-first (`ERR_MODULE_NOT_FOUND`) is honest and sufficient — state in
the report that it is weaker than an assertion fail-first.>

**Test scope:** <the scoped command (`{{scoped_test_cmd}}`); which new/edited test
files belong to which scope; the expected `selected N/<total>`. If a new test
matches no scope in `{{gate_manifest}}`, add the pattern to the manifest as a step.
The scoped run is the task loop; the full `{{test_cmd}}` is the merge gate ({{ci}}),
not a per-task requirement.>

**Artifacts:** <exact paths under `{{task_dir}}/logs/`, e.g. `49-fail-first.log`,
`49-tests.log`, `49-codemap.diff`; never the repo root. The report links them.>

### Problem

<What is wrong today, or what does not exist yet. Two to four paragraphs. Name the
specific symbols and behaviors involved. If this is a refactor, say what the current
shape is and why it does not support what is next.>

### Design

<Numbered steps. Each step names files and symbols. Add an implementation-note
subsection only when the shape of the code is not obvious from the prose.>

1. <step>
2. <step>
3. <step>

### Migration analysis

<Prototype-derived tasks only. One row per prototype step: the driver's operation,
the constant or guard it relies on (and the failure that put it there), and the
source behaviour that must reproduce it. A dropped step, a changed constant or a
swapped order is a divergence — justify it here or keep the driver's shape.>

| driver step (operation) | relies on (const / guard / order) | source behaviour that must match |
|---|---|---|
| <…> | <…> | <…> |

### Implementation note

<Concrete code the executor can paste and adjust. Full module if new; exact diff
blocks if editing. If the scaffold has a bug, the executor fixes it and notes the
fix — the scaffold is a starting point, not a spec.>

### Tests

<- **`test/<name>.test.*`** — new or edited. Real objects where possible, no mocks
unless unavoidable.>
<- **Existing tests unchanged** — state which, or "all"; a dropped test is a real
bug.>
<- **Test count** — before → after. State the expected delta; a mismatch is
investigable.>

### Acceptance (hard gate)

<- `{{typecheck_cmd}}` passes; the **scoped** run from Test scope passes; **N
scoped tests, 0 fail**. Do not run the full `{{test_cmd}}` — it is the merge gate
({{ci}}), not the per-task loop.>
<- Standalone scoped run of the new/edited test file passes; both test names appear
in the report.>
<- **Fail-first is demonstrated** — report includes the failing run before the fix
and the passing run after, both verbatim.>
<- **Prototype parity** (prototype-derived tasks only): after the port, the live lane
runs the driver's scenario against the product path and both outputs are pasted. A
unit test is not parity.>
<- `{{codemap_check_cmd}}` passes.>
<- Codemap delta captured via `mkdir -p {{task_dir}}/logs && cp agents/codemap.md
/tmp/codemap-prev.md && {{codemap_cmd}} && git diff --no-index /tmp/codemap-prev.md
agents/codemap.md > {{task_dir}}/logs/<task>-codemap.diff` contains only the
expected added lines (and their `:line` shifts). Paste the summary and the log path;
the full diff stays in `logs/`.>
<- Every touched module that exports more than one symbol has its four-slot header
(new or updated), and every new/changed export carries its JSDoc tags; the repo's
header and tag gates pass in the scoped run; the codemap diff shows the header/tag
lines and no unexplained comment churn.>
<- {{protected}} unchanged: the diff for those paths is empty.>
<- <Any file whose behavior must not change — list specifically.>

### Out of scope

<- Deferred to a named future task, with a one-line reason.>
<- Adjacent refactors that would be tempting.>
<- Behavior changes that would sneak in through the acceptance gate.>

### Open questions

<- Design choices where the default is stated but could reasonably differ. Each
entry: question, default, when to reopen.>

### Files (read only these)

| File | Repo | Use |
|---|---|---|
| <path> | {{repo}} | Edit / Read-only reference / New |
| `agents/codemap.md` | {{repo}} | Regenerate; symbol lookup only. Do not edit by hand. |
| the KB file(s) named in Knowledge base | {{repo}} | Read-only. One row per file; `*-kb.md` is the split's index page. |
| <protected path> | {{repo}} | Read-only reference to confirm it is **not** edited. |
| <prototype/report path> | {{repo}} | Read-only. The behaviour this task productionizes. |

### Appendix: <pre-flight cross-check | fixture | exact diffs>

<If the task edits a file with n scattered references to a symbol, put an `rg` here
so the executor verifies the reference set before editing. This is the check that
catches a clean extraction going silently wrong when there is one unexpected extra
reference site. Also record the `{{model_cli}} query symbol|file|section` commands
used to verify this task's symbols; a cited symbol with no query in the appendix was
not verified against the model.>

<If the task uses a fixture, put the full fixture here so the executor doesn't have
to search for one.>

<If the task replaces specific comment text, put the exact current → new diff here,
so the executor doesn't paraphrase.>
