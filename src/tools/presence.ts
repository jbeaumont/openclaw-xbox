import { xblFetch } from "../client.js";
import { EmptyParamSchema, XuidParamSchema, Friend } from "../types.js";
import { toolResult } from "../result.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerPresenceTools(api: any, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_friends_presence",
      description: "Get the online presence of all Xbox Live friends — who is online, what they are playing, and on which device.",
      parameters: EmptyParamSchema,
      async execute() {
        const data = await xblFetch<{ people: Friend[] }>(apiKey, "/friends");
        const people = data.people ?? [];
        if (people.length === 0) return toolResult("No friends found.");
        return toolResult(JSON.stringify(people, null, 2));
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
        const data = await xblFetch<unknown>(apiKey, `/${encodeURIComponent(xuid)}/presence`);
        return toolResult(JSON.stringify(data, null, 2));
      },
    },
    { optional: true }
  );
}
