import { xblFetch } from "../client.js";
import { EmptyParamSchema } from "../types.js";
import { normalizeList, formatGamePass } from "../format.js";
import { toolResult } from "../result.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeGamePassTool(api, apiKey, name, description, path, label) {
    api.registerTool({
        name,
        description,
        parameters: EmptyParamSchema,
        async execute() {
            const raw = await xblFetch(apiKey, path);
            return toolResult(formatGamePass(normalizeList(raw), label));
        },
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerGamePassTools(api, apiKey) {
    makeGamePassTool(api, apiKey, "xbox_gamepass_all", "List all titles currently available in Xbox Game Pass.", "/gamepass/all", "Game Pass");
    makeGamePassTool(api, apiKey, "xbox_gamepass_pc", "List titles available in PC Game Pass.", "/gamepass/pc", "PC Game Pass");
    makeGamePassTool(api, apiKey, "xbox_gamepass_ea_play", "List titles available through EA Play (included with Game Pass Ultimate).", "/gamepass/ea-play", "EA Play");
}
