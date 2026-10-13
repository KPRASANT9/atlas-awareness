---
title: "How the world sings about itself: a reproducible, uncertainty-aware text analysis of national anthems and national songs"
author:

  - "atlas-awareness, atlas-awareness"
date: "Draft v0.9, October 2026"
abstract: |
  National anthems are among the most widely shared texts in the world, yet comparative work on their lyrics has relied either on hand coding of small samples or on lexicon counts over English translations, usually without any measure of uncertainty. We present the Global Anthem Atlas: an open dataset and pipeline covering 242 scorable lyrics (201 national anthems and 41 national, royal, sub-national and historic songs) from 219 countries and regions. Each song receives 12 theme scores. Each score averages four readings: an English lexicon, sentence-embedding similarity to anchor sentences, zero-shot natural-language inference and, for 159 songs, the senses of curated original-language roots. Two descriptive indices summarise how a text addresses its listeners. *Energy* is an equal blend of Mobilisation (struggle content and calls to action) and Awakening (waking, hailing and collective song). *Wisdom* is a one-factor score of justice and peace, truth and virtue, and the future. Lyric length, line length, archaic diction and source type are regressed out of every index item. Every score carries a 90% interval that combines bootstrap refits, method and weight variants, and translation noise estimated from an independent second translation of 195 anthems.

  Three findings stand out. First, against 30 blind hand-labelled songs the theme scores reach a macro AUC of 0.93, and Awakening reaches 0.87 against 50 labels. Second, translation dominates the uncertainty. The second translation reproduces the ranks (Spearman ρ = 0.84 for Energy, 0.83 for Wisdom), but single songs move by up to a level, and the median 90% interval spans 1.8 standard deviations for Energy. Third, geography shapes which themes an anthem uses (sub-region explains 16–26% of each theme), not how hard it pushes. Sub-region explains none of Energy after adjustment and 13.5% of Wisdom (Moran's I = 0.09, p = 0.04). In 20 countries with both an anthem and a national song, the national song is lower on Energy in 16 cases (median −0.71 SD, Wilcoxon p = 0.03). A case study of India's *Jana Gana Mana* and *Vande Mataram* shows how a refrain of acclamation, and the root sense of a single title word, change a reading. The data, a per-song rights audit, and code that rehydrates withheld texts from pinned sources are released openly.
keywords: [national anthems, computational text analysis, nationalism, sentence embeddings, zero-shot classification, measurement validity, translation, etymology]
lang: en-GB
mainfont: DejaVu Serif
sansfont: DejaVu Sans
monofont: DejaVu Sans Mono
fontsize: 10pt
geometry: margin=2.3cm
linkcolor: blue
urlcolor: blue
---

<!--
Submission targets (for the author; not part of the paper):

- arXiv: primary cs.CL (Computation and Language); cross-list cs.CY (Computers and Society) and physics.soc-ph (Physics and Society).
- SocArXiv: Social and Behavioral Sciences > Sociology (Culture; Political sociology); also Arts and Humanities > Music (lyrics).
Citation check (2026-10-13): every reference below was verified against Crossref, arXiv or Open Library, including DOI, year, venue and pages. None is unverified.
Author filled: atlas-awareness (name and affiliation). GitHub: https://github.com/KPRASANT9/atlas-awareness. Remaining placeholder: Zenodo DOI (filled after the GitHub release is archived). Contact email omitted.
-->
