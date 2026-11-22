# Knowledge-base templates

A repo's model is layered: one **flow** half and one **model** half per layer, plus
an optional index page. Copy the three files once per layer declared in
`modev.config.json` (`layers`), replace `{{layer}}`, and fill the prose.

| Template | Target | Sections |
|---|---|---|
| `layer-flow.md` | `agents/<layer>-flow.md` | §1–§10 |
| `layer-model.md` | `agents/<layer>-model.md` | §11–§15 |
| `layer-kb.md` | `agents/<layer>-kb.md` | index only |

A repo small enough for one file per layer uses `<layer>-kb.md` as the content
file instead (sections §1–§15 in one document); the index template is for a layer
that has been split.

## The rules these files encode

**The split is the fix, not "read more."** A KB that passes ~78% of the read
window is a KB whose tail is invisible to the reading agent. The window and the
ratio are config (`readWindowLines`, `kbMaxRatio`), and the length lint enforces
the budget. When a layer outgrows it, move §11–§15 to `<layer>-model.md` and leave
`<layer>-kb.md` as the index — **section numbers never change**, so an older
`<layer>-kb §13` pointer still resolves by layer.

**One section, not the file.** A reader asks
`{{model_cli}} query section <layer> <§N>` and gets that slice. A task's
Knowledge base slot names one section per layer.

**Cite file + symbol, never `path:line`.** Line numbers drift; the codemap owns
them. `{{model_cli}} drift` fails a KB entry that names a file or symbol that no
longer exists.

**The classification.** Every state-model row is `S` (structural — a container or
shape checkable from the declaration), `B` (behavioral — a lifetime rule:
one-shot, per-tick/frame clear, monotonic, TTL), or `X` (cross-boundary — the
state or reference crosses a layer boundary; the contract lives in the model half).
A candidate invariant is not an `@invariant` until a test or tag confirms it.

**Quirks are dated and evidenced.** A `§14` entry carries the date, the symptom,
the cause if known, and the one line of evidence (a log line, a trace field, a
test name). An entry without evidence is a rumour.

**The entity table is optional.** `<layer>-model §13.6` stitches one row per domain
entity — factory, each side's container, the test that pins it. It exists only when
the repo declares that layer and section in the config (`entities`); a repo without
it simply has no row to query.
