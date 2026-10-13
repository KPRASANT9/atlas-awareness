---
cursor:
  subagentId: "bc-d04f6980-c727-56af-bf0d-b5b864b280fc"
---

# Open release checklist: Global Anthem Atlas

Everything that can be prepared without your accounts is done. Nothing has been uploaded or published. The steps under "What you need to do" are in order, and each has a rough time estimate for you.

## Done (ready for your review)

| Item | Where | Status |
|---|---|---|
| Rights audit of every song (original lyrics and translation separately; source, licence, status, release decision, attribution) | `internal/release/rights-audit.csv` | Done: 254 rows |
| Rights summary, rules and licence decision (data CC BY-SA 4.0, code MIT) | `internal/release/rights-audit-summary.md` | Done |
| Zenodo package: cleaned data with withheld texts removed, scores, country spectra, figures, code, README, datasheet, NOTICE, licences, CITATION.cff, zenodo.json, checksums | `internal/release/zenodo/` | Done; it is about 16 MB, so zip the folder to upload it |
| Rehydration and reproduction tooling (pinned Wikipedia revisions, pinned GitHub commit, hash verification, full re-run and comparison) | `internal/release/zenodo/code/rehydrate.py`, `reproduce.sh`, `compare_results.py` | Done. Clean-copy run: see `internal/release/reproduction-report.md` |
| Withheld texts (the two AI translations). **Never upload this folder.** | `internal/release/withheld/` | Kept internal |
| Preprint draft (Markdown + PDF), with every citation verified | `docs/preprint/anthem-atlas-preprint.md`, `docs/preprint/anthem-atlas-preprint.pdf` | Draft v0.9 |
| Native-speaker review sheet (83 songs, 376 items) | `docs/native-speaker-review-sheet.md`, `internal/release/review-sheet.csv` | Ready to send |
| Build scripts (rebuild the audit, the package and the review sheet) | `internal/release/build/` | Done |

## What you need to do, in order

### 1. Decide on the name and affiliation — done
- **Author name and affiliation:** atlas-awareness (no surname, no email).
- Placeholders are filled in the preprint, `package_docs/` (README, CITATION.cff, zenodo.json, LICENSE-CODE.txt, DATASHEET.md), the generated `internal/release/zenodo/` copies, and the site footer/credits.
- Remaining work below is your accounts and the publish steps (Zenodo, GitHub, SocArXiv/arXiv). Optionally add an ORCID at orcid.org.

### 2. Final read of the rights decisions (30–45 min)
- Skim `internal/release/rights-audit-summary.md`, especially "Residual risks".
- Open `rights-audit.csv` filtered to `release_decision = text released` (78 rows) and spot-check about ten of them. Two things to check: is the lyricist dead before 1956, and is the English an unattributed Wikipedia translation?
- Decide whether you are comfortable presuming that unattributed Wikipedia translations are CC BY-SA, which is the main assumption. If you are not, set those rows to "scores only" and rebuild. The release then shrinks to 19 public-domain texts.
- Optional: if you want the scores under a more permissive licence, publish `results/` as a separate CC BY 4.0 or CC0 record. The summary explains why that is possible.

### 3. Final read of the preprint (1–2 h)
- Read `docs/preprint/anthem-atlas-preprint.pdf` end to end. Check that you agree with:
  - the AI-use statement (§9), which states that you are responsible for the content;
  - the ethics and neutrality statement (§8);
  - the India case study (§6).
- Every reference was checked against Crossref, arXiv or Open Library on 2026-10-13. Please still open three or four of them yourself.
- To rebuild the PDF after editing: `cd docs/preprint && pandoc -f markdown+tex_math_single_backslash anthem-atlas-preprint.md --citeproc --pdf-engine=xelatex -o anthem-atlas-preprint.pdf`

### 4. Create the accounts (15 min)
- **Zenodo** (zenodo.org): sign in with GitHub or ORCID.
- **GitHub** (github.com), if you want the code in a public repository as well. Recommended: Zenodo can archive each GitHub release automatically.
- **SocArXiv** (osf.io/preprints/socarxiv), which needs an OSF account. **And/or arXiv** (arxiv.org): a first-time submitter in cs.CL needs an *endorsement* from an established arXiv author. Allow a few days for that, or start with SocArXiv, which needs no endorsement.

### 5. Publish the dataset on Zenodo (20–30 min)
1. Zip the package: `cd internal/release && zip -r global-anthem-atlas-v1.0.0.zip zenodo`.
   - Do **not** include `withheld/`, `build/sources/cache/` or `internal/anthem-atlas/data/dataset.csv`. These contain in-copyright texts.
2. Create a new upload and click **Reserve DOI**. Copy the DOI into `CITATION.cff`, the README citation section and the preprint's §10, then rebuild and re-zip.
3. Fill in the form from `zenodo.json`:
   - title and description;
   - licence: CC BY-SA 4.0;
   - type: Dataset;
   - keywords;
   - version: 1.0.0.

   In the description, state that `code/` is under MIT. Zenodo allows only one licence field.
4. Upload the zip, preview the record, then publish.
   - Publishing is permanent: a DOI cannot be deleted, although files can be replaced in a new version.

### 6. Optional: publish the code on GitHub (20 min)
1. Create a public repository, for example `global-anthem-atlas`.
2. Copy in the contents of `internal/release/zenodo/` **except** `results/`, `models_out/` and `figures/`, if you want a small repository; those stay on Zenodo.
3. Rename `zenodo.json` to `.zenodo.json`. That is the file name Zenodo's GitHub integration reads.
4. Add a LICENSE file containing the MIT text from `LICENSE-CODE.txt`.
5. Optionally enable the Zenodo–GitHub integration, so that each future GitHub release gets a DOI.

### 7. Post the preprint (30 min; arXiv moderation takes 1–2 working days)
- **SocArXiv:**
  - upload the PDF;
  - subjects: Social and Behavioral Sciences › Sociology;
  - licence: CC BY 4.0 or CC BY-SA 4.0, as you prefer for the paper;
  - link the Zenodo DOI as the data.
- **arXiv:**
  - primary category **cs.CL**, cross-listed to **cs.CY** and **physics.soc-ph**;
  - arXiv prefers LaTeX source: `pandoc ... -s -o anthem-atlas-preprint.tex` produces one, which you upload together with the figures from `media/`. A PDF-only submission is also accepted.
- After posting, add the preprint link to the Zenodo record under related identifiers ("is supplement to") by making a new version or editing the metadata.

### 8. Send the native-speaker review sheet (15 min to send; reviewers' time varies)
- Send `docs/native-speaker-review-sheet.md` and `internal/release/review-sheet.csv` privately to reviewers, matched by language. The language index is at the end of the sheet.
- The sheet quotes lyric excerpts of up to 20 words, so do not post it publicly.
- When answers come back, the corrected terms can be applied and a v1.1 released as a new Zenodo version.

## Blockers and caveats

- **Nothing blocks the upload except your accounts, your name and your final read.**
- **Exact reproduction needs two texts that are not public.** These are the AI translations of *Finlandia-hymni* (S220) and *Indonesia Pusaka* (S234). A public re-run rehydrates the other 252 rows exactly; these two differ, and so do the corpus-wide standardisations that depend on them. This is documented in the README.
- **Step 09 checks Wiktionary live.** Its verification flags can change as Wiktionary is edited. The scores themselves do not depend on this check.
- **The etymology layer has not had native-speaker review.** The preprint says so. Running the review before posting is optional but strengthens the paper.
- **arXiv endorsement** may delay an arXiv posting. SocArXiv does not need one.
