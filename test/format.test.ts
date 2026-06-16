import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeList,
  formatProfile,
  formatFriendsList,
  formatSearchResult,
  formatAchievements,
  formatGamePass,
  formatSessions,
  formatTitleHistory,
  formatMedia,
  formatClubs,
  formatPresence,
  formatSessionConfig,
  formatClubDetails,
  formatGameDetails,
  formatAchievementList,
} from "../src/format.js";
import type { Profile, Friend, GameTitle } from "../src/types.js";

describe("normalizeList", () => {
  test("passes arrays through", () => {
    assert.deepEqual(normalizeList<number>([1, 2]), [1, 2]);
  });
  test("unwraps a named wrapper key", () => {
    assert.deepEqual(normalizeList<number>({ people: [1, 2] }, "people"), [1, 2]);
  });
  test("falls back to Object.values for keyed-object responses", () => {
    assert.deepEqual(normalizeList<number>({ a: 1, b: 2 }), [1, 2]);
  });
  test("returns [] for null/undefined", () => {
    assert.deepEqual(normalizeList(null), []);
    assert.deepEqual(normalizeList(undefined), []);
  });
});

describe("formatProfile", () => {
  const profile: Profile = {
    id: "2533274800000000",
    settings: [
      { id: "Gamertag", value: "TestPlayer" },
      { id: "Gamerscore", value: "12345" },
      { id: "AccountTier", value: "Gold" },
    ],
  };
  test("renders gamertag, gamerscore (localized), tier, and XUID", () => {
    const out = formatProfile(profile);
    assert.match(out, /\*\*TestPlayer\*\*/);
    assert.match(out, /Gamerscore: 12,345/);
    assert.match(out, /Tier: Gold/);
    assert.match(out, /2533274800000000/);
  });
});

describe("formatFriendsList", () => {
  const friends: Friend[] = [
    { xuid: "1", gamertag: "OnlineGuy", presenceState: "Online", presenceText: "Halo" },
    { xuid: "2", gamertag: "OfflineGuy", presenceState: "Offline" },
  ];
  test("splits online/offline and counts", () => {
    const out = formatFriendsList(friends);
    assert.match(out, /1 online, 1 offline/);
    assert.match(out, /🟢 \*\*OnlineGuy\*\* — Halo/);
    assert.match(out, /⚫ \*\*OfflineGuy\*\*/);
  });
  test("handles empty list", () => {
    assert.equal(formatFriendsList([]), "No friends found.");
  });
});

describe("formatSearchResult", () => {
  test("undefined person reports not found", () => {
    assert.match(formatSearchResult(undefined, "Ghost"), /No player found.*Ghost/);
  });
  test("renders found player", () => {
    const out = formatSearchResult({ xuid: "9", gamertag: "Found", gamerScore: "500" }, "Found");
    assert.match(out, /\*\*Found\*\*/);
    assert.match(out, /Gamerscore: 500/);
    assert.match(out, /XUID: `9`/);
  });
});

describe("formatAchievements", () => {
  const titles: GameTitle[] = [
    { titleId: "1", name: "GameA", achievement: { currentGamerscore: 100, totalGamerscore: 200, currentAchievements: 5, totalAchievements: 10, progressPercentage: 50 } },
    { titleId: "2", name: "GameB", achievement: { currentGamerscore: 0, totalGamerscore: 100 } },
  ];
  test("totals gamerscore and skips zero-progress titles", () => {
    const out = formatAchievements(titles);
    assert.match(out, /2 titles, 100G/);
    assert.match(out, /GameA/);
    assert.doesNotMatch(out, /GameB/);
    assert.match(out, /\(50%\)/);
  });
  test("empty list message", () => {
    assert.equal(formatAchievements([]), "No achievement titles found.");
  });
});

describe("formatGamePass", () => {
  test("lists named titles", () => {
    const out = formatGamePass([{ title: "Forza" }, { title: "Doom" }], "Game Pass");
    assert.match(out, /2 titles available/);
    assert.match(out, /• Forza/);
  });
  test("notes product-id-only responses", () => {
    const out = formatGamePass([{ id: "ABC123" } as never], "Game Pass");
    assert.match(out, /product IDs only/);
  });
});

describe("formatSessions / formatTitleHistory / formatMedia / formatClubs", () => {
  test("sessions", () => {
    assert.equal(formatSessions([]), "No active sessions found.");
    assert.match(formatSessions([{ sessionName: "Party", status: "active" }]), /Party/);
  });
  test("title history shows last played date", () => {
    const out = formatTitleHistory([{ titleId: "1", name: "GameX", titleHistory: { lastTimePlayed: "2026-06-01T10:00:00Z" } }]);
    assert.match(out, /GameX/);
    assert.match(out, /2026-06-01/);
  });
  test("media lists links", () => {
    const out = formatMedia([{ titleName: "GameY", uri: "https://example/clip", dateTaken: "2026-05-05T00:00:00Z" }], "clips");
    assert.match(out, /Game clips/);
    assert.match(out, /https:\/\/example\/clip/);
  });
  test("clubs list with member counts", () => {
    const out = formatClubs([{ id: "c1", name: "ClawClub", membersCount: 42 }]);
    assert.match(out, /ClawClub/);
    assert.match(out, /42 members/);
  });
});

describe("detail formatters (previously raw JSON)", () => {
  test("presence: online shows what they're playing", () => {
    const out = formatPresence({ state: "Online", devices: [{ type: "XboxSeriesX", titles: [{ name: "Halo Infinite" }] }] });
    assert.match(out, /🟢 \*\*Online\*\*/);
    assert.match(out, /Halo Infinite/);
    assert.match(out, /XboxSeriesX/);
  });
  test("presence: offline shows last seen", () => {
    const out = formatPresence({ state: "Offline", lastSeen: { titleName: "Forza", timestamp: "2026-06-01T12:00:00Z" } });
    assert.match(out, /⚫ \*\*Offline\*\*/);
    assert.match(out, /Forza/);
    assert.match(out, /2026-06-01/);
  });
  test("presence: unrecognized payload degrades gracefully", () => {
    assert.match(formatPresence({}), /Offline/);
  });
  test("session config extracts visibility/join restriction", () => {
    const out = formatSessionConfig({ constants: { system: { visibility: "open", joinRestriction: "followed", maxMembersCount: 16 } } });
    assert.match(out, /Visibility: open/);
    assert.match(out, /Join restriction: followed/);
    assert.match(out, /Max members: 16/);
  });
  test("club details renders name and members", () => {
    const out = formatClubDetails({ id: "c9", name: "Speedrunners", description: "Fast", membersCount: 100 });
    assert.match(out, /Speedrunners/);
    assert.match(out, /Members: 100/);
  });
  test("game details renders title; missing title notes the id", () => {
    assert.match(formatGameDetails({ products: [{ title: "Doom Eternal" }] }, "ABC"), /Doom Eternal/);
    assert.match(formatGameDetails({}, "XYZ"), /XYZ/);
  });
  test("achievement list marks unlocked vs locked", () => {
    const out = formatAchievementList({ achievements: [
      { name: "First Blood", progressState: "Achieved", rewards: [{ type: "Gamerscore", value: 20 }] },
      { name: "Hidden", progressState: "NotStarted" },
    ] });
    assert.match(out, /✅ First Blood — 20G/);
    assert.match(out, /⬜ Hidden/);
  });
});
