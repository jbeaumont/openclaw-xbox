import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { collectXboxSecurityFindings } from "../src/security.js";

function ctx(config: unknown, env: NodeJS.ProcessEnv = {}) {
  return { sourceConfig: { plugins: { entries: { "openclaw-xbox": { config } } } }, env };
}

describe("security audit collector", () => {
  test("no findings for a clean read-only config", () => {
    const findings = collectXboxSecurityFindings(ctx({}, { OPENCLAW_XBOX_API_KEY: "from-env" }));
    assert.equal(findings.length, 0);
  });

  test("warns when write tools are enabled", () => {
    const findings = collectXboxSecurityFindings(ctx({ enableWriteTools: true }));
    const f = findings.find((x) => x.checkId === "openclaw-xbox.write-tools-enabled");
    assert.ok(f);
    assert.equal(f!.severity, "warn");
    assert.ok(f!.remediation);
  });

  test("info when the API key is stored as plaintext config", () => {
    const findings = collectXboxSecurityFindings(ctx({ apiKey: "plaintext-key-123" }));
    const f = findings.find((x) => x.checkId === "openclaw-xbox.apikey-plaintext");
    assert.ok(f);
    assert.equal(f!.severity, "info");
  });

  test("no plaintext finding for a secret reference", () => {
    const findings = collectXboxSecurityFindings(ctx({ apiKey: "secret://xbl-key" }));
    assert.ok(!findings.find((x) => x.checkId === "openclaw-xbox.apikey-plaintext"));
  });
});
