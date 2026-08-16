export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry(task, { attempts = 3, delayMs = 750, onAttemptFailure } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await onAttemptFailure?.(error, attempt);
        await delay(delayMs * attempt);
      }
    }
  }
  throw lastError;
}
