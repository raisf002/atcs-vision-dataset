import { describe, expect, it } from "vitest";
import { withRetry } from "./retry.mjs";

describe("worker retry", () => {
  it("mengulangi capture sampai berhasil", async () => {
    let attempts = 0;
    const recovered = await withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("stream transient failure");
      return "captured";
    }, { attempts: 3, delayMs: 1 });

    expect(recovered).toBe("captured");
    expect(attempts).toBe(3);
  });

  it("meneruskan kegagalan setelah seluruh percobaan habis dan memakai delay khusus", async () => {
    let terminalAttempts = 0;
    const delays = [];
    await expect(withRetry(async () => {
      terminalAttempts += 1;
      throw new Error("stream unavailable");
    }, {
      attempts: 2,
      getDelayMs: () => 1,
      onAttemptFailure: (_error, _attempt, waitMs) => delays.push(waitMs),
    })).rejects.toThrow("stream unavailable");

    expect(terminalAttempts).toBe(2);
    expect(delays).toEqual([1]);
  });
});
