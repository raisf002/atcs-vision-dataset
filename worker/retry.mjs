export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry(task, { attempts = 3, delayMs = 750, getDelayMs, onAttemptFailure } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        const waitMs = getDelayMs ? getDelayMs(error, attempt) : delayMs * attempt;
        await onAttemptFailure?.(error, attempt, waitMs);
        await delay(waitMs);
      }
    }
  }
  throw lastError;
}
