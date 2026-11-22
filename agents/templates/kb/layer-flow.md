# {{layer}} knowledge base — flow (§1–§10)

The **prose map** of the `{{layer}}` layer: what it is for, how it runs, where it
stops being authoritative, and where to start editing. It is not a signature dump —
the codemap has the symbols, the source has the truth. Link to a file and a symbol;
never to a `path:line`.

Read one section, not the file: `{{model_cli}} query section {{layer}} <§N>`.

---

## 1. The layer in one page

<What this layer is, in five sentences or fewer. The responsibility it owns, the
one it explicitly does not, and the boundary it meets. A reader who stops here
should know whether their change belongs in this layer.>

## 2. Entry points and boot order

<The places execution enters this layer, and the order they must run in. Name the
constructor / bootstrap / handler by file and symbol; state any
"must happen before" that a refactor would break. If order does not matter, say so
explicitly — that is information.>

## 3. The main loop

<The loop this layer runs under: per tick, per frame, per request, per job. State
the rate, the input at the top of the loop, and what is cleared or recomputed at
the bottom. Point at the module and symbol; do not paste the body.>

## 4. Data flow

<The path data takes through the layer, as numbered steps: where it arrives, what
transforms it, where it is stored, who reads it next. If the layer has more than
one flow (a read path and a write path), give each a paragraph.>

## 5. Boundaries and trust

<What this layer trusts, and what it must re-validate. Name the authoritative side
and the predicted/cached side. State the rule that must survive refactors, e.g.
"only the host assigns an id" or "the client never echoes a server-authoritative
field". If a value crosses a boundary, say who stamps it.>

## 6. External contracts

<The interfaces that are not this codebase's own: the wire protocol, a file format,
a database schema, a CLI, a third-party API. For each: the version, the
compatibility rule (additive only / negotiated / breaking), and the module that
owns it.>

## 7. Configuration and inputs

<What can change without a code edit: environment variables, config files, flags,
feature switches. For each: the key, the default, the effect, and where it is read.
State whether a restart is required.>

## 8. Failure modes and recovery

<How this layer fails and what the system does about it. One line per mode:
detection, the recovery path, and the evidence a reader can look for (log line,
metric, trace field). Include the modes that are silent failures — those are the
expensive ones.>

## 9. Observability

<Where the layer's state can be seen while it runs: the log lines and their fields,
the metrics and their names, the trace spans, the health endpoint. Say which of
these are stable enough to depend on, and which are debug scaffolding.>

## 10. Where to start editing

<The five to ten files a new session should open first for this layer, each with
one line on why. Keep it short: the codemap answers "where is X"; this answers
"what should I read to understand the layer". When the list grows past ten, the
layer likely wants a split.>
