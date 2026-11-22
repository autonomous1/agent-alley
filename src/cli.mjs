#!/usr/bin/env node
// ARCHITECTURE: the `modev` command line — exact symbol lookup, KB section
// slices, entity rows, substring discovery, and the drift report, all over the
// generated codemap and the KB markdown. Read-only: it never writes agents/.
// Wiring: `modev <cmd>`; tests import this file's main().
// Invariants: `query symbol` is exact (no fuzzy guess); a miss exits 1 without
// output; every query is logged to <root>/<config.cache>/queries.jsonl
// (MODEV_CACHE overrides); the layer set, codemap path and cache dir come from
// the config, so a host repo declares its shape once.
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./lib/config.mjs";
import { drift, findFiles, findSymbols, findText, loadIndex, queryEntity, querySection } from "./lib/index.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = process.env.MODEV_ROOT ? path.resolve(process.env.MODEV_ROOT) : process.cwd();
let optsRoot = DEFAULT_ROOT;

const USAGE = `modev — query the codemap and the KBs without reading them

  modev query symbol <name> [--file <substr>] [--kind <k>]
  modev query file <path>
  modev query section <layer|layer-half> <§N>   (layers come from modev.config.json)
  modev query entity <Entity>
  modev find <text> [--limit <n>]
  modev drift
  modev stats
  modev config
  modev check

Options: --root <dir> (default: MODEV_ROOT, else the cwd), --json (machine output),
--session <id> (or MODEV_SESSION / DSH_SESSION_ID).
Config: <root>/modev.config.json (or MODEV_CONFIG); absent means the defaults.
Exit: 0 found/clean, 1 no result or drift findings, 2 usage or bad config.`;

function parseArgs(argv) {
  const opts = {
    root: DEFAULT_ROOT,
    json: false,
    file: undefined,
    kind: undefined,
    limit: 10,
    // Attribution without friction: the harness sets DSH_SESSION_ID per session.
    session: process.env.MODEV_SESSION ?? process.env.DSH_SESSION_ID ?? "unknown",
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--root": opts.root = path.resolve(argv[++i] ?? "."); break;
      case "--json": opts.json = true; break;
      case "--file": opts.file = argv[++i]; break;
      case "--kind": opts.kind = argv[++i]; break;
      case "--limit": opts.limit = Number(argv[++i] ?? 10); break;
      case "--session": opts.session = argv[++i] ?? "unknown"; break;
      case "--help": case "-h": opts.help = true; break;
      default: positional.push(arg);
    }
  }
  return { opts, positional };
}

function log(opts, config, command, arg, hits) {
  try {
    const dir = process.env.MODEV_CACHE ?? path.join(opts.root, config.cache);
    mkdirSync(dir, { recursive: true });
    appendFileSync(
      path.join(dir, "queries.jsonl"),
      JSON.stringify({ ts: new Date().toISOString(), session: opts.session, command, arg, hits }) + "\n",
    );
  } catch {
    // A log write must never fail a query.
  }
}

// Two stats: is the queried file newer than the codemap? Mid-task it is, and
// the entry is a snapshot of the last regeneration — say so instead of writing.
function isStale(root, file, config) {
  try {
    const map = statSync(path.join(root, config.codemap.out)).mtimeMs;
    return statSync(path.join(root, file)).mtimeMs > map;
  } catch {
    return false;
  }
}

