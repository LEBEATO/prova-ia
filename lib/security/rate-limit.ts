type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return { allowed: true, retryAfterMs: 0 };
  }

  if (current.count >= options.limit) {
    return {
      allowed: false,
      retryAfterMs: Math.max(current.resetAt - now, 0),
    };
  }

  current.count += 1;
  buckets.set(key, current);

  return { allowed: true, retryAfterMs: 0 };
}
