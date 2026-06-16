import { xblFetch } from "../client.js";
import { XuidParamSchema, EmptyParamSchema } from "../types.js";
import { normalizeList, formatTitleHistory } from "../format.js";
import { toolResult } from "../result.js";
async function ownXuid(apiKey) {
    const data = await xblFetch(apiKey, "/account");
    return data.profileUsers?.[0]?.id;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerTitleTools(api, apiKey) {
    api.registerTool({
        name: "xbox_my_title_history",
        description: "Get the authenticated user's recently played Xbox titles — game names, last played dates, and gamerscore earned.",
        parameters: EmptyParamSchema,
        async execute() {
            const xuid = await ownXuid(apiKey);
            if (!xuid)
                return toolResult("Could not resolve your XUID from the account profile.");
            const raw = await xblFetch(apiKey, `/player/titleHistory/${encodeURIComponent(xuid)}`);
            return toolResult(formatTitleHistory(normalizeList(raw, "titles")));
        },
    });
    api.registerTool({
        name: "xbox_player_title_history",
        description: "Get another Xbox Live player's recently played titles by their XUID.",
        parameters: XuidParamSchema,
        async execute(_id, { xuid }) {
            const raw = await xblFetch(apiKey, `/player/titleHistory/${encodeURIComponent(xuid)}`);
            return toolResult(formatTitleHistory(normalizeList(raw, "titles")));
        },
    });
}
