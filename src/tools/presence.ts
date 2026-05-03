import { xblFetch } from "../client.js";
import { EmptyParamSchema, XuidParamSchema, Presence } from "../types.js";
import { toolResult } from "../result.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerPresenceTools(api: any, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_friends_presence",
      description: "Get the online presence of all Xbox Live friends — who is online, what they are playing, and on which device.",
      parameters: EmptyParamSchema,
      async execute() {
        const data = await xblFetch<{ presenceRecords: Presence[] }>(apiKey, "/presence");
        const records = data.presenceRecords ?? [];
        if (records.length === 0) return toolResult("No friends presence data available.");
        return toolResult(JSON.stringify(records, null, 2));
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "xbox_player_presence",
      description: "Get the current online presence for a specific Xbox Live player by their XUID.",
      parameters: XuidParamSchema,
      async execute(_id: string, { xuid }: { xuid: string }) {
        const data = await xblFetch<{ presenceRecords: Presence[] }>(
          apiKey,
          `/${encodeURIComponent(xuid)}/presence`
        );
        const records = data.presenceRecords ?? [];
        if (records.length === 0) return toolResult(`No presence data found for XUID: ${xuid}`);
        return toolResult(JSON.stringify(records[0], null, 2));
      },
    },
    { optional: true }
  );
}
