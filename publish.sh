#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

GIT="/usr/local/git/current/bin/git"
if ! command -v "$GIT" >/dev/null 2>&1; then
    GIT="git"
fi

echo "🔄 1. Pulling latest remote changes..."
$GIT pull --rebase origin main 2>/dev/null || true

echo "⚽ 2. Refreshing FPL mood score..."
python3 scripts/update_fpl.py 2>/dev/null || true

echo "📦 3. Building blog..."
bash ./build.sh

echo ""
echo "🔍 4. Git status:"
$GIT status -s

echo ""
MSG="$1"
if [ -z "$MSG" ]; then
    echo -n "Enter commit message (or press enter for default 'Update blog'): "
    read -r MSG
fi

if [ -z "$MSG" ]; then
    MSG="Update blog"
fi

echo ""
echo "🚀 5. Committing and pushing to GitHub..."
$GIT add .
$GIT commit -m "$MSG"
$GIT push origin main

echo ""
echo "🎉 Published! Your updates will be live in 1-2 minutes at https://prasoon1207.github.io/"
