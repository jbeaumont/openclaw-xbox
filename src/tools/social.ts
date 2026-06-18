import { xblFetch } from "../client.js";
import { EmptyParamSchema, Friend } from "../types.js";
import { normalizeList, formatRecentPlayers, formatActivity, formatAlerts } from "../format.js";
import { toolResult } from "../result.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerSocialTools(api: any, apiKey: string) {
  api.registerTool(
    {
      name: "xbox_recent_players",
      description: "List Xbox players the authenticated user has recently played with.",
      parameters: EmptyParamSchema,
      async execute() {
        const raw = await xblFetch<unknown>(apiKey, "/recent-players");
        return toolResult(formatRecentPlayers(normalizeList<Friend>(raw, "people")));
      },
    }
  );

  api.registerTool(
    {
      name: "xbox_activity_feed",
      description: "Get the authenticated user's Xbox activity feed — recent activity from friends (achievements, captures, posts).",
      parameters: EmptyParamSchema,
      async execute() {
        const raw = await xblFetch<unknown>(apiKey, "/activity/feed");
        return toolResult(formatActivity(normalizeList<unknown>(raw, "activityItems"), "Activity feed"));
      },
    }
  );

  api.registerTool(
    {
      name: "xbox_activity_history",
      description: "Get the authenticated user's own Xbox activity history — their achievements, captures, and posts.",
      parameters: EmptyParamSchema,
      async execute() {
        const raw = await xblFetch<unknown>(apiKey, "/activity/history");
        return toolResult(formatActivity(normalizeList<unknown>(raw, "activityItems"), "Activity history"));
      },
    }
  );

  api.registerTool(
    {
      name: "xbox_alerts",
      description: "Get the authenticated user's Xbox alerts and notifications (friend requests, messages, achievements).",
      parameters: EmptyParamSchema,
      async execute() {
        const raw = await xblFetch<unknown>(apiKey, "/alerts");
        return toolResult(formatAlerts(normalizeList<unknown>(raw, "alerts")));
      },
    }
  );
}
