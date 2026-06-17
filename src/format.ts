import type {
  Profile,
  Friend,
  GameTitle,
  GamePassTitle,
  Session,
  TitleHistoryEntry,
  MediaItem,
  Club,
} from "./types.js";
import { getSetting } from "./types.js";

/**
 * xbl.io sometimes returns collections as a keyed object instead of an array.
 * Normalize both shapes (and the `{ people: [...] }` / `{ titles: [...] }` wrappers)
 * into a plain array.
 */
export function normalizeList<T>(raw: unknown, ...keys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
    return Object.values(obj) as T[];
  }
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asRecord(v: unknown): Record<string, any> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export function formatProfile(p: Profile): string {
  const gamertag = getSetting(p, "Gamertag") ?? getSetting(p, "ModernGamertag") ?? "Unknown";
  const gamerscore = getSetting(p, "Gamerscore");
  const tier = getSetting(p, "AccountTier");
  const location = getSetting(p, "Location");
  const bio = getSetting(p, "Bio");
  const lines = [`🎮 **${gamertag}**`];
  if (gamerscore) lines.push(`⭐ Gamerscore: ${parseInt(gamerscore).toLocaleString()}`);
  if (tier) lines.push(`🏅 Tier: ${tier}`);
  if (location) lines.push(`📍 Location: ${location}`);
  if (bio) lines.push(`📝 Bio: ${bio}`);
  lines.push(`🆔 XUID: \`${p.id}\``);
  return lines.join("\n");
}

function friendTag(f: Friend): string {
  return f.modernGamertag ?? f.gamertag ?? f.xuid;
}

export function formatFriend(f: Friend): string {
  const status = f.presenceState === "Online" ? "🟢" : "⚫";
  let line = `${status} **${friendTag(f)}**`;
  if (f.presenceText) line += ` — ${f.presenceText}`;
  return line;
}

export function formatFriendsList(people: Friend[]): string {
  if (people.length === 0) return "No friends found.";
  const online = people.filter((f) => f.presenceState === "Online");
  const offline = people.filter((f) => f.presenceState !== "Online");
  const lines: string[] = [`👥 **Friends** (${online.length} online, ${offline.length} offline)`];
  if (online.length) lines.push("", ...online.map(formatFriend));
  if (offline.length) lines.push("", ...offline.map(formatFriend));
  return lines.join("\n");
}

export function formatSearchResult(person: Friend | undefined, gamertag: string): string {
  if (!person) return `🔍 No player found for gamertag: **${gamertag}**`;
  const lines = [`🎮 **${person.gamertag ?? gamertag}**`];
  if (person.gamerScore) lines.push(`⭐ Gamerscore: ${parseInt(person.gamerScore).toLocaleString()}`);
  if (person.realName) lines.push(`🙂 Name: ${person.realName}`);
  if (person.presenceState) {
    const dot = person.presenceState === "Online" ? "🟢" : "⚫";
    lines.push(`${dot} Status: ${person.presenceState}`);
  }
  if (person.presenceText) lines.push(person.presenceText);
  lines.push(`🆔 XUID: \`${person.xuid}\``);
  return lines.join("\n");
}

export function formatAchievements(titles: GameTitle[], limit = 25): string {
  if (titles.length === 0) return "No achievement titles found.";
  const totalScore = titles.reduce((sum, t) => sum + (t.achievement?.currentGamerscore ?? 0), 0);
  const withProgress = titles.filter((t) => (t.achievement?.currentGamerscore ?? 0) > 0);
  const lines = [
    `🏆 **Achievements** — ${titles.length} titles, ${totalScore.toLocaleString()}G`,
    "",
    ...withProgress.slice(0, limit).map((t) => {
      const a = t.achievement;
      let line = `• **${t.name}**`;
      if (a) {
        const total = a.totalAchievements ? `/${a.totalAchievements}` : "";
        line += ` — ${a.currentAchievements ?? 0}${total} achievements, ${(a.currentGamerscore ?? 0).toLocaleString()}/${(a.totalGamerscore ?? 0).toLocaleString()}G`;
        if (a.progressPercentage != null) line += ` (${a.progressPercentage}%)`;
      }
      return line;
    }),
  ];
  if (withProgress.length > limit) lines.push(`…and ${withProgress.length - limit} more with progress.`);
  return lines.join("\n");
}

