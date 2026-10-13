# Datasheet: Global Anthem Atlas v1.0.0

This follows the question set of Gebru et al., "Datasheets for Datasets" (*Communications of the ACM* 64(12), 2021, doi:10.1145/3458723).

## Motivation

**For what purpose was the dataset created?**
- To describe, comparably across the world, what national anthems and national songs talk about (12 themes) and how they address their listeners. Two descriptive indices summarise this:
  - **Energy:** rousing by struggle and calls to action, or by waking, hailing and collective song;
  - **Wisdom:** justice and peace, truth and virtue, and the future.
- The starting question was whether India's two national songs, *Vande Mataram* and *Jana Gana Mana*, represent different traditions found elsewhere in the world. It was then extended to every country.
- The indices are descriptive theme profiles. They are not judgements of songs, states or peoples.

**Who created it, and who funded it?** atlas-awareness, atlas-awareness, working with AI coding and research agents. No external funding.

## Composition

**What do the instances represent?**
- One instance is one song text as officially adopted, or a documented historic or full-poem version.
- The 254 instances are:
  - 204 national anthems: all 195 UN members and observers, 9 partially recognised states, and Denmark's second anthem;
  - 23 national songs;
  - 14 sub-national songs (Wales, England, Catalonia, Hawaiʻi, seven Indian states and others);
  - 8 historic versions;
  - 4 royal anthems;
  - 1 second anthem.
- 242 instances are analysed. The other 12 have no official lyrics or no free English text; they are listed with reasons in `data/coverage_gaps.csv`.
- Songs are grouped into 219 geographies. 212 of them have scored lyrics.

**What does each instance consist of?**
- Metadata: country, UN region and sub-region, song type, title, English title, lyricist, composer, year, source article and pinned revision.
- The English text scored (`analysis_text`, the first ~300 words) and the original-language text. Both are present only where rights allow.
- SHA-256 hashes of all texts.
- Derived features: 12 theme scores and their four readings, Mobilisation, Awakening and their facets, Energy and Wisdom with 90% intervals and quintile levels, archetype, embeddings, the etymology layer, translation drift, and a confidence grade.

**Is any information missing?**
- Texts for 141 analysed songs are withheld for copyright reasons, and the English for 23 more. All of these can be rehydrated (see Distribution), except two AI-agent translations (S220, S234).
- Music is represented only by a sparse march/slow flag (24 songs) and by lyric structure (refrains, final acclamations).

**Is it a sample?**
- National anthems are close to the full population of sovereign states (193 of 195 UN members and observers have analysed texts).
- National, sub-national and historic songs are a curated, non-exhaustive selection. No source defines "national song" consistently.

**Labels.**
- Blind hand labels from the analyst, made before any scores were seen:
  - 11 themes for 30 randomly sampled songs (`validation_hand_labels.csv`);
  - Awakening for 50 songs (`awakening_hand_labels.csv`).
- These are single-annotator labels. No inter-annotator agreement is available.

**Are there recommended splits?** No. The dataset is descriptive, not a training benchmark.

**Errors, noise and redundancy.**
- **Translation is the largest error source.** Scores are computed on English translations of varying provenance, register and fidelity. An independent second translation (195 anthems) reproduces the ranks with ρ = 0.84 (Energy) and 0.83 (Wisdom), and 82% of songs stay within one level on both axes.
- **Measurement reliability is modest:** Wisdom α = 0.47, Struggle 0.34.
- **Some texts are shared.** Cyprus uses Greece's text, and Northern Cyprus uses Turkey's.
- The intervals in `results/country_spectra_wide.csv` combine bootstrap refits, method and weight variants, and translation noise.

**Is the dataset self-contained?**
- Partly. Withheld texts are referenced by pinned Wikipedia revision ids (`data/source_revisions.csv`), by a pinned git commit for the second-translation corpus, and by Wikisource. Archival permanence of those sources is not guaranteed.
- Wikipedia keeps old revisions unless they are deleted or suppressed. A GitHub repository can be deleted.

**Confidential or sensitive data?**
- No personal data beyond the public names and dates of lyricists and composers.
- The content is politically and religiously sensitive by nature: national symbols, war, monarchy, God. Some anthems are disputed or not used by current de facto authorities (Afghanistan), or are in transition (Syria). These cases are flagged in `coverage_gaps.csv`.

**Rights status of the texts.**
- Every song has a rights audit (`data/rights_audit.csv`). A text is released only if both its original lyrics and its English translation are cleared.
- **Original lyrics** are public domain if all identified lyricists died in or before 1955 and the text was first published before 1931. Longer national terms are applied where they apply. Old texts first published after 1930 are treated as unclear, because of US terms.
- **Translations:**
  - unattributed Wikipedia translations are presumed to be editor translations under CC BY-SA 4.0;
  - named modern translators, books and websites are treated as copyrighted;
  - official translations are treated as unclear;
  - pre-1931 translations by translators who died by 1955 are public domain.
