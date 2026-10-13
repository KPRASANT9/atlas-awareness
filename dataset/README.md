# Global Anthem Atlas: dataset, scores and code (v1.0.0)

A computational reading of the lyrics of the world's national anthems and national songs. It covers 254 songs from 219 countries and regions, of which 242 have scorable lyrics. The release includes:

- 12 theme scores per song, built from an English lexicon, sentence-embedding anchors, zero-shot NLI and, for 159 songs, original-language roots;
- two descriptive indices, **Energy** (Mobilisation + Awakening) and **Wisdom** (justice/peace, truth/virtue, future), each with 90% uncertainty intervals;
- five soft "archetypes" in a latent space;
- per-country spectra with a data-confidence grade.

> **Read this first.** Energy and Wisdom describe what the *words* of a song talk about and how hard they push. They are not scores of countries, cultures or peoples, and no ranking of nations is intended or supported. Single-song levels carry about ±1 level of uncertainty, mostly from translation. Report intervals, not levels.

Author: atlas-awareness, atlas-awareness. Preprint: [SocArXiv/arXiv link, to be added].

## What is in the package

| Path | Contents |
|---|---|
| `data/songs.csv` | One row per song (254): metadata, region, song type, source article and pinned Wikipedia revision. Texts are included only where rights allow (`text_release`; see below). SHA-256 hashes cover every text, including withheld ones. |
| `data/rights_audit.csv` | Per-song rights status of the original lyrics and of the English translation, the release decision, and the attribution line |
| `data/source_revisions.csv` | Wikipedia revision ids for all 250 source articles (as of 2026-10-03 02:30 UTC) |
| `data/alt_translations_index.csv` | Hashes of the second, independent English translation used for the translation-robustness check (texts withheld) |
| `data/etymology_core_terms.csv`, `data/awakening_core_terms.csv` | 295 + 59 curated original-language key terms, with root, gloss, semantic fields, English rendering, drift and verification |
| `data/validation_hand_labels.csv`, `data/awakening_hand_labels.csv` (+ sample files) | Blind hand labels: 30 songs × 11 themes, and 50 songs for Awakening |
| `data/coverage_gaps.csv`, `data/data_list.csv`, `data/archetype_names.json` | Coverage and caveats, the list of anthems, and the archetype names |
| `data/manual_texts.json`, `cache/wikisource_morning_song_text.json` | Public-domain or CC BY-SA texts that the code previously embedded (UK, US, German anthems; Tagore's 1919 translation) |
| `results/` | All scores and diagnostics. The main tables are `energy_wisdom_scores.csv` (final axes), `country_spectra_wide.csv` (per song and per country, with 90% intervals and confidence), `scores.csv` (themes, archetypes, first-draft indices) and `*_summary.json` (validation, reliability and sensitivity). `*_v1` files are the pre-redefinition snapshots. |
| `models_out/` | Cached model outputs: sentence embeddings, anchor similarities and NLI probabilities for the main and second-translation corpora |
| `figures/` | All figures in the atlas and preprint |
| `code/` | The pipeline (`01`–`14`), plus `rehydrate.py`, `reproduce.sh` and `compare_results.py` |
| `DATASHEET.md` | Datasheet in the format of Gebru et al. (2021) |
| `NOTICE.md` | Attribution for every third-party text included |
| `LICENSE-DATA.txt`, `LICENSE-CODE.txt` | CC BY-SA 4.0 (data, results, figures, docs) and MIT (code) |
| `CITATION.cff`, `zenodo.json`, `MANIFEST.sha256` | Citation and deposit metadata, and a checksum of every file |

### Which texts are included

Many anthem lyrics and most of their English translations are still in copyright, so texts are released only where every layer is cleared. Every song still has its scores.

| `text_release` | Songs | What `songs.csv` contains |
|---|---|---|
| `text released` | 78 | English `analysis_text` (public domain or CC BY-SA 4.0 Wikipedia translation) and the original text where one exists |
| `original-language text released; English withheld (scores only)` | 23 | The public-domain original only |
| `scores only, text withheld` | 141 | No text, only the hashes |
| `not in release text …` | 12 | Not analysed (no official lyrics, or no free English text) |

The rules and their justification are in `DATASHEET.md` §Composition and in `data/rights_audit.csv`. If you believe a text is mis-classified, contact the author and it will be removed in a new version.

## Quick start: use the scores

```python
import pandas as pd
s = pd.read_csv("results/country_spectra_wide.csv")
songs = s[s.row_type == "song"]          # 242 songs; row_type == "geography" gives 219 country/region rows
songs[["song_id", "geography", "title", "energy", "energy_lo90", "energy_hi90",
       "wisdom", "wisdom_lo90", "wisdom_hi90", "confidence"]]
```

Join on `song_id` with `data/songs.csv` for metadata and with `data/rights_audit.csv` for text status.

## Reproduce everything

Requirements: Python 3.12, about 4 GB of RAM, a CPU, and network access to en.wikipedia.org, en.wiktionary.org, github.com, huggingface.co and naciscdn.org.

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r code/requirements.txt          # torch is pinned to the CPU build; use --extra-index-url https://download.pytorch.org/whl/cpu
bash code/reproduce.sh .                      # rehydrate texts, re-run steps 03b–14, then compare with the shipped outputs
```

- **`code/rehydrate.py`** re-fetches every withheld text from its public source at the exact version used. The sources are the Wikipedia articles at the pinned revision ids, the second-translation corpus at a pinned git commit, and Wikisource. It then rebuilds the working `data/dataset.csv` and checks every text against the shipped SHA-256 hashes. The rehydrated files contain in-copyright texts, so do not redistribute them.
  - Two songs cannot be rehydrated from public sources: S220 *Finlandia-hymni* and S234 *Indonesia Pusaka*. Their English texts are AI-agent translations of in-copyright lyrics. Without them, those two rows differ, and so do the downstream numbers that depend on the whole corpus (standardisation, quintile cut points). Researchers who need an exact reproduction can request the file and point the environment variable `ANTHEM_WITHHELD_TEXTS` at it.
- **`code/reproduce.sh`**:
  - moves the shipped `results/` and `models_out/` to `reference/`;
  - re-runs the models (all-mpnet-base-v2, paraphrase-multilingual-mpnet-base-v2, LaBSE, DeBERTa-v3 zero-shot NLI) and every analysis step;
  - downloads Natural Earth;
  - writes `work/reproduction_report.json` with a file-by-file comparison.
- **Expected differences.**
  - Step 09 queries live Wiktionary pages to *verify* etymology lemmas, so its verification flags can change as Wiktionary is edited.
  - Results that pass through floating-point model inference can differ in the last digits on different CPUs.
  - `results/summary.json` (translation block) and `results/translation_sensitivity.csv` are shipped as first computed, before the second-translation corpus had its line breaks restored. A fresh run gives the corrected values stored in `results/translation_check_relined.json`.
- **Verified before release.** A clean copy of this package was rehydrated (254/254 songs and 195/195 second translations matched the hashes, with the two withheld texts supplied) and re-run on a 4-CPU machine in about 40 minutes.
  - 36 of the 44 regenerated output files were byte-identical, including every main-corpus model output, score, summary and map class.
  - Six files differed only in the second-translation NLI probabilities (≤ 0.004, from CPU floating-point non-determinism) and in values derived from them (≤ 0.005).
  - The other two differed by design, as described above.

## Licences

- Data, results, figures and documentation: **CC BY-SA 4.0** (`LICENSE-DATA.txt`).
  - The included translations are Wikipedia text under CC BY-SA 4.0. Their attribution is in `NOTICE.md` and in the `attribution` column of `data/rights_audit.csv`.
  - Public-domain lyrics remain public domain.
- Code: **MIT** (`LICENSE-CODE.txt`).
  - The code imports the GPL-3.0 package `country_converter` but does not include it.
- Models and Natural Earth are not redistributed. See `NOTICE.md` for their licences.

## How it was made (AI use)

The pipeline, the analyses, the rights audit and this documentation were built with AI coding and research agents working under the direction of the human author, atlas-awareness, who is responsible for the content. The two flagged English translations (S220, S234) were produced by an AI agent and have not been independently verified. Etymological claims were curated with AI assistance, verified automatically against the texts and Wiktionary, and are awaiting native-speaker review.

## Citation

See `CITATION.cff`. Please cite the dataset DOI and, for the method, the preprint.
