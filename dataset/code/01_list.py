"""Parse Wikipedia 'List of national anthems' into a metadata table."""
import re
import sys

import pandas as pd
from bs4 import BeautifulSoup

sys.path.insert(0, __import__("os").path.dirname(__file__))
from wiki import parse

title, html = parse("List_of_national_anthems", prop="text")
soup = BeautifulSoup(html, "lxml")
rows = []
for ti, table in enumerate(soup.select("table.wikitable")):
    status = "UN member/observer" if ti == 0 else "partially recognised"
    for tr in table.select("tr")[1:]:
        th = tr.find("th")
        raw = tr.find_all("td")
        if not th or len(raw) < 4:
            continue
        tds = []
        for td in raw:
            tds.extend([td] * int(td.get("colspan", 1)))
        if ti == 1:
            tds = tds[:3] + tds[4:]
        country = th.get_text(" ", strip=True)
        country = re.sub(r"\s+", " ", country).strip()
        a = tds[0].find("a")
        link = a["href"].split("/wiki/")[-1] if a and a.get("href", "").startswith("/wiki/") else None
        small = tds[0].find("small")
        eng_title = small.get_text(strip=True).strip("()\"\u201c\u201d") if small else None
        if small:
            small.extract()
        rows.append({
            "country": country,
            "status": status,
            "title": tds[0].get_text(" ", strip=True).strip('"\u201c\u201d '),
            "title_english": eng_title,
            "adopted": tds[1].get_text(" ", strip=True),
            "lyricist": tds[2].get_text(" ", strip=True),
            "composer": tds[3].get_text(" ", strip=True),
            "wiki_page": link,
        })
df = pd.DataFrame(rows)
df["adopted"] = df["adopted"].str.replace(r"\[.*?\]", "", regex=True)
for c in ["lyricist", "composer", "title"]:
    df[c] = df[c].str.replace(r"\[.*?\]", "", regex=True).str.strip()
df.to_csv(sys.argv[1] if len(sys.argv) > 1 else "list.csv", index=False)
print(len(df), df.status.value_counts().to_dict())
print(df.head(10).to_string())
print(df[df.status != "UN member/observer"].to_string())