- **Results:** 19 public domain, 59 CC BY-SA, 47 unclear and 117 copyrighted among the 242 analysed songs.

## Collection process

**How was the data acquired?**
- The list of anthems comes from Wikipedia's "List of national anthems".
- Lyrics and translations come from the Lyrics sections of each song's English Wikipedia article (240 of 242 analysed texts). The extraction code is `code/02_extract.py`, and the dataset build is `code/03_dataset.py`.
- Curated public-domain texts:
  - Sri Aurobindo's 1909 *Vande Mataram* translation;
  - Tagore's 1919 *Morning Song of India* (Wikisource);
  - the official third stanza of Germany's anthem;
  - verses 1–4 of the US anthem (1814);
  - the three standard UK verses.
- Two songs had no public translation. An AI agent translated them from the original text: the *Finlandia* hymn and *Indonesia Pusaka*. Both are flagged.
- An independent second English corpus (github.com/reys1226/CECS450-Project1, scraped from nationalanthems.info) was used only for the translation-robustness check.

**Over what time frame?** The pipeline ran on 2026-10-03. Every Wikipedia source is pinned to the revision current at 02:30 UTC that day, and the pins were verified to reproduce the dataset exactly.

**Ethical review?** None was sought. The data are published texts and public metadata, with no human subjects. The hand labels were made by the author.

## Preprocessing, cleaning and labelling

- Wiki markup, references and repeat signs were removed. English texts were truncated to roughly the first 300 words, which is about the length usually printed and sung.
- The second-translation corpus had lost its line breaks. These were recovered heuristically from verse-initial capitals (`code/relineate.py`).
- Features come from:
  - sentence embeddings: all-mpnet-base-v2, paraphrase-multilingual-mpnet-base-v2 and LaBSE;
  - zero-shot NLI: MoritzLaurer/deberta-v3-base-zeroshot-v2.0;
  - lexicons and anchor sentences, in `code/themes.py` and `code/awakening.py`;
  - a curated etymology layer: 295 + 59 terms in 48 languages, with a 140-group light root lexicon.
- Length, line length, archaic diction and curated-text status are regressed out of every axis item. The full formula is in the preprint and in the atlas §7.
- The raw extractions are not shipped, because they contain in-copyright text. `code/rehydrate.py` regenerates them.

## Uses

**Intended uses.**
- Comparative, descriptive research on the language of national symbols, for example themes by era or region, or anthems compared with national songs.
- Teaching computational text analysis, translation sensitivity and measurement validity.
- A starting point for native-speaker and musicological work.

**Uses to avoid.**
- Ranking or scoring countries, cultures or peoples. Treating Energy as aggression or Wisdom as moral worth.
- Quoting a single song's level without its interval.
- Drawing conclusions about music or performance.
- Treating the etymology layer as philologically authoritative before native-speaker review.
- Redistributing rehydrated texts.

**Known biases and risks.**
- **Resource bias.** Languages the root lexicon does not cover have no etymology layer and wider intervals. These are mainly East and South-east Asian, Austronesian, Pacific and Central Asian languages. The 43 songs translated without an etymology check account for 13 of the 22 Low confidence grades.
- **Colonial and outsider translations.** Many English versions were made by colonial-era translators, outsiders or anonymous Wikipedia editors. Archaic diction is regressed out of the axes, but not out of the theme spectra.
- **Language-family association.** Language family explains 13% of Energy beyond sub-region. The independent second translation reproduces this, so it is probably not one translator's artefact; the likeliest explanation is history (revolutionary marches versus hymns). A register effect cannot be ruled out.
- **Western theme lexicons.** The theme lexicons and anchors are written in English by one analyst.

## Distribution

- **Repository:** Zenodo, DOI `[to be assigned]`.
- **Licences:**
  - Data, results, figures and documentation: CC BY-SA 4.0, because the dataset includes CC BY-SA text adapted from Wikipedia. Attribution is in `NOTICE.md`.
  - Code: MIT.
- **Third-party components that are not redistributed:**
  - Natural Earth (public domain);
  - Hugging Face models (Apache-2.0 and MIT);
  - the second-translation corpus (no licence; withheld; only hashes and derived scores are shipped).

## Maintenance

- Maintained by the author: atlas-awareness, atlas-awareness.
- Errata, rights takedowns and native-speaker corrections (see the review sheet in the project repository) will be released as new Zenodo versions under the same concept DOI.
- If a rights holder objects to an included text, it will be removed in a new version.