export function formatAchievementList(raw: unknown): string {
  const items = normalizeList<unknown>(raw, "achievements");
  if (items.length === 0) return "No achievements found for that title.";
  const lines = [`🏆 **Achievements** — ${items.length}`, ""];
  for (const item of items.slice(0, 40)) {
    const a = asRecord(item);
    const unlocked = a.progressState === "Achieved" || a.unlocked === true;
    const dot = unlocked ? "✅" : "⬜";
    const rewards = Array.isArray(a.rewards) ? a.rewards : [];
    const gs = rewards.find((r: unknown) => asRecord(r).type === "Gamerscore");
    const gsValue = gs ? asRecord(gs).value : undefined;
    lines.push(`${dot} ${a.name ?? "Unknown"}${gsValue ? ` — ${gsValue}G` : ""}`);
  }
  if (items.length > 40) lines.push(`…and ${items.length - 40} more.`);
  return lines.join("\n");
}

export function formatGamePass(titles: GamePassTitle[], label: string): string {
  if (titles.length === 0) return `No titles found in ${label}.`;
  const named = titles.filter((t) => t.title);
  const lines = [`🎮 **${label}** — ${titles.length} titles available`];
  if (named.length) {
    lines.push("", ...named.slice(0, 40).map((t) => `• ${t.title}`));
    if (named.length > 40) lines.push(`…and ${named.length - 40} more.`);
  } else {
    lines.push("", "_The catalog API returned product IDs only. Use `xbox_game_details` to resolve a specific ID to a title._");
  }
  return lines.join("\n");
}

export function formatSession(s: Session): string {
  const lines: string[] = [];
  if (s.sessionName) lines.push(`🎟️ **${s.sessionName}**`);
  if (s.titleId) lines.push(`Title ID: \`${s.titleId}\``);
  if (s.status) lines.push(`Status: ${s.status}`);
  if (s.members?.length) {
    lines.push(`👤 Members: ${s.members.map((m) => m.gamertag ?? m.xuid ?? "unknown").join(", ")}`);
  }
  return lines.join("\n") || "Session (no details)";
}

export function formatSessions(sessions: Session[]): string {
  if (sessions.length === 0) return "No active sessions found.";
  return [`🎟️ **Sessions** — ${sessions.length} active`, "", ...sessions.map(formatSession)].join("\n\n");
}

export function formatTitleHistory(titles: TitleHistoryEntry[], limit = 25): string {
  if (titles.length === 0) return "No recently played titles found.";
  const lines = [`🕹️ **Recently played** — ${titles.length} titles`, ""];
  for (const t of titles.slice(0, limit)) {
    let line = `• **${t.name}**`;
    const last = t.titleHistory?.lastTimePlayed;
    if (last) line += ` — last played ${last.slice(0, 10)}`;
    if (t.achievement?.currentGamerscore != null) line += ` (${t.achievement.currentGamerscore.toLocaleString()}G)`;
    lines.push(line);
  }
  if (titles.length > limit) lines.push(`…and ${titles.length - limit} more.`);
  return lines.join("\n");
}

/** Best capture date across the variants screenshots/clips use. */
export function pickMediaDate(m: MediaItem): string | undefined {
  return m.dateTaken ?? m.dateRecorded ?? m.datePublished;
}

/**
 * Best download/stream link for a DVR item. Xbox returns links in arrays
 * (gameClipUris / screenshotUris / contentLocators), preferring a "Download"
 * entry; xbl.io may reshape these, so check every known variant and fall back
 * to a flat `uri`.
 */
export function pickMediaUri(m: MediaItem): string | undefined {
  const arrays = [m.gameClipUris, m.screenshotUris, m.contentLocators];
  for (const arr of arrays) {
    if (!arr?.length) continue;
    const download = arr.find(
      (u) => u.uri && (u.uriType === "Download" || u.locatorType === "Download")
    );
    const chosen = download ?? arr.find((u) => u.uri);
    if (chosen?.uri) return chosen.uri;
  }
  return m.uri;
}

export function formatMedia(items: MediaItem[], kind: "screenshots" | "clips", limit = 20): string {
  if (items.length === 0) return `No ${kind} found.`;
  const icon = kind === "clips" ? "🎬" : "📸";
  const lines = [`${icon} **${kind === "clips" ? "Game clips" : "Screenshots"}** — ${items.length} captured`, ""];
  for (const m of items.slice(0, limit)) {
    const when = pickMediaDate(m);
    const uri = pickMediaUri(m);
    let line = `• ${m.titleName ?? m.titleId ?? "Unknown title"}`;
    if (when) line += ` — ${when.slice(0, 10)}`;
    if (uri) line += `\n  🔗 ${uri}`;
    lines.push(line);
  }
  if (items.length > limit) lines.push(`…and ${items.length - limit} more.`);
  return lines.join("\n");
}

