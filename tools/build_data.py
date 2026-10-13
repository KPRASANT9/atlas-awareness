"""Build the site's data files from the Global Anthem Atlas results.

Usage (from the project store root):
    python site/tools/build_data.py

Reads  internal/anthem-atlas/results/country_spectra_wide.csv, energy_wisdom_scores.csv,
       country_spectra_entries.md, internal/anthem-atlas/data/dataset.csv and
       site/tools/ne_50m_admin_0_countries.topo.json (built by build_geo.sh).
Writes site/data/atlas.json and site/data/world.topo.json.

Lyric texts are never read into the output: only scores, short generated readings,
metadata and links to sources.
"""
import json
import math
import os
import re

import country_converter as coco
import logging
import pandas as pd

logging.getLogger("country_converter").setLevel(logging.ERROR)

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
STORE = os.path.dirname(SITE)
ATLAS = os.path.join(STORE, "internal", "anthem-atlas")
RES = os.path.join(ATLAS, "results")
OUT = os.path.join(SITE, "data")

THEMES = [
    ("nature", "Landscape & nature"),
    ("sacred_mother", "Land as mother"),
    ("unity", "Unity & togetherness"),
    ("freedom", "Freedom & independence"),
    ("martial", "Battle & sacrifice"),
    ("divine", "God & blessing"),
    ("monarch", "Monarch or sovereign"),
    ("universal", "Justice & peace"),
    ("history", "Ancestors & history"),
    ("future", "Future & progress"),
    ("reflective", "Truth, virtue & wisdom"),
    ("awakening", "Waking, hailing & song"),
]
SUBS = ["mobilisation", "awakening", "struggle", "drive", "invocation", "build"]
ITEMS = ["martial", "freedom", "imperative", "exclamation", "music", "universal", "reflective",
         "future", "awakening", "repetition", "final_acclaim"]

# Same join rules as internal/anthem-atlas/code/10_world_map.py
FIX = {"Palestine": "PSX", "South Sudan": "SDS", "Kosovo": "KOS", "Northern Cyprus": "CYN",
       "Somaliland": "SOL", "Taiwan": "TWN"}
NO_POLYGON = {"Abkhazia": (41.0, 43.05), "South Ossetia": (44.0, 42.3), "Transnistria": (29.4, 47.2)}
NOT_MAPPED = {"Sovereign Military Order of Malta": "no territory",
              "Sahrawi Arab Democratic Republic": "disputed territory; the anthem is in the dataset but not mapped onto Western Sahara"}


def num(x, nd=2):
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    if math.isnan(v):
        return None
    return round(v, nd)


def triple(r, base):
    return [num(r.get(base)), num(r.get(base + "_lo90")), num(r.get(base + "_hi90"))]


def boolish(x):
    return str(x).strip().lower() in ("true", "1", "1.0", "yes")


def parse_readings(path):
    """Map geography -> list of (energy, wisdom, reading) for each entry line in the generated entries."""
    out, cur = {}, None
    lines = open(path, encoding="utf-8").read().splitlines()
    i = 0
    ew = re.compile(r"Energy ([+\u2212\-]?\d+\.\d+) \[.*?\], Wisdom ([+\u2212\-]?\d+\.\d+) \[.*?\]")

    def f(s):
        return float(s.replace("\u2212", "-"))

    while i < len(lines):
        ln = lines[i]
        m = re.match(r"^- \*\*(.+?)\*\*: (.*)$", ln)
        if m:
            cur = m.group(1)
            out.setdefault(cur, [])
            body = m.group(2)
            mm = ew.search(body)
            if mm and i + 1 < len(lines) and lines[i + 1].startswith("  ") and not lines[i + 1].lstrip().startswith("- "):
                out[cur].append((f(mm.group(1)), f(mm.group(2)), lines[i + 1].strip()))
                i += 2
                continue
        m = re.match(r"^  - Also \*(.+?)\* \((.+?)\): (.*)$", ln)
        if m and cur:
            body = m.group(3)
            mm = ew.search(body)
            if mm:
                reading = body[mm.end():].lstrip(". ").strip()
                out[cur].append((f(mm.group(1)), f(mm.group(2)), reading))
        i += 1
    return out


def source_link(row):
    src = str(row.get("text_source") or "")
    page = row.get("wiki_page")
    m = re.search(r"(en\.wiki(?:pedia|source)\.org/wiki/[^\s,;()]+)", src)
    if m:
        url = "https://" + m.group(1)
    elif isinstance(page, str) and page:
        url = "https://en.wikipedia.org/wiki/" + page
    else:
        url = None
    label = src.split(" (")[0] if src else None
    return url, src


RIGHTS = os.path.join(STORE, "internal", "release", "rights-audit.csv")


