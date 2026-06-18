import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeNotification,
  resolveNotifyOptions,
  DEFAULT_NOTIFY_STATE,
  type NotifyState,
  type NotifyOptions,
} from "../src/notifications.js";
import type { Friend } from "../src/types.js";

const NOW = new Date("2026-06-18T12:00:00Z");
const TODAY = "2026-06-18";
const OPTS: NotifyOptions = { friendOnline: true, newClips: true, maxPerDay: 10 };

function online(xuid: string, gamertag: string): Friend {
  return { xuid, gamertag, presenceState: "Online" };
}
function offline(xuid: string, gamertag: string): Friend {
  return { xuid, gamertag, presenceState: "Offline" };
}
function seeded(over: Partial<NotifyState> = {}): NotifyState {
  return { ...DEFAULT_NOTIFY_STATE, initialized: true, day: TODAY, ...over };
}

describe("computeNotification", () => {
  test("first run seeds silently (no alert for the existing online list)", () => {
    const { text, state } = computeNotification(
      { ...DEFAULT_NOTIFY_STATE },
      [online("1", "Ava"), offline("2", "Bo")],
      ["c1"],
      OPTS,
      NOW
    );
    assert.equal(text, undefined);
    assert.equal(state.initialized, true);
    assert.deepEqual(state.onlineXuids, ["1"]);
    assert.deepEqual(state.clipIds, ["c1"]);
  });

  test("alerts when a friend transitions offline -> online, with the off-switch reminder", () => {
    const prev = seeded({ onlineXuids: [] });
    const { text, state } = computeNotification(prev, [online("1", "Ava")], [], OPTS, NOW);
    assert.ok(text);
    assert.match(text!, /Ava\*\* is online/);
    assert.match(text!, /notifications\.enabled false/); // reminder included first time
    assert.equal(state.sentToday, 1);
    assert.equal(state.remindedDay, TODAY);
    assert.equal(state.pending.length, 1);
  });

  test("no alert when nothing changed", () => {
    const prev = seeded({ onlineXuids: ["1"] });
    const { text } = computeNotification(prev, [online("1", "Ava")], [], OPTS, NOW);
    assert.equal(text, undefined);
  });

  test("alerts on a new clip id", () => {
    const prev = seeded({ clipIds: ["c1"] });
    const { text } = computeNotification(prev, [], ["c1", "c2"], OPTS, NOW);
    assert.ok(text);
    assert.match(text!, /1 new game clip/);
  });

  test("respects maxPerDay cap (suppresses but still advances state)", () => {
    const prev = seeded({ onlineXuids: [], sentToday: 10 });
    const { text, state } = computeNotification(prev, [online("9", "Zed")], [], OPTS, NOW);
    assert.equal(text, undefined);
    assert.deepEqual(state.onlineXuids, ["9"]); // state advances so we don't re-alert later
  });

  test("off-switch reminder appears at most once per day", () => {
    const prev = seeded({ onlineXuids: [], sentToday: 1, remindedDay: TODAY });
    const { text } = computeNotification(prev, [online("1", "Ava")], [], OPTS, NOW);
    assert.ok(text);
    assert.match(text!, /Ava/);
    assert.doesNotMatch(text!, /notifications\.enabled false/); // no second reminder today
  });

  test("daily counter rolls over on a new day", () => {
    const prev = seeded({ day: "2026-06-17", sentToday: 10, onlineXuids: [] });
    const { text, state } = computeNotification(prev, [online("1", "Ava")], [], OPTS, NOW);
    assert.ok(text); // cap from yesterday doesn't apply today
    assert.equal(state.sentToday, 1);
  });

  test("honors friendOnline=false / newClips=false toggles", () => {
    const prev = seeded({ onlineXuids: [], clipIds: [] });
    const { text } = computeNotification(
      prev,
      [online("1", "Ava")],
      ["c1"],
      { friendOnline: false, newClips: false, maxPerDay: 10 },
      NOW
    );
    assert.equal(text, undefined);
  });
});

describe("resolveNotifyOptions", () => {
  test("defaults", () => {
    const { opts, intervalMs } = resolveNotifyOptions(undefined);
    assert.deepEqual(opts, { friendOnline: true, newClips: true, maxPerDay: 10 });
    assert.equal(intervalMs, 15 * 60_000);
  });
  test("floors interval at 5 minutes", () => {
    assert.equal(resolveNotifyOptions({ intervalMinutes: 1 }).intervalMs, 5 * 60_000);
  });
  test("respects explicit toggles", () => {
    const { opts } = resolveNotifyOptions({ friendOnline: false, maxPerDay: 3 });
    assert.equal(opts.friendOnline, false);
    assert.equal(opts.maxPerDay, 3);
  });
});
