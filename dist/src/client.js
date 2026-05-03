const BASE_URL = "https://xbl.io/api/v2";
export class XblApiError extends Error {
    status;
    constructor(status, message) {
        super(`xbl.io ${status}: ${message}`);
        this.status = status;
        this.name = "XblApiError";
    }
}
export async function xblFetch(apiKey, path, options = {}) {
    const { method = "GET", body } = options;
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            "X-Authorization": apiKey,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        let message = res.statusText;
        try {
            const err = (await res.json());
            if (err.message)
                message = err.message;
        }
        catch {
            // use statusText fallback
        }
        throw new XblApiError(res.status, message);
    }
    return res.json();
}
