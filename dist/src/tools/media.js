import { xblFetch } from "../client.js";
import { EmptyParamSchema } from "../types.js";
import { normalizeList, formatMedia } from "../format.js";
import { toolResult } from "../result.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerMediaTools(api, apiKey) {
    api.registerTool({
        name: "xbox_screenshots",
        description: "List the authenticated user's recent Xbox DVR screenshots — title, capture date, and a link to each image.",
        parameters: EmptyParamSchema,
        async execute() {
            const raw = await xblFetch(apiKey, "/dvr/screenshots");
            return toolResult(formatMedia(normalizeList(raw, "values", "screenshots"), "screenshots"));
        },
    });
    api.registerTool({
        name: "xbox_game_clips",
        description: "List the authenticated user's recent Xbox DVR game clips — title, capture date, and a link to each clip.",
        parameters: EmptyParamSchema,
        async execute() {
            const raw = await xblFetch(apiKey, "/dvr/gameclips");
            return toolResult(formatMedia(normalizeList(raw, "values", "gameClips"), "clips"));
        },
    });
}
