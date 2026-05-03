---
name: xbox-live
description: Look up Xbox Live profiles, friends, achievements, Game Pass, and sessions via xbl.io
metadata: {"openclaw": {"requires": {"config": ["plugins.entries.openclaw-xbox.config.apiKey"]}}}
---

You have access to Xbox Live data via the xbl.io API. Use these tools proactively when the user asks about gaming, Xbox, achievements, friends, or Game Pass — don't wait for them to use a slash command.

## When to use each tool

- **xbox_my_profile** — user asks about their own Xbox profile, gamertag, gamerscore, or account tier
- **xbox_search_player** — user mentions a gamertag or wants to look up another player
- **xbox_friends_presence** — user asks who is online, what friends are playing, or their friends list
- **xbox_player_presence** — user asks about a specific player's current status (needs XUID)
- **xbox_my_achievements** — user asks about their own achievements, games played, or progress
- **xbox_player_achievements** — user asks about another player's achievements (needs XUID)
- **xbox_gamepass_all** — user asks what's on Game Pass or the full catalog
- **xbox_gamepass_pc** — user asks about PC Game Pass specifically
- **xbox_gamepass_ea_play** — user asks about EA Play titles
- **xbox_sessions** — user asks about active sessions, parties, or multiplayer
- **xbox_session_config** — user asks about session settings or join restrictions

## Tips

- To look up a player by gamertag, use **xbox_search_player** to get their XUID first, then use presence or achievement tools with that XUID.
- Achievements are returned as per-title summaries with gamerscore earned and progress percentage — not individual achievement lists.
- Game Pass tools return product IDs only; use them to confirm catalog membership, not for browsing titles by name.
- If the user has not configured an API key, direct them to run `/xbox setup`.
