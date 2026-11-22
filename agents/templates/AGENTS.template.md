# AGENTS.md — {{repo}}

{{description}}

**Repo:** {{root}}. Run every command from this folder.

**Node:** {{node}}. Start shell commands with
`cd {{root}} && export PATH={{node_bin}}:$PATH &&` so `node`, `npm` and `npx`
resolve to the pinned version.

**Roles:** the role briefs are `agents/coder-role.md`, `agents/designer-role.md`,
`agents/researcher-role.md`, `agents/model-developer-role.md` and — when the repo
runs a live lane — `agents/bot-developer-role.md`; this file is the repo-wide rule
set common to all of them.

## Repo profile

Filled by `modev init`; edit in place. Every brief refers back here, so a command
or path changes in one place.

| Key | Value |
|---|---|
| `repo` | {{repo}} |
| `root` | {{root}} |
| `node` | {{node}} |
| `node bin` | {{node_bin}} |
| `test` | {{test_cmd}} |
| `scoped test` | {{scoped_test_cmd}} |
| `typecheck` | {{typecheck_cmd}} |
| `build` | {{build_cmd}} |
| `codemap` | {{codemap_cmd}} |
| `codemap check` | {{codemap_check_cmd}} |
| `model` | {{model_cli}} |
| `tasks` | {{task_dir}} |
| `layers` | {{layers}} |
| `gates` | {{gates}} |
| `gate manifest` | {{gate_manifest}} |
| `protected` | {{protected}} |
| `merge gate` | {{ci}} |

## Read order for every task (hard stop)

1. The task file the user named — only once.
2. This `agents/AGENTS.md` — already injected; do not re-read.
3. The KB sections named in the task's **Knowledge base** slot (only those
   sections; the KB is the map, not a field dump). Query them:
   `{{model_cli}} query section <layer> <§N>`. If the slot is missing or names no
   section, stop.
4. The task's **Files table** paths (and only the line ranges / symbols it names).
5. **Symbol lookup:** `{{model_cli}} query symbol <exact name>`, then open the
   source file it names. Never read `agents/codemap.md`.

`agents/operator-notes.md`, when present, is the operator's dated record; it is
not a read-order step — the durable rules live in the role briefs.

## Reports are the handoff

The pipeline is a graph, not a line: each session writes a report, and the next
session reads the one for its area before acting.

| Lane | Writes | Reads before acting |
|---|---|---|
| designer | `{{task_dir}}/proposed/*.md` | the ledger, report dir, `agents/research/*.md` |
| coder | `{{task_dir}}/reports/<task>-*.md` | the prototype/report the task cites |
| researcher | `agents/research/*.md` | the model (`{{model_cli}}`) and the source |
| model | `agents/model-reviews/*.md` | the reports a task or run cites |
| live/bot developer (optional) | `{{task_dir}}/reports/live-*.md`; the run ledger | the ledger, the drivers README, the prior `live-*.md` |

A task or run cites the report it builds on (Architecture note or Files table). A
report with no consumer is not done: end it with the proposal or the `Next:` line.

## Query the model — never read the map

`agents/codemap.md` and the KB files are inputs to `{{model_cli}}`; a session asks
for one entry, not the document.

- **Symbol:** `{{model_cli}} query symbol <exact name>` → `file:line`, signature,
  doc line, tags, calls, used-by. Open that source file and verify: the source is
  the truth, the codemap is the index.
- **Module:** `query file <path>` → imports, packages, used-by, and the symbol list.
- **KB section:** `query section <layer|file> <§N>` → exactly that section
  (`entity <Name>` stitches the state-model entity row).
- **Discovery** (no task, no Files table): the first search is `find <text>`
  (unknown name) or `query symbol <name>` (known name); open the file the query
  names. `rg` follows and is scoped to that file or directory; it is right for
  call sites, function-locals, `test/` and `packages/` (not in the codemap). A
  repo-wide `rg --include` sweep is the last resort — say what the query missed.
- **Freshness:** the codemap describes the last regeneration. While you are
  editing, source outranks it. Regenerate (`{{codemap_cmd}}`) before reporting,
  then re-query.
- **A member is not a symbol.** A method on a class or a factory's object is not a
  top-level symbol; `query symbol` will miss it. Query the owner's file and read
  the declaration.

## Do not read memory or skills

The harness's only always-on instruction surface is `AGENTS.md`: this file and the
home `AGENTS.md` are already in the prompt.

- Do **not** re-read this file (or the home `AGENTS.md`) for "context".
- Do **not** open a `SKILL.md` body unless the task names that skill.
- If a memory plugin is installed, do **not** call its tools and do **not** read
  its state directories. Auto-suggestions that open those paths are wrong —
  close them and stay on the Files table.

