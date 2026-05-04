import { xblFetch } from "../client.js";
import { EmptyParamSchema, GamePassTitle } from "../types.js";
import { toolResult } from "../result.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeGamePassTool(
  api: any,
  apiKey: string,
  name: string,
  description: string,
  path: string
) {
  api.registerTool(
    {
      name,
      description,
      parameters: EmptyParamSchema,
      async execute() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await xblFetch<any>(apiKey, path);
        const titles: GamePassTitle[] = Array.isArray(raw) ? raw : (raw && typeof raw === "object" ? Object.values(raw) : []);
        if (titles.length === 0) return toolResult("No titles found.");
        return toolResult(JSON.stringify(titles, null, 2));
      },
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerGamePassTools(api: any, apiKey: string) {
  makeGamePassTool(
    api, apiKey,
    "xbox_gamepass_all",
    "List all titles currently available in Xbox Game Pass.",
    "/gamepass/all"
  );

  makeGamePassTool(
    api, apiKey,
    "xbox_gamepass_pc",
    "List titles available in PC Game Pass.",
    "/gamepass/pc"
  );

  makeGamePassTool(
    api, apiKey,
    "xbox_gamepass_ea_play",
    "List titles available through EA Play (included with Game Pass Ultimate).",
    "/gamepass/ea-play"
  );
}
