import { test } from "node:test";
import assert from "node:assert/strict";
import { macArchitectureFromSignals as detect } from "../src/mac-architecture.ts";
test("Mac architecture uses hardware signals rather than misleading UA tokens", () => {
  assert.equal(detect("arm"), "Apple Silicon");
  assert.equal(detect("x86"), "Intel");
  assert.equal(detect("", "ANGLE (Apple, Apple M4 Pro, Metal)"), "Apple Silicon");
  assert.equal(detect("", "Apple GPU"), "Apple Silicon");
  assert.equal(detect("", "Intel Iris Plus Graphics"), "Intel");
  assert.equal(detect("", "AMD Radeon Pro 5500M"), "Intel");
  assert.equal(detect("", "Apple"), null);
  assert.equal(detect(), null);
});
