# openclaw-xbox

An [OpenClaw](https://github.com/openclaw/openclaw) plugin that brings Xbox Live data into your AI assistant via the [xbl.io](https://xbl.io) API — profiles, presence, achievements, Game Pass, title history, DVR media, clubs, and sessions.

Read-only by default. State-changing actions (add/remove friend, send message) are strictly opt-in.

---

## Prerequisites

- OpenClaw gateway `>=2026.3.24-beta.2`
- An [xbl.io](https://xbl.io) account (free tier: 150 requests/hour)

---

## Install

### From ClawHub (recommended)

[ClawHub](https://docs.openclaw.ai/clawhub) is OpenClaw's plugin registry:

```bash
openclaw plugins install clawhub:openclaw-xbox
```

### From git

```bash
openclaw plugins install git:github.com/jbeaumont/openclaw-xbox
```

---

## Configure

### 1. Get an xbl.io API key

1. Go to [xbl.io](https://xbl.io) and sign in with your Microsoft account — this links your Xbox Live account.
2. Open **API Keys** in the dashboard and copy your key.

### 2. Enable the plugin and set the key

```bash
openclaw config set plugins.entries.openclaw-xbox.enabled true
openclaw config set plugins.entries.openclaw-xbox.config.apiKey YOUR_KEY_HERE
```

Prefer not to store the key in config? Set the `OPENCLAW_XBOX_API_KEY` environment
variable instead. Then restart the gateway so it picks up the plugin.

### 3. Verify

```
/xbox setup
```

This confirms your key is valid and shows your gamertag and gamerscore.

---

## Commands

Use `/xbox` directly in your OpenClaw chat:

| Command | Description |
|---|---|
| `/xbox help` | List all available commands |
| `/xbox setup` | Verify your API key and connection |
| `/xbox profile` | Your Xbox profile and gamerscore |
| `/xbox friends` | Friends list with online status |
| `/xbox search <gamertag>` | Look up any player by gamertag |
| `/xbox achievements` | Your achievement progress across all titles |
| `/xbox gamepass [pc\|ea]` | Game Pass catalog (optionally PC or EA Play) |
| `/xbox sessions` | Active sessions and party members |

---

## Agent tools

Once the plugin is enabled with a valid key, these tools are available to the agent
automatically. They are **additive** — you do not need to swap your `tools.profile`
or grant a broad toolset (see Troubleshooting).

### Read-only

| Tool | Description |
|---|---|
| `xbox_my_profile` | Your own profile — gamertag, XUID, gamerscore, tier |
| `xbox_search_player` | Look up any player by gamertag |
| `xbox_friends_presence` | All friends' online status and what they're playing |
| `xbox_player_presence` | Presence for a specific player by XUID |
| `xbox_player_presence_by_gamertag` | Search + presence in one call |
| `xbox_my_achievements` | Your achievements across all titles |
| `xbox_player_achievements` | Another player's achievements (optional title filter) |
| `xbox_my_title_history` | Your recently played titles |
| `xbox_player_title_history` | Another player's recently played titles |
| `xbox_screenshots` | Your recent DVR screenshots |
| `xbox_game_clips` | Your recent DVR game clips |
| `xbox_gamepass_all` / `xbox_gamepass_pc` / `xbox_gamepass_ea_play` | Game Pass catalog |
| `xbox_game_details` | Resolve a marketplace product ID to a title |
| `xbox_search_clubs` / `xbox_club_details` | Xbox Clubs search and details |
| `xbox_sessions` / `xbox_session_config` | Active sessions and configuration |

### Write tools (opt-in)

Disabled by default. To enable:

```bash
openclaw config set plugins.entries.openclaw-xbox.config.enableWriteTools true
```

| Tool | Description |
|---|---|
| `xbox_add_friend` | Add a player to your friends list |
| `xbox_remove_friend` | Remove a player from your friends list |
| `xbox_send_message` | Send a message to a player |

These tools are **owner-only** and each requires an explicit `confirm` flag, so the
agent cannot change state without a deliberate, confirmed step.

---

## Troubleshooting

**Agent says a tool isn't available**

If you run a restrictive `tools.profile` (an exclusive allowlist), the plugin's tools
may not be included. Add this plugin's tools **alongside** your existing setup rather
than replacing it — do not swap to `group:default` just for this plugin:

```bash
# keep whatever you already allow, and add the plugin's tools:
openclaw config set tools.allow '["...your existing tools...", "openclaw-xbox"]'
```

Then restart the gateway.

**Rate limited**

The free xbl.io tier allows 150 requests/hour. Responses are cached for 60s to reduce
calls; if you hit the limit the plugin reports how long to wait.

---

## Development

```bash
npm install
npm run typecheck
npm run rebuild   # cleans and rebuilds dist/
```

The compiled `dist/` is committed so git installs work without a build step. CI fails
if `dist/` drifts from `src/` — run `npm run rebuild` and commit before pushing.

### Publishing to ClawHub

```bash
npm i -g clawhub
clawhub login
clawhub package publish . --family code-plugin --dry-run   # preview
clawhub package publish . --family code-plugin
```

---

## License

MIT — see [LICENSE](./LICENSE).
