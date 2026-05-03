#!/usr/bin/env bash
set -e

API_KEY="7cf19e96-c40b-48ac-876c-6aac9be0f753"

echo "→ Installing plugin..."
openclaw plugins install git:github.com/jbeaumont/openclaw-xbox

echo "→ Setting API key..."
openclaw config set plugins.entries.openclaw-xbox.config.apiKey "$API_KEY"

echo "→ Restarting gateway..."
openclaw gateway restart

echo "✓ Done — run /xbox setup to verify"
