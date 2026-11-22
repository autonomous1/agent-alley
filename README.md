# agent-alley

A multi-role agent pipeline for model-driven development.

A small team of agent roles works on one codebase through a shared, machine-readable
model of it: a generated **codemap** (files, symbols, signatures, call edges) and
layered **knowledge bases** (flow, state model, invariants). A CLI answers exact
queries against them — one symbol, one bounded section — so a session reads a page
instead of a map, and stale model data is caught mechanically instead of costing a
session.

**Not a marketplace.** This is a local, file-based pipeline for coding agents; it
is not affiliated with agent-alley.com or any hosted agent marketplace.

The package ships the tooling that maintains that model — the codemap generator, the
`modev` query CLI, the lints and their self-check — together with generic
**templates** for a repo's own `agents/`: the role briefs, the task templates, and
the knowledge-base skeleton.

> **Status: pre-release.** The extraction from its host repo is in progress.
>
> **Working today:** the codemap generator, the `modev` CLI (`query`, `find`,
> `drift`, `stats`, `config`, `check`), the three lints plus their self-check,
> `modev.config.json`, and the role/task/KB templates.
>
> **Planned:** `modev init` (write the config and `AGENTS.md`, copy the templates),
> `modev kb scaffold` (derive a layer's KB from the codemap), the no-line and
> identifier gates as lints, and adoption by host repos.
>
> Until `init` lands, copy the files under `agents/templates/` into a repo's
> `agents/` by hand and replace the placeholders.

## Requirements

- Node **>= 22.18** — the codemap generator is TypeScript run through Node's type
  stripping.
- One runtime dependency, `typescript`, used only by the generator.

## Install

```sh
npm install                  # from this repo, for development
npm install -D agent-alley   # as a dev dependency, once published
```

The package installs the `modev` binary.

## Using the CLI

```sh
npx modev config                     # the resolved config, including the derived maxLines
npx modev check                      # every lint; exit 1 on a finding
npx modev query symbol loadConfig    # exact symbol: file:line, signature, tags, calls
npx modev query file src/lib/config.mjs
npx modev query section shared 13    # one bounded KB section
npx modev query entity Pawn          # the stitched entity row
npx modev find config                # substring entry point (symbol names and titles)
npx modev drift                      # KB refs that name a file or symbol that is gone
npx modev stats                      # the query log, by session and command
```

In this repo itself, `node src/cli.mjs` is the same CLI — `npx modev` resolves only
once the package is installed as a dependency.

`query` is exact: a miss prints nothing and exits 1. `find` is the only substring
entry point. Options: `--root <dir>` (default `MODEV_ROOT`, else the cwd), `--json`,
`--session <id>`, `--limit <n>`. Environment: `MODEV_ROOT`, `MODEV_CONFIG` (an
explicit config path), `MODEV_CACHE` (the query log), `MODEV_SESSION`.

Exit codes: `0` found or clean, `1` no result or findings, `2` usage or invalid
config.

`query`, `find` and `drift` read the generated codemap, so generate it first (see
[Development](#development)). `check` and `config` do not need one.

## Config

Each repo declares its shape once, in `modev.config.json` at the root (or the file
`MODEV_CONFIG` names). Every key is optional; absent means the defaults below.

```json
{
  "layers": ["host", "client", "shared", "bot"],
  "readWindowLines": 400,
  "kbMaxRatio": 0.78,
  "codemap": { "roots": ["src"], "out": "agents/codemap.md" },
  "entities": { "layer": "shared", "section": "13.6" },
  "scopes": "test/scopes.json",
  "cache": ".modev"
}
```

- `layers` — the KB families. They compile into the `agents/<layer>-(kb|flow|model).md`
  pattern, the `§` owner scanner, and `modev query section <layer>`; a ref that names
  an undeclared layer's KB is left to that repo rather than re-attributed.
- `readWindowLines` / `kbMaxRatio` — the split budget. A KB past
  `floor(readWindowLines * kbMaxRatio)` lines has a tail the reader never sees.
- `codemap.roots` / `codemap.out` — what the generator scans, and where it writes;
  explicit `--root` / `--out` flags still win.
- `entities` — the layer and section holding the entity table. Omit it, or declare a
  layer set without that layer, and the entity query is off rather than lying.
- `scopes` — the `always`-gate manifest the count lint reads; a missing file makes
  that lint a no-op.
- `cache` — where the query log lives (`MODEV_CACHE` overrides).

A present config is strict: an unknown key or a wrong type is an error, so a typo
cannot silently weaken a gate. `npx modev config` prints the resolved shape.

## Templates

`agents/templates/` holds the generic role briefs (coder, designer, researcher,
model-developer, and the optional live/bot lane), the task and bot-task templates,
and `AGENTS.template.md` with a **Repo profile** region. They carry the method and
the rules, not any one repo's paths or knowledge-base prose; every repo-specific
fact is a documented placeholder. `modev init` will copy them into a repo's
`agents/` and substitute the placeholders.

`agents/templates/kb/` holds the knowledge-base skeleton, copied once per declared
layer: a **flow** half (§1–§10: purpose, boot order, the main loop, boundaries and
trust, external contracts, failure modes, observability, where to edit), a **model**
half (§11–§15: invariant index, layer map, the state model with its 13.1–13.6 rows
and the optional entity table, dated quirks, single sources), and an **index** that
declares no sections so an older `layer-kb §N` pointer still resolves.

`test/templates.test.mjs` keeps them honest: it fails on an undocumented
placeholder, on a host-specific string that leaked in, on a lost section, and on a
KB skeleton whose numbering moved between halves.

## Development

```sh
npm install
npm run verify     # check + self-check + the test suite
npm run codemap    # writes agents/codemap.md (generated, gitignored)
```

Layout:

- `src/cli.mjs` — the `modev` command line.
- `src/check.mjs` — the lint runner behind `modev check` / `npm run check`.
- `src/self-check.mjs` — one deliberately broken fixture per lint.
- `src/lints/` — the model gates (KB length, section refs, count claims).
- `src/lib/` — config, the codemap and KB parsers, the query layer.
- `src/codemap.ts` — the generator.
- `agents/templates/` — the role, task and KB templates.
- `test/` — the suite: CLI contract, config, templates.

## License

MIT — see [LICENSE](LICENSE).
