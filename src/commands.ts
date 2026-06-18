import { xblFetch, XblApiError } from "./client.js";
import type { Profile, Friend, GameTitle, GamePassTitle, Session } from "./types.js";
import { getSetting } from "./types.js";
import type { NotificationsConfig } from "./config.js";
import { resolveNotifyOptions } from "./notifications.js";
import {
  normalizeList,
  formatProfile,
  formatFriendsList,
  formatSearchResult,
  formatAchievements,
  formatGamePass,
  formatSessions,
} from "./format.js";

const HELP_TEXT = `
**Xbox Live** — available commands:

  /xbox setup               Check configuration and verify your API key
  /xbox profile             Your Xbox profile and gamerscore
  /xbox friends             Friends list with online status
  /xbox search <gamertag>   Look up any player by gamertag
  /xbox achievements        Your achievements across all titles
  /xbox gamepass            Full Game Pass catalog
  /xbox gamepass pc         PC Game Pass titles
  /xbox gamepass ea         EA Play titles
  /xbox sessions            Active sessions and party members
  /xbox notify              Proactive-alert status and how to toggle it
`.trim();

function handleNotify(notifications: NotificationsConfig | undefined): string {
  const enabled = notifications?.enabled === true;
  const setPath = "openclaw config set plugins.entries.openclaw-xbox.config.notifications";
  if (!enabled) {
    return [
      "🔕 **Xbox alerts: off**",
      "",
      "Get pinged when a friend comes online or you capture a clip. Alerts piggyback on your next message (low cost) and are capped per day.",
      "",
      "Enable:",
      "```",
      `${setPath}.enabled true`,
      "```",
    ].join("\n");
  }
  const { opts, intervalMs } = resolveNotifyOptions(notifications);
  const watching = [opts.friendOnline ? "friends online" : null, opts.newClips ? "new clips" : null]
    .filter(Boolean)
    .join(", ");
  return [
    "🔔 **Xbox alerts: on**",
    `Watching: ${watching || "nothing"} · every ${Math.round(intervalMs / 60000)} min · max ${opts.maxPerDay}/day`,
    "",
    "Turn off:",
    "```",
    `${setPath}.enabled false`,
    "```",
  ].join("\n");
}

async function handleSetup(apiKey: string | undefined): Promise<string> {
  if (!apiKey) {
    return [
      "**Xbox Live Setup**",
      "",
      "⚠️  No API key configured. Here's how to get started:",
      "",
      "1. Go to **https://xbl.io** and sign in with your Microsoft account",
      "2. Copy your API key from the dashboard",
      "3. Run this command:",
      "",
      "   ```",
      "   openclaw config set plugins.entries.openclaw-xbox.config.apiKey YOUR_KEY",
      "   ```",
      "",
      "   (Or set the `OPENCLAW_XBOX_API_KEY` environment variable.)",
      "",
      "4. Restart the gateway, then run `/xbox setup` again to verify.",
    ].join("\n");
  }

  try {
    const data = await xblFetch<{ profileUsers: Profile[] }>(apiKey, "/account", { ttlMs: 0 });
    const profile = data.profileUsers?.[0];
    if (!profile) throw new Error("No profile returned");
    const gamertag = getSetting(profile, "Gamertag") ?? getSetting(profile, "ModernGamertag") ?? "Unknown";
    const gamerscore = parseInt(getSetting(profile, "Gamerscore") ?? "0");
    return [
      "**Xbox Live Setup**",
      "",
      `✅ API key configured`,
      `✅ Connection verified — signed in as **${gamertag}** (G: ${gamerscore.toLocaleString()})`,
      "",
      "Type `/xbox help` to see available commands.",
    ].join("\n");
  } catch (err) {
    const detail = err instanceof XblApiError ? err.hint : String(err);
    return [
      "**Xbox Live Setup**",
      "",
      `✅ API key configured`,
      `❌ Connection failed — ${detail}`,
    ].join("\n");
  }
}

async function handleProfile(apiKey: string): Promise<string> {
  const data = await xblFetch<{ profileUsers: Profile[] }>(apiKey, "/account");
  const profile = data.profileUsers?.[0];
  if (!profile) return "No profile data returned.";
  return formatProfile(profile);
}

