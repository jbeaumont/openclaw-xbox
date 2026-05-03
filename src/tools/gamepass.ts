import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { xblFetch } from "../client.js";
import { EmptyParamSchema, GamePassTitle } from "../types.js";

function makeGamePassTool(
  api: OpenClawPluginApi,
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
        const data = await xblFetch<{ titles: GamePassTitle[] }>(apiKey, path);
        const titles = data.titles ?? [];
        if (titles.length === 0) return { content: [{ type: "text", text: "No titles found." }] };
        return {
          content: [{
            type: "text",
            text: JSON.stringify(titles, null, 2),
          }],
        };
      },
    },
    { optional: true }
  );
}

export function registerGamePassTools(api: OpenClawPluginApi, apiKey: string) {
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
