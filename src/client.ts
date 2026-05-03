const BASE_URL = "https://xbl.io/api/v2";

export class XblApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(`xbl.io ${status}: ${message}`);
    this.name = "XblApiError";
  }
}

export async function xblFetch<T>(
  apiKey: string,
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = options;

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
    throw new XblApiError(res.status, message);
  }

  const json = await res.json() as { content?: T; code?: number };
  return (json.content ?? json) as T;
}
