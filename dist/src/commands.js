import { xblFetch, XblApiError } from "./client.js";
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
function formatProfile(p) {
    const gamertag = getSetting(p, "Gamertag") ?? getSetting(p, "ModernGamertag") ?? "Unknown";
    const gamerscore = getSetting(p, "Gamerscore");
    const tier = getSetting(p, "AccountTier");
    const location = getSetting(p, "Location");
    const bio = getSetting(p, "Bio");
    const lines = [`**${gamertag}**`];
    if (gamerscore)
        lines.push(`Gamerscore: ${parseInt(gamerscore).toLocaleString()}`);
    if (tier)
        lines.push(`Tier: ${tier}`);
    if (location)
        lines.push(`Location: ${location}`);
    if (bio)
        lines.push(`Bio: ${bio}`);
    lines.push(`XUID: \`${p.id}\``);
    return lines.join("\n");
}
function formatPresenceRecord(p) {
    const status = p.state === "Online" ? "🟢" : "⚫";
    let line = `${status} \`${p.xuid}\``;
    if (p.lastSeen?.titleName)
        line += ` — ${p.lastSeen.titleName}`;
    if (p.lastSeen?.deviceType)
        line += ` (${p.lastSeen.deviceType})`;
    return line;
}
function formatGamePassTitle(t) {
    let line = `• **${t.title}**`;
    if (t.developers?.length)
        line += ` — ${t.developers[0]}`;
    return line;
}
function formatSession(s) {
    const lines = [];
    if (s.sessionName)
        lines.push(`**${s.sessionName}**`);
    if (s.titleId)
        lines.push(`Title ID: \`${s.titleId}\``);
    if (s.status)
        lines.push(`Status: ${s.status}`);
    if (s.members?.length) {
        lines.push(`Members: ${s.members.map(m => m.gamertag ?? m.xuid ?? "unknown").join(", ")}`);
    }
    return lines.join("\n") || "Session (no details)";
}
async function handleSetup(apiKey) {
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
        const data = await xblFetch(apiKey, "/account");
        const profile = data.profileUsers?.[0];
        if (!profile)
            throw new Error("No profile returned");
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
    }
    catch (err) {
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
async function handleProfile(apiKey) {
    const data = await xblFetch(apiKey, "/account");
    const profile = data.profileUsers?.[0];
    if (!profile)
        return "No profile data returned.";
    return formatProfile(profile);
}
async function handleFriends(apiKey) {
    const data = await xblFetch(apiKey, "/presence");
    const records = data.presenceRecords ?? [];
    if (records.length === 0)
        return "No friends presence data available.";
    const online = records.filter(r => r.state === "Online");
    const offline = records.filter(r => r.state !== "Online");
    const lines = [`**Friends** (${online.length} online, ${offline.length} offline)`];
    if (online.length) {
        lines.push("", ...online.map(formatPresenceRecord));
    }
    if (offline.length) {
        lines.push("", ...offline.map(formatPresenceRecord));
    }
    return lines.join("\n");
}
async function handleSearch(apiKey, gamertag) {
    if (!gamertag)
        return "Usage: `/xbox search <gamertag>`";
    const data = await xblFetch(apiKey, `/search/${encodeURIComponent(gamertag)}`);
    const profile = data.profileUsers?.[0];
    if (!profile)
        return `No player found for gamertag: **${gamertag}**`;
    return formatProfile(profile);
}
async function handleAchievements(apiKey) {
    const data = await xblFetch(apiKey, "/achievements");
    const achievements = data.achievements ?? [];
    if (achievements.length === 0)
        return "No achievements found.";
    const unlocked = achievements.filter(a => a.isUnlocked);
    const total = achievements.length;
    const score = unlocked.reduce((sum, a) => sum + (a.gamerscore ?? 0), 0);
    const lines = [
        `**Achievements** — ${unlocked.length}/${total} unlocked, ${score.toLocaleString()}G`,
        "",
        ...unlocked.slice(0, 20).map(a => `✅ **${a.name}**${a.gamerscore ? ` (${a.gamerscore}G)` : ""}${a.description ? ` — ${a.description}` : ""}`),
    ];
    if (unlocked.length > 20)
        lines.push(`…and ${unlocked.length - 20} more.`);
    return lines.join("\n");
}
async function handleGamePass(apiKey, sub) {
    const pathMap = {
        "": { path: "/gamepass/all", label: "Game Pass" },
        "pc": { path: "/gamepass/pc", label: "PC Game Pass" },
        "ea": { path: "/gamepass/ea-play", label: "EA Play" },
    };
    const target = pathMap[sub];
    if (!target)
        return `Unknown option \`${sub}\`. Try: /xbox gamepass, /xbox gamepass pc, /xbox gamepass ea`;
    const data = await xblFetch(apiKey, target.path);
    const titles = data.titles ?? [];
    if (titles.length === 0)
        return `No titles found in ${target.label}.`;
    const lines = [
        `**${target.label}** — ${titles.length} titles`,
        "",
        ...titles.slice(0, 30).map(formatGamePassTitle),
    ];
    if (titles.length > 30)
        lines.push(`…and ${titles.length - 30} more.`);
    return lines.join("\n");
}
async function handleSessions(apiKey) {
    const data = await xblFetch(apiKey, "/session");
    const sessions = data.sessions ?? [];
    if (sessions.length === 0)
        return "No active sessions found.";
    return [
        `**Sessions** — ${sessions.length} active`,
        "",
        ...sessions.map(formatSession),
    ].join("\n");
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerCommands(api, apiKey) {
    api.registerCommand({
        name: "xbox",
        description: "Xbox Live — /xbox help for all commands",
        acceptsArgs: true,
        requireAuth: false,
        handler: async (ctx) => {
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
                let text;
                switch (sub) {
                    case "setup":
                        text = await handleSetup(apiKey);
                        break;
                    case "profile":
                        text = await handleProfile(apiKey);
                        break;
                    case "friends":
                        text = await handleFriends(apiKey);
                        break;
                    case "search":
                        text = await handleSearch(apiKey, rest);
                        break;
                    case "achievements":
                        text = await handleAchievements(apiKey);
                        break;
                    case "gamepass":
                        text = await handleGamePass(apiKey, rest.toLowerCase());
                        break;
                    case "sessions":
                        text = await handleSessions(apiKey);
                        break;
                    case "help":
                    case "":
                        text = HELP_TEXT;
                        break;
                    default:
                        text = `Unknown command \`/xbox ${sub}\`.\n\n${HELP_TEXT}`;
                }
                return { text };
            }
            catch (err) {
                const detail = err instanceof XblApiError
                    ? `${err.status}: ${err.message}`
                    : String(err);
                return { text: `❌ Xbox Live error — ${detail}` };
            }
        },
    });
}
