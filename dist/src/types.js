import { Type } from "@sinclair/typebox";
// --- Shared primitives ---
export const ProfileSchema = Type.Object({
    id: Type.String(),
    settings: Type.Array(Type.Object({ id: Type.String(), value: Type.String() })),
    isSponsoredUser: Type.Optional(Type.Boolean()),
});
export function getSetting(profile, settingId) {
    return profile.settings.find(s => s.id === settingId)?.value;
}
export const PresenceSchema = Type.Object({
    xuid: Type.String(),
    state: Type.String(),
    lastSeen: Type.Optional(Type.Object({
        deviceType: Type.Optional(Type.String()),
        titleId: Type.Optional(Type.String()),
        titleName: Type.Optional(Type.String()),
        timestamp: Type.Optional(Type.String()),
    })),
});
export const AchievementSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    isUnlocked: Type.Optional(Type.Boolean()),
    timeUnlocked: Type.Optional(Type.String()),
    gamerscore: Type.Optional(Type.Number()),
    rarity: Type.Optional(Type.Object({
        currentCategory: Type.Optional(Type.String()),
        currentPercentage: Type.Optional(Type.Number()),
    })),
});
export const GamePassTitleSchema = Type.Object({
    id: Type.Optional(Type.String()),
    title: Type.String(),
    developers: Type.Optional(Type.Array(Type.String())),
    publishers: Type.Optional(Type.Array(Type.String())),
    categories: Type.Optional(Type.Array(Type.String())),
    images: Type.Optional(Type.Array(Type.Object({
        type: Type.Optional(Type.String()),
        url: Type.Optional(Type.String()),
    }))),
});
export const SessionSchema = Type.Object({
    sessionId: Type.Optional(Type.String()),
    sessionName: Type.Optional(Type.String()),
    titleId: Type.Optional(Type.String()),
    members: Type.Optional(Type.Array(Type.Object({
        xuid: Type.Optional(Type.String()),
        gamertag: Type.Optional(Type.String()),
    }))),
    status: Type.Optional(Type.String()),
});
// --- Tool parameter schemas ---
export const XuidParamSchema = Type.Object({
    xuid: Type.String({ description: "Xbox User ID (XUID) of the player" }),
});
export const GamertagParamSchema = Type.Object({
    gamertag: Type.String({ description: "Xbox gamertag to search for" }),
});
export const PlayerAchievementsParamSchema = Type.Object({
    xuid: Type.String({ description: "Xbox User ID (XUID) of the player" }),
    titleId: Type.Optional(Type.String({ description: "Limit results to a specific title ID" })),
});
export const EmptyParamSchema = Type.Object({});
