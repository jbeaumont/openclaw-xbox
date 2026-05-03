import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { xblFetch } from "../client.js";
import { EmptyParamSchema, XuidParamSchema, Presence } from "../types.js";

export function registerPresenceTools(api: OpenClawPluginApi, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_friends_presence",
      description: "Get the online presence of all Xbox Live friends — who is online, what they are playing, and on which device.",
      parameters: EmptyParamSchema,
      async execute() {
        const data = await xblFetch<{ presenceRecords: Presence[] }>(apiKey, "/presence");
        const records = data.presenceRecords ?? [];
        if (records.length === 0) return { content: [{ type: "text", text: "No friends presence data available." }] };
        return {
          content: [{
            type: "text",
            text: JSON.stringify(records, null, 2),
          }],
        };
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "xbox_player_presence",
      description: "Get the current online presence for a specific Xbox Live player by their XUID.",
      parameters: XuidParamSchema,
      async execute(_id, { xuid }) {
        const data = await xblFetch<{ presenceRecords: Presence[] }>(
          apiKey,
          `/${encodeURIComponent(xuid)}/presence`
        );
        const records = data.presenceRecords ?? [];
        if (records.length === 0) return { content: [{ type: "text", text: `No presence data found for XUID: ${xuid}` }] };
        return {
          content: [{
            type: "text",
            text: JSON.stringify(records[0], null, 2),
          }],
        };
      },
    },
    { optional: true }
  );
}
