import { xblFetch } from "../client.js";
import { EmptyParamSchema } from "../types.js";
import { toolResult } from "../result.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerSessionTools(api, apiKey) {
    api.registerTool({
        name: "xbox_sessions",
        description: "List the current Xbox Live sessions and parties â€” active multiplayer sessions, members, and title being played.",
        parameters: EmptyParamSchema,
        async execute() {
            const data = await xblFetch(apiKey, "/session");
            const sessions = data.results ?? [];
            if (sessions.length === 0)
                return toolResult("No active sessions found.");
            return toolResult(JSON.stringify(sessions, null, 2));
        },
    });
    api.registerTool({
        name: "xbox_session_config",
        description: "Get the configuration details for the current Xbox Live session â€” settings, privacy, and join restrictions.",
        parameters: EmptyParamSchema,
        async execute() {
            const data = await xblFetch(apiKey, "/session/config");
            return toolResult(JSON.stringify(data, null, 2));
        },
    });
}
