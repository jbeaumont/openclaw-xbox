import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { xblFetch, XblApiError } from "./client.js";
import type { Profile, Presence, Achievement, GamePassTitle, Session } from "./types.js";

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
`.trim();

function formatProfile(p: Profile): string {
  const lines = [`**${p.gamertag}**`];
  if (p.gamerscore !== undefined) lines.push(`Gamerscore: ${p.gamerscore.toLocaleString()}`);
  if (p.accountTier) lines.push(`Tier: ${p.accountTier}`);
  if (p.location) lines.push(`Location: ${p.location}`);
  if (p.bio) lines.push(`Bio: ${p.bio}`);
  lines.push(`XUID: \`${p.xuid}\``);
  return lines.join("\n");
}

function formatPresenceRecord(p: Presence): string {
  const status = p.state === "Online" ? "🟢" : "⚫";
  let line = `${status} \`${p.xuid}\``;
  if (p.lastSeen?.titleName) line += ` — ${p.lastSeen.titleName}`;
  if (p.lastSeen?.deviceType) line += ` (${p.lastSeen.deviceType})`;
  return line;
}

function formatGamePassTitle(t: GamePassTitle): string {
  let line = `• **${t.title}**`;
  if (t.developers?.length) line += ` — ${t.developers[0]}`;
  return line;
}

function formatSession(s: Session): string {
  const lines: string[] = [];
  if (s.sessionName) lines.push(`**${s.sessionName}**`);
  if (s.titleId) lines.push(`Title ID: \`${s.titleId}\``);
  if (s.status) lines.push(`Status: ${s.status}`);
  if (s.members?.length) {
    lines.push(`Members: ${s.members.map(m => m.gamertag ?? m.xuid ?? "unknown").join(", ")}`);
  }
  return lines.join("\n") || "Session (no details)";
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
      "4. Run `/xbox setup` again to verify the connection.",
    ].join("\n");
  }

  try {
    const data = await xblFetch<{ profileUsers: Profile[] }>(apiKey, "/account");
    const profile = data.profileUsers?.[0];
    if (!profile) throw new Error("No profile returned");
    return [
      "**Xbox Live Setup**",
      "",
      `✅ API key configured`,
      `✅ Connection verified — signed in as **${profile.gamertag}** (G: ${(profile.gamerscore ?? 0).toLocaleString()})`,
      "",
      "All 11 tools are active. Type `/xbox help` to see available commands.",
    ].join("\n");
  } catch (err) {
    const detail = err instanceof XblApiError
      ? `API error ${err.status}: ${err.message}`
      : String(err);
    return [
      "**Xbox Live Setup**",
      "",
      `✅ API key configured`,
      `❌ Connection failed — ${detail}`,
      "",
      "Check that your API key is correct at **https://xbl.io**.",
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
  const data = await xblFetch<{ presenceRecords: Presence[] }>(apiKey, "/presence");
  const records = data.presenceRecords ?? [];
  if (records.length === 0) return "No friends presence data available.";

  const online = records.filter(r => r.state === "Online");
  const offline = records.filter(r => r.state !== "Online");

  const lines: string[] = [`**Friends** (${online.length} online, ${offline.length} offline)`];
  if (online.length) {
    lines.push("", ...online.map(formatPresenceRecord));
  }
  if (offline.length) {
    lines.push("", ...offline.map(formatPresenceRecord));
  }
  return lines.join("\n");
}

async function handleSearch(apiKey: string, gamertag: string): Promise<string> {
  if (!gamertag) return "Usage: `/xbox search <gamertag>`";
  const data = await xblFetch<{ profileUsers: Profile[] }>(
    apiKey,
    `/search/${encodeURIComponent(gamertag)}`
  );
  const profile = data.profileUsers?.[0];
  if (!profile) return `No player found for gamertag: **${gamertag}**`;
  return formatProfile(profile);
}

async function handleAchievements(apiKey: string): Promise<string> {
  const data = await xblFetch<{ achievements: Achievement[] }>(apiKey, "/achievements");
  const achievements = data.achievements ?? [];
  if (achievements.length === 0) return "No achievements found.";

  const unlocked = achievements.filter(a => a.isUnlocked);
  const total = achievements.length;
  const score = unlocked.reduce((sum, a) => sum + (a.gamerscore ?? 0), 0);

  const lines = [
    `**Achievements** — ${unlocked.length}/${total} unlocked, ${score.toLocaleString()}G`,
    "",
    ...unlocked.slice(0, 20).map(a =>
      `✅ **${a.name}**${a.gamerscore ? ` (${a.gamerscore}G)` : ""}${a.description ? ` — ${a.description}` : ""}`
    ),
  ];
  if (unlocked.length > 20) lines.push(`…and ${unlocked.length - 20} more.`);
  return lines.join("\n");
}

async function handleGamePass(apiKey: string, sub: string): Promise<string> {
  const pathMap: Record<string, { path: string; label: string }> = {
    "":    { path: "/gamepass/all",     label: "Game Pass" },
    "pc":  { path: "/gamepass/pc",      label: "PC Game Pass" },
    "ea":  { path: "/gamepass/ea-play", label: "EA Play" },
  };
  const target = pathMap[sub];
  if (!target) return `Unknown option \`${sub}\`. Try: /xbox gamepass, /xbox gamepass pc, /xbox gamepass ea`;

  const data = await xblFetch<{ titles: GamePassTitle[] }>(apiKey, target.path);
  const titles = data.titles ?? [];
  if (titles.length === 0) return `No titles found in ${target.label}.`;

  const lines = [
    `**${target.label}** — ${titles.length} titles`,
    "",
    ...titles.slice(0, 30).map(formatGamePassTitle),
  ];
  if (titles.length > 30) lines.push(`…and ${titles.length - 30} more.`);
  return lines.join("\n");
}

async function handleSessions(apiKey: string): Promise<string> {
  const data = await xblFetch<{ sessions: Session[] }>(apiKey, "/session");
  const sessions = data.sessions ?? [];
  if (sessions.length === 0) return "No active sessions found.";

  return [
    `**Sessions** — ${sessions.length} active`,
    "",
    ...sessions.map(formatSession),
  ].join("\n");
}

export function registerCommands(api: OpenClawPluginApi, apiKey: string | undefined) {
  api.registerCommand("xbox", {
    description: "Xbox Live — /xbox help for all commands",
    acceptsArgs: true,
    handler: async (args: string) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0]?.toLowerCase() ?? "";
      const rest = parts.slice(1).join(" ");

      if (!apiKey && sub !== "setup" && sub !== "help" && sub !== "") {
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
          case "help":
          case "":
            text = HELP_TEXT;
            break;
          default:
            text = `Unknown command \`/xbox ${sub}\`.\n\n${HELP_TEXT}`;
        }

        return { text };
      } catch (err) {
        const detail = err instanceof XblApiError
          ? `${err.status}: ${err.message}`
          : String(err);
        return { text: `❌ Xbox Live error — ${detail}` };
      }
    },
  });
}
