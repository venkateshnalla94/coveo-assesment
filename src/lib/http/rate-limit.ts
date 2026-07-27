// In-memory sliding-window limiter. Fine for this assessment's single-instance deployment;
// a real multi-instance deployment needs a shared store (e.g. Redis) instead.
const windows = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (windows.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);

  if (timestamps.length >= limit) {
    windows.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  windows.set(key, timestamps);
  return false;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "local";
}
