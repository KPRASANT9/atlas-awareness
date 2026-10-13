"""Recover approximate verse lines for texts whose line breaks were lost.

The alternative-translation corpus (03b) was scraped without newlines in 192 of 195 texts, so line-based measures
(words per line, imperative/exclamation rates, 2-line windows, stanza segments, final acclamation) degenerate.
English verse translations capitalise the first word of each line, so a capitalised word starts a new pseudo-line
unless it is a word that is routinely capitalised mid-line. Fragments shorter than MIN_WORDS are merged back.
Pseudo-stanzas of STANZA lines are separated by a blank line. validate() measures agreement on the main corpus.
"""
import re

MIDLINE_CAPS = {"i", "i'm", "i'll", "i've", "o", "oh", "god", "god's", "lord", "thee", "thy", "thou", "thine", "he", "his",
                "him", "christ", "allah", "jesus", "heaven", "almighty", "creator", "king", "queen"}
MIN_WORDS, STANZA = 3, 4
CAP = re.compile(r"^[\"'\u201c\u2018(\u00a1\u00bf]*[A-Z\u00c0-\u00d6\u00d8-\u00de]")


def has_lines(text, min_breaks=3):
    return str(text).count("\n") >= min_breaks


def relineate(text, force=False):
    text = str(text)
    if has_lines(text) and not force:
        return text
    toks = text.split()
    lines, cur = [], []
    for i, t in enumerate(toks):
        bare = re.sub(r"^[\"'\u201c\u2018(\u00a1\u00bf]+|[^\w']+$", "", t).lower()
        prev = toks[i - 1] if i else ""
        brk = cur and CAP.match(t) and (bare not in MIDLINE_CAPS or re.search(r"[.;:!?]$", prev))
        if brk:
            lines.append(cur)
            cur = []
        cur.append(t)
    if cur:
        lines.append(cur)
    merged = []
    for l in lines:
        if merged and len(l) < MIN_WORDS:
            merged[-1].extend(l)
        else:
            merged.append(l)
    if len(merged) > 1 and len(merged[0]) < MIN_WORDS:
        merged[1] = merged[0] + merged[1]
        merged.pop(0)
    out = [" ".join(l) for l in merged]
    return "\n\n".join("\n".join(out[i:i + STANZA]) for i in range(0, len(out), STANZA)) + "\n"


def validate(texts):
    """Line-count and words-per-line agreement between true lines and lines recovered from the flattened text."""
    import numpy as np
    from scipy.stats import spearmanr
    n_true, n_rec = [], []
    for t in texts:
        lt = [l for l in str(t).split("\n") if l.strip()]
        lr = [l for l in relineate(" ".join(str(t).split()), force=True).split("\n") if l.strip()]
        n_true.append(len(lt))
        n_rec.append(len(lr))
    n_true, n_rec = np.array(n_true), np.array(n_rec)
    return {"rho_n_lines": round(float(spearmanr(n_true, n_rec)[0]), 3),
            "median_ratio_recovered_to_true": round(float(np.median(n_rec / n_true)), 3)}
