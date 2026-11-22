// ARCHITECTURE: KB halves must fit the read window; a KB past ~78% of the window
// has a tail the reading agent never sees (agents/model-developer-role.md).
// Wiring: check.mjs; one finding per oversized file.
// Invariants: the budget is derived from the config's window and ratio, never
// from the file, and the KB pattern comes from the config's layer set.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadConfig } from "../lib/config.mjs";

export const id = "kb-length";
export const description = "a KB half above the config's max ratio of the read window has an invisible tail";

export function run(root, config = loadConfig(root)) {
  const dir = path.join(root, "agents");
  const findings = [];
  for (const file of readdirSync(dir).sort()) {
    if (!config.kbFile.test(file)) continue;
    const lines = readFileSync(path.join(dir, file), "utf8").split("\n").length - 1;
    if (lines > config.maxLines) {
      findings.push({
        file: `agents/${file}`,
        line: config.maxLines + 1,
        message: `${lines} lines > ${config.maxLines} (${config.kbMaxRatio} of a ${config.readWindowLines}-line window)`,
      });
    }
  }
  return findings;
}
