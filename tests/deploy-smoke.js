const assert = require("assert");
const fs = require("fs");
const path = require("path");

const idlPath = path.join(__dirname, "..", "target", "idl", "blockbite_vesting.json");

assert.ok(fs.existsSync(idlPath), "IDL was not generated; anchor build likely failed");

const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
const instructions = new Set(idl.instructions.map((instruction) => instruction.name));

assert.ok(
  instructions.has("createStream") || instructions.has("create_stream"),
  "create_stream instruction is missing"
);
assert.ok(instructions.has("withdraw"), "withdraw instruction is missing");
assert.ok(instructions.has("cancel"), "cancel instruction is missing");

console.log("Anchor deploy smoke test passed: required Week 3 instructions are present.");