## Do not open other repos

Do **not** open a sibling repository unless the Files table names a path there.
"Do not change repo X" also means do not read it to invent a design.

If the task sketches collision / movement / lights / input or similar, implement
**exactly** that sketch in the listed files. Do not rediscover behaviour by
searching dependencies or sibling repos.

## Find code fast

- Ask the model for the exact symbol; open the file it names and verify it there.
- `rg` the source for a symbol the model does not know (function-locals, call sites
  inside a function), or to verify an entry.
- Regenerate with `{{codemap_cmd}}` after adding, moving or renaming exports.
  `{{codemap_check_cmd}}` exits 1 if it is stale. `{{model_cli}} drift` reports a
  KB/codemap mismatch.

## Comment as contract

Comments carry what types cannot: *why*, *when*, and cross-call invariants. They
are load-bearing, not decorative — the codemap extracts them and the per-task diff
surfaces them. A stale comment is a bug.

**Module header.** Every module that exports more than one symbol opens with four
labeled slots, one line each. Omit a slot rather than fill it with filler.

```ts
// ARCHITECTURE: <what this module is for, one sentence>.
// Wiring: <who constructs it, who calls it, what it composes>.
// Order: <load/init invariants a refactor would break>.
// Invariants: <state that must hold across calls and is not typed>.
```

**Tag vocabulary (closed set — additions need a consumer).**

- `@invariant` — must remain true across calls. Pair with an explicit
  `(test: <name>)` reference to an existing test, or defer with
  `(test lands …)` if the test is scheduled for a later task. Silence is a bug;
  the pairing gate checks this.
- `@pre` / `@post` — contracts the type cannot express: call order, required prior
  action.
- `@why` — the non-obvious choice; the "looks wrong but isn't". Highest-value tag.
- `@when` — lifecycle: "set once `x` resolves", "call before `take`".
- `@see` — cross-reference the codemap can link.
- `@internal` — excluded from the exported surface.

Do not tag `@param` / `@returns` when the signature already says it. Do not
restate the types.

**KB row classifications.** The state-model tables tag each row:
`S` structural (a container or shape checkable from the declaration), `B`
behavioral (a lifetime rule: one-shot, per-tick/snapshot/frame clear, monotonic,
TTL), `X` cross-boundary (the state or reference crosses a layer boundary; the
contract lives in the shared/model KB). A candidate invariant is not an
`@invariant` until a test or tag confirms it.

**Editorial rule: why and when, not how.** "How it works" duplicates the body and
rots fastest. If the *how* is non-obvious, the fix is a named type, a helper, or a
test — not a comment. The exception is *how to use it* (calling convention), which
is `@pre` / `@when`.

**Tag on touch.** When a task edits a module, update that module's four-slot
header and the tags on every new or changed export. Do not sweep untouched code or
adjacent modules. Acceptance gate for every task that edits code: *codemap diff is
reviewable and includes no unexplained comment churn*.

## Layout

<!-- Fill from the repo: the directory → purpose list. Keep it one line per
directory; the codemap has the symbols. -->

- `src/` — …
- `test/` — …
- `agents/` — the model: KBs, decisions, briefs, templates.
- `{{task_dir}}/` — proposed / invoked tasks, reports, logs, live traces.

## Commands

- Test (full, the merge gate): `{{test_cmd}}` — {{ci}}. Do not weaken it.
- Scoped (per task): `{{scoped_test_cmd}}` — the development loop.
- Typecheck: `{{typecheck_cmd}}`. Build: `{{build_cmd}}`.
- Codemap: `{{codemap_cmd}}`. Model queries: `{{model_cli}} query|find|drift|stats`.

## Rules

- **Protected boundaries:** {{protected}}. Work around them; if a change seems
  needed, stop and describe it.
- Source-authoritative: clients send inputs only; gameplay rules live on the host
  or in the shared contract. (Replace for a non-game repo: name the authoritative
  side.)
- Add or update tests in `test/` for behavior changes; run the scoped command and
  the typecheck. The full suite is the merge gate, not the per-task loop.
- **Scripts are tracked.** A task's script lives under a tracked directory named in
  the task's Files table; never in a gitignored one. Use repo-relative paths —
  never an absolute `/home/...` literal.
- Never write logs, reports or diffs to the repo root.

## Ending a turn

A turn that ends normally needs no operator action: stop after the report or
summary, with **no** `Next:` line — silence means nothing to dispatch. If the turn
ends with a question, a blocker, or a decision only the operator can make, end with
exactly one line:

`Next: operator — <the one action>`

If the next action belongs to another agent, name it so the operator can route it:
`Next: designer — draft the follow-up task`. Never end with both a summary and an
unexplained question.
