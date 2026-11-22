# Templates

Generic, repo-independent starting points for a host repo's `agents/` directory.
They carry the **skeleton and the rules**, not any one repo's claims: no host paths,
no KB prose, no run history.

`modev init` (when it lands) copies each file to its target, substituting the
placeholders from `modev.config.json` and the repo's answers.

| Template | Target in a host repo |
|---|---|
| `AGENTS.template.md` | `agents/AGENTS.md` |
| `coder-role.md` | `agents/coder-role.md` |
| `designer-role.md` | `agents/designer-role.md` |
| `researcher-role.md` | `agents/researcher-role.md` |
| `model-developer-role.md` | `agents/model-developer-role.md` |
| `bot-developer-role.md` | `agents/bot-developer-role.md` (optional live lane) |
| `task-template.md` | `agents/task-template.md` |
| `bot-task-template.md` | `agents/bot-task-template.md` (optional live lane) |
| `kb/layer-flow.md` | `agents/<layer>-flow.md` — one per declared layer |
| `kb/layer-model.md` | `agents/<layer>-model.md` |
| `kb/layer-kb.md` | `agents/<layer>-kb.md` — the index, or the whole KB when unsplit |

The KB templates copy **once per layer** declared in `modev.config.json`; the split
budget, the row classification and the no-`path:line` rule are in
[`kb/README.md`](kb/README.md).

## Placeholders

A closed set. `test/templates.test.mjs` fails on any placeholder outside this
table, so a typo or a new one is a deliberate edit to both.

| Placeholder | Meaning |
|---|---|
| `{{repo}}` | repo name |
| `{{layer}}` | a layer name from the config (`host`, `shared`, …) |
| `{{root}}` | absolute repo root |
| `{{description}}` | one paragraph: what the repo is and where authority sits |
| `{{node}}` | Node version requirement |
| `{{node_bin}}` | the Node bin directory for the `export PATH=…` prefix |
| `{{test_cmd}}` | full suite (the merge gate) |
| `{{scoped_test_cmd}}` | scoped selector (the per-task loop) |
| `{{typecheck_cmd}}` | typecheck |
| `{{build_cmd}}` | build |
| `{{codemap_cmd}}` | regenerate the codemap |
| `{{codemap_check_cmd}}` | codemap staleness check |
| `{{model_cli}}` | the model query invocation (e.g. `npx modev`) |
| `{{task_dir}}` | task root: `proposed/`, `invoked/`, `reports/`, `logs/`, `live/` |
| `{{layers}}` | the KB layer list |
| `{{gates}}` | the mechanical gates run in CI |
| `{{gate_manifest}}` | the always-gates manifest (e.g. `test/scopes.json`) |
| `{{protected}}` | paths/invariants no lane may edit (kernel, frozen files) |
| `{{ci}}` | the merge-gate cadence (e.g. "on push/PR and every two hours") |
| `{{live_url}}` | the live lane's endpoint (optional lane) |
| `{{token_env}}` | how the live lane gets its token (optional lane) |
| `{{seats}}` | the live lane's seat rule (optional lane) |
| `{{drivers_dir}}` | the tracked directory for live-run scripts (optional lane) |
| `{{ledger}}` | the ledger of proven prototypes (optional lane) |

## Editing a template

1. Read the whole file; the briefs cross-reference each other.
2. Keep the tag vocabulary and the four-slot header closed — a new tag needs a
   consumer, a new slot needs a rule that uses it.
3. Run `npm run verify`. The templates test checks the placeholder set, that no
   host-specific string leaked in, and that the required sections survive.
