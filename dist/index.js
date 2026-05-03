import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { registerIdentityTools } from "./src/tools/identity.js";
import { registerPresenceTools } from "./src/tools/presence.js";
import { registerAchievementTools } from "./src/tools/achievements.js";
import { registerGamePassTools } from "./src/tools/gamepass.js";
import { registerSessionTools } from "./src/tools/sessions.js";
import { registerCommands } from "./src/commands.js";
export default definePluginEntry({
    id: "openclaw-xbox",
    name: "Xbox Live",
    description: "Xbox Live tools via xbl.io — profiles, presence, achievements, Game Pass catalog, and sessions",
    register(api) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pluginCfg = api.config?.plugins?.entries?.["openclaw-xbox"]?.config;
        const apiKey = pluginCfg?.apiKey || undefined;
        // Commands are always registered — /xbox setup works even without a key
        registerCommands(api, apiKey);
        if (!apiKey) {
            api.logger?.warn("openclaw-xbox: no apiKey configured — agent tools unavailable, run /xbox setup");
            return;
        }
        registerIdentityTools(api, apiKey);
        registerPresenceTools(api, apiKey);
        registerAchievementTools(api, apiKey);
        registerGamePassTools(api, apiKey);
        registerSessionTools(api, apiKey);
    },
});
