import { xblFetch } from "../client.js";
import { EmptyParamSchema, Session } from "../types.js";
import { normalizeList, formatSessions, formatSessionConfig } from "../format.js";
import { toolResult } from "../result.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerSessionTools(api: any, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_sessions",
      description: "List the current Xbox Live sessions and parties — active multiplayer sessions, members, and title being played.",
      parameters: EmptyParamSchema,
      async execute() {
        const raw = await xblFetch<unknown>(apiKey, "/session");
        return toolResult(formatSessions(normalizeList<Session>(raw, "results")));
      },
    }
  );

  api.registerTool(
    {
      name: "xbox_session_config",
      description: "Get the configuration details for the current Xbox Live session — settings, privacy, and join restrictions.",
      parameters: EmptyParamSchema,
      async execute() {
        const data = await xblFetch<unknown>(apiKey, "/session/config");
        return toolResult(formatSessionConfig(data));
      },
    }
  );
}
