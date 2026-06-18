import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { registerIdentityTools } from "./src/tools/identity.js";
import { registerPresenceTools } from "./src/tools/presence.js";
import { registerAchievementTools } from "./src/tools/achievements.js";
import { registerGamePassTools } from "./src/tools/gamepass.js";
import { registerSessionTools } from "./src/tools/sessions.js";
import { registerTitleTools } from "./src/tools/titles.js";
import { registerMediaTools } from "./src/tools/media.js";
import { registerClubTools, registerCatalogTools } from "./src/tools/clubs.js";
import { registerSocialTools } from "./src/tools/social.js";
import { registerWriteTools } from "./src/tools/write.js";
import { registerCommands } from "./src/commands.js";
import { resolveConfig } from "./src/config.js";
import { collectXboxSecurityFindings } from "./src/security.js";
import { createNotificationService, type SessionHolder } from "./src/notifications.js";
import { READ_TOOLS, WRITE_TOOLS } from "./src/tool-names.js";

const AUTO_ENABLE_PATH = "plugins.entries.openclaw-xbox.config.apiKey";

export default definePluginEntry({
  id: "openclaw-xbox",
  name: "Xbox Live",
  description: "Xbox Live tools via xbl.io — profiles, presence, achievements, Game Pass catalog, and sessions",

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(api: any) {
    // Auto-enable the plugin once a key is present, so users don't need a
    // separate `openclaw plugins enable` step. (No-op on runtimes without it.)
    api.registerAutoEnableProbe?.((ctx: { config?: unknown; env?: NodeJS.ProcessEnv }) => {
      const cfg = (ctx?.config as any)?.plugins?.entries?.["openclaw-xbox"]?.config;
      if (cfg?.apiKey || ctx?.env?.OPENCLAW_XBOX_API_KEY) return AUTO_ENABLE_PATH;
      return null;
    });

    // Contribute security findings to `openclaw` audits / ClawHub trust scans.
    api.registerSecurityAuditCollector?.(collectXboxSecurityFindings);

    const { apiKey, enableWriteTools, notifications } = resolveConfig(api);

    // Commands are always registered — /xbox setup works even without a key
    registerCommands(api, apiKey, notifications);

    if (!apiKey) {
      api.logger?.warn("openclaw-xbox: no apiKey configured — agent tools unavailable, run /xbox setup");
      return;
    }

    // Read-only tools — available whenever a key is configured
    registerIdentityTools(api, apiKey);
    registerPresenceTools(api, apiKey);
    registerAchievementTools(api, apiKey);
    registerGamePassTools(api, apiKey);
    registerSessionTools(api, apiKey);
    registerTitleTools(api, apiKey);
    registerMediaTools(api, apiKey);
    registerClubTools(api, apiKey);
    registerCatalogTools(api, apiKey);
    registerSocialTools(api, apiKey);

    // Write/destructive tools — opt-in only, owner-restricted, confirm-gated
    if (enableWriteTools) {
      registerWriteTools(api, apiKey);
      api.logger?.info("openclaw-xbox: write tools enabled (add/remove friend, send message)");
    }

    // Display/policy metadata so surfaces can show risk levels. (No-op if unsupported.)
    for (const toolName of READ_TOOLS) {
      api.registerToolMetadata?.({ toolName, risk: "low", tags: ["xbox", "read"] });
    }
    if (enableWriteTools) {
      for (const toolName of WRITE_TOOLS) {
        api.registerToolMetadata?.({ toolName, risk: "high", tags: ["xbox", "write"] });
      }
    }

    // Proactive notifications — opt-in only. Off by default = zero ambient cost.
    // Alerts piggyback on the user's next turn (no extra agent turns), and each
    // alert self-advertises how to disable them.
    if (notifications?.enabled) {
      const holder: SessionHolder = {};
      // Remember the most recent session so alerts can attach to the next turn.
      api.registerAgentEventSubscription?.({
        id: "openclaw-xbox-session-tracker",
        streams: ["lifecycle"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handle: (event: any) => {
          if (event?.sessionKey) holder.lastSessionKey = event.sessionKey;
        },
      });
      api.registerService?.(createNotificationService(api, apiKey, notifications, holder));
      api.logger?.info("openclaw-xbox: proactive notifications enabled (opt-in)");
    }
  },
});
