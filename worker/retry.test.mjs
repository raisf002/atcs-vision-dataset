import assert from "node:assert/strict";
import { withRetry } from "./retry.mjs";

let attempts = 0;
const recovered = await withRetry(async () => {
  attempts += 1;
  if (attempts < 3) throw new Error("stream transient failure");
  return "captured";
}, { attempts: 3, delayMs: 1 });
assert.equal(recovered, "captured");
assert.equal(attempts, 3);

let terminalAttempts = 0;
await assert.rejects(() => withRetry(async () => {
  terminalAttempts += 1;
  throw new Error("stream unavailable");
}, { attempts: 2, delayMs: 1 }), /stream unavailable/);
assert.equal(terminalAttempts, 2);
console.log("worker retry test passed");
