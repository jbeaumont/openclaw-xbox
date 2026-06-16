export type SecuritySeverity = "info" | "warn" | "critical";
export interface SecurityFinding {
  checkId: string;
  severity: SecuritySeverity;
  title: string;
  detail: string;
  remediation?: string;
}

interface AuditContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sourceConfig?: any;
  env?: NodeJS.ProcessEnv;
}

/**
 * Surface this plugin's security-relevant posture to `openclaw` security audits
 * and the ClawHub trust scan. Pure and synchronous — reads config/env only,
 * never secrets, the network, or the filesystem.
 */
export function collectXboxSecurityFindings(ctx: AuditContext): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const cfg = ctx?.sourceConfig?.plugins?.entries?.["openclaw-xbox"]?.config;

  if (cfg?.enableWriteTools === true) {
    findings.push({
      checkId: "openclaw-xbox.write-tools-enabled",
      severity: "warn",
      title: "Xbox write tools enabled",
      detail:
        "State-changing Xbox tools (add/remove friend, send message) are enabled. They are owner-only and require an explicit confirm flag, but can modify your Xbox social graph and send messages on your behalf.",
      remediation: "Set plugins.entries.openclaw-xbox.config.enableWriteTools to false to disable them.",
    });
  }

  const key = cfg?.apiKey;
  if (typeof key === "string" && key.length > 0 && !key.startsWith("secret://")) {
    findings.push({
      checkId: "openclaw-xbox.apikey-plaintext",
      severity: "info",
      title: "xbl.io API key stored in plain config",
      detail:
        "The xbl.io API key is stored as plaintext in config and grants read access to your Xbox Live data.",
      remediation:
        "Prefer the OPENCLAW_XBOX_API_KEY environment variable or a secret reference instead of plaintext config.",
    });
  }

  return findings;
}
