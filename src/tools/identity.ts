import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { xblFetch } from "../client.js";
import { EmptyParamSchema, GamertagParamSchema, Profile } from "../types.js";

export function registerIdentityTools(api: OpenClawPluginApi, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_my_profile",
      description: "Get the authenticated Xbox Live user's own profile — gamertag, XUID, gamerscore, account tier, bio, and location.",
      parameters: EmptyParamSchema,
      async execute() {
        const data = await xblFetch<{ profileUsers: Profile[] }>(apiKey, "/account");
        const profile = data.profileUsers?.[0];
        if (!profile) return { content: [{ type: "text", text: "No profile data returned." }] };
        return {
          content: [{
            type: "text",
            text: JSON.stringify(profile, null, 2),
          }],
        };
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "xbox_search_player",
      description: "Look up an Xbox Live player by gamertag. Returns their XUID, gamerscore, account tier, and profile details.",
      parameters: GamertagParamSchema,
      async execute(_id, { gamertag }) {
        const data = await xblFetch<{ profileUsers: Profile[] }>(
          apiKey,
          `/search/${encodeURIComponent(gamertag)}`
        );
        const profile = data.profileUsers?.[0];
        if (!profile) return { content: [{ type: "text", text: `No player found for gamertag: ${gamertag}` }] };
        return {
          content: [{
            type: "text",
            text: JSON.stringify(profile, null, 2),
          }],
        };
      },
    },
    { optional: true }
  );
}
