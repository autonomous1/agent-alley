// ARCHITECTURE: the template contract — the templates carry the skeleton and the
// rules, never a host repo's claims, and they speak one closed placeholder set.
// Wiring: `node --test test/*.test.mjs`; reads agents/templates/ directly.
// Invariants: every template is listed in templates/README.md; every placeholder
// used is documented there and nothing else; a host-specific string is a failure,
// not a style note; the sections a reader depends on survive an edit; the KB
// skeleton keeps §1–§10 / §11–§15 and its index declares no numbered section.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, "..", "agents", "templates");
const KB_DIR = path.join(DIR, "kb");

const TEMPLATES = [
  "AGENTS.template.md",
  "coder-role.md",
  "designer-role.md",
  "researcher-role.md",
  "model-developer-role.md",
  "bot-developer-role.md",
  "task-template.md",
  "bot-task-template.md",
];

const KB_TEMPLATES = ["layer-flow.md", "layer-model.md", "layer-kb.md"];

// A template that names a host repo, its files, its hostnames or its dirs is a
// copy of that repo's model, not a template. Shapes, not words: `host` alone is
// fine; `host-flow.md` is not.
const FORBIDDEN = [
  /conveyor-engine/i,
  /dsh-tasks/,
  /qa-token/,
  /CE_TOKEN/,
  /127\.0\.0\.1/,
  /arena\.tszakacs\.com/,
  /(host|client|shared|bot)-(flow|model|kb)\.md/,
  /goap\.ts/,
  /ts-ext-register/,
  /~\/dev\//,
  /\/home\/[a-z]/i, // a concrete user path; the generic `/home/...` rule text is fine
  /agent-alley/,
];

const read = (name) => readFileSync(path.join(DIR, name), "utf8");
const readKb = (name) => readFileSync(path.join(KB_DIR, name), "utf8");
const ALL_KB_FILES = [...KB_TEMPLATES, "README.md"];

function placeholders(text) {
  return [...text.matchAll(/\{\{([^{}]+)\}\}/g)].map((m) => m[1]);
}

function documented() {
  const readme = read("README.md");
  const inTable = [...readme.matchAll(/^\| `\{\{([a-z_]+)\}\}` \|/gm)].map((m) => m[1]);
  assert.ok(inTable.length >= 15, `templates/README.md documents ${inTable.length} placeholders`);
  return new Set(inTable);
}

test("every template exists, is non-trivial, and is in the map", () => {
  const readme = read("README.md");
  const present = readdirSync(DIR).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
  assert.deepEqual(present, [...TEMPLATES].sort(), "templates/ and the test's list disagree");
  for (const name of TEMPLATES) {
    const text = read(name);
    assert.ok(text.trim().length > 500, `${name} is too small to be a brief`);
    assert.ok(readme.includes(name), `${name} is not listed in templates/README.md`);
  }
});

test("every KB template exists and is in the map", () => {
  const readme = read("README.md");
  const present = readdirSync(KB_DIR).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
  assert.deepEqual(present, [...KB_TEMPLATES].sort(), "kb/ and the test's list disagree");
  for (const name of KB_TEMPLATES) {
    const text = readKb(name);
    assert.ok(text.trim().length > 400, `kb/${name} is too small to be a skeleton`);
    assert.ok(readme.includes(`kb/${name}`), `kb/${name} is not listed in templates/README.md`);
  }
});

test("no template leaks a host repo's model", () => {
  for (const name of TEMPLATES) {
    const text = read(name);
    for (const pattern of FORBIDDEN) {
      const match = pattern.exec(text);
      assert.equal(match, null, `${name} contains host-specific ${JSON.stringify(match?.[0])}`);
    }
  }
  for (const name of ALL_KB_FILES) {
    const text = readKb(name);
    for (const pattern of FORBIDDEN) {
      const match = pattern.exec(text);
      assert.equal(match, null, `kb/${name} contains host-specific ${JSON.stringify(match?.[0])}`);
    }
  }
});

