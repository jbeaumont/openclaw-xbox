import { xblFetch } from "../client.js";
import { EmptyParamSchema, XuidParamSchema, GamertagParamSchema, Friend } from "../types.js";
import { normalizeList, formatFriendsList, formatPresence } from "../format.js";
import { toolResult } from "../result.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerPresenceTools(api: any, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_friends_presence",
      description: "Get the online presence of all Xbox Live friends — who is online, what they are playing, and on which device.",
      parameters: EmptyParamSchema,
      async execute() {
        const raw = await xblFetch<unknown>(apiKey, "/friends");
        return toolResult(formatFriendsList(normalizeList<Friend>(raw, "people")));
      },
    }
  );

  api.registerTool(
    {
      name: "xbox_player_presence",
      description: "Get the current online presence for a specific Xbox Live player by their XUID.",
      parameters: XuidParamSchema,
      async execute(_id: string, { xuid }: { xuid: string }) {
        const data = await xblFetch<unknown>(apiKey, `/${encodeURIComponent(xuid)}/presence`);
        return toolResult(formatPresence(data));
      },
    }
  );

  api.registerTool(
    {
      name: "xbox_player_presence_by_gamertag",
      description: "Convenience tool: look up a player by gamertag and return their current presence in one step.",
      parameters: GamertagParamSchema,
      async execute(_id: string, { gamertag }: { gamertag: string }) {
        const searchRaw = await xblFetch<unknown>(apiKey, `/search/${encodeURIComponent(gamertag)}`);
        const person = normalizeList<Friend>(searchRaw, "people")[0];
        if (!person?.xuid) return toolResult(`No player found for gamertag: ${gamertag}`);
        const data = await xblFetch<unknown>(apiKey, `/${encodeURIComponent(person.xuid)}/presence`);
        return toolResult(`${person.gamertag ?? gamertag}\n${formatPresence(data)}`);
      },
    }
  );
}
