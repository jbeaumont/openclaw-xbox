import { xblFetch } from "../client.js";
import { EmptyParamSchema, PlayerAchievementsParamSchema, GameTitle } from "../types.js";
import { toolResult } from "../result.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerAchievementTools(api: any, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_my_achievements",
      description: "Get the authenticated user's Xbox Live achievement progress across all titles — gamerscore earned, achievements unlocked, and progress percentage per title.",
      parameters: EmptyParamSchema,
      async execute() {
        const data = await xblFetch<{ titles: GameTitle[] }>(apiKey, "/achievements");
        const titles = data.titles ?? [];
        if (titles.length === 0) return toolResult("No achievement titles found.");
        return toolResult(JSON.stringify(titles, null, 2));
      },
    },
    { optional: true }
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
        const data = await xblFetch<unknown>(apiKey, path);
        return toolResult(JSON.stringify(data, null, 2));
      },
    },
    { optional: true }
  );
}
