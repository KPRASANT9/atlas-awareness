"""Songs whose scored English text is itself the original (or an independent official English text).

For these, dataset.original_text holds a later translation or a parallel version in another language, so reading its
roots as the "original" (etymology layer, translation drift) or counting refrains on it would be wrong. They get no
etymology weight, their refrain repetition is counted on the English, and they carry no translation uncertainty.
Songs with no stored original (has_original == False) are English-language originals already and are not listed.
"""

ENGLISH_ORIGINAL = {  # national anthems, keyed by country
    "Ireland": "'A Soldier's Song' was written in English (Kearney, 1907); the stored Irish text is the 1923 translation",
    "United Kingdom": "written in English; the stored text is a Latin translation",
    "Ghana": "written in English; the stored text is a French translation",
    "Namibia": "written in English; the stored text is a German translation",
    "Mauritius": "written in English; the stored text is a French translation",
    "Zambia": "official lyrics written in English; the stored text is the Bemba version",
    "Canada": "the English lyrics (Weir, 1908) are an independent official text, not a translation of the French",
    "Nigeria": "written in English; the stored text is a Yoruba translation",
    "Uganda": "written in English; the stored text is a Luganda translation",
    "The Gambia": "written in English; the stored text is a Wolof translation",
    "Grenada": "written in English; the stored text is a Grenadian Creole translation",
    "Saint Lucia": "written in English; the stored text is a Kwéyòl translation",
    "Fiji": "the English lyrics are an independent official text; the Fijian lyrics differ in content",
    "New Zealand": "written in English (Bracken, 1876); the stored Māori text is an 1878 translation",
}


def english_original_ids(dataset):
    """song_ids of the national anthems listed above (raises if a listed country has no anthem row)."""
    an = dataset[dataset.song_type == "national anthem"]
    ids = {}
    for c, why in ENGLISH_ORIGINAL.items():
        m = an[an.country == c]
        if len(m) != 1:
            raise ValueError(f"text_origin: expected one national anthem for {c}, found {len(m)}")
        ids[m.song_id.iloc[0]] = f"{c}: {why}"
    return ids


def english_language_ids(dataset):
    """All songs whose scored English text is the original: the listed anthems plus songs with no stored original."""
    ids = set(english_original_ids(dataset))
    ids |= set(dataset[~dataset.has_original.astype(bool)].song_id)
    return ids - {sid for sid in dataset[dataset.country == "Iceland"].song_id}
