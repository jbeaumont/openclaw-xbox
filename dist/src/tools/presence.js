import { xblFetch } from "../client.js";
import { EmptyParamSchema, XuidParamSchema } from "../types.js";
import { toolResult } from "../result.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerPresenceTools(api, apiKey) {
    api.registerTool({
        name: "xbox_friends_presence",
        description: "Get the online presence of all Xbox Live friends -- who is online, what they are playing, and on which device.",
        parameters: EmptyParamSchema,
        async execute() {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const raw = await xblFetch(apiKey, "/friends");
            const rawPeople = raw?.people ?? raw;
            const people = Array.isArray(rawPeople)
                ? rawPeople
                : rawPeople && typeof rawPeople === "object"
                    ? Object.values(rawPeople)
                    : [];
            if (people.length === 0)
                return toolResult("No friends found.");
            const online = people.filter(p => p.presenceState === "Online");
            const offline = people.filter(p => p.presenceState !== "Online");
            const lines = [`Friends: ${online.length} online, ${offline.length} offline`];
            for (const p of online) {
                const tag = p.modernGamertag ?? p.gamertag ?? p.xuid;
                lines.push(`  ${tag} -- ${p.presenceText ?? "Online"}`);
            }
            if (offline.length > 0) {
                lines.push(`\nOffline (${offline.length}):`);
                for (const p of offline) {
                    const tag = p.modernGamertag ?? p.gamertag ?? p.xuid;
                    lines.push(`  ${tag}${p.presenceText ? ` -- last seen: ${p.presenceText}` : ""}`);
                }
            }
            return toolResult(lines.join("\n"));
        },
    });
    api.registerTool({
        name: "xbox_player_presence",
        description: "Get the current online presence for a specific Xbox Live player by their XUID.",
        parameters: XuidParamSchema,
        async execute(_id, { xuid }) {
            const data = await xblFetch(apiKey, `/${encodeURIComponent(xuid)}/presence`);
            return toolResult(JSON.stringify(data, null, 2));
        },
    });
}
