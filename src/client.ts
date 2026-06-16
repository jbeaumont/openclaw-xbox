const BASE_URL = "https://xbl.io/api/v2";

/** Default TTL for cached GET responses (ms). xbl.io free tier is 150 req/hr. */
const DEFAULT_TTL_MS = 60_000;

export class XblApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Seconds to wait before retrying, when the API reports it (429). */
    public readonly retryAfterSeconds?: number
  ) {
    super(`xbl.io ${status}: ${message}`);
    this.name = "XblApiError";
  }

  /** Human-friendly hint shown to the user for common failure modes. */
  get hint(): string {
    if (this.status === 401 || this.status === 403) {
      return "Your xbl.io API key looks invalid or expired — check it at https://xbl.io.";
    }
    if (this.status === 429) {
      const wait = this.retryAfterSeconds ? ` Try again in ~${this.retryAfterSeconds}s.` : "";
      return `xbl.io rate limit reached (free tier is 150 requests/hour).${wait}`;
    }
    return this.message;
  }
}

type CacheEntry = { value: unknown; expires: number };
const cache = new Map<string, CacheEntry>();

/** Clear the response cache (used by tests and after write operations). */
export function clearXblCache(): void {
  cache.clear();
}

export async function xblFetch<T>(
  apiKey: string,
  path: string,
  options: { method?: string; body?: unknown; ttlMs?: number } = {}
): Promise<T> {
  const { method = "GET", body, ttlMs = DEFAULT_TTL_MS } = options;
  const cacheable = method === "GET" && ttlMs > 0;
  const cacheKey = `${apiKey.slice(-6)}:${path}`;

  if (cacheable) {
    const hit = cache.get(cacheKey);
    if (hit && hit.expires > Date.now()) return hit.value as T;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "X-Authorization": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Language": "en-US",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = (await res.json()) as { message?: string };
      if (err.message) message = err.message;
    } catch {
      // use statusText fallback
    }
    const retryAfter = res.headers.get("retry-after");
    const retryAfterSeconds = retryAfter ? Number(retryAfter) || undefined : undefined;
    throw new XblApiError(res.status, message, retryAfterSeconds);
  }

  const json = (await res.json()) as { content?: T; code?: number };
  const value = (json.content ?? json) as T;

  if (cacheable) {
    cache.set(cacheKey, { value, expires: Date.now() + ttlMs });
  }
  return value;
}
