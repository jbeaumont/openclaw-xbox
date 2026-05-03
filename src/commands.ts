import { xblFetch, XblApiError } from "./client.js";
import type { Profile, Friend, GameTitle, GamePassTitle, Session } from "./types.js";
import { getSetting } from "./types.js";

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
  const gamertag = getSetting(p, "Gamertag") ?? getSetting(p, "ModernGamertag") ?? "Unknown";
  const gamerscore = getSetting(p, "Gamerscore");
  const tier = getSetting(p, "AccountTier");
  const location = getSetting(p, "Location");
  const bio = getSetting(p, "Bio");
  const lines = [`**${gamertag}**`];
  if (gamerscore) lines.push(`Gamerscore: ${parseInt(gamerscore).toLocaleString()}`);
  if (tier) lines.push(`Tier: ${tier}`);
  if (location) lines.push(`Location: ${location}`);
  if (bio) lines.push(`Bio: ${bio}`);
  lines.push(`XUID: \`${p.id}\``);
  return lines.join("\n");
}

function formatFriend(f: Friend): string {
  const status = f.presenceState === "Online" ? "🟢" : "⚫";
  let line = `${status} **${f.gamertag}**`;
  if (f.presenceText) line += ` — ${f.presenceText}`;
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
    const gamertag = getSetting(profile, "Gamertag") ?? getSetting(profile, "ModernGamertag") ?? "Unknown";
    const gamerscore = parseInt(getSetting(profile, "Gamerscore") ?? "0");
    return [
      "**Xbox Live Setup**",
      "",
      `✅ API key configured`,
      `✅ Connection verified — signed in as **${gamertag}** (G: ${gamerscore.toLocaleString()})`,
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
  const data = await xblFetch<{ people: Friend[] }>(apiKey, "/friends");
  const people = data.people ?? [];
  if (people.length === 0) return "No friends found.";

  const online = people.filter(f => f.presenceState === "Online");
  const offline = people.filter(f => f.presenceState !== "Online");

  const lines: string[] = [`**Friends** (${online.length} online, ${offline.length} offline)`];
  if (online.length) lines.push("", ...online.map(formatFriend));
  if (offline.length) lines.push("", ...offline.map(formatFriend));
  return lines.join("\n");
}

async function handleSearch(apiKey: string, gamertag: string): Promise<string> {
  if (!gamertag) return "Usage: `/xbox search <gamertag>`";
  const data = await xblFetch<{ people: Friend[] }>(
    apiKey,
    `/search/${encodeURIComponent(gamertag)}`
  );
  const person = data.people?.[0];
  if (!person) return `No player found for gamertag: **${gamertag}**`;
  const lines = [`**${person.gamertag ?? gamertag}**`];
  if (person.gamerScore) lines.push(`Gamerscore: ${parseInt(person.gamerScore).toLocaleString()}`);
  if (person.realName) lines.push(`Name: ${person.realName}`);
  if (person.presenceState) lines.push(`Status: ${person.presenceState}`);
  if (person.presenceText) lines.push(person.presenceText);
  lines.push(`XUID: \`${person.xuid}\``);
  return lines.join("\n");
}

async function handleAchievements(apiKey: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await xblFetch<any>(apiKey, "/achievements");
  let titles: GameTitle[];
  if (Array.isArray(raw)) {
    titles = raw;
  } else if (raw?.titles && Array.isArray(raw.titles)) {
    titles = raw.titles;
  } else if (raw && typeof raw === "object") {
    titles = Object.values(raw) as GameTitle[];
  } else {
    titles = [];
  }
  if (titles.length === 0) return "No achievement titles found.";

  const totalScore = titles.reduce((sum, t) => sum + (t.achievement?.currentGamerscore ?? 0), 0);
  const lines = [
    `**Achievements** — ${titles.length} titles, ${totalScore.toLocaleString()}G`,
    "",
    ...titles.filter(t => (t.achievement?.currentGamerscore ?? 0) > 0).slice(0, 25).map(t => {
      const a = t.achievement;
      let line = `• **${t.name}**`;
      if (a) {
        const total = a.totalAchievements ? `/${a.totalAchievements}` : "";
        line += ` — ${a.currentAchievements ?? 0}${total} achievements, ${(a.currentGamerscore ?? 0).toLocaleString()}/${(a.totalGamerscore ?? 0).toLocaleString()}G`;
      }
      if (a?.progressPercentage != null) line += ` (${a.progressPercentage}%)`;
      return line;
    }),
  ];
  const withProgress = titles.filter(t => (t.achievement?.currentGamerscore ?? 0) > 0);
  if (withProgress.length > 25) lines.push(`…and ${withProgress.length - 25} more with progress.`);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await xblFetch<any>(apiKey, target.path);
  const all: GamePassTitle[] = Array.isArray(raw) ? raw : (raw && typeof raw === "object" ? Object.values(raw) : []);
  if (all.length === 0) return `No titles found in ${target.label}.`;

  return [
    `**${target.label}** — ${all.length} titles available`,
    "",
    "_The catalog API returns product IDs only. Ask the agent to look up a specific game by name or ID._",
  ].join("\n");
}

async function handleSessions(apiKey: string): Promise<string> {
  const data = await xblFetch<{ results: Session[] }>(apiKey, "/session");
  const sessions = data.results ?? [];
  if (sessions.length === 0) return "No active sessions found.";

  return [
    `**Sessions** — ${sessions.length} active`,
    "",
    ...sessions.map(formatSession),
  ].join("\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCommands(api: any, apiKey: string | undefined) {
  api.registerCommand({
    name: "xbox",
    description: "Xbox Live — /xbox help for all commands",
    acceptsArgs: true,
    requireAuth: false,
    handler: async (ctx: { args?: string }) => {
      const args = ctx.args ?? "";
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
