#!/usr/bin/env bash
set -e

API_KEY="${XBL_API_KEY:-}"

if [[ -z "$API_KEY" ]]; then
  echo "Error: set XBL_API_KEY before running, e.g.:"
  echo "  XBL_API_KEY=your-key ./reinstall.sh"
  exit 1
fi

echo "→ Installing plugin..."
openclaw plugins install git:github.com/jbeaumont/openclaw-xbox

echo "→ Setting API key..."
openclaw config set plugins.entries.openclaw-xbox.config.apiKey "$API_KEY"

echo "→ Restarting gateway..."
openclaw gateway restart

echo "✓ Done — run /xbox setup to verify"
