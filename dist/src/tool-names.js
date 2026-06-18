/**
 * Single source of truth for the plugin's tool names, split by capability.
 * Used for runtime risk metadata and asserted against the manifest by the
 * contract test, so the manifest, runtime, and tests cannot drift.
 */
export const READ_TOOLS = [
    "xbox_my_profile",
    "xbox_search_player",
    "xbox_friends_presence",
    "xbox_player_presence",
    "xbox_player_presence_by_gamertag",
    "xbox_my_achievements",
    "xbox_player_achievements",
    "xbox_gamepass_all",
    "xbox_gamepass_pc",
    "xbox_gamepass_ea_play",
    "xbox_sessions",
    "xbox_session_config",
    "xbox_my_title_history",
    "xbox_player_title_history",
    "xbox_screenshots",
    "xbox_game_clips",
    "xbox_search_clubs",
    "xbox_club_details",
    "xbox_game_details",
    "xbox_recent_players",
    "xbox_activity_feed",
    "xbox_activity_history",
    "xbox_alerts",
];
export const WRITE_TOOLS = ["xbox_add_friend", "xbox_remove_friend", "xbox_send_message"];
export const ALL_TOOLS = [...READ_TOOLS, ...WRITE_TOOLS];
/** Root config path for this plugin's settings. */
export const CONFIG_ROOT = "plugins.entries.openclaw-xbox.config";
