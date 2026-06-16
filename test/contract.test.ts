import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import entry from "../index.js";
import { ALL_TOOLS } from "../src/tool-names.js";
import { makeApi } from "./helpers.js";

const manifestPath = fileURLToPath(new URL("../openclaw.plugin.json", import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  contracts: { tools: string[] };
  toolMetadata: Record<string, { configSignals?: { rootPath: string; required?: string[] }[] }>;
  activation: { onStartup?: boolean; onCommands?: string[]; onConfigPaths?: string[] };
};

describe("manifest contract", () => {
  test("contracts.tools exactly matches the tools the runtime registers", () => {
    const api = makeApi({ pluginConfig: { apiKey: "k", enableWriteTools: true } });
    entry.register(api);

    const registered = api.tools.map((t) => t.name).sort();
    const declared = [...manifest.contracts.tools].sort();

    assert.deepEqual(
      registered.filter((t) => !declared.includes(t)),
      [],
      "tools registered but not declared in manifest"
    );
    assert.deepEqual(
      declared.filter((t) => !registered.includes(t)),
      [],
      "tools declared in manifest but not registered"
    );
  });

  test("contracts.tools matches the shared tool-names source of truth", () => {
    assert.deepEqual([...manifest.contracts.tools].sort(), [...ALL_TOOLS].sort());
  });

  test("every declared tool has toolMetadata with a config signal", () => {
    for (const tool of manifest.contracts.tools) {
      const meta = manifest.toolMetadata[tool];
      assert.ok(meta, `missing toolMetadata for ${tool}`);
      const signal = meta.configSignals?.[0];
      assert.ok(signal, `missing configSignal for ${tool}`);
      assert.equal(signal.rootPath, "plugins.entries.openclaw-xbox.config");
      assert.ok(signal.required?.includes("apiKey"), `${tool} should require apiKey`);
    }
  });

  test("write tools require the enableWriteTools signal", () => {
    for (const tool of ["xbox_add_friend", "xbox_remove_friend", "xbox_send_message"]) {
      const required = manifest.toolMetadata[tool].configSignals?.[0].required ?? [];
      assert.ok(required.includes("enableWriteTools"), `${tool} should require enableWriteTools`);
    }
  });

  test("activation is startup-lazy and triggered by the command + config", () => {
    assert.equal(manifest.activation.onStartup, false, "plugin should not load on every gateway startup");
    assert.ok(manifest.activation.onCommands?.includes("xbox"), "should activate on the /xbox command");
    assert.ok(
      manifest.activation.onConfigPaths?.includes("plugins.entries.openclaw-xbox.config"),
      "should activate when its config is present"
    );
  });
});
