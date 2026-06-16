import { test, describe } from "node:test";
import assert from "node:assert/strict";
import entry from "../index.js";
import { makeApi, findTool, textOf } from "./helpers.js";

/**
 * Opt-in live smoke tests. These hit the real xbl.io API and are SKIPPED unless
 * both OPENCLAW_XBOX_LIVE=1 and OPENCLAW_XBOX_API_KEY are set. They only exercise
 * read-only tools — never the write/destructive ones.
 *
 *   OPENCLAW_XBOX_API_KEY=xxx npm run test:live
 */
const apiKey = process.env.OPENCLAW_XBOX_API_KEY;
const enabled = process.env.OPENCLAW_XBOX_LIVE === "1" && !!apiKey;
const opts = enabled ? {} : { skip: "set OPENCLAW_XBOX_LIVE=1 and OPENCLAW_XBOX_API_KEY to run" };

describe("live xbl.io smoke (read-only)", () => {
  function api() {
    const a = makeApi({ pluginConfig: { apiKey } });
    entry.register(a);
    return a;
  }

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
