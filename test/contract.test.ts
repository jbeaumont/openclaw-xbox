import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import entry from "../index.js";
import { makeApi } from "./helpers.js";

const manifestPath = fileURLToPath(new URL("../openclaw.plugin.json", import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  contracts: { tools: string[] };
};

describe("manifest contract", () => {
  test("contracts.tools exactly matches the tools the runtime registers", () => {
    // Register with a key AND write tools enabled to get the full surface.
    const api = makeApi({ pluginConfig: { apiKey: "k", enableWriteTools: true } });
    entry.register(api);

    const registered = api.tools.map((t) => t.name).sort();
    const declared = [...manifest.contracts.tools].sort();

    const missingInManifest = registered.filter((t) => !declared.includes(t));
    const missingInRuntime = declared.filter((t) => !registered.includes(t));

    assert.deepEqual(
      missingInManifest,
      [],
      `tools registered but not declared in manifest: ${missingInManifest.join(", ")}`
    );
    assert.deepEqual(
      missingInRuntime,
      [],
      `tools declared in manifest but not registered: ${missingInRuntime.join(", ")}`
    );
  });
});