async function handleFriends(apiKey: string): Promise<string> {
  const raw = await xblFetch<unknown>(apiKey, "/friends");
  return formatFriendsList(normalizeList<Friend>(raw, "people"));
}

async function handleSearch(apiKey: string, gamertag: string): Promise<string> {
  if (!gamertag) return "Usage: `/xbox search <gamertag>`";
  const raw = await xblFetch<unknown>(apiKey, `/search/${encodeURIComponent(gamertag)}`);
  const people = normalizeList<Friend>(raw, "people");
  return formatSearchResult(people[0], gamertag);
}

async function handleAchievements(apiKey: string): Promise<string> {
  const raw = await xblFetch<unknown>(apiKey, "/achievements");
  return formatAchievements(normalizeList<GameTitle>(raw, "titles"));
}

async function handleGamePass(apiKey: string, sub: string): Promise<string> {
  const pathMap: Record<string, { path: string; label: string }> = {
    "":    { path: "/gamepass/all",     label: "Game Pass" },
    "pc":  { path: "/gamepass/pc",      label: "PC Game Pass" },
    "ea":  { path: "/gamepass/ea-play", label: "EA Play" },
  };
  const target = pathMap[sub];
  if (!target) return `Unknown option \`${sub}\`. Try: /xbox gamepass, /xbox gamepass pc, /xbox gamepass ea`;

  const raw = await xblFetch<unknown>(apiKey, target.path);
  return formatGamePass(normalizeList<GamePassTitle>(raw), target.label);
}

async function handleSessions(apiKey: string): Promise<string> {
  const raw = await xblFetch<unknown>(apiKey, "/session");
  return formatSessions(normalizeList<Session>(raw, "results"));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCommands(api: any, apiKey: string | undefined, notifications?: NotificationsConfig) {
  api.registerCommand({
    name: "xbox",
    description: "Xbox Live — /xbox help for all commands",
    acceptsArgs: true,
    requireAuth: false,
    agentPromptGuidance: [
      "Use xbox_my_profile to get the user's own Xbox profile, gamertag, or gamerscore.",
      "Use xbox_search_player to look up any player by gamertag.",
      "Use xbox_friends_presence to see who is online and what friends are playing.",
      "Use xbox_my_achievements to see the user's achievement progress across all titles.",
      "Use xbox_sessions to check active multiplayer sessions and party members.",
      "Use xbox_gamepass_all, xbox_gamepass_pc, or xbox_gamepass_ea_play for Game Pass catalog.",
    ],
    handler: async (ctx: { args?: string }) => {
      const args = ctx.args ?? "";
      const parts = args.trim().split(/\s+/);
      const sub = parts[0]?.toLowerCase() ?? "";
      const rest = parts.slice(1).join(" ");

      if (!apiKey && sub !== "setup" && sub !== "help" && sub !== "" && sub !== "notify") {
        return {
          text: "⚠️  Xbox Live is not configured yet. Run `/xbox setup` to get started.",
        };
      }

      try {
        let text: string;

        switch (sub) {
          case "setup":
            text = await handleSetup(apiKey);
            break;
          case "profile":
            text = await handleProfile(apiKey!);
            break;
          case "friends":
            text = await handleFriends(apiKey!);
            break;
          case "search":
            text = await handleSearch(apiKey!, rest);
            break;
          case "achievements":
            text = await handleAchievements(apiKey!);
            break;
          case "gamepass":
            text = await handleGamePass(apiKey!, rest.toLowerCase());
            break;
          case "sessions":
            text = await handleSessions(apiKey!);
            break;
          case "notify":
            text = handleNotify(notifications);
            break;
          case "help":
          case "":
            text = HELP_TEXT;
            break;
          default:
            text = `Unknown command \`/xbox ${sub}\`.\n\n${HELP_TEXT}`;
        }

        return { text };
      } catch (err) {
        const detail = err instanceof XblApiError ? err.hint : String(err);
        return { text: `❌ Xbox Live error — ${detail}` };
      }
    },
  });
}
