#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

PORT=${1:-8000}

# Automatically free the port if a previous preview server was left running or suspended
if lsof -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ Port $PORT is already in use by a previous process."
    echo "🧹 Automatically terminating previous preview process..."
    PREV_PID=$(lsof -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null)
    if [ -n "$PREV_PID" ]; then
        kill -9 $PREV_PID 2>/dev/null || true
        sleep 1
    fi
fi

# If port is still taken by another application, find the next available port
while lsof -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

echo "======================================================="
echo " 🌐 Starting local blog preview at http://localhost:$PORT"
echo " Press Ctrl+C to stop the server"
echo "======================================================="

# Refresh FPL score if possible
python3 scripts/update_fpl.py 2>/dev/null || true

# Rebuild before previewing
if [ -f "./build.sh" ]; then
    bash ./build.sh
fi

# Open browser after a brief moment
(sleep 1 && open "http://localhost:$PORT") &

# Start server with live rebuilding & cache-busting
if command -v python3 >/dev/null 2>&1 && [ -f "scripts/preview_server.py" ]; then
    python3 scripts/preview_server.py "$PORT"
elif command -v python3 >/dev/null 2>&1; then
    python3 -m http.server "$PORT"
elif command -v ruby >/dev/null 2>&1; then
    ruby -run -e httpd . -p "$PORT"
else
    echo "❌ Error: Neither Python 3 nor Ruby is available to serve files."
    exit 1
fi
