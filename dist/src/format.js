import { getSetting } from "./types.js";
/**
 * xbl.io sometimes returns collections as a keyed object instead of an array.
 * Normalize both shapes (and the `{ people: [...] }` / `{ titles: [...] }` wrappers)
 * into a plain array.
 */
export function normalizeList(raw, ...keys) {
    if (Array.isArray(raw))
        return raw;
    if (raw && typeof raw === "object") {
        const obj = raw;
        for (const key of keys) {
            if (Array.isArray(obj[key]))
                return obj[key];
        }
        return Object.values(obj);
    }
    return [];
}
export function formatProfile(p) {
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
function friendTag(f) {
    return f.modernGamertag ?? f.gamertag ?? f.xuid;
}
export function formatFriend(f) {
    const status = f.presenceState === "Online" ? "🟢" : "⚫";
    let line = `${status} **${friendTag(f)}**`;
    if (f.presenceText)
        line += ` — ${f.presenceText}`;
    return line;
}
export function formatFriendsList(people) {
    if (people.length === 0)
        return "No friends found.";
    const online = people.filter((f) => f.presenceState === "Online");
    const offline = people.filter((f) => f.presenceState !== "Online");
    const lines = [`**Friends** (${online.length} online, ${offline.length} offline)`];
    if (online.length)
        lines.push("", ...online.map(formatFriend));
    if (offline.length)
        lines.push("", ...offline.map(formatFriend));
    return lines.join("\n");
}
export function formatSearchResult(person, gamertag) {
    if (!person)
        return `No player found for gamertag: **${gamertag}**`;
    const lines = [`**${person.gamertag ?? gamertag}**`];
    if (person.gamerScore)
        lines.push(`Gamerscore: ${parseInt(person.gamerScore).toLocaleString()}`);
    if (person.realName)
        lines.push(`Name: ${person.realName}`);
    if (person.presenceState)
        lines.push(`Status: ${person.presenceState}`);
    if (person.presenceText)
        lines.push(person.presenceText);
    lines.push(`XUID: \`${person.xuid}\``);
    return lines.join("\n");
}
export function formatAchievements(titles, limit = 25) {
    if (titles.length === 0)
        return "No achievement titles found.";
    const totalScore = titles.reduce((sum, t) => sum + (t.achievement?.currentGamerscore ?? 0), 0);
    const withProgress = titles.filter((t) => (t.achievement?.currentGamerscore ?? 0) > 0);
    const lines = [
        `**Achievements** — ${titles.length} titles, ${totalScore.toLocaleString()}G`,
        "",
        ...withProgress.slice(0, limit).map((t) => {
            const a = t.achievement;
            let line = `• **${t.name}**`;
            if (a) {
                const total = a.totalAchievements ? `/${a.totalAchievements}` : "";
                line += ` — ${a.currentAchievements ?? 0}${total} achievements, ${(a.currentGamerscore ?? 0).toLocaleString()}/${(a.totalGamerscore ?? 0).toLocaleString()}G`;
                if (a.progressPercentage != null)
                    line += ` (${a.progressPercentage}%)`;
            }
            return line;
        }),
    ];
    if (withProgress.length > limit)
        lines.push(`…and ${withProgress.length - limit} more with progress.`);
    return lines.join("\n");
}
export function formatGamePass(titles, label) {
    if (titles.length === 0)
        return `No titles found in ${label}.`;
    const named = titles.filter((t) => t.title);
    const lines = [`**${label}** — ${titles.length} titles available`];
    if (named.length) {
        lines.push("", ...named.slice(0, 40).map((t) => `• ${t.title}`));
        if (named.length > 40)
            lines.push(`…and ${named.length - 40} more.`);
    }
    else {
        lines.push("", "_The catalog API returned product IDs only. Use `xbox_game_details` to resolve a specific ID to a title._");
    }
    return lines.join("\n");
}
export function formatSession(s) {
    const lines = [];
    if (s.sessionName)
        lines.push(`**${s.sessionName}**`);
    if (s.titleId)
        lines.push(`Title ID: \`${s.titleId}\``);
    if (s.status)
        lines.push(`Status: ${s.status}`);
    if (s.members?.length) {
        lines.push(`Members: ${s.members.map((m) => m.gamertag ?? m.xuid ?? "unknown").join(", ")}`);
    }
    return lines.join("\n") || "Session (no details)";
}
export function formatSessions(sessions) {
    if (sessions.length === 0)
        return "No active sessions found.";
    return [`**Sessions** — ${sessions.length} active`, "", ...sessions.map(formatSession)].join("\n");
}
export function formatTitleHistory(titles, limit = 25) {
    if (titles.length === 0)
        return "No recently played titles found.";
    const lines = [`**Recently played** — ${titles.length} titles`, ""];
    for (const t of titles.slice(0, limit)) {
        let line = `• **${t.name}**`;
        const last = t.titleHistory?.lastTimePlayed;
        if (last)
            line += ` — last played ${last.slice(0, 10)}`;
        if (t.achievement?.currentGamerscore != null)
            line += ` (${t.achievement.currentGamerscore.toLocaleString()}G)`;
        lines.push(line);
    }
    if (titles.length > limit)
        lines.push(`…and ${titles.length - limit} more.`);
    return lines.join("\n");
}
export function formatMedia(items, kind, limit = 20) {
    if (items.length === 0)
        return `No ${kind} found.`;
    const lines = [`**${kind === "clips" ? "Game clips" : "Screenshots"}** — ${items.length} captured`, ""];
    for (const m of items.slice(0, limit)) {
        const when = m.dateTaken ?? m.datePublished;
        let line = `• ${m.titleName ?? m.titleId ?? "Unknown title"}`;
        if (when)
            line += ` — ${when.slice(0, 10)}`;
        if (m.uri)
            line += `\n  ${m.uri}`;
        lines.push(line);
    }
    if (items.length > limit)
        lines.push(`…and ${items.length - limit} more.`);
    return lines.join("\n");
}
export function formatClubs(clubs, limit = 20) {
    if (clubs.length === 0)
        return "No clubs found.";
    const lines = [`**Clubs** — ${clubs.length} found`, ""];
    for (const c of clubs.slice(0, limit)) {
        let line = `• **${c.name ?? c.id ?? "Unknown"}**`;
        if (c.membersCount != null)
            line += ` — ${c.membersCount.toLocaleString()} members`;
        if (c.id)
            line += ` (id: \`${c.id}\`)`;
        lines.push(line);
    }
    if (clubs.length > limit)
        lines.push(`…and ${clubs.length - limit} more.`);
    return lines.join("\n");
}
