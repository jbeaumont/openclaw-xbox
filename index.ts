import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { registerIdentityTools } from "./src/tools/identity.js";
import { registerPresenceTools } from "./src/tools/presence.js";
import { registerAchievementTools } from "./src/tools/achievements.js";
import { registerGamePassTools } from "./src/tools/gamepass.js";
import { registerSessionTools } from "./src/tools/sessions.js";

export default definePluginEntry({
  id: "openclaw-xbox",
  name: "Xbox Live",
  description: "Xbox Live tools via xbl.io — profiles, presence, achievements, Game Pass catalog, and sessions",

  register(api) {
    const apiKey = api.config.get<string>("apiKey");

    if (!apiKey) {
      api.logger?.warn("openclaw-xbox: no apiKey configured — all tools will be unavailable");
      return;
    }

    registerIdentityTools(api, apiKey);
    registerPresenceTools(api, apiKey);
    registerAchievementTools(api, apiKey);
    registerGamePassTools(api, apiKey);
    registerSessionTools(api, apiKey);
  },
});
