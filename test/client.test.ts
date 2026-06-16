import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { xblFetch, XblApiError } from "../src/client.js";
import { installFetch } from "./helpers.js";

let active: { calls: unknown[]; restore: () => void } | undefined;
afterEach(() => {
  active?.restore();
  active = undefined;
});

describe("xblFetch caching", () => {
  test("caches GET responses within the TTL", async () => {
    const f = installFetch({ "/account": { profileUsers: [{ id: "1", settings: [] }] } });
    active = f;
    await xblFetch("key-aaaaaa", "/account");
    await xblFetch("key-aaaaaa", "/account");
    assert.equal(f.calls.length, 1, "second call should be served from cache");
  });

  test("ttlMs:0 disables caching", async () => {
    const f = installFetch({ "/account": { profileUsers: [] } });
    active = f;
    await xblFetch("key-bbbbbb", "/account", { ttlMs: 0 });
    await xblFetch("key-bbbbbb", "/account", { ttlMs: 0 });
    assert.equal(f.calls.length, 2);
  });

  test("does not cache non-GET requests", async () => {
    const f = installFetch({ "/messages": { ok: true } });
    active = f;
    await xblFetch("key-cccccc", "/messages", { method: "POST", body: { x: 1 } });
    await xblFetch("key-cccccc", "/messages", { method: "POST", body: { x: 1 } });
    assert.equal(f.calls.length, 2);
  });
});

describe("xblFetch response unwrapping", () => {
  test("unwraps a { content } envelope", async () => {
    const f = installFetch({ "/x": { content: { hello: "world" } } });
    active = f;
    const out = await xblFetch<{ hello: string }>("key-dddddd", "/x");
    assert.deepEqual(out, { hello: "world" });
  });
  test("returns the raw body when there is no content envelope", async () => {
    const f = installFetch({ "/y": { hello: "raw" } });
    active = f;
    const out = await xblFetch<{ hello: string }>("key-eeeeee", "/y");
    assert.deepEqual(out, { hello: "raw" });
  });
});

describe("XblApiError mapping", () => {
  test("401 produces an invalid-key hint", async () => {
    const f = installFetch({ "/account": { status: 401, body: { message: "Unauthorized" } } });
    active = f;
    await assert.rejects(
      () => xblFetch("key-ffffff", "/account"),
      (err: unknown) => {
        assert.ok(err instanceof XblApiError);
        assert.equal(err.status, 401);
        assert.match(err.hint, /invalid or expired/);
        return true;
      }
    );
  });

  test("429 surfaces rate-limit hint with retry-after seconds", async () => {
    const f = installFetch({ "/account": { status: 429, body: { message: "Too Many" }, headers: { "retry-after": "30" } } });
    active = f;
    await assert.rejects(
      () => xblFetch("key-gggggg", "/account"),
      (err: unknown) => {
        assert.ok(err instanceof XblApiError);
        assert.equal(err.status, 429);
        assert.equal(err.retryAfterSeconds, 30);
        assert.match(err.hint, /rate limit/i);
        assert.match(err.hint, /30s/);
        return true;
      }
    );
  });
});
