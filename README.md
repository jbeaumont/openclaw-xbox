# openclaw-xbox

An [OpenClaw](https://github.com/openclaw/openclaw) plugin that brings Xbox Live data into your AI assistant via the [xbl.io](https://xbl.io) API.

**v1 tools:** profiles, presence, achievements, Game Pass catalog, and sessions.

---

## Prerequisites

- OpenClaw gateway `>=2026.3.24-beta.2`
- An [xbl.io](https://xbl.io) account (free tier: 150 requests/hour)

---

## Setup

### 1. Install the plugin

```bash
openclaw plugins install git:github.com/jbeaumont/openclaw-xbox
```

### 2. Get an xbl.io API key

1. Go to [xbl.io](https://xbl.io) and sign in with your Microsoft account — this links your Xbox Live account
2. Navigate to **API Keys** in the dashboard
3. Copy your key

### 3. Enable the plugin and configure the API key

```bash
openclaw config set plugins.entries.openclaw-xbox.enabled true
openclaw config set plugins.entries.openclaw-xbox.config.apiKey YOUR_KEY_HERE
```

Then restart the gateway so it picks up the new plugin entry.

### 4. Verify the connection

```
/xbox setup
```

This will confirm your key is valid and show your gamertag and gamerscore. If anything is wrong it will tell you what to check.

---

## Commands

Once configured, use `/xbox` directly in your OpenClaw chat:

| Command | Description |
|---|---|
| `/xbox help` | List all available commands |
| `/xbox setup` | Verify your API key and connection |
| `/xbox profile` | Your Xbox profile and gamerscore |
| `/xbox friends` | Friends list with online status |
| `/xbox search <gamertag>` | Look up any player by gamertag |
| `/xbox achievements` | Your achievement progress across all titles |
| `/xbox gamepass` | Full Game Pass catalog |
| `/xbox gamepass pc` | PC Game Pass titles |
| `/xbox gamepass ea` | EA Play titles |
| `/xbox sessions` | Active sessions and party members |

---

## Agent Tools

The plugin also registers tools that the AI agent can use automatically once the plugin is enabled (step 3 above). No `tools.allow` changes needed — the tools are available to the agent by default.

### Identity
| Tool | Description |
|---|---|
| `xbox_my_profile` | Your own profile — gamertag, XUID, gamerscore, account tier |
| `xbox_search_player` | Look up any player by gamertag |

### Presence
| Tool | Description |
|---|---|
| `xbox_friends_presence` | All friends' online status and what they're playing |
| `xbox_player_presence` | Presence for a specific player by XUID |

### Achievements
| Tool | Description |
|---|---|
| `xbox_my_achievements` | Your achievements across all titles |
| `xbox_player_achievements` | Another player's achievements (optionally filtered by title ID) |

### Game Pass Catalog
| Tool | Description |
|---|---|
| `xbox_gamepass_all` | Full Game Pass catalog |
| `xbox_gamepass_pc` | PC Game Pass titles |
| `xbox_gamepass_ea_play` | EA Play titles (included with Game Pass Ultimate) |

### Sessions & Party
| Tool | Description |
|---|---|
| `xbox_sessions` | Active sessions and party members |
| `xbox_session_config` | Current session configuration and join settings |

---

## Troubleshooting

**Agent says a tool isn't available**

If you have a `tools.profile` configured, it may not include plugin tools. The cleanest fix is to replace the profile with an explicit allow list that covers both your existing tools and this plugin:

```bash
openclaw config unset tools.profile
openclaw config set tools.allow '["group:openclaw", "openclaw-xbox"]'
```

`group:openclaw` covers all the same built-in tools as the `coding` profile. Then restart the gateway.

---

## Roadmap (v2)

- Party invites (`xbox_invite_to_party`)
- Friends management (`xbox_add_friend`, `xbox_remove_friend`)
- DVR — game clips and screenshots
- Marketplace browsing and deals
- Title history
- npm / ClawHub publishing

---

## License

MIT
