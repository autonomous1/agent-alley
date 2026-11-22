// ARCHITECTURE: the one place a host repo's shape is declared — its layer names,
// the KB read window, the codemap roots/out, the scopes manifest, the cache dir.
// Wiring: every module that used to hardcode one of them (lib/parse-kb,
// lib/refs, lib/index, lib/parse-codemap, lints/*, cli, codemap.ts) reads the
// resolved config; check.mjs loads it once and hands it to each lint.
// Order: loadConfig() once per process at the entry point; every consumer is a
// pure read afterwards. A missing file means today's defaults (so the package's
// own fixtures keep working); a present file is strict.
// Invariants: the compiled KB regexes come from `layers`, never from a second
// list; `maxLines` is derived from the window, never stored; an unknown key or
// a wrong type is an error, not a silent fallback (a typo must not weaken a gate).
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const CONFIG_FILE = "modev.config.json";

// A layer name is an identifier: it is compiled into the KB filename pattern and
// the `§` owner scanner, so it may not carry regex syntax or a path separator.
const LAYER = /^[a-z][a-z0-9]*$/;
const SECTION = /^\d+(?:\.\d+)?$/;
const TOP_KEYS = new Set(["layers", "readWindowLines", "kbMaxRatio", "codemap", "entities", "scopes", "cache"]);
const CODEMAP_KEYS = new Set(["roots", "out"]);
const ENTITY_KEYS = new Set(["layer", "section"]);

export const DEFAULTS = Object.freeze({
  layers: Object.freeze(["host", "client", "shared", "bot"]),
  readWindowLines: 400,
  kbMaxRatio: 0.78,
  codemap: Object.freeze({ roots: Object.freeze(["src"]), out: "agents/codemap.md" }),
  entities: Object.freeze({ layer: "shared", section: "13.6" }),
  scopes: "test/scopes.json",
  cache: ".modev",
});

function fail(where, message) {
  throw new Error(`modev config: ${where}: ${message}`);
}

