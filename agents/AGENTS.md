# AGENTS.md — agent-alley

The multi-role agent pipeline for model-driven development.

**Read order for every task**
1. The task file the user named — once.
2. This file — injected; do not re-read.
3. The task's **Knowledge base** sections, queried through the model CLI; never
   read a whole KB file for one section.
4. The task's **Files table** paths — only those.
5. Symbol lookup through the model, then open the source file it names.

**The model is a deliverable.** The codemap and the knowledge bases are artifacts
an agent reads; a stale one costs a session. Keep them true and small; never
hand-edit a generated map.

**Ending a turn.** A normal finish needs no operator action and no `Next:` line.
If you are blocked, or need a decision only the operator can make, end with
`Next: operator — <the one action>`.

Roles, templates and the knowledge bases are added when the pipeline is
extracted from `conveyor-engine-arena`; this file is the placeholder.
