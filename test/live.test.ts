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

/**
 * Discovery probe for *candidate* endpoints whose paths we're unsure of. Unlike
 * probePath this NEVER fails the test — it just reports the status and, on 200,
 * the response's top-level keys so we can decide which tools to build.
 */
async function reportPath(path: string): Promise<void> {
  try {
    const raw = await xblFetch<unknown>(apiKey!, path, { ttlMs: 0 });
    const keys = raw && typeof raw === "object" ? Object.keys(raw as object) : typeof raw;
    console.log(`  ✓ ${path} → 200  keys=${JSON.stringify(keys)}`);
  } catch (err) {
    const status = err instanceof XblApiError ? err.status : "ERR";
    console.log(`  ✗ ${path} → ${status}`);
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

describe("live DVR shape inspection (prints real field names to tune the parser)", () => {
  function summarize(label: string, raw: unknown) {
    const top = raw && typeof raw === "object" ? Object.keys(raw as object) : typeof raw;
    const list = normalizeList<Record<string, unknown>>(raw, "values", "gameClips", "screenshots");
    const first = list[0] ? Object.keys(list[0]) : [];
    const uriArrays = list[0]
      ? ["gameClipUris", "screenshotUris", "contentLocators", "thumbnails"].filter(
          (k) => Array.isArray((list[0] as Record<string, unknown>)[k])
        )
      : [];
    console.log(`  ${label}: topKeys=${JSON.stringify(top)} count=${list.length} itemKeys=${JSON.stringify(first)} uriArrays=${JSON.stringify(uriArrays)}`);
    for (const k of uriArrays) {
      const sample = (list[0] as Record<string, unknown[]>)[k]?.[0];
      if (sample) console.log(`    ${k}[0] keys=${JSON.stringify(Object.keys(sample as object))}`);
    }
  }
  test("print /dvr/gameclips shape", opts, async () => {
    summarize("/dvr/gameclips", await xblFetch(apiKey!, "/dvr/gameclips", { ttlMs: 0 }));
  });
  test("print /dvr/screenshots shape", opts, async () => {
    summarize("/dvr/screenshots", await xblFetch(apiKey!, "/dvr/screenshots", { ttlMs: 0 }));
  });
});

describe("live xbl.io — Item 2 candidate endpoints (discovery, never fails)", () => {
  test("probe candidate read endpoints", opts, async () => {
    const account = await xblFetch<{ profileUsers: { id: string }[] }>(apiKey!, "/account", { ttlMs: 0 });
    const xuid = account.profileUsers?.[0]?.id ?? "";
    const candidates = [
      "/recent-players",
      `/recent-players/${xuid}`,
      "/activity/feed",
      "/activity/history",
      "/alerts",
      "/player/stats",
      `/player/stats/${xuid}`,
      `/${xuid}/stats`,
      `/followers/${xuid}`,
      "/following",
      `/following/${xuid}`,
    ];
    console.log("  -- Item 2 candidate endpoints --");
    for (const path of candidates) {
      if (path.includes("//")) continue; // skip if xuid was empty
      await reportPath(path);
    }
  });
});
