# openclaw-xbox

An [OpenClaw](https://github.com/openclaw/openclaw) plugin that brings Xbox Live data into your AI assistant via the [xbl.io](https://xbl.io) API.

**v1 tools:** profiles, presence, achievements, Game Pass catalog, and sessions.

---

## Requirements

- A running OpenClaw gateway (`>=2026.3.24-beta.2`)
- A free [xbl.io](https://xbl.io) API key (150 requests/hour on the free tier)

---

## Installation

```bash
openclaw plugins install git:github.com/jbeaumont/openclaw-xbox
```

---

## Configuration

Add the following to your OpenClaw config (e.g. `~/.openclaw/config.json`):

```json
{
  "plugins": {
    "entries": {
      "openclaw-xbox": {
        "enabled": true,
        "config": {
          "apiKey": "YOUR_XBL_IO_API_KEY"
        },
        "tools": {
          "allow": [
            "xbox_my_profile",
            "xbox_search_player",
            "xbox_friends_presence",
            "xbox_player_presence",
            "xbox_my_achievements",
            "xbox_player_achievements",
            "xbox_gamepass_all",
            "xbox_gamepass_pc",
            "xbox_gamepass_ea_play",
            "xbox_sessions",
            "xbox_session_config"
          ]
        }
      }
    }
  }
}
```

All tools are **optional** — only tools listed under `tools.allow` will be available to the agent. Add only the ones you want.

---

## Tools

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
