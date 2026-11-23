import test from "node:test";
import assert from "node:assert/strict";
import * as model from "../src/models/event.model.js";
test("modelo events exporta lógica de validación", () => {
  assert.ok(Object.keys(model).length > 0);
});
