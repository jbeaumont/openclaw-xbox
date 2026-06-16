# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [0.4.1] - 2026-06-16

### Changed
- README is now consumer-focused: documents the `openclaw onboard` setup path,
  and moves development/release/publishing instructions to `CONTRIBUTING.md`
  (they don't belong on the public ClawHub listing).

## [0.4.0] - 2026-06-16

### Added
- Setup/onboarding integration: declares the `xbl-io` provider (with the
  `OPENCLAW_XBOX_API_KEY` env var) in the manifest `setup` block, so the key
  surfaces in `openclaw onboard` and setup/status flows.
- Security audit collector: contributes findings to `openclaw` audits and the
  ClawHub trust scan (warns when write tools are enabled; notes a plaintext
  API key and recommends env/secret refs).

### Changed
- Consistent, delightful output: every tool now returns formatted Markdown with
  tasteful emojis instead of raw JSON. `xbox_player_presence`,
  `xbox_session_config`, `xbox_club_details`, `xbox_game_details`, and
  title-filtered `xbox_player_achievements` are now formatted.

## [0.3.0] - 2026-06-16

### Changed
- **Startup-lazy activation.** `activation.onStartup` is now `false`; the plugin
  loads on demand via `activation.onCommands` (`/xbox`) and `onConfigPaths`,
  instead of loading on every gateway startup.
- Moved `typescript` to `devDependencies` — the published plugin now has a single
  runtime dependency (`@sinclair/typebox`).
- Ship `tsconfig.json` and `CHANGELOG.md` so consumers can rebuild from source.

### Added
- `toolMetadata` config signals in the manifest so the gateway knows each tool's
  availability (requires `apiKey`; write tools also require `enableWriteTools`)
  without importing the plugin runtime.
- Auto-enable probe: setting the API key enables the plugin without a separate
  `openclaw plugins enable` step.
- Runtime tool risk metadata (read tools `low`, write tools `high`).
- Extended the contract test to validate manifest `toolMetadata` and activation.

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
