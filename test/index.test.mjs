import assert from "node:assert/strict";
import test from "node:test";
import { name } from "../src/index.mjs";

test("the package exports its name", () => {
  assert.equal(name, "agent-alley");
});
