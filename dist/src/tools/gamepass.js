import { xblFetch } from "../client.js";
import { EmptyParamSchema } from "../types.js";
import { toolResult } from "../result.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeGamePassTool(api, apiKey, name, description, path) {
    api.registerTool({
        name,
        description,
        parameters: EmptyParamSchema,
        async execute() {
            const data = await xblFetch(apiKey, path);
            const titles = data.titles ?? [];
            if (titles.length === 0)
                return toolResult("No titles found.");
            return toolResult(JSON.stringify(titles, null, 2));
        },
    }, { optional: true });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerGamePassTools(api, apiKey) {
    makeGamePassTool(api, apiKey, "xbox_gamepass_all", "List all titles currently available in Xbox Game Pass.", "/gamepass/all");
    makeGamePassTool(api, apiKey, "xbox_gamepass_pc", "List titles available in PC Game Pass.", "/gamepass/pc");
    makeGamePassTool(api, apiKey, "xbox_gamepass_ea_play", "List titles available through EA Play (included with Game Pass Ultimate).", "/gamepass/ea-play");
}
