const inFlightRequests = new Map();

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractStatusCode = (error) =>
  error?.response?.status ??
  error?.status ??
  error?.httpStatus ??
  null;

const isLikelyNetworkError = (error) => {
  const code = error?.code;
  const message = (error?.message || '').toLowerCase();

  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || code === 'ERR_NETWORK') {
    return true;
  }

  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timed out') ||
    message.includes('timeout')
  );
};

export const isTransientHttpError = (error) => {
  const status = extractStatusCode(error);
  if (status && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }
  return !status && isLikelyNetworkError(error);
};

export const runRequestWithPolicy = async ({
  dedupeKey,
  requestFn,
  maxRetries = 2,
  baseDelayMs = 300,
  maxJitterMs = 150,
  shouldRetry = isTransientHttpError,
}) => {
  if (!dedupeKey) {
    throw new Error('runRequestWithPolicy requires a dedupeKey');
  }

  if (typeof requestFn !== 'function') {
    throw new Error('runRequestWithPolicy requires a requestFn function');
  }

  const inFlight = inFlightRequests.get(dedupeKey);
  if (inFlight) {
    return inFlight;
  }

  const requestPromise = (async () => {
    let attempt = 0;
    while (true) {
      try {
        return await requestFn();
      } catch (error) {
        const canRetry = attempt < maxRetries && shouldRetry(error, attempt + 1);
        if (!canRetry) {
          throw error;
        }

        const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * maxJitterMs);
        await sleep(exponentialDelay + jitter);
        attempt += 1;
      }
    }
  })();

  inFlightRequests.set(dedupeKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(dedupeKey);
  }
};

