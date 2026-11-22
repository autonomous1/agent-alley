# agent-alley

A multi-role agent pipeline for model-driven development.

A small team of agent roles works on one codebase through a shared,
machine-readable model of it: a generated **codemap** (files, symbols,
signatures, call edges) and layered **knowledge bases** (flow, state model,
invariants). A CLI answers exact queries against them — one symbol, one bounded
section — so a session reads a page instead of a map, and stale model data is
caught mechanically rather than costing a session.

The package ships the role briefs (designer, coder, bot-developer, researcher,
model-developer), the task and report templates, and the lints that keep the
model honest. Installed as a dev dependency, it scaffolds a repo's `agents/`
directory, generates the codemap from configured source roots, and scaffolds the
knowledge-base skeleton for the repo's own sessions to fill.

Status: placeholder — the extraction from `conveyor-engine-arena` is in progress.
