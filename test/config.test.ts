import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resolveConfig } from "../src/config.js";

const ENV_KEYS = ["OPENCLAW_XBOX_API_KEY", "OPENCLAW_XBOX_ENABLE_WRITE_TOOLS"];
const saved: Record<string, string | undefined> = {};
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});
function snapshotEnv() {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  for (const k of ENV_KEYS) delete process.env[k];
}

describe("resolveConfig precedence", () => {
  test("pluginConfig wins over nested config and env", () => {
    snapshotEnv();
    process.env.OPENCLAW_XBOX_API_KEY = "from-env";
    const api = {
      pluginConfig: { apiKey: "from-plugin" },
      config: { plugins: { entries: { "openclaw-xbox": { config: { apiKey: "from-nested" } } } } },
    };
    assert.equal(resolveConfig(api).apiKey, "from-plugin");
  });

  test("falls back to nested config when pluginConfig is absent", () => {
    snapshotEnv();
    const api = {
      config: { plugins: { entries: { "openclaw-xbox": { config: { apiKey: "from-nested" } } } } },
    };
    assert.equal(resolveConfig(api).apiKey, "from-nested");
  });

  test("falls back to the environment variable when no config is present", () => {
    snapshotEnv();
    process.env.OPENCLAW_XBOX_API_KEY = "from-env";
    assert.equal(resolveConfig({}).apiKey, "from-env");
  });

  test("enableWriteTools reads from config and OPENCLAW_XBOX_ENABLE_WRITE_TOOLS", () => {
    snapshotEnv();
    assert.equal(resolveConfig({}).enableWriteTools, false);
    process.env.OPENCLAW_XBOX_ENABLE_WRITE_TOOLS = "true";
    assert.equal(resolveConfig({}).enableWriteTools, true);
    assert.equal(resolveConfig({ pluginConfig: { enableWriteTools: false } }).enableWriteTools, false);
  });
});
