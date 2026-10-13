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

# 1 Introduction

Almost every state has an anthem, and many also have a national song, a royal anthem or a regional hymn that people sing on other occasions. These texts are short, formal and endlessly repeated: the kind of everyday, unnoticed nationalism that Billig [-@billig1995] called *banal*, and a ritual medium through which an "imagined community" [@anderson1983] hears itself addressed. They are also an unusually clean comparative corpus. One text serves one function in nearly every country, and the texts are, in principle, public.

In practice the corpus is hard to compare. The texts are in more than a hundred languages, so most comparative work reads English translations, whose provenance, register and fidelity vary widely. The textual features of interest (themes such as land, God, monarch, struggle or the future; rhetorical acts such as commanding, hailing or praying) are interpretive. And small samples, single coders and single methods make it difficult to say how much any reported difference between songs or regions is signal.

This paper makes three contributions.

1. **A reproducible, open measurement pipeline.**
   - It scores 12 themes in 242 song texts through four independent readings, and it validates them against blind hand labels.
   - It builds two descriptive indices, Energy and Wisdom, from first principles. They are tested for reliability and for confounding by length, line length, archaic diction and source.
   - The data, code and a per-song rights audit are released under open licences. Texts that cannot be redistributed are rehydrated from pinned public sources and verified by hash.
2. **Uncertainty as a first-class output.** Every song and every country has 90% intervals that combine model refits, method and weight variants, and translation noise. The translation noise is estimated from an independent second translation. We report intervals and rank agreement rather than league tables.
3. **An original-language layer.** For 159 songs, curated and lexicon-matched roots show where an English translation shifts a key word's sense. The layer measures this drift and lets it inform the theme scores, capped at about a quarter of each score.

We stress at the outset that the indices describe *texts*. A song that hails or commands is not evidence about a people's temperament. A text with little explicit language of justice is not less wise in any moral sense. And many anthems carry the marks of the war, revolution or coronation in which they were written.

# 2 Related work

**Sociology and political science of anthems.**

- Cerulo's studies analysed the *musical* structure of anthems in relation to the political conditions of their adoption [-@cerulo1989], related anthems and flags to world-system position [-@cerulo1993], and developed these ideas in *Identity Designs* [-@cerulo1995].
- Kyridis et al. [-@kyridis2009] content-analysed anthem lyrics for nationalist themes.
- Lauenstein, Murer, Boos and Reicher [-@lauenstein2015] studied the gendered "imagined family" (motherland, fatherland, sons) in anthems.
- Podeh [-@podeh2022] described Arab anthems as hybrid national symbols.
- Pavković and Kelen [-@pavkovic2016] study the role of anthems in the making of nation states, with a focus on the Balkans.
- Developmental work has examined how children understand an anthem's meaning [@winstone2016].

**Quantitative text analysis of anthems.**

- Silaghi-Dumitrescu [-@silaghi2020; -@silaghi2023] counted topics across anthem texts and traced their trends over time.
- More recently, topic modelling and transformer-based sentiment analysis have been applied to English anthem texts [@martis2025; @bakir2025].
- Hasan et al. [-@hasan2024] related the *musical* characteristics of anthems to global indices.
- These studies typically use one method on English texts. They do not estimate how sensitive their results are to translation, and they rarely release reproducible pipelines.

**Methods we build on.**

- Sentence embeddings: Sentence-BERT [@reimers2019], multilingual distillation [@reimers2020] and LaBSE [@feng2022].
- Entailment-based zero-shot classification [@yin2019], using an NLI-trained DeBERTa model [@he2021; @he2021v3] in the manner validated for political text by Laurer et al. [-@laurer2024].
- UMAP [@mcinnes2018] for the latent map.
- Standard reliability, rank and spatial statistics [@cronbach1951; @mcdonald1999; @wilcoxon1945; @kruskal1952; @moran1950; @hubert1985; @rousseeuw1987].
- The Equal Earth projection [@savric2019] for maps.
- Our documentation follows Datasheets for Datasets [@gebru2021] and, for model-derived scores, the spirit of Model Cards [@mitchell2019].

# 3 Data

**Coverage.**

- The dataset lists 254 songs:
  - 204 national anthems, covering all 195 UN member and observer states, 9 partially recognised states, and Denmark's second (royal) anthem;
  - 23 national songs, 14 sub-national songs, 8 historic or full-poem versions, 4 royal anthems and 1 second anthem.
