/** Retries transient Supabase Auth network failures (AuthRetryableFetchError / Failed to fetch). */
export async function withAuthNetworkRetry<T>(
  operation: () => Promise<T>,
  options?: { attempts?: number; delayMs?: number },
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const delayMs = options?.delayMs ?? 400;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableAuthNetworkError(error) || attempt === attempts) {
        throw error;
      }
      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
}

export function isRetryableAuthNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error && typeof error.name === 'string' ? error.name : '';
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const lower = message.toLowerCase();

  if (name === 'AuthRetryableFetchError' || name === 'TypeError') {
    return (
      lower.includes('fetch') ||
      lower.includes('network') ||
      lower.includes('timeout') ||
      lower.includes('abort') ||
      lower.includes('failed')
    );
  }

  return (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('network request failed')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
