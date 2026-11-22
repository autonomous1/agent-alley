// ARCHITECTURE: the config contract — an absent file means today's defaults; a
// present file is the declared shape and every consumer reads it (the KB pattern,
// the §-owner scanner, the length budget, the scopes manifest, the codemap path,
// the CLI's layer parsing).
// Wiring: `node --test test/*.test.mjs`; every fixture is a temporary directory,
// every loadConfig call passes `{}` so a developer's MODEV_CONFIG cannot leak in.
// Invariants: absent == defaults; a typo or a wrong type is an error, not a silent
// fallback; the layer set is the only source of the KB filename pattern.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../src/lib/config.mjs";
import { loadIndex, querySection } from "../src/lib/index.mjs";
import { run as kbCountClaims } from "../src/lints/kb-count-claims.mjs";
import { run as kbLength } from "../src/lints/kb-length.mjs";
import { run as kbSectionRefs } from "../src/lints/kb-section-refs.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "..", "src", "cli.mjs");
const CACHE = path.join(os.tmpdir(), "agent-alley-config-cache");

function repo({ config, files = {}, scopes } = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "modev-cfg-"));
  mkdirSync(path.join(root, "agents"), { recursive: true });
  if (config !== undefined) writeFileSync(path.join(root, "modev.config.json"), JSON.stringify(config));
  if (scopes !== undefined) {
    mkdirSync(path.join(root, "test"), { recursive: true });
    writeFileSync(path.join(root, "test/scopes.json"), JSON.stringify(scopes));
  }
  for (const [name, body] of Object.entries(files)) {
    const target = path.join(root, name);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, body);
  }
  return root;
}

function cli(args) {
  const env = { ...process.env, MODEV_CACHE: CACHE };
  delete env.MODEV_CONFIG;
  return spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", env });
}

test("an absent config is today's defaults", () => {
  const root = repo();
  const config = loadConfig(root, {});
  assert.equal(config.file, null);
  assert.deepEqual(config.layers, ["host", "client", "shared", "bot"]);
  assert.equal(config.readWindowLines, 400);
  assert.equal(config.maxLines, 312);
  assert.equal(config.codemap.out, "agents/codemap.md");
  assert.equal(config.scopes, "test/scopes.json");
  rmSync(root, { recursive: true, force: true });
});

test("a declared config is the shape consumers read", () => {
  const config = loadConfig(
    repo({
      config: {
        layers: ["web", "node"],
        readWindowLines: 100,
        kbMaxRatio: 0.5,
        codemap: { roots: ["app"], out: "docs/map.md" },
        entities: { layer: "web", section: "9.1" },
        scopes: "gates.json",
        cache: ".cache/modev",
      },
    }),
    {},
  );
  assert.deepEqual(config.layers, ["web", "node"]);
  assert.equal(config.maxLines, 50);
  assert.equal(config.codemap.roots[0], "app");
  assert.equal(config.codemap.out, "docs/map.md");
  assert.equal(config.entities.layer, "web");
  assert.equal(config.entities.section, "9.1");
  assert.equal(config.scopes, "gates.json");
  assert.equal(config.cache, ".cache/modev");
  assert.ok(config.kbFile.test("web-flow.md"));
  assert.ok(!config.kbFile.test("host-flow.md"));
});

test("a typo is an error, not a silent fallback", () => {
  const root = repo({ config: { layer: ["web"] } });
  assert.throws(() => loadConfig(root, {}), /unknown key "layer"/);
  rmSync(root, { recursive: true, force: true });
});

test("a malformed layer or window is an error", () => {
  const layers = repo({ config: { layers: ["Host"] } });
  assert.throws(() => loadConfig(layers, {}), /lowercase identifier/);
  const empty = repo({ config: { layers: [] } });
  assert.throws(() => loadConfig(empty, {}), /non-empty array/);
  const window = repo({ config: { readWindowLines: 0 } });
  assert.throws(() => loadConfig(window, {}), /positive integer/);
  const ratio = repo({ config: { kbMaxRatio: 1.5 } });
  assert.throws(() => loadConfig(ratio, {}), /number in \(0, 1\]/);
  for (const root of [layers, empty, window, ratio]) rmSync(root, { recursive: true, force: true });
});

