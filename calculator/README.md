# Calculator

A calculator that installs onto an iPhone home screen, opens full screen with no
browser chrome, and keeps working with no signal at all.

It is a web app, not an App Store app. That is a deliberate trade: it needs no
Mac, no Xcode, no `$99/year` Apple Developer account and no review queue, and it
updates the moment this repo is pushed. Once installed it gets its own icon and
runs full screen, so day to day it is hard to tell apart from a native app.

## Put it on your iPhone

1. **Publish it.** Merge this branch into `main`. GitHub Pages serves this repo,
   so a minute or two later the app is live at
   <https://prasoon1207.github.io/calculator/>.
2. **Open that URL in Safari on your iPhone.** Safari specifically — Chrome and
   Firefox on iOS cannot install home-screen apps the same way.
3. **Tap the Share button**, the square with an arrow pointing out of it, in the
   toolbar at the bottom of the screen.
4. **Scroll down the share sheet and tap "Add to Home Screen."** If you don't
   see it, tap "Edit Actions" at the bottom and add it.
5. **Tap "Add"** in the top right. The icon lands on your home screen.
6. **Tap the icon.** It opens full screen, with no address bar.

Open it once while online so it can cache itself, and it will work in airplane
mode from then on.

To remove it, press and hold the icon and choose "Delete App", exactly like any
other app. To update it after pushing changes here, delete it and add it again,
or just open it while online and it will refresh itself in the background.

## Using it

The keypad works the way a phone calculator does: operations resolve left to
right with no operator precedence, so `2 + 3 × 4` is `20`, not `14`.

| Key | What it does |
| --- | --- |
| `AC` / `C` | Clears everything, or just the number you are typing |
| `±` | Flips the sign |
| `%` | `50 + 10%` gives `55`; `200 × 10%` gives `20`; `50 %` on its own gives `0.5` |
| `=` | Press it again to repeat the last operation, so `2 + 3 = = =` counts up by 3 |

Swipe left or right across the number to delete its last digit. Dividing by zero
shows `Error`; press `AC` to carry on.

On a desktop browser the number keys, `+`, `-`, `*`, `/`, `%`, `Enter`,
`Backspace` and `Escape` all work.

## Working on it

```sh
# Run the arithmetic tests (no dependencies, just Node).
node --test calculator/tests/*.test.js

# Preview locally, then open http://localhost:8000/calculator/
python3 -m http.server 8000

# Redraw the home-screen icons after changing the artwork.
python3 calculator/icons/generate_icons.py
```

After any change to the layout, open
`http://localhost:8000/calculator/tests/layout-check.html`. It renders the app at
eleven phone, tablet and desktop sizes and checks that no key falls off the
bottom edge, that nothing overflows or overlaps, and that the keys stay large
enough to hit. It should report `ALL PASS`.

| File | Role |
| --- | --- |
| `engine.js` | All arithmetic and keypad state. No DOM, so Node can test it directly. |
| `app.js` | Binds the engine to the keypad, keyboard and swipe gesture. |
| `styles.css` | Dark theme, safe-area insets, keypad grid. |
| `sw.js` | Service worker that caches the app for offline use. |
| `manifest.webmanifest` | Name, colours and icons used when installed. |
| `icons/` | Generated PNGs, plus the script that draws them. |
| `tests/` | Arithmetic tests, and the layout check described above. |

Service workers only run over HTTPS or on `localhost`, so offline support is
active on GitHub Pages and during local preview, but not if you open
`index.html` straight off the filesystem.

The service worker answers from its cache first and refreshes in the background,
so a deploy reaches installed copies on their next launch. That does mean the
launch right after a deploy can still show the previous version. `CACHE_NAME` in
`sw.js` only needs bumping to evict files that have been renamed or deleted.

## If you later want a real native app

The same interface would port to a SwiftUI app, but that route needs a Mac
running Xcode to build it, plus a paid Apple Developer account to keep it on a
phone for more than seven days, or to ship it through the App Store at all.
Worth it for anything that needs widgets, Siri, or hardware APIs; not worth it
for a calculator.
