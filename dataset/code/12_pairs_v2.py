"""Anthem vs national song (20 pairs from 07_pairs.py) on the rebuilt axes: old Energy (= Mobilisation), new Energy,
Awakening and Wisdom. Usage: python 12_pairs_v2.py <atlas_dir>"""
import json
import os
import sys

import pandas as pd
from scipy.stats import wilcoxon

A = sys.argv[1]
R = os.path.join(A, "results")
pairs = pd.read_csv(os.path.join(R, "anthem_vs_national_song_pairs.csv"))
s = pd.read_csv(os.path.join(R, "energy_wisdom_scores.csv")).merge(
    pd.read_csv(os.path.join(A, "data", "dataset.csv"))[["song_id", "title"]], on="song_id")
rows = []
for _, r in pairs.iterrows():
    ns = s[(s.country == r.country) & (s.title == r.song)]
    an = s[(s.country == r.country) & (s.song_type == "national anthem")]
    if len(ns) == 1 and len(an):
        rows.append({"country": r.country, "national_song": r.song,
                     **{k: float(ns.iloc[0][k] - an.iloc[0][k]) for k in ("energy_v1", "energy", "mobilisation", "awakening", "wisdom")}})
d = pd.DataFrame(rows)
out = {"n_pairs": len(d), "difference": "national song minus anthem (standardised scores)"}
for k in ("energy_v1", "energy", "mobilisation", "awakening", "wisdom"):
    out[k] = {"song_lower": int((d[k] < 0).sum()), "median": round(float(d[k].median()), 3), "wilcoxon_p": round(float(wilcoxon(d[k]).pvalue), 3)}
d.round(3).to_csv(os.path.join(R, "anthem_vs_national_song_v2.csv"), index=False)
json.dump(out, open(os.path.join(R, "anthem_vs_national_song_v2.json"), "w"), indent=1)
print(json.dumps(out, indent=1))
