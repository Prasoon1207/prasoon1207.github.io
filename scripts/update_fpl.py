#!/usr/bin/env python3
"""Fetch FPL results for my team and write a mood score to fpl.json.

The score is in [-1, 1]: latest gameweek points compared against the
global average for that gameweek, scaled by 25 points. The website
tints its background green (doing well) or red (doing badly) with it.
"""
import json
import os
import urllib.request
from datetime import datetime, timezone

TEAM_ID = 2673685
BASE = "https://fantasy.premierleague.com/api"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fpl.json")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    history = get(f"{BASE}/entry/{TEAM_ID}/history/")
    events = get(f"{BASE}/bootstrap-static/")["events"]

    data = {
        "score": 0.0,
        "event": None,
        "points": None,
        "average": None,
        "overall_rank": None,
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }

    current = history.get("current") or []
    if current:
        gw = current[-1]
        avg = next((e["average_entry_score"] for e in events if e["id"] == gw["event"]), 0)
        if avg:
            data["score"] = round(max(-1.0, min(1.0, (gw["points"] - avg) / 25.0)), 3)
        data["event"] = gw["event"]
        data["points"] = gw["points"]
        data["average"] = avg
        data["overall_rank"] = gw["overall_rank"]

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")

    print(f"Wrote {OUT}: {data}")


if __name__ == "__main__":
    main()