function escapeRe(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Compile the declarative fields into the regexes and derived numbers consumers use. */
function compile(raw) {
  const alt = raw.layers.map(escapeRe).join("|");
  return {
    ...raw,
    kbFile: new RegExp(`^(${alt})-(?:kb|flow|model)\\.md$`),
    owner: new RegExp(`(${alt})(?:-kb)?\\b`, "g"),
    sectionTarget: new RegExp(`^(${alt})-(kb|flow|model)(?:\\.md)?$`),
    maxLines: Math.floor(raw.readWindowLines * raw.kbMaxRatio),
  };
}

/** The defaults, compiled — for callers that have no root (pure helpers under test). */
export const DEFAULT_CONFIG = Object.freeze({ ...compile(DEFAULTS), file: null });

function readJson(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch (err) {
    throw new Error(`modev config: ${file}: cannot read — ${err.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`modev config: ${file}: invalid JSON — ${err.message}`);
  }
}

function objectOrFail(where, key, value) {
  if (value === undefined) return {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(where, `"${key}" must be an object`);
  return value;
}

function validate(where, raw, merged) {
  if (!Array.isArray(merged.layers) || merged.layers.length === 0) fail(where, "layers must be a non-empty array");
  const seen = new Set();
  for (const layer of merged.layers) {
    if (typeof layer !== "string" || !LAYER.test(layer)) fail(where, `layer ${JSON.stringify(layer)} must be a lowercase identifier (${LAYER})`);
    if (seen.has(layer)) fail(where, `duplicate layer "${layer}"`);
    seen.add(layer);
  }
  if (!Number.isInteger(merged.readWindowLines) || merged.readWindowLines < 1) fail(where, "readWindowLines must be a positive integer");
  if (typeof merged.kbMaxRatio !== "number" || !(merged.kbMaxRatio > 0 && merged.kbMaxRatio <= 1)) fail(where, "kbMaxRatio must be a number in (0, 1]");
  if (!Array.isArray(merged.codemap.roots) || merged.codemap.roots.length === 0 || merged.codemap.roots.some((r) => typeof r !== "string" || r === "")) {
    fail(where, "codemap.roots must be a non-empty array of paths");
  }
  if (typeof merged.codemap.out !== "string" || merged.codemap.out === "") fail(where, "codemap.out must be a path");
  // The entity table is optional: it exists only where its layer is declared, so
  // a repo with no `shared` layer simply has no §13.6 to stitch.
  if (merged.entities.layer !== null) {
    if (!seen.has(merged.entities.layer)) fail(where, `entities.layer "${merged.entities.layer}" is not one of the layers`);
    if (typeof merged.entities.section !== "string" || !SECTION.test(merged.entities.section)) fail(where, "entities.section must be a section id (§N or §N.M)");
  } else if (merged.entities.section !== null) {
    fail(where, "entities.section must be null when entities.layer is null");
  }
  if (typeof merged.scopes !== "string" || merged.scopes === "") fail(where, "scopes must be a path");
  if (typeof merged.cache !== "string" || merged.cache === "") fail(where, "cache must be a path");

  // Unknown keys are a typo that would otherwise be a silently ignored gate.
  if (raw !== undefined) {
    for (const key of Object.keys(raw)) if (!TOP_KEYS.has(key)) fail(where, `unknown key "${key}" (known: ${[...TOP_KEYS].join(", ")})`);
    for (const key of Object.keys(objectOrFail(where, "codemap", raw.codemap))) {
      if (!CODEMAP_KEYS.has(key)) fail(where, `unknown key "codemap.${key}" (known: ${[...CODEMAP_KEYS].join(", ")})`);
    }
    for (const key of Object.keys(objectOrFail(where, "entities", raw.entities))) {
      if (!ENTITY_KEYS.has(key)) fail(where, `unknown key "entities.${key}" (known: ${[...ENTITY_KEYS].join(", ")})`);
    }
  }
}

// The entity table lives in a declared layer; without that layer it is off, so a
// layer set like ["web"] does not inherit the arena's `shared §13.6` convention.
function entityConfig(where, raw, layers) {
  const given = objectOrFail(where, "entities", raw);
  if (raw !== undefined && given.layer === undefined && given.section !== undefined) {
    fail(where, "entities.section needs entities.layer");
  }
  if (given.layer !== undefined) return { layer: given.layer, section: given.section ?? null };
  if (given.section !== undefined) return { layer: DEFAULTS.entities.layer, section: given.section };
  if (layers.includes(DEFAULTS.entities.layer)) return { ...DEFAULTS.entities };
  return { layer: null, section: null };
}

/**
 * Resolve the config for one repo root.
 * @param root repo root (the directory holding agents/ and the codemap).
 * @param env the environment; `MODEV_CONFIG` points at an explicit file.
 * @returns the frozen config: declared fields plus the compiled regexes and `maxLines`.
 */
export function loadConfig(root = process.cwd(), env = process.env) {
  const explicit = env.MODEV_CONFIG;
  const file = explicit ? path.resolve(explicit) : path.join(root, CONFIG_FILE);
  if (explicit && !existsSync(file)) throw new Error(`modev config: ${file}: MODEV_CONFIG points at a missing file`);
  const present = existsSync(file);
  const raw = present ? readJson(file) : undefined;
  const where = present ? file : CONFIG_FILE;
  if (raw !== undefined && (typeof raw !== "object" || raw === null || Array.isArray(raw))) {
    throw new Error(`modev config: ${where}: the file must contain one JSON object`);
  }
  const source = raw ?? {};
  const layers = source.layers ?? [...DEFAULTS.layers];
  const merged = {
    layers,
    readWindowLines: source.readWindowLines ?? DEFAULTS.readWindowLines,
    kbMaxRatio: source.kbMaxRatio ?? DEFAULTS.kbMaxRatio,
    codemap: { ...DEFAULTS.codemap, ...objectOrFail(where, "codemap", source.codemap) },
    entities: entityConfig(where, source.entities, layers),
    scopes: source.scopes ?? DEFAULTS.scopes,
    cache: source.cache ?? DEFAULTS.cache,
  };
  validate(where, raw, merged);
  return Object.freeze({ ...compile(merged), file: present ? file : null });
}
