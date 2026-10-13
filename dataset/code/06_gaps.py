"""Write an explicit coverage-gap / caveat table."""
import os
import sys

import pandas as pd

W = sys.argv[1]
d = pd.read_csv(os.path.join(W, "dataset.csv"))
rows = []
for _, r in d[~d.analyzable].iterrows():
    reason = r.notes if not r.has_official_lyrics else "no public-domain / CC-licensed English translation found on Wikipedia (likely copyrighted modern lyrics or untranslated)"
    if not r.has_official_lyrics and not str(r.notes).strip():
        reason = "no official lyrics"
    rows.append({"country": r.country, "song_type": r.song_type, "title": r.title, "status": "excluded from analysis", "reason": reason})
CAVEATS = [
    ("Afghanistan", "national anthem", "2006 'Milli Surud' analysed; the de facto Taliban administration does not use it (uses an a cappella nasheed)"),
    ("Syria", "national anthem", "Humat ad-Diyar analysed; post-2024 transition anthem status is in flux"),
    ("San Marino", "national anthem", "Lyrics (Carducci) adopted only in 2025 per Wikipedia; before that the anthem was instrumental"),
    ("Cyprus", "national anthem", "Uses Greece's Hymn to Liberty: identical text, counted for both countries"),
    ("Northern Cyprus", "national anthem", "Uses Turkey's Istiklal Marsi: identical text, counted for both"),
    ("Denmark", "royal anthem", "Denmark has two anthems; 'Der er et yndigt land' is treated as the national anthem, 'Kong Christian' as royal"),
    ("Germany", "national anthem", "Only stanza 3 is official; the full 1841 poem is a separate 'historic' row"),
    ("Finland", "national song", "Finlandia hymn: English rendering is an agent translation of the Finnish original (no PD translation on Wikipedia)"),
    ("Indonesia", "national song", "Indonesia Pusaka: English rendering is an agent translation of the Indonesian original"),
    ("(all)", "all", "Long anthems are analysed on their first ~300 words; Wikipedia often prints all stanzas while only some are sung"),
    ("(all)", "all", "Translations are mostly from Wikipedia (CC BY-SA, translator often unattributed); quality and register vary"),
    ("New Zealand", "national anthem", "Second anthem 'God Save the King' not duplicated (same text as UK)"),
]
for c, t, why in CAVEATS:
    rows.append({"country": c, "song_type": t, "title": "", "status": "included with caveat", "reason": why})
pd.DataFrame(rows).to_csv(os.path.join(W, "coverage_gaps.csv"), index=False)
print(pd.DataFrame(rows).to_string())
