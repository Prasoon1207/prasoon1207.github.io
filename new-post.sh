#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

TITLE="$1"
if [ -z "$TITLE" ]; then
    echo -n "Enter post title: "
    read -r TITLE
fi

if [ -z "$TITLE" ]; then
    echo "❌ Post title cannot be empty."
    exit 1
fi

TODAY=$(date +"%Y-%m-%d")
# Slugify title
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g')
FILENAME="content/${TODAY}-${SLUG}.md"

mkdir -p content

if [ -f "$FILENAME" ]; then
    echo "⚠️ File $FILENAME already exists."
    exit 1
fi

cat <<EOF > "$FILENAME"
---
title: ${TITLE}
date: ${TODAY}
reading_time: 3
---

Write your post content here in Markdown...

### Section Heading

* Point 1
* Point 2

Inline math: \$x^2 + y^2 = z^2\$

Block equation:
\$\$
f(x) = \\int_{-\\infty}^\\infty e^{-t^2} dt
\$\$
EOF

echo "✅ Created new post draft: $FILENAME"
echo "👉 Open and edit this file, then run ./build.sh and ./preview.sh to test!"