def load_rights():
    """Pinned source revision per song from the release rights audit (no text columns are read)."""
    if not os.path.exists(RIGHTS):
        return {}
    cols = ["song_id", "wikipedia_article", "wikipedia_revid", "wikipedia_revision_url", "release_decision"]
    ra = pd.read_csv(RIGHTS, usecols=cols)
    out = {}
    for _, r in ra.iterrows():
        rec = {"textRelease": "scores only" if "scores only" in str(r.release_decision) else
               ("released" if r.release_decision == "text released" else "none")}
        if isinstance(r.wikipedia_revision_url, str):
            rec["revUrl"] = r.wikipedia_revision_url
            rec["revLabel"] = f"{r.wikipedia_article}, Wikipedia, revision {int(r.wikipedia_revid)}"
        out[r.song_id] = rec
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    wide = pd.read_csv(os.path.join(RES, "country_spectra_wide.csv"))
    ews = pd.read_csv(os.path.join(RES, "energy_wisdom_scores.csv")).set_index("song_id")
    ds = pd.read_csv(os.path.join(ATLAS, "data", "dataset.csv")).set_index("song_id")
    readings = parse_readings(os.path.join(RES, "country_spectra_entries.md"))
    rights = load_rights()

    songs_df = wide[wide.row_type == "song"]
    geos_df = wide[wide.row_type == "geography"]

    songs = {}
    for _, r in songs_df.iterrows():
        sid = r.song_id
        d = ds.loc[sid] if sid in ds.index else {}
        url, src = source_link(d if isinstance(d, dict) else d.to_dict())
        e = ews.loc[sid] if sid in ews.index else None
        rec = {
            "id": sid,
            "geo": r.geography,
            "title": r.title,
            "titleEn": (d.get("title_english") if not isinstance(d, dict) else None),
            "type": r.song_type,
            "primary": boolish(r.is_primary),
            "year": int(r.year) if not pd.isna(r.year) else None,
            "lyricist": d.get("lyricist") if not isinstance(d, dict) else None,
            "composer": d.get("composer") if not isinstance(d, dict) else None,
            "archetype": (e["archetype"] if e is not None else None),
            "words": int(r.n_words) if not pd.isna(r.n_words) else None,
            "lang": r.source_lang if isinstance(r.source_lang, str) else None,
            "family": r.language_family if isinstance(r.language_family, str) else None,
            "englishOriginal": boolish(r.english_is_original),
            "ety": {"layer": r.etymology_layer, "alpha": num(r.etymology_alpha),
                    "core": int(r.n_core_terms) if not pd.isna(r.n_core_terms) else 0,
                    "light": int(r.n_light_root_hits) if not pd.isna(r.n_light_root_hits) else 0,
                    "drift": num(r.translation_drift), "driftBasis": r.translation_drift_basis if isinstance(r.translation_drift_basis, str) else None},
            "secondTranslation": boolish(r.second_translation),
            "shift": [num(r.second_translation_energy_shift), num(r.second_translation_wisdom_shift)],
            "archaic": num(r.archaic_words_per100),
            "lyricStatus": r.lyric_status if isinstance(r.lyric_status, str) else None,
            "stability": num(r.cell_stability),
            "confidence": r.confidence,
            "reasons": r.confidence_reasons if isinstance(r.confidence_reasons, str) else "",
            "energy": triple(r, "energy"),
            "wisdom": triple(r, "wisdom"),
            "levels": [int(r.energy_level) if not pd.isna(r.energy_level) else None,
                       int(r.wisdom_level) if not pd.isna(r.wisdom_level) else None],
            "subs": {k: triple(r, k) for k in SUBS},
            "themes": {k: triple(r, "theme_" + k) for k, _ in THEMES},
            "items": {k: num(r.get("item_" + k)) for k in ITEMS},
            "sourceUrl": url,
            "source": src or None,
            "reading": None,
        }
        if isinstance(rec["titleEn"], float):
            rec["titleEn"] = None
        for k in ("lyricist", "composer"):
            if isinstance(rec[k], float):
                rec[k] = None
        rec.update(rights.get(sid, {}))
        songs[sid] = rec

    # attach readings by matching rounded Energy/Wisdom within each geography
    unmatched = []
    for geo, entries in readings.items():
        cand = [s for s in songs.values() if s["geo"] == geo and s["energy"][0] is not None]
        for e, w, text in entries:
            best = min(cand, key=lambda s: abs(s["energy"][0] - e) + abs(s["wisdom"][0] - w), default=None)
            if best and abs(best["energy"][0] - e) + abs(best["wisdom"][0] - w) < 0.03 and best["reading"] is None:
                best["reading"] = text
            else:
                unmatched.append((geo, e, w))
    missing = [s["id"] for s in songs.values() if s["energy"][0] is not None and not s["reading"]]
    print(f"readings: {sum(1 for s in songs.values() if s['reading'])} attached, unmatched entries {len(unmatched)}, songs without reading {missing}")

    names = list(geos_df.geography)
    isos = coco.convert(names, to="ISO3", not_found=None)
    geos = []
    for (_, r), iso in zip(geos_df.iterrows(), isos):
        name = r.geography
        sids = [s for s in str(r.songs).split(";") if s and s != "nan"] if isinstance(r.songs, str) else []
        sids = [s.strip() for s in re.split(r"[;,| ]+", str(r.songs)) if s.strip() and s.strip() != "nan"] if isinstance(r.songs, str) else []
        scored = not pd.isna(r.energy)
        if not sids and isinstance(r.song_id, str):
            sids = [r.song_id]
        main = r.song_id if isinstance(r.song_id, str) else (sids[0] if sids else None)
        sids = [main] + [s for s in sids if s != main] if main else sids
        key, point, mapnote = None, None, None
        if r.geography_status != "sub-national/historic":
            if name in NO_POLYGON:
                point = list(NO_POLYGON[name])
            elif name in NOT_MAPPED:
                mapnote = NOT_MAPPED[name]
            else:
                key = FIX.get(name) or (iso if isinstance(iso, str) and iso != "not found" else None)
        parent = None
        if main in ds.index:
            p = ds.loc[main].get("parent_country")
            parent = p if isinstance(p, str) else None
        geos.append({
            "name": name, "status": r.geography_status, "subregion": r.subregion, "macro": r.macro_region,
            "key": key, "point": point, "mapNote": mapnote, "parent": parent,
            "scored": scored, "main": main, "songs": sids,
            "lyricStatus": r.lyric_status if isinstance(r.lyric_status, str) else None,
            "confidence": r.confidence, "reasons": r.confidence_reasons if isinstance(r.confidence_reasons, str) else "",
        })
        if not scored and main in songs:
            songs[main]["lyricStatus"] = songs[main]["lyricStatus"] or (r.lyric_status if isinstance(r.lyric_status, str) else None)
    # songs present in dataset for unscored geographies but absent from song rows
    for g in geos:
        for sid in g["songs"]:
            if sid not in songs and sid in ds.index:
                d = ds.loc[sid]
                url, src = source_link(d.to_dict())
                songs[sid] = {"id": sid, "geo": g["name"], "title": d.title, "type": d.song_type, "primary": True,
                              "year": (int(re.search(r"\d{4}", str(d.year_adopted)).group())
                                       if re.search(r"\d{4}", str(d.year_adopted)) else None),
                              "lyricist": d.lyricist if isinstance(d.lyricist, str) else None,
                              "composer": d.composer if isinstance(d.composer, str) else None,
                              "confidence": "Not scored", "reasons": "", "lyricStatus": g["lyricStatus"],
                              "energy": [None, None, None], "wisdom": [None, None, None],
                              "sourceUrl": url, "source": src or None, "reading": None, "notScored": True}

    keys = [g["key"] for g in geos if g["key"]]
    dup = {k for k in keys if keys.count(k) > 1}
    print("geographies:", len(geos), "with polygon key:", len(keys), "duplicate keys:", dup)

    # geometry: attach geography name to each Natural Earth feature by ADM0_A3
    topo = json.load(open(os.path.join(HERE, "ne_50m_admin_0_countries.topo.json")))
    obj = topo["objects"][list(topo["objects"])[0]]
    key2geo = {}
    for g in geos:
        if g["key"]:
            key2geo.setdefault(g["key"], g["name"])
    found = set()
    for geom in obj["geometries"]:
        p = geom["properties"]
        k = p.get("ADM0_A3")
        if k in key2geo:
            p["geo"] = key2geo[k]
            found.add(k)
            p["role"] = "data"
        elif k == "SAH":
            p["role"] = "nodata"
            p["note"] = "Western Sahara: disputed; the SADR anthem is in the dataset but not mapped onto the territory"
        elif p.get("SOV_A3") == k or k in ("KAS",):
            p["role"] = "outscope"
        else:
            p["role"] = "outscope"
        p["name"] = p.pop("ADMIN", p.get("NAME"))
        for drop in ("NAME", "SOV_A3"):
            p.pop(drop, None)
    missing_poly = [g["name"] for g in geos if g["key"] and g["key"] not in found]
    print("keys without polygon:", missing_poly)
    for g in geos:
        if g["key"] and g["key"] not in found:
            g["key"] = None
            g["mapNote"] = "no polygon at this map scale"
    topo["objects"] = {"countries": obj}
    json.dump(topo, open(os.path.join(OUT, "world.topo.json"), "w"), separators=(",", ":"))

    meta = {
        "themes": [{"key": k, "label": l} for k, l in THEMES],
        "subs": SUBS,
        "nSongs": sum(1 for s in songs.values() if s["energy"][0] is not None),
        "nGeos": len(geos),
        "nGeosScored": sum(1 for g in geos if g["scored"]),
        "cutpoints": {"energy": [-0.878, -0.297, 0.236, 0.852], "wisdom": [-0.869, -0.283, 0.238, 0.794]},
        "source": "Global Anthem Atlas results (country_spectra_wide.csv, energy_wisdom_scores.csv, country_spectra_entries.md)",
    }
    json.dump({"meta": meta, "geos": geos, "songs": songs}, open(os.path.join(OUT, "atlas.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    print("wrote", os.path.join(OUT, "atlas.json"), os.path.getsize(os.path.join(OUT, "atlas.json")) // 1024, "KB")


if __name__ == "__main__":
    main()
