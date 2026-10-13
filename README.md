# Global Anthem Atlas: public website

A static, backend-free website for the Global Anthem Atlas ("open release"). It has four pages:

| Page | What it shows |
|---|---|
| `index.html` | The story (Geyam vs Geetham → the world's anthems), key findings and the "themes, not rankings" note |
| `map.html` | Equal Earth world map: continuous Energy × Wisdom field, or Energy, Wisdom, Mobilisation, Awakening or any of the 12 themes; uncertainty as fade or hatch; spectrum card on click |
| `explore.html` | Energy × Wisdom scatter over a density heat map, with optional search and optional 90% ranges |
| `method.html` | Axes, the full formula (KaTeX), etymology layer, uncertainty, limitations, bias audit, AI-use disclosure |

No lyric text is included anywhere in the site or its data. Cards show scores, a short generated reading and a link to the pinned Wikipedia revision each song was scored from.

**Author:** atlas-awareness. Built with AI agents; atlas-awareness is responsible.

**Licences:** data, scores and readings are CC BY-SA 4.0 (`LICENSE-DATA.txt`); code is MIT (`LICENSE-CODE.txt`). The site includes material adapted from English Wikipedia (Wikipedia contributors, CC BY-SA 4.0); full attribution is in `method.html#credits`.

## Layout

This repository is the GitHub Pages root (site files at `/`). Analysis docs and the public dataset sit in sibling folders that Pages will also serve as extra paths, not as the homepage.

```
/                  index.html  map.html  explore.html  method.html
assets/            style.css, JS, favicon.svg
data/              atlas.json, world.topo.json
vendor/            d3, topojson-client, KaTeX (+ fonts and licences)
tools/             build_data.py, build_geo.sh
atlas-docs/        atlas report, country spectra, preprint, checklist, review sheet
dataset/           public Zenodo package (scores, figures, code, licences)
media/             maps and site screenshots
LICENSE-DATA.txt   CC BY-SA 4.0
LICENSE-CODE.txt   MIT
.nojekyll          netlify.toml
```

Every site asset is local: there are no CDN, font or analytics requests. The site is about 1.7 MB uncompressed; the map page, the heaviest, transfers about 310 KB gzipped (GitHub Pages and Netlify compress automatically).

**Not in this repository:** `internal/release/withheld/` (the two AI translations), the raw in-copyright lyric table, Wikipedia fetch caches, `node_modules`, and `__pycache__`.

## Run locally

Any static file server works. The pages use ES modules and `fetch`, so opening the files directly with `file://` will not work.

```bash
python3 -m http.server 8080
# open http://localhost:8080/
```

## Rebuild the data (only when the atlas results change)

`data/atlas.json` and `data/world.topo.json` are committed, so deploying needs no build step. To regenerate them from the analysis `results/` (not shipped in this repo):

```bash
pip install pandas country_converter
python tools/build_data.py
```

The script joins each geography to Natural Earth by ADM0_A3 code, attaches the plain-language readings, and never reads lyric columns into the output. To rebuild the simplified boundaries themselves, run `tools/build_geo.sh` (needs Node and network access once).

## Deploy to GitHub Pages

Site files are already at the repository root. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions** (workflow `.github/workflows/pages.yml`) or **Deploy from a branch** (`master` or `main`, folder `/ (root)`). Keep `.nojekyll` so GitHub serves every file untouched. Intended URL: `https://kprasant9.github.io/atlas-awareness/`. All links are relative.

A `.zenodo.json` and root `CITATION.cff` are in the tree so that enabling this repository under [Zenodo’s GitHub tab](https://zenodo.org/account/settings/github/) and cutting a tagged GitHub release (`v1.0.0`) archives the public package and mints a DOI. The DOI is then written back into `CITATION.cff`, this README, the preprint, and `method.html` credits. Withheld lyrics are not in this repository.

## Deploy to Netlify

Drag and drop the repository root (or just the site files). From Git: import the repository and leave the build command empty; `netlify.toml` at the root publishes this folder.

```bash
npm install -g netlify-cli
netlify deploy            # draft URL for review
netlify deploy --prod     # publish
```

## Before publishing

- [x] **Licences set.** Data, scores and readings: CC BY-SA 4.0 (`LICENSE-DATA.txt`). Code: MIT (`LICENSE-CODE.txt`). Both are shown in every page footer and in `method.html` section 10, with Wikipedia attribution following the release's `NOTICE.md`.
- [x] **No lyrics.** The site shows no lyric text. Checked against the 164 songs marked scores-only in `internal/release/rights-audit.csv`: once song titles (many anthems are named after their first line) are excluded, no 6-word sequence of their English or original text appears in any page or data file.
- [x] **Author filled.** Footers, method credits and `LICENSE-CODE.txt` name atlas-awareness (name and affiliation). Contact email omitted. Zenodo DOI and preprint URL stay as placeholders until those are posted:
  ```bash
  grep -rn "ZENODO_RECORD_ID\|PREPRINT_URL_PLACEHOLDER" --include=*.html --include=*.txt .
  ```
- [ ] **Review.** Readings are machine-generated from the scores. A native-speaker review of the 22 low-confidence songs is still open.

## Accessibility and design notes

- Keyboard: every control is a native element. The map's "Find a country" box and the alphabetical table view open any card without a mouse; `Esc` closes a card.
- Screen readers: maps and charts have text descriptions; cards announce politely; values have spoken descriptions such as "more than typical".
- Colour: the combined field uses orange, blue and lightness (no red-versus-green); single layers use the PuOr diverging scheme. Uncertainty is also available as a hatch pattern, which does not rely on colour.
- Neutrality: nothing is highlighted on load, lists are alphabetical, and no page ranks countries.