- 242 texts are analysed: 201 anthems and 41 others. 193 of the 195 UN members and observers are covered.
- Twelve songs are excluded because they have no official lyrics (for example Spain's *Marcha Real*, Kosovo, Bosnia and Herzegovina, the EU) or no free English text. All exclusions and caveats are recorded.

**Sources.**

- The anthem list comes from Wikipedia's "List of national anthems", and texts from the Lyrics sections of each English Wikipedia article (240 of 242 analysed texts). All articles are pinned to their revision as of 2026-10-03 02:30 UTC; re-extraction at these revisions reproduces the dataset exactly.
- Five public-domain texts were curated: Sri Aurobindo's 1909 translation of *Vande Mataram*, Tagore's own 1919 translation of the full *Jana Gana Mana* poem, Germany's official third stanza, verses 1–4 of the US anthem, and the three standard UK verses.
- Two songs had no public translation. For these, the *Finlandia* hymn and *Indonesia Pusaka*, an AI agent produced the English from the original text. Both are flagged, and neither has been independently verified.
- Long texts are analysed on their first ~300 words, roughly what is printed and sung.

**Second translation.** For 195 anthems, an independent English corpus provides a second translation, used only for the robustness checks. It was scraped by a third party from nationalanthems.info and is pinned to a git commit. Its line breaks had been lost; they were recovered from verse-initial capitals, a method that reproduces line-based measures on the main corpus (imperative rate ρ = 0.96, exclamation 0.99).

**Rights.** A per-song audit classifies the original lyrics and the English translation separately as public domain, CC BY-SA, copyrighted or unclear (§10, data availability). The release includes texts only where both layers are cleared: 78 songs in full and 23 in the original language only. All other songs are released as scores and hashes.

# 4 Method

## 4.1 Themes

The 11 base themes are:

- nature and land beauty;
- land as mother or sacred;
- unity;
- freedom;
- martial imagery and sacrifice;
- divine;
- monarch or ruler;
- justice, peace and humanity ("universal");
- history and ancestors;
- future and destiny;
- truth, virtue and conscience ("reflective").

A 12th theme, Awakening, is introduced in §4.3. Each theme \(t\) is scored for song \(s\) by three English readings and, where available, a fourth original-language reading. Here \(\operatorname{clip}(u)=\max(-3,\min(3,u))\), and \(\mu,\sigma\) are taken over the 242 texts.

- **Lexicon:** \(L_{s,t}=\sqrt{100\,c_{s,t}/n_s}\) for \(c_{s,t}\) lexicon matches in \(n_s\) words, giving \(z^{\text{lex}}_{s,t}=\operatorname{clip}((L_{s,t}-\mu_t)/\sigma_t)\).
- **Anchors:** two-line windows are embedded with all-mpnet-base-v2 [@reimers2019]. \(A_{s,t}\) is the mean over the top three windows of the best cosine similarity to three anchor sentences for the theme. Raw similarities share a large "sounds like an anthem" component (mean inter-theme correlation 0.48). They are therefore z-scored, centred by the song's mean across themes, and re-standardised to give \(z^{\text{anc}}_{s,t}\).
- **NLI:** \(N_{s,t}\) is the mean over the top two stanzas of \(P(\text{entail}\mid\text{stanza}, \text{"This text is about } t\text{"})\) under DeBERTa-v3 zero-shot NLI [@laurer2024], giving \(z^{\text{nli}}_{s,t}\).
- **Roots:** each curated term \(i\) carries the semantic fields of its root sense. Each field maps to a theme vector \(\boldsymbol\phi_f\). The term weights are \(\omega_i=p_i c_i o_i\), combining position (title 2, refrain 1.5, body 1), curator confidence (1, 0.7 or 0.4) and whether the term was found in the original text (1 or 0.5). This gives
  \[ R_{s,t}=\frac{\sum_i\omega_i v_{i,t}}{\sum_i\omega_i},\qquad z^{\text{ety}}_{s,t}=\operatorname{clip}\!\Big(\frac{R_{s,t}-\mu^{\text{ety}}_t}{\sigma^{\text{ety}}_t}\Big). \]

The readings are blended with a song-specific etymology weight \(\alpha_s\). The weight grows with the confidence and number of terms (\(\kappa_s\)) and with the measured translation drift \(\delta_s\):

\[ \delta_s=\frac{\sum_i\omega_i\big(1-\cos(\mathbf v_i^{\text{root}},\mathbf v_i^{\text{EN}})\big)}{\sum_i\omega_i},\qquad \alpha_s=\kappa_s\,(0.25+0.25\,\delta_s), \]

\[ \theta_{s,t}=(1-\alpha_s)\cdot\tfrac13\big(z^{\text{lex}}_{s,t}+z^{\text{anc}}_{s,t}+z^{\text{nli}}_{s,t}\big)+\alpha_s\,z^{\text{ety}}_{s,t}. \]

**Etymology layer.**

- The curated core holds 295 terms in 48 languages for 63 songs (median \(\alpha\) 0.26), plus 59 awakening terms.
- A light lexicon of 140 cross-lingual stem groups covers 96 more songs (median \(\alpha\) 0.135).
- \(\alpha_s=0\) for 83 songs. These are mostly English originals, including 14 anthems whose scored English *is* the original or an independent official text.

## 4.2 Confound control

For every index item \(x_{s,j}\), we fit an ordinary least-squares regression on a nuisance vector:

\[ \mathbf n_s=\big(\ln n_s,\ \sqrt{\text{archaic words per 100}},\ \text{words per line},\ \mathbb 1[\text{curated text}]\big), \]

and we use the standardised residual \(\tilde z_{s,j}\). Before this step, these variables explained 10.4% of a first-draft energy index. Lyric length alone correlated ρ = 0.47 with martial content, because longer printed texts contain more battle stanzas. After residualisation they explain 0.0% of either axis. Era is deliberately *not* removed, because wars and coronations shape lyrics. Era explains 0.6% of Energy and 5.2% of Wisdom.

## 4.3 Energy

Energy is how strongly a text rouses its listeners. It has two components.

**Mobilisation** averages two facets:

- *Struggle*: martial and freedom themes;
- *Drive*: a formative index of imperative lines \(I\), exclamations \(X\) and a sparse march/slow tempo flag \(M\), available for 24 songs.

\[ S_s=\tfrac12(\tilde z_{\text{martial}}+\tilde z_{\text{freedom}}),\quad D_s=\tfrac13(\tilde z_I+\tilde z_X+\tilde z_M),\quad \text{Mob}_s=\operatorname{std}\big(\tfrac12(S_s+D_s)\big). \]

**Awakening** captures a second way of rousing: by waking, rising and dawn, by hailing and acclamation ("long live", "victory to thee"), and by collective song and praise.

- Its content facet, *Invocation*, is a 12th theme built exactly like the others. It has its own lexicon, six anchors and two NLI hypotheses, and its roots come from 59 curated terms and 31 root groups.
- Its form facet, *Build*, averages refrain repetition \(P\) (counted on the original text where available) and the share of stanzas that end on an acclamation \(F\).
- All three Awakening items are additionally residualised on the divine and monarch themes. This keeps Awakening from being religious or royal content by construction; the control changes the score negligibly (r = 0.999).

\[ \text{Awk}_s=\operatorname{std}\big(\tfrac23\tilde z_{\text{awk}}+\tfrac13\cdot\tfrac12(\tilde z_P+\tilde z_F)\big),\qquad E_s=\operatorname{std}\big(\tfrac12\text{Mob}_s+\tfrac12\text{Awk}_s\big). \]

The ⅔/⅓ split and the equal blend were fixed before any results were seen. We report \(E\) for Mobilisation weights from 0.3 to 0.7.

## 4.4 Wisdom

**How the axis was chosen.** A first-draft index that added nature to ethics had a reliability of α = 0.08, because landscape praise sits with land-as-mother and history, not with ethical reflection. Exploratory factor analysis instead found a factor of reflective (0.62), universal (0.39) and future (0.32) content.

**Definition.** Wisdom is the loading-weighted one-factor score of the three residualised themes, with loadings \(\boldsymbol\lambda=(0.485, 0.536, 0.422)\) for universal, reflective and future:

\[ W_s=\operatorname{std}\Big(\frac{\sum_j\lambda_j\tilde z_{s,j}}{\sum_j\lambda_j}\Big). \]

Its reliability is modest (α = ω = 0.47). Nature, land-as-mother, divine, monarch, unity and history are on neither axis. They colour the map and define the archetypes, but devotion is not counted as "wisdom".

## 4.5 Archetypes and the latent map

- Each song's latent vector concatenates 20 principal components of its sentence embedding with its 11 theme scores, each block given equal weight.
- k-means is run for \(k=4\)–8. The silhouette is flat and low [@rousseeuw1987], so \(k=5\) was chosen by bootstrap stability.
- The two-dimensional map is a UMAP projection [@mcinnes2018].

## 4.6 Uncertainty

**Per-song intervals.** Each song's 90% interval combines three sources:

1. 200 bootstrap refits of every fitted step: standardisation, residualisation, factor loadings and quantile cut points;
2. single-method and design-variant rescorings, for a total of 260 runs;
3. translation noise. This is the layer-specific standard deviation of the shift between the main and the second translation, which is smaller for songs with curated roots. It is added in quadrature.

**Confidence grade.** A transparent, additive grade marks each song High, Medium or Low. The penalties are:

- a short text;
- a translation with no etymology check;
- no second translation;
- instability across refits;
- a caveat about the lyric's status.

**Validation.** We use blind hand labels from the analyst: 30 random songs labelled for 11 themes, and 50 songs labelled for Awakening.

# 5 Results

## 5.1 Validity and reliability

**Themes.**

- Against the 30 hand-labelled songs, the averaged theme scores reach a macro AUC of 0.93. The individual readings reach 0.83–0.87.
- Precision is 0.75 and recall 0.86 at \(z>0\).
- The weakest themes are reflective (0.80) and future (0.89).
- One design choice, centring the anchor scores per song, was made after an early look at this sample.

**Awakening** reaches an AUC of 0.87 against its 50 labels; Mobilisation alone reaches 0.61.

- Its lexicon reading (0.98) is partly circular, because the labels rest on the same surface words. The model readings are a fairer test: anchors 0.60, NLI 0.72, roots 0.71, and the three English readings combined 0.90.
- Its Build facet is weak (AUC 0.55; refrain repetition loads 0.03).

**Wisdom** identifies songs hand-tagged universal, reflective or future with an AUC of 0.73, compared with 0.58 for the first-draft index.

**Independence.** The axes are nearly independent (ρ = −0.10). Awakening is unrelated to the divine and monarch themes even before they are controlled for (ρ = −0.06 and −0.01).

## 5.2 Translation is the dominant uncertainty

**Agreement with the second translation** (195 anthems, Spearman ρ):

- Energy 0.84 and Wisdom 0.83, with the etymology layer;
- 0.82 and 0.79 without it.
- 82% of songs stay within one quintile level on both axes, against 76% without the roots. Part of this gain is mechanical, because both translations share the root component.

**Per-song intervals.**

- The median 90% interval spans 1.8 SD for Energy and 1.4 SD for Wisdom. That is roughly three of the five quintile levels.
- Intervals are widest for translated songs without an etymology check: median Wisdom width 2.0 SD, against 1.4 SD with curated roots.
- Translation fidelity correlates ρ = 0.27 with Energy, where fidelity is measured as LaBSE similarity between the original and the English. This could mean that loose translators soften, or that martial lines translate literally, so we report it rather than remove it.

We therefore report positions with intervals, and differences only when they survive them. A difference of half a standard deviation between two countries usually lies inside both intervals.

## 5.3 Robustness of the indices

**Weight sensitivity.** Mobilisation weights of 0.4–0.6 give Energy ranks with ρ ≥ 0.98 against the default. More Awakening weight tracks the hand labels better (AUC 0.87 at \(w=0.3\)). More Mobilisation weight is slightly more stable across translations (ρ 0.86 at \(w=0.7\)).

**Etymology weight.** Halving or doubling it keeps ranks at ρ ≥ 0.983.

**Grid stability.** Under the refits and variants, a song keeps its exact cell of the 5×5 grid a median 58% of the time. It stays within one level on both axes in nearly all runs.

**Archetypes are soft.**

- The silhouette is about 0.06.
- On 80% subsamples, 56% of assignments match (adjusted Rand index [@hubert1985]).
- With a different embedding model, 46% match.
- We treat the five families as neighbourhoods, not types:

| Family | Songs | Anthems |
|---|---|---|
| Call to Arms | 61 | 53 |
| Heritage Homeland | 59 | 52 |
| Unity & Justice | 49 | 47 |
| Garden & Mother | 45 | 28 |
| Crown & Covenant | 28 | 21 |

![The Energy × Wisdom plane (panel A: density; panel B: 5×5 quintile grid with counts; hatched cells are least stable). No song or country is labelled.](../../media/energy-wisdom-heatmap.png){width=95%}

## 5.4 The plane has a broad middle, not tribes

On the 5×5 quintile grid, cell counts do not depart significantly from what independent axes would produce (χ² = 25.8, df = 16, p = 0.057).

**One asymmetry is visible.** Calm, high-Wisdom texts are common (14 songs at Energy 1, Wisdom 5), but rousing, high-Wisdom texts are rare (3). Texts that speak of justice and the future tend to reason rather than hail.

**The corners give the axes their meaning:**

| Corner | Songs | Typical content |
|---|---|---|
| Contemplative and ethical (calm, high Wisdom) | 44 | Truth, virtue, justice and peace |
| Rousing idealism (rousing, high Wisdom) | 32 | A shared future in a "let us build" register |
| Rooted and serene (calm, low Wisdom) | 38 | Landscape, ancestors, faith, the motherland |
| Martial resolve (rousing, low Wisdom) | 39 | Freedom won by struggle and sacrifice |

## 5.5 Geography decides themes, not intensity

**Themes are regional.** Sub-region explains 16–26% of the variance of each theme. For example:

- 54% of African anthems fall in Unity & Justice, and 49% of anthems in the Americas in Call to Arms;
- Polynesia leads on the divine and monarch themes;
- Northern Europe leads on nature and divine, and is lowest on freedom.

**The indices are not.**

| | Continent explains | Sub-region explains (adjusted) | Moran's I (neighbours within 50 km) |
|---|---|---|---|
| Energy | 0.4% (p = 0.92) | none (p = 0.78) | 0.02 (p = 0.34) |
| Mobilisation | 3.2% (p = 0.18) | 0.6% (p = 0.39) | 0.06 (p = 0.11) |
| Awakening | 1.2% (p = 0.67) | 0.9% (p = 0.35) | −0.01 (p = 0.54) |
| Wisdom | 6.5% (p = 0.01) | 13.5% (p < 0.001) | 0.09 (p = 0.04) |

The higher-Wisdom sub-regions are Eastern Asia (+1.05 SD), Western Africa (+0.83) and Middle Africa (+0.74). These are mostly 20th-century post-independence or reform-era texts about justice, work and the future. Polynesia (−1.20), Eastern Europe (−0.75) and Northern Europe (−0.59) are lower; there, landscape, faith, crown and ancestry dominate.

**Language family.** Main-song Energy differs by language family, and family explains 13% of Energy beyond sub-region (permutation p = 0.001), but nothing of Wisdom. The independent second translation reproduces the family ordering (rank correlation of family means 0.75). That argues against a single-translator artefact. The likeliest explanation is historical: revolutionary marches in Romance-language and Eastern European anthems, and hymns in many Germanic, Bantu and Pacific ones. A register effect of imperative morphology cannot be excluded.

**Era.** Era leaves a fingerprint on themes. Anthems adopted before 1946 carry more martial content than those of 1946–1989, and monarch content declines steadily over time.

## 5.6 National songs are gentler than anthems

In 20 countries with both an anthem and a separate national song, the national song has lower Energy in 16 cases (median −0.71 SD, Wilcoxon signed-rank p = 0.03) [@wilcoxon1945]. The difference is carried by Awakening, which is also lower in 16 of 20 (p = 0.03), not by Mobilisation (11 of 20, p = 0.55). Anthems hail, invoke and close on acclamation more often; they do not necessarily march harder. With 20 pairs this is a modest result, and the p-value is not corrected for the three components tested.

# 6 Case study: India's two national songs

India has a national anthem, *Jana Gana Mana* (Tagore, 1911), and a national song, *Vande Mataram* (Bankim Chandra Chattopadhyay, 1875; two stanzas adopted in 1950). They are often contrasted as a song of conscience and destiny and a song of devotion to the land. All values below are standardised scores with 90% intervals.

| | *Jana Gana Mana* | *Vande Mataram* (official stanzas) |
|---|---|---|
| Energy | +1.25 [−0.04, +2.44] | −0.12 [−1.05, +0.86] |
| Mobilisation | −0.80 [−1.52, −0.08] | −0.05 [−0.92, +0.99] |
| Awakening | +2.67 [+1.86, +3.70] | −0.13 [−1.20, +0.89] |
| Wisdom | +1.44 [+0.70, +2.11] | −0.93 [−1.75, −0.14] |
| Strongest themes | divine +1.26 [0.62, 1.90]; reflective +1.46 [0.22, 2.70]; future +1.19 [0.70, 1.67] | nature +1.93 [1.46, 2.40]; land as mother +1.75 [0.78, 2.73] |
| Weakest themes | martial −0.90 [−1.34, −0.46]; unity −0.80 [−1.36, −0.23] | martial −1.11 [−1.57, −0.65]; unity −1.02 [−1.47, −0.58] |
| Archetype | Crown & Covenant | Garden & Mother |
| Data confidence | High | High |

**Awakening reverses a reading of *Jana Gana Mana*.** On Mobilisation alone it is a calm hymn, with no martial content and few commands. Its refrain, however, is a sustained acclamation: *tava śubha nāme jāge, tava śubha āśiṣa māge, gāhe tava jaya-gāthā … jaya he, jaya he* ("it wakes at thy auspicious name, asks thy blessing, sings thy song of victory … victory to thee"). Both the content readings and the form readings register it:

- the content: the roots √jāgṛ "wake", √gai "sing" and √ji "conquer", in acclamation use "hail";
- the form: the repeated *jaya he* and the final acclamation.

Its Awakening interval lies wholly above +1.8. Its Energy interval, however, still reaches 0, so a statement that it is "among the most rousing anthems" would overreach. The defensible statement is that it rouses by acclamation rather than by struggle.

**One title word matters at the margin.** The English renders *adhināyaka* as "ruler". Its root sense, adhi- + √nī, "one who leads over", is closer to "guide".

- Reading it by its root lowers the monarch theme by about a quarter (+1.13 to +0.85) and raises reflective content (+1.18 to +1.46).
- The archetype does not change, because the family is defined as much by divine address, and because *vidhātā* ("ordainer") and *jaya* keep the address to a sovereign-like presence.
- This matches the long-standing debate over whom the song addresses. Tagore said its addressee was the guide of India's destiny, not a king; a model sees only second-person address to a sovereign.

**Unity is under-read.** *Jana Gana Mana* expresses unity by enumerating regions and rivers. The theme readings look for "united", "together" or "brothers", so they score it low on unity (−0.80). This is the clearest instance in the corpus of meaning carried by structure that keyword- and model-based scoring miss.

***Vande Mataram* is devotion, not "low wisdom".**

- Its content (a sacred, fertile, watered land, *sujalām suphalām*) lives in the nature and land-as-mother themes, which are on neither axis.
- Its title root √vand ("bow, revere") is rendered "praise", a drift of 0.5. Reading the root raises land-as-mother from +1.59 to +1.75.
- Its low Wisdom score says only that it contains little explicit language of justice, abstract virtue or the future.

**Neighbours.** *Vande Mataram*'s nearest neighbour worldwide is Bangladesh's *Amar Shonar Bangla* (cosine 0.81), another Bengal-renaissance song of mother-earth devotion. In the latent space, the two Indian songs are about as related as two random songs (61st percentile of all pairs). Their relationship is complementary, not overlapping.

# 7 Limitations

- **Translation.** Everything is scored on English. Idioms can mislead: Indonesian and Malay *tumpah darah*, literally "spilt blood", means birthplace. Punctuation habits and register vary by translator. The intervals include this noise, but they cannot include errors shared by both translations.
- **Music and performance** are absent, apart from a sparse tempo flag and lyric structure. How an anthem *sounds* is often what listeners mean by its energy.
- **Measurement.** Wisdom (α = 0.47) and Struggle (0.34) are modest measures. Awakening's form facet is weak. The theme lexicons and anchors were written in English by one analyst. The hand labels come from a single annotator, so there is no inter-annotator agreement.
- **The etymology layer** was curated with AI assistance and verified automatically: all 295 terms were found in the original texts, and Wiktionary confirms 87% of checkable roots. Native speakers have not yet reviewed it; a review sheet covering 83 songs is released with the data. Root sense is not usage, which is why the layer's weight is capped.
- **Selection.** National songs are a curated, partial list. Long texts are capped at ~300 words, while countries often sing one stanza. Some anthems are disputed or in transition (Afghanistan, Syria), and Cyprus and Northern Cyprus share other countries' texts.
- **Resource bias.** Languages the root lexicon does not cover have wider intervals and account for most Low confidence grades.

# 8 Ethics and neutrality statement

National symbols are politically and emotionally charged. We took five precautions.

1. **The indices describe texts, not countries, cultures or peoples.** No ranking of nations is computed or implied. Maps label no country, and the per-country entries are written in a fixed template: two strongest themes, one weakest, each index with its interval.
2. **The words are deliberately value-neutral in use.** "Energy" means that a text commands, exclaims, wakes or hails. "Wisdom" means that it uses explicit language of justice, truth and the future. Neither is a measure of moral or spiritual worth, and devotional content is deliberately not counted as wisdom.
3. **Many texts are historical.** They were written during wars, revolutions or coronations, and some are no longer sung by the authorities that hold power. We report such caveats rather than adjust for them.
4. **Bias in the instrument is audited and reported.** We report resource bias, the use of colonial-era and anonymous translations, archaic register, and associations with language family. Where an artefact could be fixed without removing real content, it was. For example, English originals had been treated as translations and given an etymology layer, and this was corrected.
5. **Rights are respected.** No in-copyright lyric is redistributed. Withheld texts are referenced by pinned revision and hash only.

No human subjects were involved. All sources are published texts and public metadata.

# 9 Use of AI

The analysis was built with AI agents. AI coding and research agents wrote the pipeline code, ran the analyses, drafted the reports, the rights audit and this manuscript, and curated the etymology terms, working under the direction of the human author, atlas-awareness. The two flagged English translations (S220, S234) were produced by an AI agent. The models used inside the method (sentence encoders and an NLI classifier) are documented in §4. atlas-awareness chose the research questions and approved the design decisions, including the redefinition of Energy. The human author atlas-awareness is responsible for the content, including any errors. Every reference was checked against Crossref, arXiv or Open Library.

# 10 Data and code availability

**Where.** Data, scores, figures and code are deposited at Zenodo, DOI [to be assigned after the GitHub release is archived]. The code and interactive site are on GitHub at <https://github.com/KPRASANT9/atlas-awareness>.

**Licences.** Data, results, figures and documentation are under CC BY-SA 4.0, because the release includes CC BY-SA translations adapted from English Wikipedia; attribution for each is in `NOTICE.md`. Code is under MIT.

**Rights audit.** The package includes a per-song audit of the original lyrics and the English translation:

| Layer | Public domain | CC BY-SA | Copyrighted | Unclear |
|---|---|---|---|---|
| Original lyrics | 101 | – | 99 | 42 |
| Combined status of the scored text | 19 | 59 | 117 | 47 |

78 texts are released in full and 23 in the original language only. For the remaining songs, `code/rehydrate.py` re-fetches the texts from Wikipedia at pinned revision ids, from the second-translation corpus at a pinned commit, and from Wikisource. It verifies every text against shipped SHA-256 hashes. `code/reproduce.sh` then re-runs the whole pipeline on a CPU and compares every output with the shipped reference. In a clean-copy test on four CPUs (about 40 minutes), 36 of the 44 regenerated outputs were byte-identical. Six differed by at most 0.005, from floating-point non-determinism in the second-translation NLI. Two differed by design: they are first-draft files kept from before a line-break repair of the second-translation corpus.

**Exceptions.** Two AI-agent translations of in-copyright lyrics are not distributed and are available on request. Step 09 queries live Wiktionary pages only to *verify* lemmas, so its verification flags can drift as Wiktionary is edited.

**Documentation.** A datasheet [@gebru2021] documents the dataset.

# References

::: {#refs}
:::

---
references:
- id: anderson1983
  type: book
  author: [{family: Anderson, given: Benedict}]
  title: "Imagined Communities: Reflections on the Origin and Spread of Nationalism"
  publisher: Verso
  publisher-place: London
  issued: {year: 1983}
- id: bakir2025
  type: article-journal
  author: [{family: Bakir, given: Rezan}, {family: Ergul, given: Nurgul}]
  title: "A natural language processing approach to comparative sentiment and topic analysis of English national anthems"
  container-title: ICTACT Journal on Soft Computing
  volume: 16
  issue: 1
  page: 3795-3802
  issued: {year: 2025}
  DOI: 10.21917/ijsc.2025.0526
- id: billig1995
  type: book
  author: [{family: Billig, given: Michael}]
  title: Banal Nationalism
  publisher: Sage
  publisher-place: London
  issued: {year: 1995}
- id: cerulo1989
  type: article-journal
  author: [{family: Cerulo, given: Karen A.}]
  title: "Sociopolitical control and the structure of national symbols: An empirical analysis of national anthems"
  container-title: Social Forces
  volume: 68
  issue: 1
  page: "76"
  issued: {year: 1989}
  DOI: 10.2307/2579221
- id: cerulo1993
  type: article-journal
  author: [{family: Cerulo, given: Karen A.}]
  title: "Symbols and the world system: National anthems and flags"
  container-title: Sociological Forum
  volume: 8
  issue: 2
  page: 243-271
  issued: {year: 1993}
  DOI: 10.1007/BF01115492
- id: cerulo1995
  type: book
  author: [{family: Cerulo, given: Karen A.}]
  title: "Identity Designs: The Sights and Sounds of a Nation"
  publisher: Rutgers University Press
  publisher-place: New Brunswick, NJ
  issued: {year: 1995}
- id: cronbach1951
  type: article-journal
  author: [{family: Cronbach, given: Lee J.}]
  title: Coefficient alpha and the internal structure of tests
  container-title: Psychometrika
  volume: 16
  issue: 3
  page: 297-334
  issued: {year: 1951}
  DOI: 10.1007/BF02310555
- id: feng2022
  type: paper-conference
  author: [{family: Feng, given: Fangxiaoyu}, {family: Yang, given: Yinfei}, {family: Cer, given: Daniel}, {family: Arivazhagan, given: Naveen}, {family: Wang, given: Wei}]
  title: Language-agnostic BERT sentence embedding
  container-title: "Proceedings of the 60th Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)"
  page: 878-891
  issued: {year: 2022}
  DOI: 10.18653/v1/2022.acl-long.62
- id: gebru2021
  type: article-journal
  author: [{family: Gebru, given: Timnit}, {family: Morgenstern, given: Jamie}, {family: Vecchione, given: Briana}, {family: Vaughan, given: Jennifer Wortman}, {family: Wallach, given: Hanna}, {family: Daumé III, given: Hal}, {family: Crawford, given: Kate}]
  title: Datasheets for datasets
  container-title: Communications of the ACM
  volume: 64
  issue: 12
  page: 86-92
  issued: {year: 2021}
  DOI: 10.1145/3458723
- id: hasan2024
  type: article
  author: [{family: Hasan, given: S M Rakib}, {family: Dhakal, given: Aakar}, {family: Siddiqua, given: Ayesha}, {family: Rahman, given: Mohammad Mominur}, {family: Islam, given: Md Maidul}, {family: Chowdhury, given: Mohammed Arfat Raihan}, {family: Swapno, given: S M Masfequier Rahman}, {family: Nobel, given: SM Nuruzzaman}]
  title: Analyzing musical characteristics of national anthems in relation to global indices
  publisher: arXiv
  number: "2404.03606"
  issued: {year: 2024}
  URL: https://arxiv.org/abs/2404.03606
- id: he2021
  type: article
  author: [{family: He, given: Pengcheng}, {family: Liu, given: Xiaodong}, {family: Gao, given: Jianfeng}, {family: Chen, given: Weizhu}]
  title: "DeBERTa: Decoding-enhanced BERT with disentangled attention"
  publisher: arXiv
  number: "2006.03654"
  issued: {year: 2020}
  URL: https://arxiv.org/abs/2006.03654
- id: he2021v3
  type: article
  author: [{family: He, given: Pengcheng}, {family: Gao, given: Jianfeng}, {family: Chen, given: Weizhu}]
  title: "DeBERTaV3: Improving DeBERTa using ELECTRA-style pre-training with gradient-disentangled embedding sharing"
  publisher: arXiv
  number: "2111.09543"
  issued: {year: 2021}
  URL: https://arxiv.org/abs/2111.09543
- id: hubert1985
  type: article-journal
  author: [{family: Hubert, given: Lawrence}, {family: Arabie, given: Phipps}]
  title: Comparing partitions
  container-title: Journal of Classification
  volume: 2
  issue: 1
  page: 193-218
  issued: {year: 1985}
  DOI: 10.1007/BF01908075
- id: kruskal1952
  type: article-journal
  author: [{family: Kruskal, given: William H.}, {family: Wallis, given: W. Allen}]
  title: Use of ranks in one-criterion variance analysis
  container-title: Journal of the American Statistical Association
  volume: 47
  issue: 260
  page: 583-621
  issued: {year: 1952}
  DOI: 10.1080/01621459.1952.10483441
- id: kyridis2009
  type: article-journal
  author: [{family: Kyridis, given: Argyris}, {family: Mavrikou, given: Anna}, {family: Zagkos, given: Christos}, {family: Golia, given: Paraskevi}, {family: Vamvakidou, given: Ifigenia}, {family: Fotopoulos, given: Nikos}]
  title: "Nationalism through state-constructed symbols: The case of national anthems"
  container-title: "The International Journal of Interdisciplinary Social Sciences: Annual Review"
  volume: 4
  issue: 6
  page: 1-14
  issued: {year: 2009}
  DOI: 10.18848/1833-1882/CGP/v04i06/52940
- id: lauenstein2015
  type: article-journal
  author: [{family: Lauenstein, given: Oliver}, {family: Murer, given: Jeffrey S.}, {family: Boos, given: Margarete}, {family: Reicher, given: Stephen}]
  title: "'Oh motherland I pledge to thee …': A study into nationalism, gender and the representation of an imagined family within national anthems"
  container-title: Nations and Nationalism
  volume: 21
  issue: 2
  page: 309-329
  issued: {year: 2015}
  DOI: 10.1111/nana.12123
- id: laurer2024
  type: article-journal
  author: [{family: Laurer, given: Moritz}, {family: van Atteveldt, given: Wouter}, {family: Casas, given: Andreu}, {family: Welbers, given: Kasper}]
  title: "Less annotating, more classifying: Addressing the data scarcity issue of supervised machine learning with deep transfer learning and BERT-NLI"
  container-title: Political Analysis
  volume: 32
  issue: 1
  page: 84-100
  issued: {year: 2024}
  DOI: 10.1017/pan.2023.20
- id: martis2025
  type: paper-conference
  author: [{family: Martis, given: Joy Elvine}, {family: Bundela, given: Beena}, {family: Murthy, given: Ganesa A.}, {family: Sangeetha, given: S.}, {family: Yogapriya, given: J.}, {family: Babu, given: T. Harish}]
  title: Topic modeling and transformer sentiment analysis of English national anthems
  container-title: 2025 3rd International Conference on Advances in Computation, Communication and Information Technology (ICAICCIT)
  page: 769-773
  issued: {year: 2025}
  DOI: 10.1109/ICAICCIT68829.2025.11434145
- id: mcdonald1999
  type: book
  author: [{family: McDonald, given: Roderick P.}]
  title: "Test Theory: A Unified Treatment"
  publisher: Lawrence Erlbaum
  publisher-place: Mahwah, NJ
  issued: {year: 1999}
- id: mcinnes2018
  type: article-journal
  author: [{family: McInnes, given: Leland}, {family: Healy, given: John}, {family: Saul, given: Nathaniel}, {family: Großberger, given: Lukas}]
  title: "UMAP: Uniform manifold approximation and projection"
  container-title: Journal of Open Source Software
  volume: 3
  issue: 29
  page: 861
  issued: {year: 2018}
  DOI: 10.21105/joss.00861
- id: mitchell2019
  type: paper-conference
  author: [{family: Mitchell, given: Margaret}, {family: Wu, given: Simone}, {family: Zaldivar, given: Andrew}, {family: Barnes, given: Parker}, {family: Vasserman, given: Lucy}, {family: Hutchinson, given: Ben}, {family: Spitzer, given: Elena}, {family: Raji, given: Inioluwa Deborah}, {family: Gebru, given: Timnit}]
  title: Model cards for model reporting
  container-title: Proceedings of the Conference on Fairness, Accountability, and Transparency (FAT* '19)
  page: 220-229
  issued: {year: 2019}
  DOI: 10.1145/3287560.3287596
- id: moran1950
  type: article-journal
  author: [{family: Moran, given: P. A. P.}]
  title: Notes on continuous stochastic phenomena
  container-title: Biometrika
  volume: 37
  issue: 1-2
  page: 17-23
  issued: {year: 1950}
  DOI: 10.1093/biomet/37.1-2.17
- id: pavkovic2016
  type: book
  author: [{family: Pavković, given: Aleksandar}, {family: Kelen, given: Christopher}]
  title: "Anthems and the Making of Nation States: Identity and Nationalism in the Balkans"
  publisher: I.B. Tauris
  publisher-place: London
  issued: {year: 2016}
  DOI: 10.5040/9780755619443
- id: podeh2022
  type: article-journal
  author: [{family: Podeh, given: Elie}]
  title: "Anthems in the Arab world: A hybrid national symbol"
  container-title: Nations and Nationalism
  volume: 28
  issue: 4
  page: 1379-1394
  issued: {year: 2022}
  DOI: 10.1111/nana.12803
- id: reimers2019
  type: paper-conference
  author: [{family: Reimers, given: Nils}, {family: Gurevych, given: Iryna}]
  title: "Sentence-BERT: Sentence embeddings using Siamese BERT-networks"
  container-title: Proceedings of EMNLP-IJCNLP 2019
  page: 3980-3990
  issued: {year: 2019}
  DOI: 10.18653/v1/D19-1410
- id: reimers2020
  type: paper-conference
  author: [{family: Reimers, given: Nils}, {family: Gurevych, given: Iryna}]
  title: Making monolingual sentence embeddings multilingual using knowledge distillation
  container-title: Proceedings of EMNLP 2020
  page: 4512-4525
  issued: {year: 2020}
  DOI: 10.18653/v1/2020.emnlp-main.365
- id: rousseeuw1987
  type: article-journal
  author: [{family: Rousseeuw, given: Peter J.}]
  title: "Silhouettes: A graphical aid to the interpretation and validation of cluster analysis"
  container-title: Journal of Computational and Applied Mathematics
  volume: 20
  page: 53-65
  issued: {year: 1987}
  DOI: 10.1016/0377-0427(87)90125-7
- id: savric2019
  type: article-journal
  author: [{family: Šavrič, given: Bojan}, {family: Patterson, given: Tom}, {family: Jenny, given: Bernhard}]
  title: The Equal Earth map projection
  container-title: International Journal of Geographical Information Science
  volume: 33
  issue: 3
  page: 454-465
  issued: {year: 2019}
  DOI: 10.1080/13658816.2018.1504949
- id: silaghi2020
  type: article-journal
  author: [{family: Silaghi-Dumitrescu, given: Radu}]
  title: Topics in national anthems
  container-title: Journal of Language and Literature
  volume: 20
  issue: 2
  page: "288"
  issued: {year: 2020}
  DOI: 10.24071/joll.v20i2.2541
- id: silaghi2023
  type: article-journal
  author: [{family: Silaghi-Dumitrescu, given: Radu}]
  title: "Trends in the texts of national anthems: A comparative study"
  container-title: Heliyon
  volume: 9
  issue: 8
  page: e19105
  issued: {year: 2023}
  DOI: 10.1016/j.heliyon.2023.e19105
- id: wilcoxon1945
  type: article-journal
  author: [{family: Wilcoxon, given: Frank}]
  title: Individual comparisons by ranking methods
  container-title: Biometrics Bulletin
  volume: 1
  issue: 6
  page: "80"
  issued: {year: 1945}
  DOI: 10.2307/3001968
- id: yin2019
  type: paper-conference
  author: [{family: Yin, given: Wenpeng}, {family: Hay, given: Jamaal}, {family: Roth, given: Dan}]
  title: "Benchmarking zero-shot text classification: Datasets, evaluation and entailment approach"
  container-title: Proceedings of EMNLP-IJCNLP 2019
  page: 3912-3921
  issued: {year: 2019}
  DOI: 10.18653/v1/D19-1404
- id: winstone2016
  type: article-journal
  author: [{family: Winstone, given: Naomi}, {family: Witherspoon, given: Kirsty}]
  title: "'It's all about our great Queen': The British National Anthem and national identity in 8–10-year-old children"
  container-title: Psychology of Music
  volume: 44
  issue: 2
  page: 263-277
  issued: {year: 2016}
  DOI: 10.1177/0305735614565831
...
