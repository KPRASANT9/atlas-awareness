#!/usr/bin/env bash
# Rebuilds tools/ne_50m_admin_0_countries.topo.json from Natural Earth 1:50m admin-0 (public domain).
# Then run tools/build_data.py to attach geographies and write data/world.topo.json.
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp -d)"
curl -sSL -o "$tmp/ne50.geojson" \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson
npx --yes mapshaper@0.6.102 "$tmp/ne50.geojson" \
  -filter 'ADMIN != "Antarctica"' \
  -filter-fields ADM0_A3,ADMIN,NAME,SOV_A3,LABEL_X,LABEL_Y \
  -simplify 35% keep-shapes \
  -o format=topojson quantization=1e5 ne_50m_admin_0_countries.topo.json
rm -rf "$tmp"
