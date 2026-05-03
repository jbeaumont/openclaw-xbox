import { Type, Static } from "@sinclair/typebox";

// --- Shared primitives ---

export const ProfileSchema = Type.Object({
  id: Type.String(),
  settings: Type.Array(Type.Object({ id: Type.String(), value: Type.String() })),
  isSponsoredUser: Type.Optional(Type.Boolean()),
});
export type Profile = Static<typeof ProfileSchema>;

export function getSetting(profile: Profile, settingId: string): string | undefined {
  return profile.settings.find(s => s.id === settingId)?.value;
}

export const FriendSchema = Type.Object({
  xuid: Type.String(),
  gamertag: Type.Optional(Type.String()),
  modernGamertag: Type.Optional(Type.String()),
  gamerScore: Type.Optional(Type.String()),
  realName: Type.Optional(Type.String()),
  presenceState: Type.Optional(Type.String()),
  presenceText: Type.Optional(Type.String()),
  isFavorite: Type.Optional(Type.Boolean()),
  displayPicRaw: Type.Optional(Type.String()),
});
export type Friend = Static<typeof FriendSchema>;

export const GameTitleSchema = Type.Object({
  titleId: Type.String(),
  name: Type.String(),
  type: Type.Optional(Type.String()),
  devices: Type.Optional(Type.Array(Type.String())),
  achievement: Type.Optional(Type.Object({
    currentAchievements: Type.Optional(Type.Number()),
    totalAchievements: Type.Optional(Type.Number()),
    currentGamerscore: Type.Optional(Type.Number()),
    totalGamerscore: Type.Optional(Type.Number()),
    progressPercentage: Type.Optional(Type.Number()),
  })),
  titleHistory: Type.Optional(Type.Object({
    lastTimePlayed: Type.Optional(Type.String()),
  })),
});
export type GameTitle = Static<typeof GameTitleSchema>;

export const GamePassTitleSchema = Type.Object({
  id: Type.Optional(Type.String()),
  siglId: Type.Optional(Type.String()),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  imageUrl: Type.Optional(Type.String()),
});
export type GamePassTitle = Static<typeof GamePassTitleSchema>;

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
export type Session = Static<typeof SessionSchema>;

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
