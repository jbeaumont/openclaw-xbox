---
name: xbox-live
description: Look up Xbox Live profiles, friends, achievements, Game Pass, title history, DVR media, clubs, and sessions via xbl.io
metadata: {"openclaw": {"requires": {"config": ["plugins.entries.openclaw-xbox.config.apiKey"]}}}
---

You have access to Xbox Live data via the xbl.io API. Use these tools proactively when the user asks about gaming, Xbox, achievements, friends, or Game Pass — don't wait for them to use a slash command.

## When to use each tool

- **xbox_my_profile** — the user's own profile, gamertag, gamerscore, or account tier
- **xbox_search_player** — look up another player by gamertag (returns their XUID)
- **xbox_friends_presence** — who is online, what friends are playing, the friends list
- **xbox_player_presence** — a specific player's current status (needs XUID)
- **xbox_player_presence_by_gamertag** — a player's status when you only have a gamertag
- **xbox_my_achievements** / **xbox_player_achievements** — achievement progress
- **xbox_my_title_history** / **xbox_player_title_history** — recently played games
- **xbox_screenshots** / **xbox_game_clips** — the user's captured DVR media
- **xbox_gamepass_all** / **xbox_gamepass_pc** / **xbox_gamepass_ea_play** — Game Pass catalog
- **xbox_game_details** — resolve a Game Pass product ID to a title
- **xbox_search_clubs** / **xbox_club_details** — Xbox Clubs
- **xbox_sessions** / **xbox_session_config** — active sessions and join settings

## Write tools (only if enabled)

`xbox_add_friend`, `xbox_remove_friend`, and `xbox_send_message` change state. They are
only available when the user has opted in. Always confirm the exact action with the user
first, then call the tool with `confirm: true`. Never call them speculatively.

## Tips

- To act on a player you only know by gamertag, call **xbox_search_player** first to get
  their XUID, then use presence/achievement/title-history tools with that XUID.
- Achievements come back as per-title summaries (gamerscore + progress %), not individual
  achievement lists, unless you pass a specific title ID.
- The Game Pass catalog often returns product IDs only — use **xbox_game_details** to
  resolve a specific ID to a name.
- If the user has not configured an API key, direct them to run `/xbox setup`.
