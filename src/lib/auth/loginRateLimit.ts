const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Entry = {
  failures: number;
  windowStart: number;
  lockedUntil?: number;
};

const store = new Map<string, Entry>();

export function isLoginBlocked(key: string): boolean {
  const e = store.get(key);
  if (!e) return false;
  const now = Date.now();
  if (e.lockedUntil != null) {
    if (now < e.lockedUntil) return true;
    store.delete(key);
    return false;
  }
  if (now - e.windowStart > WINDOW_MS) {
    store.delete(key);
    return false;
  }
  return false;
}

export function loginLockedUntilMs(key: string): number {
  const e = store.get(key);
  if (!e?.lockedUntil) return 0;
  return Math.max(0, e.lockedUntil - Date.now());
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  let e = store.get(key);
  if (!e || now - e.windowStart > WINDOW_MS) {
    e = { failures: 1, windowStart: now };
    store.set(key, e);
    return;
  }
  e.failures += 1;
  if (e.failures >= MAX_FAILURES) {
    e.lockedUntil = now + WINDOW_MS;
  }
  store.set(key, e);
}

export function clearLoginFailures(key: string) {
  store.delete(key);
}

export function rateLimitKey(ip: string, username: string) {
  return `${ip}::${username.toLowerCase()}`;
}
