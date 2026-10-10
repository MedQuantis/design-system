# Writing

## No em dash, no en dash

Never use the em dash or the en dash, in any language, in any copy: slides, reports, pages, emails, app strings, translations and these guidelines. A guideline test fails on either character in `guidelines/`.

Choose the punctuation that matches how the two parts relate:

- a second clause with its own subject becomes a new sentence;
- an aside goes between commas or in parentheses;
- a definition, an explanation or a list lead-in takes a colon;
- two balanced independent clauses take a semicolon;
- a short label pairing (a section number and its name, a scope and its period) takes a middle dot: "04 · Analytics".

A spaced hyphen used as an aside is a disguised dash and follows the same rule. Hyphens inside compound words stay ("Swiss-hosted", "nDSG-konform"). The middle dot and the arrow (→) are allowed.

When translating, never carry a dash over from the source language: restructure the sentence in the target language.

## Titles

- Sentence case: capital on the first word and on proper nouns only.
- No full stop at the end of a title, even a title of two sentences (drop only the final one).
- Eyebrows and section labels are typed in normal case; CSS sets them in capitals ([typography](typography.md)).

## Sentences and lists

- Write full sentences with a subject and a verb. An idea that matters gets two or three sentences, not a bullet.
- Distrust triads and mechanical bullet lists. A list is for items that are genuinely parallel.
- Body pages: short sentences, one idea per bullet.
- Summary and agenda pages: one line per point, readable in three seconds. The detail lives in the body pages.

## French typography

- A non-breaking space (U+00A0) before `:`, `;`, `?`, `!` and `%`.
- French quotation marks with non-breaking spaces inside: « exemple ».
- Regulatory abbreviations as listed in [voice](voice.md).

## Source files

Markdown is written one line per paragraph or list item, never hard-wrapped at a fixed width. Editors wrap the display; the file keeps one logical line per paragraph.