export function formatClubs(clubs: Club[], limit = 20): string {
  if (clubs.length === 0) return "No clubs found.";
  const lines = [`👥 **Clubs** — ${clubs.length} found`, ""];
  for (const c of clubs.slice(0, limit)) {
    let line = `• **${c.name ?? c.id ?? "Unknown"}**`;
    if (c.membersCount != null) line += ` — ${c.membersCount.toLocaleString()} members`;
    if (c.id) line += ` (id: \`${c.id}\`)`;
    lines.push(line);
  }
  if (clubs.length > limit) lines.push(`…and ${clubs.length - limit} more.`);
  return lines.join("\n");
}

export function formatClubDetails(raw: unknown): string {
  const r = asRecord(raw);
  const wrapped = Array.isArray(r.clubs) ? r.clubs[0] : Array.isArray(r.results) ? r.results[0] : raw;
  const c = asRecord(wrapped);
  const profile = asRecord(c.profile);
  const name = c.name ?? profile.name?.value ?? c.id ?? "Unknown club";
  const lines = [`👥 **${name}**`];
  const desc = c.description ?? profile.description?.value;
  if (desc) lines.push(`📝 ${desc}`);
  const members = c.membersCount ?? c.followersCount ?? profile.membersCount;
  if (members != null) lines.push(`👤 Members: ${Number(members).toLocaleString()}`);
  if (c.type) lines.push(`🏷️ Type: ${c.type}`);
  if (c.id) lines.push(`🆔 Club ID: \`${c.id}\``);
  return lines.length > 1 ? lines.join("\n") : `👥 Club details retrieved for \`${c.id ?? "unknown"}\`.`;
}

export function formatPresence(raw: unknown): string {
  const p = asRecord(raw);
  const state = p.state ?? p.presenceState;
  if (state === "Online") {
    const lines = ["🟢 **Online**"];
    const devices = Array.isArray(p.devices) ? p.devices : [];
    const playing: string[] = [];
    for (const d of devices) {
      const dev = asRecord(d);
      const titles = Array.isArray(dev.titles) ? dev.titles : [];
      for (const t of titles) {
        const title = asRecord(t);
        if (title.name) playing.push(`🎮 ${title.name}${dev.type ? ` on ${dev.type}` : ""}`);
      }
    }
    if (playing.length) lines.push(...playing);
    return lines.join("\n");
  }
  const lastSeen = asRecord(p.lastSeen);
  if (lastSeen.titleName || lastSeen.timestamp) {
    const when = lastSeen.timestamp ? ` (${String(lastSeen.timestamp).slice(0, 10)})` : "";
    const what = lastSeen.titleName ? ` playing ${lastSeen.titleName}` : "";
    return `⚫ **Offline** — last seen${what}${when}`;
  }
  return `⚫ **${state ?? "Offline"}**`;
}

export function formatGameDetails(raw: unknown, productId: string): string {
  const d = asRecord(raw);
  const product = asRecord(Array.isArray(d.products) ? d.products[0] : d);
  const title = product.title ?? product.name ?? d.title ?? d.name;
  if (!title) return `🛒 Details retrieved for product \`${productId}\`, but no title field was present.`;
  const lines = [`🛒 **${title}**`];
  const desc = product.description ?? d.description;
  if (desc) lines.push(`📝 ${String(desc).slice(0, 400)}`);
  if (product.publisherName ?? d.publisherName) lines.push(`🏢 Publisher: ${product.publisherName ?? d.publisherName}`);
  const price = product.price ?? d.price;
  if (price != null) lines.push(`💲 Price: ${price}`);
  lines.push(`🆔 Product ID: \`${productId}\``);
  return lines.join("\n");
}

export function formatSessionConfig(raw: unknown): string {
  const c = asRecord(raw);
  const lines = ["⚙️ **Session configuration**"];
  const constants = asRecord(asRecord(c.constants).system);
  const visibility = constants.visibility ?? c.visibility;
  const joinRestriction = constants.joinRestriction ?? c.joinRestriction;
  const maxMembers = constants.maxMembersCount ?? c.maxMembersCount;
  if (visibility) lines.push(`👁️ Visibility: ${visibility}`);
  if (joinRestriction) lines.push(`🔒 Join restriction: ${joinRestriction}`);
  if (maxMembers != null) lines.push(`👥 Max members: ${maxMembers}`);
  if (lines.length === 1) {
    const keys = Object.keys(c);
    if (keys.length) lines.push(`Configuration fields: ${keys.slice(0, 12).join(", ")}`);
    else return "⚙️ No session configuration available.";
  }
  return lines.join("\n");
}
