import { test, describe } from "node:test";
import assert from "node:assert/strict";
import entry from "../index.js";
import { xblFetch, XblApiError } from "../src/client.js";
import { normalizeList } from "../src/format.js";
import type { Profile, GamePassTitle } from "../src/types.js";
import { makeApi, findTool, textOf } from "./helpers.js";

/**
 * Opt-in live smoke tests. These hit the real xbl.io API and are SKIPPED unless
 * both OPENCLAW_XBOX_LIVE=1 and OPENCLAW_XBOX_API_KEY are set. They only exercise
 * read-only tools/endpoints — never the write/destructive ones.
 *
 *   OPENCLAW_XBOX_API_KEY=xxx npm run test:live
 */
const apiKey = process.env.OPENCLAW_XBOX_API_KEY;
const enabled = process.env.OPENCLAW_XBOX_LIVE === "1" && !!apiKey;
const opts = enabled ? {} : { skip: "set OPENCLAW_XBOX_LIVE=1 and OPENCLAW_XBOX_API_KEY to run" };

function api() {
  const a = makeApi({ pluginConfig: { apiKey } });
  entry.register(a);
  return a;
}

/**
 * Hit a read-only endpoint and assert the PATH is correct. A 404 means the
 * endpoint path is wrong (the thing we're trying to catch) and fails the test.
 * Any other status (e.g. 403 plan limit, 200 empty) is reported but tolerated,
 * since it does not indicate a wrong path.
 */
async function probePath(path: string): Promise<void> {
  try {
    await xblFetch(apiKey!, path, { ttlMs: 0 });
    console.log(`  ✓ ${path} → 200`);
  } catch (err) {
    if (err instanceof XblApiError) {
      assert.notEqual(err.status, 404, `${path} returned 404 — endpoint path is likely wrong`);
      console.log(`  ⚠ ${path} → ${err.status} (${err.message}) — not a 404, tolerating`);
      return;
    }
    throw err;
  }
}

describe("live xbl.io smoke — confirmed tools (read-only)", () => {
  test("xbox_my_profile returns a profile", opts, async () => {
    const out = textOf(await findTool(api(), "xbox_my_profile").execute("live"));
    assert.ok(out.length > 0);
    assert.doesNotMatch(out, /error/i);
  });

  test("xbox_friends_presence returns friends summary", opts, async () => {
    const out = textOf(await findTool(api(), "xbox_friends_presence").execute("live"));
    assert.ok(out.length > 0);
  });

  test("xbox_my_achievements returns achievements summary", opts, async () => {
    const out = textOf(await findTool(api(), "xbox_my_achievements").execute("live"));
    assert.ok(out.length > 0);
  });

  test("xbox_my_title_history returns recently played", opts, async () => {
    const out = textOf(await findTool(api(), "xbox_my_title_history").execute("live"));
    assert.ok(out.length > 0);
  });
});

describe("live xbl.io endpoint reachability — paths I could not verify offline", () => {
  test("DVR screenshots endpoint path", opts, async () => {
    await probePath("/dvr/screenshots");
  });

  test("DVR game clips endpoint path", opts, async () => {
    await probePath("/dvr/gameclips");
  });

  test("clubs find endpoint path", opts, async () => {
    await probePath(`/clubs/find?q=${encodeURIComponent("halo")}`);
  });

  test("player title history endpoint path (own XUID)", opts, async () => {
    const account = await xblFetch<{ profileUsers: Profile[] }>(apiKey!, "/account", { ttlMs: 0 });
    const xuid = account.profileUsers?.[0]?.id;
    assert.ok(xuid, "could not resolve own XUID");
    await probePath(`/player/titleHistory/${encodeURIComponent(xuid!)}`);
  });

  test("player presence endpoint path (own XUID)", opts, async () => {
    const account = await xblFetch<{ profileUsers: Profile[] }>(apiKey!, "/account", { ttlMs: 0 });
    const xuid = account.profileUsers?.[0]?.id;
    assert.ok(xuid, "could not resolve own XUID");
    await probePath(`/${encodeURIComponent(xuid!)}/presence`);
  });

  test("marketplace details endpoint path (product ID from Game Pass)", opts, async () => {
    const raw = await xblFetch<unknown>(apiKey!, "/gamepass/all", { ttlMs: 0 });
    const titles = normalizeList<GamePassTitle>(raw);
    const productId = titles[0]?.id ?? titles[0]?.siglId;
    if (!productId) {
      console.log("  ⚠ no product ID available from /gamepass/all — skipping marketplace probe");
      return;
    }
    await probePath(`/marketplace/details/${encodeURIComponent(productId)}`);
  });
});
