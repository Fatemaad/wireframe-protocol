#!/bin/bash
# One command to sync the latest files and (re)start the app.
# Usage:  ./run.sh

SRC="/Users/fatemaalkhalifa/Library/Application Support/Claude/local-agent-mode-sessions/17fc07f0-0b3c-4db3-9431-ed19eefa944d/f6e85c0d-0e0d-4722-9a80-f02ca8e3c76f/local_53fdf635-4815-4496-bab4-5a7d69a2122a/outputs"
DEST="$HOME/wireframe-protocol"

echo "→ Stopping any old server on port 3000..."
lsof -ti:3000 | xargs kill 2>/dev/null

echo "→ Syncing latest files from Cowork..."
cp "$SRC/index.html" "$DEST/index.html" && echo "  index.html ✓"
cp "$SRC/server.js"  "$DEST/server.js"  && echo "  server.js ✓"
[ -f "$SRC/logos.js" ] && cp "$SRC/logos.js" "$DEST/logos.js" && echo "  logos.js ✓"

echo "→ Starting server..."
cd "$DEST" && npm start
