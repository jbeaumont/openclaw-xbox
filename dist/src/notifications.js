import { promises as fs } from "node:fs";
import path from "node:path";
import { xblFetch } from "./client.js";
import { normalizeList } from "./format.js";
export const DEFAULT_NOTIFY_STATE = {
    initialized: false,
    onlineXuids: [],
    clipIds: [],
    day: "",
    sentToday: 0,
    pending: [],
};
const DISABLE_HINT = "Xbox alerts are on — turn them off with `openclaw config set plugins.entries.openclaw-xbox.config.notifications.enabled false`.";
function utcDay(now) {
    return now.toISOString().slice(0, 10);
}
function friendLabel(f) {
    return f.modernGamertag ?? f.gamertag ?? f.xuid;
}
/** Resolve config to concrete options, applying defaults + the 5-minute floor. */
export function resolveNotifyOptions(cfg) {
    return {
        opts: {
            friendOnline: cfg?.friendOnline !== false,
            newClips: cfg?.newClips !== false,
            maxPerDay: cfg?.maxPerDay ?? 10,
        },
        intervalMs: Math.max(5, cfg?.intervalMinutes ?? 15) * 60_000,
    };
}
/**
 * Pure detection + coalescing + capping. Given the previous state and the
 * current friends/clip snapshot, returns any alert text plus the next state.
 * Does no IO. First run (uninitialized) seeds silently so we never alert on the
 * whole existing online list / clip backlog. The off-switch reminder is appended
 * at most once per day.
 */
export function computeNotification(prev, friends, clipIds, opts, now) {
    const today = utcDay(now);
    const onlineNow = friends.filter((f) => f.presenceState === "Online").map((f) => f.xuid);
    const sentToday = prev.day === today ? prev.sentToday : 0;
    let remindedDay = prev.day === today ? prev.remindedDay : undefined;
    const baseState = {
        initialized: true,
        onlineXuids: onlineNow,
        clipIds,
        day: today,
        sentToday,
        remindedDay,
        pending: prev.pending ?? [],
    };
    // First run seeds silently.
    if (!prev.initialized)
        return { state: baseState };
    const events = [];
    if (opts.friendOnline) {
        const prevOnline = new Set(prev.onlineXuids);
        for (const f of friends) {
            if (f.presenceState === "Online" && !prevOnline.has(f.xuid)) {
                const what = f.presenceText ? ` — ${f.presenceText}` : "";
                events.push(`🟢 **${friendLabel(f)}** is online${what}`);
            }
        }
    }
    if (opts.newClips) {
        const prevClips = new Set(prev.clipIds);
        const newCount = clipIds.filter((id) => !prevClips.has(id)).length;
        if (newCount > 0)
            events.push(`🎬 ${newCount} new game clip${newCount === 1 ? "" : "s"} captured`);
    }
    // No real transition, or daily cap reached: advance state, surface nothing.
    if (events.length === 0 || sentToday >= opts.maxPerDay)
        return { state: baseState };
    const lines = ["🎮 **Xbox update**", ...events];
    if (remindedDay !== today) {
        lines.push("", `_${DISABLE_HINT}_`);
        remindedDay = today;
    }
    const text = lines.join("\n");
    const pending = [...(prev.pending ?? []), text].slice(-5);
    return { text, state: { ...baseState, sentToday: sentToday + 1, remindedDay, pending } };
}
/** Stable id for a clip across the field-name variants xbl.io may use. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clipId(c) {
    return c?.gameClipId ?? c?.contentId ?? c?.id ?? undefined;
}
async function readState(file) {
    try {
        return { ...DEFAULT_NOTIFY_STATE, ...JSON.parse(await fs.readFile(file, "utf8")) };
    }
    catch {
        return { ...DEFAULT_NOTIFY_STATE };
    }
}
async function writeState(file, state) {
    try {
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, JSON.stringify(state));
    }
    catch {
        // best-effort; a failed write just means we re-seed next tick
    }
}
/**
 * Background service: polls xbl.io on an interval, detects friend-online and
 * new-clip transitions, and enqueues a single coalesced next-turn injection into
 * the user's most recent session (≈ zero ambient token cost). Registered only
 * when notifications are enabled.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createNotificationService(api, apiKey, cfg, holder) {
    const { opts, intervalMs } = resolveNotifyOptions(cfg);
    let timer;
    let stateFile = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function tick(ctx) {
        try {
            const state = await readState(stateFile);
            const friends = normalizeList(await xblFetch(apiKey, "/friends", { ttlMs: 0 }), "people");
            let clipIds = state.clipIds;
            if (opts.newClips) {
                const raw = await xblFetch(apiKey, "/dvr/gameclips", { ttlMs: 0 });
                clipIds = normalizeList(raw, "values", "gameClips")
                    .map((c) => clipId(c))
                    .filter((id) => !!id);
            }
            const { state: next } = computeNotification(state, friends, clipIds, opts, new Date());
            if (holder.lastSessionKey && next.pending.length) {
                await api.enqueueNextTurnInjection?.({
                    sessionKey: holder.lastSessionKey,
                    text: next.pending.join("\n\n"),
                    idempotencyKey: `xbox-notify-${next.day}-${next.sentToday}`,
                });
                next.pending = [];
            }
            await writeState(stateFile, next);
        }
        catch (err) {
            ctx?.logger?.warn?.(`openclaw-xbox: notifications tick failed — ${String(err)}`);
        }
    }
    return {
        id: "openclaw-xbox-notifications",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async start(ctx) {
            stateFile = path.join(ctx.stateDir ?? ".", "openclaw-xbox-notifications.json");
            await tick(ctx);
            timer = setInterval(() => void tick(ctx), intervalMs);
            timer.unref?.();
        },
        async stop() {
            if (timer)
                clearInterval(timer);
            timer = undefined;
        },
    };
}
