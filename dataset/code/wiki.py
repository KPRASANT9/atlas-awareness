"""Small cached Wikipedia API client."""
import hashlib
import json
import os
import time

import requests

CACHE = os.path.join(os.path.dirname(__file__), "..", "cache")
os.makedirs(CACHE, exist_ok=True)
API = "https://en.wikipedia.org/w/api.php"
HEADERS = {"User-Agent": "GeographyResonance-AnthemAtlas/0.1 (research; contact: none)"}


def _cached(key, fn):
    path = os.path.join(CACHE, hashlib.md5(key.encode()).hexdigest() + ".json")
    if os.path.exists(path):
        return json.load(open(path))
    for attempt in range(4):
        try:
            data = fn()
            break
        except Exception:
            time.sleep(2 ** attempt)
    else:
        data = None
    json.dump(data, open(path, "w"))
    return data


def parse(page, prop="wikitext"):
    """Return (resolved_title, content) for a page; content is wikitext or HTML."""
    def fetch():
        r = requests.get(API, params={"action": "parse", "page": page, "prop": prop,
                                      "format": "json", "formatversion": 2, "redirects": 1},
                         headers=HEADERS, timeout=30)
        d = r.json()
        if "error" in d:
            return {"title": None, "content": None}
        return {"title": d["parse"]["title"], "content": d["parse"][prop]}
    d = _cached(f"{prop}:{page}", fetch)
    return (d or {}).get("title"), (d or {}).get("content")
