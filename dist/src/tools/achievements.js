import { xblFetch } from "../client.js";
import { EmptyParamSchema, PlayerAchievementsParamSchema } from "../types.js";
import { normalizeList, formatAchievements, formatAchievementList } from "../format.js";
import { toolResult } from "../result.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerAchievementTools(api, apiKey) {
    api.registerTool({
        name: "xbox_my_achievements",
        description: "Get the authenticated user's Xbox Live achievement progress across all titles — gamerscore earned, achievements unlocked, and progress percentage per title.",
        parameters: EmptyParamSchema,
        async execute() {
            const raw = await xblFetch(apiKey, "/achievements");
            return toolResult(formatAchievements(normalizeList(raw, "titles")));
        },
    });
    api.registerTool({
        name: "xbox_player_achievements",
        description: "Get Xbox Live achievement progress for another player by their XUID. Optionally filter by a specific title ID.",
        parameters: PlayerAchievementsParamSchema,
        async execute(_id, { xuid, titleId }) {
            const path = titleId
                ? `/achievements/player/${encodeURIComponent(xuid)}/${encodeURIComponent(titleId)}`
                : `/achievements/player/${encodeURIComponent(xuid)}`;
            const raw = await xblFetch(apiKey, path);
            // Title-filtered queries return per-achievement detail; the all-titles
            // query returns per-title summaries.
            if (titleId)
                return toolResult(formatAchievementList(raw));
            return toolResult(formatAchievements(normalizeList(raw, "titles")));
        },
    });
}
