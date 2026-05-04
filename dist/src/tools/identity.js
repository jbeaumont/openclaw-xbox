import { xblFetch } from "../client.js";
import { EmptyParamSchema, GamertagParamSchema } from "../types.js";
import { toolResult } from "../result.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerIdentityTools(api, apiKey) {
    api.registerTool({
        name: "xbox_my_profile",
        description: "Get the authenticated Xbox Live user's own profile â€” gamertag, XUID, gamerscore, account tier, bio, and location.",
        parameters: EmptyParamSchema,
        async execute() {
            const data = await xblFetch(apiKey, "/account");
            const profile = data.profileUsers?.[0];
            if (!profile)
                return toolResult("No profile data returned.");
            return toolResult(JSON.stringify(profile, null, 2));
        },
    });
    api.registerTool({
        name: "xbox_search_player",
        description: "Look up an Xbox Live player by gamertag. Returns their XUID, gamerscore, and profile details.",
        parameters: GamertagParamSchema,
        async execute(_id, { gamertag }) {
            const data = await xblFetch(apiKey, `/search/${encodeURIComponent(gamertag)}`);
            const person = data.people?.[0];
            if (!person)
                return toolResult(`No player found for gamertag: ${gamertag}`);
            return toolResult(JSON.stringify(person, null, 2));
        },
    });
}
