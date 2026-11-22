# {{layer}} knowledge base — model (§11–§15)

The **invariants and state** of the `{{layer}}` layer: what must remain true, what
the layer owns, which rules are lifetimes rather than shapes, and what has already
bitten someone. This is the half a coder is told to read before editing — keep it
short enough that the tail is never cut off.

Read one section, not the file: `{{model_cli}} query section {{layer}} <§N>`.

---

## 11. Invariant index

Every invariant that must survive a refactor, one row each. `class` is `S`
(structural), `B` (behavioral), or `X` (cross-boundary). An invariant is not
confirmed until a test or a tag names it; a row with no test is an open risk, not a
fact.

| id | invariant | class | tag | test |
|---|---|---|---|---|
| <i1> | <one sentence, checkable> | S | `@invariant` | `<file>::<test name>` |
| <i2> | <…> | B | `@invariant` | `<file>::<test name>` |

## 12. Layer map and single sources

<What this layer owns outright, what it imports, and which module is the one
authority for each concept it touches. One paragraph, then the table.>

| concept | single source | this layer's role |
|---|---|---|
| <concept> | `<file>` `<Symbol>` | owner / reader / cache |
| <concept> | `<file>` `<Symbol>` | owner / reader / cache |

## 13. {{layer}} state model

The layer's state, grouped the way a reader asks for it: containers, ownership,
per-call state, lifetimes, and what crosses the boundary.

### 13.1 Structural containers

The containers that exist and the shape they hold. Checkable from the declaration.

| container | created by | cleared by | class |
|---|---|---|---|
| <name> | `<Symbol>` | `<Symbol>` | S |
| <name> | `<Symbol>` | `<Symbol>` | S |

### 13.2 Ownership and authority

Who may write each piece of state, and who only reads it. `owner` names the
authoritative writer; a second writer is a bug unless the row says otherwise.

| state | owner | readers | class |
|---|---|---|---|
| <state> | `<Symbol>` | `<Symbol>` | S |
| <state> | `<Symbol>` | `<Symbol>` | S |

### 13.3 Per-call state

State that is set and cleared around one call, frame, tick or request. `cleared`
names the boundary; "never" means it accumulates until a reset path runs.

| state | set by | cleared by | class |
|---|---|---|---|
| <state> | `<Symbol>` | <boundary or `never`> | B |
| <state> | `<Symbol>` | <boundary or `never`> | B |

### 13.4 Lifetime rules

The rules that are not a shape: one-shot, monotonic, TTL, drop-on-disconnect. Each
row names the rule and the evidence that pins it.

| name | rule | evidence |
|---|---|---|
| <name> | <one-shot / monotonic / TTL N / drops on …> | `<file>::<test>` |
| <name> | <…> | `<file>::<test>` |

### 13.5 Cross-boundary state

State or references that cross a layer boundary. The contract lives in the model
half of the side that owns it; this row says what crosses and where the contract
is written.

| state | crosses | contract lives in | class |
|---|---|---|---|
| <state> | `<other layer>` | `<layer>-model §<N>` | X |
| <state> | `<other layer>` | `<layer>-model §<N>` | X |

### 13.6 Entity table

One row per domain entity, stitched from each side's container and the test that
pins it. Optional: it exists only when this layer and section are declared in the
config (`entities`). The first header must stay `entity`; the middle headers name
the participating sides and are cosmetic.

| entity | factory | host | client | test |
|---|---|---|---|---|
| <Entity> | `<factory>` | `<container>` | `<container>` | `<file>::<test>` |
| <Entity> | `<factory>` | `<container>` | `<container>` | `<file>::<test>` |

## 14. Known quirks and open gaps

Dated entries, newest first. Each carries the symptom, the cause if known, the one
line of evidence, and the workaround or fix. An entry with no evidence is a rumour;
do not add one.

### YYYY-MM-DD — <symptom in one line>

- **Symptom:** <what a run or a user observes>.
- **Cause:** <the mechanism, or "unknown">.
- **Evidence:** <the log line, trace field, or test name that shows it>.
- **Workaround / fix:** <what to do today; the task id if one exists>.

## 15. Single sources of truth

The files and symbols a reader must never re-implement: the one place each concept
is defined, and what it would take to move it. When two modules appear to own the
same concept, this section names the survivor.

| concept | file | symbol | why it is the source |
|---|---|---|---|
| <concept> | `<file>` | `<Symbol>` | <one line> |
| <concept> | `<file>` | `<Symbol>` | <one line> |
