import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { xblFetch } from "../client.js";
import { EmptyParamSchema, Session } from "../types.js";

export function registerSessionTools(api: OpenClawPluginApi, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_sessions",
      description: "List the current Xbox Live sessions and parties — active multiplayer sessions, members, and title being played.",
      parameters: EmptyParamSchema,
      async execute() {
        const data = await xblFetch<{ sessions: Session[] }>(apiKey, "/session");
        const sessions = data.sessions ?? [];
        if (sessions.length === 0) return { content: [{ type: "text", text: "No active sessions found." }] };
        return {
          content: [{
            type: "text",
            text: JSON.stringify(sessions, null, 2),
          }],
        };
      },
    },
    { optional: true }
  );

  api.registerTool(
    {
      name: "xbox_session_config",
      description: "Get the configuration details for the current Xbox Live session — settings, privacy, and join restrictions.",
      parameters: EmptyParamSchema,
      async execute() {
        const data = await xblFetch<unknown>(apiKey, "/session/config");
        return {
          content: [{
            type: "text",
            text: JSON.stringify(data, null, 2),
          }],
        };
      },
    },
    { optional: true }
  );
}
