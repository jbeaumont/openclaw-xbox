import { xblFetch } from "../client.js";
import { EmptyParamSchema, GamertagParamSchema, Profile, Friend } from "../types.js";
import { normalizeList, formatProfile, formatSearchResult } from "../format.js";
import { toolResult } from "../result.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerIdentityTools(api: any, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_my_profile",
      description: "Get the authenticated Xbox Live user's own profile — gamertag, XUID, gamerscore, account tier, bio, and location.",
      parameters: EmptyParamSchema,
      async execute() {
        const data = await xblFetch<{ profileUsers: Profile[] }>(apiKey, "/account");
        const profile = data.profileUsers?.[0];
        if (!profile) return toolResult("No profile data returned.");
        return toolResult(formatProfile(profile));
      },
    }
  );

  api.registerTool(
    {
      name: "xbox_search_player",
      description: "Look up an Xbox Live player by gamertag. Returns their XUID, gamerscore, and profile details.",
      parameters: GamertagParamSchema,
      async execute(_id: string, { gamertag }: { gamertag: string }) {
        const raw = await xblFetch<unknown>(apiKey, `/search/${encodeURIComponent(gamertag)}`);
        const people = normalizeList<Friend>(raw, "people");
        return toolResult(formatSearchResult(people[0], gamertag));
      },
    }
  );
}
