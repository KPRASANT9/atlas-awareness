"""Paired comparison: national song (or second anthem) minus the same country's national anthem."""
import json
import os
import sys

import pandas as pd
from scipy.stats import wilcoxon

W = sys.argv[1]
s = pd.read_csv(os.path.join(W, "results", "scores.csv"))
an = s[s.song_type == "national anthem"].groupby("country").first()
ns = s[s.song_type.isin(["national song", "second anthem"]) & s.country.isin(an.index)]
cols = ["theme_nature", "theme_sacred_mother", "theme_martial", "theme_monarch", "theme_divine", "theme_freedom", "energy", "wisdom"]
p = pd.DataFrame([{"country": r.country, "song": r.title, **{c: r[c] - an.loc[r.country, c] for c in cols}} for _, r in ns.iterrows()])
p.round(3).to_csv(os.path.join(W, "results", "anthem_vs_national_song_pairs.csv"), index=False)
out = {c: {"n": int(len(p)), "median_diff": round(float(p[c].median()), 3), "share_song_higher": round(float((p[c] > 0).mean()), 3),
           "wilcoxon_p": round(float(wilcoxon(p[c]).pvalue), 4)} for c in cols}
json.dump(out, open(os.path.join(W, "results", "anthem_vs_national_song_summary.json"), "w"), indent=1)
print(json.dumps(out, indent=1))
