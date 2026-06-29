const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_LIMIT = 5;         // Max 5 check-ins per minute per IP

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

// Clean up expired rate limits periodically
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, info] of rateLimitMap.entries()) {
      if (now > info.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 10 * 60 * 1000); // Clean every 10 minutes
}

/**
 * Checks if a request from a given IP address exceeds the limit.
 * Returns true if rate limit is exceeded, false otherwise.
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const info = rateLimitMap.get(ip);

  if (!info) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return false;
  }

  if (now > info.resetTime) {
    // Window expired, reset
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return false;
  }

  // Inside current window
  info.count += 1;
  if (info.count > MAX_LIMIT) {
    return true;
  }

  return false;
}
