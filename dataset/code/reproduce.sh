#!/usr/bin/env bash
# Reproduce every number in the release from public sources.
# Usage: bash code/reproduce.sh [PACKAGE_DIR]
# Requires: Python 3.12, pip install -r code/requirements.txt, network access to en.wikipedia.org,
# en.wiktionary.org, github.com, huggingface.co and naciscdn.org. CPU only; the model step is the slow one.
# The shipped results/ and models_out/ are moved to reference/ first and compared at the end.
set -euo pipefail
PKG=$(cd "${1:-$(dirname "$0")/..}" && pwd)
cd "$PKG"
python code/rehydrate.py "$PKG" || echo "WARNING: rehydration mismatches (see above); continuing"
if [ ! -d reference ]; then
  mkdir -p reference/data_terms
  mv results models_out reference/
  cp data/etymology_core_terms.csv data/awakening_core_terms.csv data/coverage_gaps.csv reference/data_terms/
fi
mkdir -p results models_out work/figures
# The *_v1 files are frozen snapshots of the pre-redefinition Energy; steps 08 and 10 read them to report what moved.
cp reference/results/*_v1.* results/
ln -sfn ../models_out data/models_out
ln -sfn ../results data/results
python code/04_models.py data
python code/05_analyze.py data work/figures
python code/06_gaps.py data
python code/07_pairs.py data
python code/09_etymology.py "$PKG" work/wikt_cache
python code/11a_awakening_models.py "$PKG"
python code/11_awakening.py "$PKG"
python code/08_energy_wisdom_space.py "$PKG" work/figures
SHP=work/ne_50m_admin_0_countries.shp
[ -f "$SHP" ] || (curl -sL -o work/ne50.zip https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.zip && unzip -o -q work/ne50.zip -d work)
python code/10_world_map.py "$PKG" work/figures "$SHP"
python code/12_pairs_v2.py "$PKG"
python code/13_country_spectra.py "$PKG"
python code/14_country_spectra_figures.py "$PKG" work/figures "$SHP"
rm -f data/models_out data/results
python code/compare_results.py reference "$PKG" work/reproduction_report.json