test("kb-length uses the declared window, not the arena's 400", () => {
  const body = "# Web model\n\n## 1. A\n\n" + "filler\n".repeat(60);
  const root = repo({ config: { layers: ["web"], readWindowLines: 100, kbMaxRatio: 0.5 }, files: { "agents/web-model.md": body } });
  const findings = kbLength(root, loadConfig(root, {}));
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /> 50 \(0\.5 of a 100-line window\)/);
  rmSync(root, { recursive: true, force: true });
});

test("kb-section-refs resolves against the declared layers only", () => {
  const body = "# Web model\n\n## 1. A\n\nSee `web-kb.md` §99 and `host-kb.md` §99.\n";
  const root = repo({ config: { layers: ["web"] }, files: { "agents/web-model.md": body } });
  const findings = kbSectionRefs(root, loadConfig(root, {}));
  assert.equal(findings.length, 1, JSON.stringify(findings));
  assert.match(findings[0].message, /§99 is not in the web KB/);
  rmSync(root, { recursive: true, force: true });
});

test("kb-count-claims reads the declared scopes manifest", () => {
  const root = repo({
    config: { layers: ["web"], scopes: "gates.json" },
    files: { "agents/web-model.md": "# Web model\n\n## 1. A\n\nFive `always` gates.\n", "gates.json": JSON.stringify({ always: ["a", "b"] }) },
  });
  const findings = kbCountClaims(root, loadConfig(root, {}));
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /gates\.json has 2/);
  rmSync(root, { recursive: true, force: true });
});

test("the index resolves a custom layer and ignores undeclared ones", () => {
  const root = repo({
    config: { layers: ["web"] },
    files: {
      "agents/web-model.md": "# Web model\n\n## 7. State\n\nx\n",
      "agents/host-model.md": "# Host model\n\n## 1. Boot\n\nx\n",
      "agents/codemap.md": "# Codemap\n\n## Modules\n",
    },
  });
  const index = loadIndex(root, loadConfig(root, {}));
  assert.equal(querySection(index, "web", "7").length, 1);
  assert.equal(querySection(index, "host", "1").length, 0);
  rmSync(root, { recursive: true, force: true });
});

test("the CLI answers for a custom layer and reports the config", () => {
  const root = repo({
    config: { layers: ["web"] },
    files: {
      "agents/web-model.md": "# Web model\n\n## 7. State\n\nx\n",
      "agents/codemap.md": "# Codemap\n\n## Modules\n",
    },
  });
  const hit = cli(["query", "section", "web", "7", "--root", root]);
  assert.equal(hit.status, 0, hit.stderr);
  assert.match(hit.stdout, /web §7 — State/);

  const miss = cli(["query", "section", "host", "7", "--root", root]);
  assert.equal(miss.status, 1);

  const config = cli(["config", "--root", root]);
  assert.equal(config.status, 0, config.stderr);
  const printed = JSON.parse(config.stdout);
  assert.deepEqual(printed.layers, ["web"]);
  assert.equal(printed.file, path.join(root, "modev.config.json"));
  assert.equal(printed.maxLines, 312);
  rmSync(root, { recursive: true, force: true });
});

test("the CLI root defaults to MODEV_ROOT", () => {
  const root = repo({
    config: { layers: ["web"] },
    files: { "agents/web-model.md": "# Web model\n\n## 7. State\n\nx\n", "agents/codemap.md": "# Codemap\n\n## Modules\n" },
  });
  const env = { ...process.env, MODEV_ROOT: root, MODEV_CACHE: CACHE };
  delete env.MODEV_CONFIG;
  const result = spawnSync(process.execPath, [CLI, "config"], { encoding: "utf8", env });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).file, path.join(root, "modev.config.json"));
  rmSync(root, { recursive: true, force: true });
});

test("the CLI treats a broken config as usage, not a finding", () => {
  const root = repo({ config: { layers: [] }, files: { "agents/codemap.md": "# Codemap\n\n## Modules\n" } });
  const result = cli(["config", "--root", root]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /layers must be a non-empty array/);
  rmSync(root, { recursive: true, force: true });
});
