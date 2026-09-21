#!/usr/bin/env python3
import http.server
import os
import sys
import time
import threading

# Import build function from build.py
DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, DIR)
from build import build_site, BASE_DIR, CONTENT_DIR, TEMPLATES_DIR

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

class NoCacheAutoRebuildHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path == "/post/fpl.json":
            return os.path.join(BASE_DIR, "fpl.json")
        return super().translate_path(path)

    def end_headers(self):
        # Disable browser caching completely so CSS/HTML changes show immediately
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

def get_watched_mtimes():
    mtimes = {}
    watch_paths = [
        os.path.join(BASE_DIR, "style.css"),
        os.path.join(BASE_DIR, "fpl-mood.js"),
    ]
    for folder in [CONTENT_DIR, TEMPLATES_DIR]:
        if os.path.exists(folder):
            for root, _, files in os.walk(folder):
                for f in files:
                    watch_paths.append(os.path.join(root, f))
    for p in watch_paths:
        if os.path.exists(p):
            mtimes[p] = os.path.getmtime(p)
    return mtimes

def watch_and_rebuild():
    last_mtimes = get_watched_mtimes()
    while True:
        time.sleep(0.5)
        current_mtimes = get_watched_mtimes()
        if current_mtimes != last_mtimes:
            print("\n🔄 Detected file changes! Automatically rebuilding site...", flush=True)
            try:
                build_site()
                print("✅ Rebuild complete! Refresh your browser to see changes.\n", flush=True)
            except Exception as e:
                print(f"⚠️ Rebuild error: {e}", flush=True)
            last_mtimes = current_mtimes

if __name__ == "__main__":
    os.chdir(BASE_DIR)
    
    # Run initial build
    build_site()
    
    # Start file watcher in background thread
    watcher_thread = threading.Thread(target=watch_and_rebuild, daemon=True)
    watcher_thread.start()
    
    server = http.server.ThreadingHTTPServer(("", PORT), NoCacheAutoRebuildHandler)
    print(f"🚀 Auto-rebuilding preview server running at http://localhost:{PORT}")
    print("👀 Watching content/, templates/, and style.css for changes...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping preview server...")
