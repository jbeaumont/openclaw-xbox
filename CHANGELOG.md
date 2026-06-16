# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-06-16

### Added
- Title history tools: `xbox_my_title_history`, `xbox_player_title_history`.
- DVR media tools: `xbox_screenshots`, `xbox_game_clips`.
- Club tools: `xbox_search_clubs`, `xbox_club_details`.
- Marketplace lookup: `xbox_game_details` to resolve Game Pass product IDs to titles.
- Convenience tool: `xbox_player_presence_by_gamertag` (search + presence in one call).
- Opt-in write tools (`enableWriteTools`): `xbox_add_friend`, `xbox_remove_friend`,
  `xbox_send_message`. These are owner-only and require an explicit `confirm` flag.
- Response caching with a 60s TTL and friendly rate-limit (429) handling.
- `OPENCLAW_XBOX_API_KEY` / `OPENCLAW_XBOX_ENABLE_WRITE_TOOLS` environment-variable
  fallbacks for configuration.
- ClawHub publishing metadata, `LICENSE`, CI workflow, and a dist-freshness check.

### Changed
- Agent tools now return compact, formatted text instead of raw JSON dumps,
  sharing formatters with the `/xbox` slash commands.
- README rewritten around ClawHub install and least-privilege tool exposure.

### Fixed
- Corrupted em-dash characters (mojibake) in several tool descriptions.
- README troubleshooting no longer instructs users to grant the full `group:default`
  toolset; plugin tools are additive to whatever toolset is already configured.

## [0.1.0]

### Added
- Initial release: profiles, presence, achievements, Game Pass catalog, and sessions.
