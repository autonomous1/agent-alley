# {{layer}} knowledge base — index

The index page for the `{{layer}}` layer. It **declares no sections of its own**:
`{{layer}}-kb §N` resolves by layer, so an older pointer keeps working after the
split, and a reader is never sent to the wrong half.

| Half | Covers | Query |
|---|---|---|
| `{{layer}}-flow.md` | §1–§10 — what the layer is for, how it runs, where it is not authoritative | `{{model_cli}} query section {{layer}} <§N>` |
| `{{layer}}-model.md` | §11–§15 — invariants, layer map, state model, quirks, single sources | `{{model_cli}} query section {{layer}} <§N>` |

Rules for this layer's KB:

- **Numbers never change.** A new section takes the next free number; a retired one
  is marked, not reused. A renumber breaks every reference in every other file, and
  the reference lint will not always catch it.
- **Split when the budget is exceeded.** The length lint enforces the window; when
  a half trips it, move §11–§15 into `<layer>-model.md` and leave this page as the
  index. Do not grow the index into a third half.
- **Cite file + symbol, never `path:line`.** `{{model_cli}} drift` checks that a
  named file or symbol still exists.
- **One section per query.** A task's Knowledge base slot names one section per
  layer; a reader who needs more asks for more, one at a time.
