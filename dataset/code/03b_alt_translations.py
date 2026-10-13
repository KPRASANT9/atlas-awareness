"""Align an independent English-translation corpus to dataset anthems (translation-sensitivity check).

Source: anthems.csv from github.com/reys1226/CECS450-Project1 (196 anthems; scraped from nationalanthems.info,
via Kaggle 'nation-anthems-with-lyrics'). Used ONLY as a robustness check, never as the primary text.
"""
import importlib
import os
import sys

import country_converter as coco
import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))
ds = importlib.import_module("03_dataset") if False else None
from importlib.util import spec_from_file_location

W = sys.argv[1]
df = pd.read_csv(os.path.join(W, "dataset.csv"))
alt = pd.read_csv(os.path.join(W, "reys_anthems.csv"))
cc = coco.CountryConverter()
alt["iso3"] = cc.convert(alt.nation.str.strip().tolist(), to="ISO3", not_found=None)
an = df[(df.song_type == "national anthem") & df.analyzable].copy()
an["iso3"] = cc.convert(an.country.tolist(), to="ISO3", not_found=None)

# reuse the same cleaning as the main dataset
src = open(os.path.join(os.path.dirname(__file__), "03_dataset.py")).read()
ns = {}
exec(src[src.index("def clean_text"):src.index("rows = []")], {"re": __import__("re")}, ns)
clean_text, first_words = ns["clean_text"], ns["first_words"]

m = an.merge(alt[["iso3", "lyrics_english"]].dropna(), on="iso3", how="inner")
m = m[m.iso3.notna()]
m["alt_text"] = m.lyrics_english.map(clean_text).map(first_words)
m = m[m.alt_text.str.split().str.len() >= 20]
m[["song_id", "country", "alt_text"]].to_csv(os.path.join(W, "alt_translations.csv"), index=False)
print(len(m), "anthems with an alternative translation")
