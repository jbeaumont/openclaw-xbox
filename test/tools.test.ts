import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import entry from "../index.js";
import { READ_TOOLS, WRITE_TOOLS } from "../src/tool-names.js";
import { makeApi, installFetch, findTool, textOf } from "./helpers.js";

let active: { restore: () => void } | undefined;

// These tests assert config-driven registration, so they must be independent of
// ambient env (e.g. a real OPENCLAW_XBOX_API_KEY set for `npm run test:live`).
const ENV_KEYS = ["OPENCLAW_XBOX_API_KEY", "OPENCLAW_XBOX_ENABLE_WRITE_TOOLS"];
const savedEnv: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  active?.restore();
  active = undefined;
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("plugin registration", () => {
  test("registers the command but no tools when no key is configured", () => {
    const api = makeApi({ pluginConfig: {} });
    entry.register(api);
    assert.equal(api.tools.length, 0);
    assert.ok(api.commands.find((c) => c.name === "xbox"));
    assert.ok(api.logs.find((l) => l.level === "warn"));
  });

  test("registers all read tools when a key is configured, write tools stay off by default", () => {
    const api = makeApi({ pluginConfig: { apiKey: "k" } });
    entry.register(api);
    const names = api.tools.map((t) => t.name);
    for (const t of READ_TOOLS) assert.ok(names.includes(t), `missing ${t}`);
    for (const t of WRITE_TOOLS) assert.ok(!names.includes(t), `${t} should be off by default`);
  });

  test("registers write tools (owner-only) when enableWriteTools is set", () => {
    const api = makeApi({ pluginConfig: { apiKey: "k", enableWriteTools: true } });
    entry.register(api);
    const names = api.tools.map((t) => t.name);
    for (const t of WRITE_TOOLS) assert.ok(names.includes(t), `missing ${t}`);
    for (const t of WRITE_TOOLS) assert.equal(findTool(api, t).ownerOnly, true, `${t} must be ownerOnly`);
  });
});

describe("read tool execution", () => {
  test("xbox_my_profile formats the account response", async () => {
    const api = makeApi({ pluginConfig: { apiKey: "k" } });
    entry.register(api);
    active = installFetch({
      "/account": { profileUsers: [{ id: "55", settings: [{ id: "Gamertag", value: "WiringTag" }] }] },
    });
    const out = textOf(await findTool(api, "xbox_my_profile").execute("t1"));
    assert.match(out, /WiringTag/);
  });

  test("xbox_search_player hits /search/<gamertag>", async () => {
    const api = makeApi({ pluginConfig: { apiKey: "k" } });
    entry.register(api);
    const f = installFetch({ "/search/Halo": { people: [{ xuid: "7", gamertag: "Halo" }] } });
    active = f;
    const out = textOf(await findTool(api, "xbox_search_player").execute("t2", { gamertag: "Halo" }));
    assert.match(out, /Halo/);
    assert.ok(f.calls.some((c) => c.path === "/search/Halo"));
  });
});

describe("write tool confirm gating", () => {
  test("xbox_add_friend does NOT call the API when confirm is false", async () => {
    const api = makeApi({ pluginConfig: { apiKey: "k", enableWriteTools: true } });
    entry.register(api);
    const f = installFetch({ "/friends/add/": { ok: true } });
    active = f;
    const out = textOf(await findTool(api, "xbox_add_friend").execute("t3", { xuid: "9", confirm: false }));
    assert.match(out, /Not added/);
    assert.equal(f.calls.length, 0, "no network call should happen without confirm");
  });

  test("xbox_add_friend POSTs when confirm is true", async () => {
    const api = makeApi({ pluginConfig: { apiKey: "k", enableWriteTools: true } });
    entry.register(api);
    const f = installFetch({ "/friends/add/9": { ok: true } });
    active = f;
    const out = textOf(await findTool(api, "xbox_add_friend").execute("t4", { xuid: "9", confirm: true }));
    assert.match(out, /Added/);
    assert.ok(f.calls.some((c) => c.method === "POST" && c.path === "/friends/add/9"));
  });
});