function anySrcNewer(root, config) {
  try {
    const map = statSync(path.join(root, config.codemap.out)).mtimeMs;
    for (const sourceRoot of config.codemap.roots) {
      for (const entry of readdirSync(path.join(root, sourceRoot), { recursive: true, withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith(".ts")) {
          if (statSync(path.join(entry.parentPath, entry.name)).mtimeMs > map) return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

function clip(list, max) {
  return list.length > max ? `${list.slice(0, max).join(", ")} … (+${list.length - max} more)` : list.join(", ");
}

function printSymbol(symbol, index) {
  const file = index.codemap.files.get(symbol.file);
  console.log(`${symbol.name}  ${symbol.kind}${symbol.local ? " (local)" : ""}  ${symbol.file}:${symbol.line}`);
  if (symbol.signature) console.log(`  ${symbol.signature}`);
  if (symbol.doc) console.log(`  ${symbol.doc}`);
  for (const tag of symbol.tags) console.log(`  ${tag.tag} ${tag.text}`.trimEnd());
  if (symbol.calls.length) console.log(`  calls: ${clip(symbol.calls, 8)}`);
  // The codemap tracks importers per module, not per symbol.
  if (file?.usedBy.length) console.log(`  module used by: ${clip(file.usedBy, 6)}`);
  if (isStale(index.root, symbol.file, index.config)) console.log(`  stale: ${symbol.file} changed after ${index.config.codemap.out} — run npm run codemap`);
}

function printSection(section) {
  console.log(`${section.layer} §${section.id} — ${section.title}`);
  console.log(`${section.file}:${section.line}-${section.endLine} (${section.text.split("\n").length} lines)`);
  console.log("");
  console.log(section.text);
}

const plain = (text) => text.replace(/`/g, "");

function printEntity(row, config) {
  console.log(`${row.entity}  (${config.entities.layer}-model §${config.entities.section})`);
  console.log(`  shared: ${plain(row.factory)}`);
  console.log(`  host:   ${plain(row.host)}`);
  console.log(`  client: ${plain(row.client)}`);
  console.log(`  test:   ${plain(row.test)}`);
}

export async function main(argv) {
  const { opts, positional } = parseArgs(argv);
  if (opts.help || positional.length === 0) {
    console.log(USAGE);
    return 0;
  }

  let config;
  try {
    config = loadConfig(opts.root);
  } catch (err) {
    console.error(err.message);
    return 2;
  }

  optsRoot = opts.root;
  const [command, sub, ...rest] = positional;

  // `config` is the one command that does not need a codemap: it reports the
  // resolved shape, which is exactly what a new host repo inspects before it has one.
  if (command === "config") {
    const { kbFile, owner, sectionTarget, maxLines, file, ...declared } = config;
    console.log(JSON.stringify({ file, ...declared, maxLines }, null, 2));
    return 0;
  }

  // `check` and `config` report on the repo's shape; neither needs a codemap.
  if (command === "check") {
    const { main: check } = await import("./check.mjs");
    return check(opts.root);
  }

  const codemapPath = path.join(opts.root, config.codemap.out);
  if (!existsSync(codemapPath)) {
    console.error(`modev: no ${codemapPath}; run npm run codemap`);
    return 2;
  }

  const index = loadIndex(opts.root, config);

  if (command === "query" && sub === "symbol") {
    const name = rest[0];
    if (!name) { console.error("modev: query symbol <name>"); return 2; }
    const hits = findSymbols(index, name, { file: opts.file, kind: opts.kind });
    log(opts, config, "symbol", name, hits.length);
    if (hits.length === 0) {
      const hint = anySrcNewer(opts.root, config) ? ` (${config.codemap.roots.join(", ")} changed after ${config.codemap.out} — run npm run codemap)` : "";
      console.error(`modev: no symbol ${name}${hint}`);
      return 1;
    }
    if (opts.json) console.log(JSON.stringify(hits, null, 2));
    else hits.forEach((hit, i) => { if (i) console.log(""); printSymbol(hit, index); });
    return 0;
  }

  if (command === "query" && sub === "file") {
    const target = rest[0];
    if (!target) { console.error("modev: query file <path>"); return 2; }
    const files = findFiles(index, target);
    if (files.length === 0) { console.error(`modev: no file ${target}`); return 1; }
    if (files.length > 1) {
      console.error(`modev: ${target} matches ${files.length} files:`);
      for (const file of files) console.error(`  ${file.path}`);
      return 1;
    }
    const file = files[0];
    log(opts, config, "file", file.path, file.symbols.length);
    if (opts.json) console.log(JSON.stringify(file, null, 2));
    else {
      console.log(`${file.path} (${file.lines} lines)`);
      if (file.doc) console.log(`  ${file.doc}`);
      if (file.imports.length) console.log(`  imports: ${clip(file.imports, 8)}`);
      if (file.pkgs.length) console.log(`  pkgs: ${clip(file.pkgs, 6)}`);
      if (file.usedBy.length) console.log(`  used by: ${clip(file.usedBy, 6)}`);
      if (isStale(opts.root, file.path, config)) console.log(`  stale: ${file.path} changed after ${config.codemap.out} — run npm run codemap`);
      for (const symbol of file.symbols) {
        const doc = symbol.doc ? `  ${symbol.doc}` : "";
        console.log(`  ${symbol.name}  ${symbol.kind}${symbol.local ? " (local)" : ""}  :${symbol.line}${doc}`);
      }
    }
    return 0;
  }

  if (command === "query" && sub === "section") {
    const target = rest[0];
    const id = rest[1];
    if (!target || !id) { console.error("modev: query section <layer|layer-half> <§N>"); return 2; }
    // Accept the layer (`shared`) or the file (`shared-model`, `shared-model.md`);
    // the file form narrows resolution to that half. Both come from the config.
    const fileMatch = config.sectionTarget.exec(target);
    const layer = fileMatch ? fileMatch[1] : target;
    // `*-kb` is the index: it declares no sections, so resolve by layer instead.
    const file =
      fileMatch && fileMatch[2] !== "kb" ? `${target.replace(/\.md$/, "")}.md` : undefined;
    const hits = querySection(index, layer, id).filter((hit) => !file || hit.file.endsWith(file));
    log(opts, config, "section", `${layer} ${id}`, hits.length);
    if (hits.length === 0) { console.error(`modev: no ${layer} §${id}`); return 1; }
    if (opts.json) console.log(JSON.stringify(hits, null, 2));
    else hits.forEach((hit, i) => { if (i) console.log(""); printSection(hit); });
    return 0;
  }

  if (command === "query" && sub === "entity") {
    const name = rest[0];
    if (!name) { console.error("modev: query entity <name>"); return 2; }
    const hits = queryEntity(index, name);
    log(opts, config, "entity", name, hits.length);
    if (hits.length === 0) { console.error(`modev: no entity ${name}`); return 1; }
    if (opts.json) console.log(JSON.stringify(hits, null, 2));
    else hits.forEach((row) => printEntity(row, config));
    return 0;
  }

  if (command === "find") {
    const text = sub;
    if (!text) { console.error("modev: find <text>"); return 2; }
    const hits = findText(index, text, opts.limit);
    log(opts, config, "find", text, hits.length);
    if (hits.length === 0) {
      console.error(`modev: nothing matches ${text}`);
      console.error("  find matches symbol names and section titles; for source text, member names, and packages/ use rg");
      return 1;
    }
    if (opts.json) console.log(JSON.stringify(hits, null, 2));
    else {
      for (const hit of hits) {
        console.log(
          hit.kind === "symbol"
            ? `${hit.name}  ${hit.symbolKind}  ${hit.file}:${hit.line}`
            : `${hit.layer} §${hit.id}  ${hit.title}  ${hit.file}:${hit.line}`,
        );
      }
    }
    return 0;
  }

  if (command === "drift") {
    const findings = drift(index);
    if (opts.json) console.log(JSON.stringify(findings, null, 2));
    else if (findings.length === 0) console.log("modev: no drift");
    else for (const finding of findings) console.log(`${finding.file}:${finding.line}  ${finding.message}`);
    return findings.length === 0 ? 0 : 1;
  }

  if (command === "stats") {
    const file = path.join(process.env.MODEV_CACHE ?? path.join(opts.root, config.cache), "queries.jsonl");
    if (!existsSync(file)) { console.log("modev: no queries logged yet"); return 0; }
    const rows = readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
    const bySession = new Map();
    const byCommand = new Map();
    const byArg = new Map();
    for (const row of rows) {
      bySession.set(row.session ?? "unknown", (bySession.get(row.session ?? "unknown") ?? 0) + 1);
      byCommand.set(row.command, (byCommand.get(row.command) ?? 0) + 1);
      const key = `${row.command} ${row.arg}`;
      byArg.set(key, (byArg.get(key) ?? 0) + 1);
    }
    console.log(`queries: ${rows.length}`);
    console.log("by session:");
    for (const [name, count] of [...bySession].sort((a, b) => b[1] - a[1])) console.log(`  ${name}: ${count}`);
    console.log("by command:");
    for (const [name, count] of [...byCommand].sort((a, b) => b[1] - a[1])) console.log(`  ${name}: ${count}`);
    console.log("top:");
    for (const [key, count] of [...byArg].sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${count}× ${key}`);
    return 0;
  }

  console.error(`modev: unknown command "${[command, sub].filter(Boolean).join(" ")}"`);
  console.error(USAGE);
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
