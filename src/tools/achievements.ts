import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { xblFetch } from "../client.js";
import { EmptyParamSchema, PlayerAchievementsParamSchema, Achievement } from "../types.js";

export function registerAchievementTools(api: OpenClawPluginApi, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_my_achievements",
      description: "Get the authenticated user's Xbox Live achievements across all titles — names, unlock status, gamerscore, and rarity.",
      parameters: EmptyParamSchema,
      async execute() {
        const data = await xblFetch<{ achievements: Achievement[] }>(apiKey, "/achievements");
        const achievements = data.achievements ?? [];
        if (achievements.length === 0) return { content: [{ type: "text", text: "No achievements found." }] };
        return {
          content: [{
            type: "text",
            text: JSON.stringify(achievements, null, 2),
          }],
        };
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "xbox_player_achievements",
      description: "Get Xbox Live achievements for another player by their XUID. Optionally filter by a specific title ID.",
      parameters: PlayerAchievementsParamSchema,
      async execute(_id, { xuid, titleId }) {
        const path = titleId
          ? `/achievements/player/${encodeURIComponent(xuid)}/${encodeURIComponent(titleId)}`
          : `/achievements/player/${encodeURIComponent(xuid)}`;
        const data = await xblFetch<{ achievements: Achievement[] }>(apiKey, path);
        const achievements = data.achievements ?? [];
        if (achievements.length === 0) return { content: [{ type: "text", text: `No achievements found for XUID: ${xuid}` }] };
        return {
          content: [{
            type: "text",
            text: JSON.stringify(achievements, null, 2),
          }],
        };
      },
    },
    { optional: true }
  );
}
