#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Check if python3 is available and working
if command -v python3 >/dev/null 2>&1 && python3 -c "import sys" >/dev/null 2>&1; then
    echo "⚡ Building site using Python (build.py)..."
    python3 build.py
elif command -v ruby >/dev/null 2>&1; then
    echo "⚡ Building site using Ruby (build.rb)..."
    ruby build.rb
else
    echo "❌ Error: Neither Python 3 nor Ruby was found to run the build script."
    exit 1
fi
