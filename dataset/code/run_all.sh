#!/usr/bin/env bash
# Reproduce the Global Anthem Atlas end to end.
# Usage: bash code/run_all.sh <workdir> <media_dir>
# Requires: python3.12, pip install -r code/requirements.txt ; network access to en.wikipedia.org / en.wikisource.org / huggingface.co
set -euo pipefail
W=${1:-.}
MEDIA=${2:-$W/media}
HERE=$(cd "$(dirname "$0")" && pwd)
cd "$W"
# hand-made inputs (validation labels, archetype names) live in ../data next to this code folder
cp -n "$HERE/../data/validation_hand_labels.csv" "$HERE/../data/archetype_names.json" . 2>/dev/null || true
curl -sL -o reys_anthems.csv https://raw.githubusercontent.com/reys1226/CECS450-Project1/HEAD/datasets/anthems.csv
python "$HERE/01_list.py" data_list.csv
python -c "import pandas as pd,urllib.parse as u; d=pd.read_csv('data_list.csv'); d['wiki_page']=d.wiki_page.map(lambda x:u.unquote(x) if isinstance(x,str) else x); d.to_csv('data_list.csv',index=False)"
python "$HERE/02_extract.py" data_list.csv extract_anthems.json
python -c "
import sys,json; sys.path.insert(0,'$HERE')
from songs_list import SONGS
import importlib; ex=importlib.import_module('02_extract')
res={}
for c,p,t,page,n in SONGS:
    if page not in res: res[page]=ex.extract(page)
json.dump(res,open('extract_songs.json','w'),ensure_ascii=False,indent=1)"
python "$HERE/03_dataset.py" .
python "$HERE/03b_alt_translations.py" .
python "$HERE/04_models.py" .
python "$HERE/05_analyze.py" . "$MEDIA"
python "$HERE/06_gaps.py" .
python "$HERE/07_pairs.py" .
# Energy x Wisdom latent space, etymology layer and world map (operate on the internal/anthem-atlas layout)
ATLAS=$(cd "$HERE/.." && pwd)
python "$HERE/09_etymology.py" "$ATLAS" "$W/wikt_cache"
python "$HERE/11a_awakening_models.py" "$ATLAS"
python "$HERE/11_awakening.py" "$ATLAS"
python "$HERE/08_energy_wisdom_space.py" "$ATLAS" "$MEDIA"
[ -f ne_50m_admin_0_countries.shp ] || (curl -sL -o ne50.zip https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.zip && unzip -o -q ne50.zip)
python "$HERE/10_world_map.py" "$ATLAS" "$MEDIA" ne_50m_admin_0_countries.shp
python "$HERE/12_pairs_v2.py" "$ATLAS"
python "$HERE/13_country_spectra.py" "$ATLAS"
python "$HERE/14_country_spectra_figures.py" "$ATLAS" "$MEDIA" ne_50m_admin_0_countries.shp
