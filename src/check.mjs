// ARCHITECTURE: the model check runner — runs every lint in lints/, prints one
// line per lint, and fails if any lint reports a finding.
// Wiring: `npm run check` and `modev check`; each lint exports { id, run(root, config) }.
// Order: lints are independent and sorted by filename; none reads another's
// state within a run.
// Invariants: a lint returns findings and never writes; the runner owns the exit
// code; a broken config is exit 2 (usage), not a lint finding.
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./lib/config.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const lintDir = path.join(here, "lints");

/**
 * Run every lint once, in filename order, with the same config.
 * @param root repo root.
 * @param config the resolved config (loadConfig).
 * @returns one `{ id, findings }` record per lint.
 */
export async function checkLints(root, config) {
  const results = [];
  for (const file of readdirSync(lintDir).filter((f) => f.endsWith(".mjs")).sort()) {
    const { id, run } = await import(path.join(lintDir, file));
    results.push({ id, findings: run(root, config) });
  }
  return results;
}

/**
 * The `modev check` / `npm run check` entry.
 * @param root repo root (default: MODEV_ROOT, else the cwd).
 * @returns 0 all lints pass, 1 a lint reported a finding, 2 the config is invalid.
 */
export async function main(root = process.env.MODEV_ROOT ?? process.cwd()) {
  let config;
  try {
    config = loadConfig(root);
  } catch (err) {
    console.error(err.message);
    return 2;
  }
  if (!existsSync(path.join(root, "agents"))) {
    console.error(`modev: no agents/ under ${root}; run \`modev init\` or copy the templates from agents/templates/`);
    return 2;
  }
  console.log(`modev: config ${config.file ?? "(defaults)"} — layers ${config.layers.join(", ")}, window ${config.readWindowLines} → max ${config.maxLines}`);

  let failed = 0;
  for (const { id, findings } of await checkLints(root, config)) {
    console.log(`modev: ${id} — ${findings.length === 0 ? "ok" : `FAIL (${findings.length})`}`);
    for (const finding of findings) {
      console.log(`  ${finding.file}:${finding.line}  ${finding.message}`);
    }
    if (findings.length > 0) failed += 1;
  }

  if (failed > 0) {
    console.log(`\nmodev:check failed — ${failed} lint(s)`);
    return 1;
  }
  console.log("\nmodev:check passed");
  return 0;
}

const isEntrypoint = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isEntrypoint) process.exitCode = await main();