test("the placeholder vocabulary is closed and documented", () => {
  const allowed = documented();
  const texts = [...TEMPLATES.map((n) => [n, read(n)]), ...ALL_KB_FILES.map((n) => [`kb/${n}`, readKb(n)])];
  for (const [name, text] of texts) {
    for (const placeholder of placeholders(text)) {
      assert.match(placeholder, /^[a-z][a-z0-9_]*$/, `${name} has a malformed placeholder {{${placeholder}}}`);
      assert.ok(allowed.has(placeholder), `${name} uses undocumented {{${placeholder}}}`);
    }
  }
});

test("a template does not leave a placeholder unexplained or doubled", () => {
  const texts = [...TEMPLATES.map((n) => [n, read(n)]), ...ALL_KB_FILES.map((n) => [`kb/${n}`, readKb(n)])];
  for (const [name, text] of texts) {
    for (const line of text.split("\n")) {
      assert.doesNotMatch(line, /\{\{[^}]*\{\{/, `${name} has a doubled placeholder: ${line.trim()}`);
    }
  }
});

test("the KB skeleton keeps its numbered contract", () => {
  const flow = readKb("layer-flow.md");
  const model = readKb("layer-model.md");
  const index = readKb("layer-kb.md");

  // The flow half owns §1–§10; the model half owns §11–§15. A section added in the
  // wrong half is what makes a reader open the file the task did not name.
  for (let n = 1; n <= 10; n++) assert.match(flow, new RegExp(`^## ${n}\\. `, "m"), `layer-flow.md is missing ## ${n}.`);
  for (let n = 11; n <= 15; n++) assert.match(model, new RegExp(`^## ${n}\\. `, "m"), `layer-model.md is missing ## ${n}.`);
  assert.doesNotMatch(flow, /^## 1[1-5]\. /m, "layer-flow.md carries a model-half section");
  assert.doesNotMatch(model, /^## ([1-9]|10)\. /m, "layer-model.md carries a flow-half section");

  // §13 is the state model, and 13.6 is the optional entity table the config names.
  for (const sub of ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6"]) {
    assert.match(model, new RegExp(`^### ${sub.replace(".", "\\.")} `, "m"), `layer-model.md is missing ${sub}`);
  }
  assert.match(model, /^\| entity \|/m, "layer-model.md §13.6 needs the `entity` table header");
  assert.match(model, /\bS\b.*\bB\b.*\bX\b|class.*S.*B.*X/s, "layer-model.md must state the S/B/X classification");

  // The index page declares no numbered section: that is what keeps an older
  // `layer-kb §N` pointer resolving by layer instead of landing on the index.
  assert.doesNotMatch(index, /^## \d/m, "layer-kb.md must not declare a numbered section");
  assert.match(index, /declare[s]? no sections?/i, "layer-kb.md must say it declares no sections");
});

test("the sections a reader depends on survive", () => {
  const required = {
    "AGENTS.template.md": ["## Read order for every task", "## Comment as contract", "## Ending a turn", "Next: operator"],
    "coder-role.md": ["## Pre-Flight", "## HALT", "HALT: MISSING_CONTEXT", "## Task-template specification", "Next: operator"],
    "designer-role.md": ["## Writing discipline", "## Task design", "## Method", "Next: operator"],
    "researcher-role.md": ["## Method", "## Evidence rules", "## Deliverable", "Next: operator"],
    "model-developer-role.md": ["## The 78% rule", "## Journal", "## What you do not do", "Next: operator"],
    "bot-developer-role.md": ["## Run protocol", "## Diagnosis", "## Journal", "Next: operator"],
    "task-template.md": ["**Knowledge base:**", "**Files to touch:**", "**Test scope:**", "### Acceptance"],
    "bot-task-template.md": ["## Question", "**Knowledge base:**", "## Evidence", "## Report"],
  };
  for (const [name, sections] of Object.entries(required)) {
    const text = read(name);
    for (const section of sections) {
      assert.ok(text.includes(section), `${name} lost ${section}`);
    }
  }
  const kbReadme = readKb("README.md");
  for (const rule of ["78%", "path:line", "`S` (structural", "`B` (behavioral", "`X` (cross-boundary", "dated"]) {
    assert.ok(kbReadme.includes(rule), `kb/README.md lost the rule ${JSON.stringify(rule)}`);
  }
});
