import { xblFetch } from "../client.js";
import { EmptyParamSchema, PlayerAchievementsParamSchema, GameTitle } from "../types.js";
import { normalizeList, formatAchievements } from "../format.js";
import { toolResult } from "../result.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerAchievementTools(api: any, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_my_achievements",
      description: "Get the authenticated user's Xbox Live achievement progress across all titles — gamerscore earned, achievements unlocked, and progress percentage per title.",
      parameters: EmptyParamSchema,
      async execute() {
        const raw = await xblFetch<unknown>(apiKey, "/achievements");
        return toolResult(formatAchievements(normalizeList<GameTitle>(raw, "titles")));
      },
    }
  );

  api.registerTool(
    {
      name: "xbox_player_achievements",
      description: "Get Xbox Live achievement progress for another player by their XUID. Optionally filter by a specific title ID.",
      parameters: PlayerAchievementsParamSchema,
      async execute(_id: string, { xuid, titleId }: { xuid: string; titleId?: string }) {
        const path = titleId
          ? `/achievements/player/${encodeURIComponent(xuid)}/${encodeURIComponent(titleId)}`
          : `/achievements/player/${encodeURIComponent(xuid)}`;
        const raw = await xblFetch<unknown>(apiKey, path);
        // Title-filtered queries return raw achievement detail; the all-titles
        // query returns per-title summaries we can format compactly.
        if (titleId) return toolResult(JSON.stringify(raw, null, 2));
        return toolResult(formatAchievements(normalizeList<GameTitle>(raw, "titles")));
      },
    }
  );
}
