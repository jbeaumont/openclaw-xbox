import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { registerIdentityTools } from "./src/tools/identity.js";
import { registerPresenceTools } from "./src/tools/presence.js";
import { registerAchievementTools } from "./src/tools/achievements.js";
import { registerGamePassTools } from "./src/tools/gamepass.js";
import { registerSessionTools } from "./src/tools/sessions.js";
import { registerTitleTools } from "./src/tools/titles.js";
import { registerMediaTools } from "./src/tools/media.js";
import { registerClubTools, registerCatalogTools } from "./src/tools/clubs.js";
import { registerWriteTools } from "./src/tools/write.js";
import { registerCommands } from "./src/commands.js";
import { resolveConfig } from "./src/config.js";

export default definePluginEntry({
  id: "openclaw-xbox",
  name: "Xbox Live",
  description: "Xbox Live tools via xbl.io — profiles, presence, achievements, Game Pass catalog, and sessions",

  register(api) {
    const { apiKey, enableWriteTools } = resolveConfig(api);

    // Commands are always registered — /xbox setup works even without a key
    registerCommands(api, apiKey);

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

    // Write/destructive tools — opt-in only, owner-restricted, confirm-gated
    if (enableWriteTools) {
      registerWriteTools(api, apiKey);
      api.logger?.info("openclaw-xbox: write tools enabled (add/remove friend, send message)");
    }
  },
});
