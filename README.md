# Prasoon's Personal Website & Blog

Repository powering [prasoon1207.github.io](https://prasoon1207.github.io/).

---

## 📁 Directory Structure

```text
blog/
├── content/              # ✍️ Write your markdown posts here (*.md)
│   └── template.md.draft # Example post template
├── post/                 # 📄 Compiled HTML posts (generated automatically)
├── templates/            # 🎨 HTML templates
│   ├── index_template.html
│   └── post_template.html
├── images/               # 🖼️ Profile pictures and static assets
├── scripts/              # ⚙️ Helper scripts (e.g., FPL mood updater)
├── build.sh              # ⚡ Build wrapper (auto-detects Python or Ruby)
├── preview.sh            # 🌐 Preview locally at http://localhost:8000
├── new-post.sh           # 📝 Helper to scaffold a new markdown post
├── publish.sh            # 🚀 Commit and push changes to GitHub Pages
├── build.py              # Python site generator
├── build.rb              # Zero-dependency Ruby generator (works on macOS out-of-the-box)
├── index.html            # Main site homepage (generated from template)
└── style.css             # Site styles
```

---

## 🚀 Quick Start: Everyday Workflow

### 1. Create a New Post
Run:
```bash
./new-post.sh "Your Post Title"
```
This automatically creates a dated markdown file in `content/`, e.g.:
`content/2026-09-03-your-post-title.md`

### 2. Write Your Content
Edit the markdown file. Make sure the front-matter metadata at the top is intact:
```markdown
---
title: Understanding Policy Gradients
date: 2026-09-03
reading_time: 5
---

Write your thoughts here in standard Markdown...
```

**Supported Formatting:**
- Headings (`#`, `##`, `###`)
- Bold (`**text**`), italics (`*text*`), inline code (`` `code` ``)
- Lists (`* ` or `1. `) and blockquotes (`> `)
- **Math & LaTeX** via MathJax:
  - Inline: `$E_{x \sim p}[f(x)]$`
  - Block:
    ```markdown
    $$
    \nabla_\theta J(\theta) = \mathbb{E}[\nabla_\theta \log \pi_\theta(a|s) Q(s,a)]
    $$
    ```

### 3. Preview Locally
Run:
```bash
./preview.sh
```
This will compile the site and open `http://localhost:8000` in your browser.

### 4. Publish to GitHub Pages
When you're happy with your changes:
```bash
./publish.sh "Add post on policy gradients"
```
Or use standard git commands:
```bash
./build.sh
git add .
git commit -m "New post: Policy Gradients"
git push origin main
```
Your post will be live at [prasoon1207.github.io](https://prasoon1207.github.io/) within 1-2 minutes!

---

## ⚽ Automatic FPL Mood Background

The background color of the website tints **green** (when beating the gameweek average) or **red** (when below it) based on your Fantasy Premier League team score.

- **Automated Updates**: Configured via [.github/workflows/update-fpl.yml](.github/workflows/update-fpl.yml) using GitHub Actions. It runs twice daily (at 06:00 and 18:00 UTC) to fetch the latest gameweek data from the FPL API and commit it to `fpl.json`.
- **Manual / Local Update**: Whenever you run `./preview.sh` or `./publish.sh`, it automatically refreshes `fpl.json` using `python3 scripts/update_fpl.py`.

