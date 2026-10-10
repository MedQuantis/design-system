# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools==4.66.1", "brotli==1.2.0", "uharfbuzz==0.56.3"]
# ///
"""Outline the MQ monogram and the MedQuantis wordmark from the Outfit variable font.

Usage: uv run scripts/outline-brand.py [--check] <outfit-variable.woff2> <brand-dir>

Writes the monogram set (M Outfit 700, Q Outfit 400, centred on cap height, corners 8/64;
small variant M 800, Q 600 with larger letters) and the wordmark ("Med" Outfit 600, "Quantis"
Outfit 300, navy on light, white on navy) as screen variants with
live text and print variants with outlined text. With --check nothing is written; the script
exits 1 when a committed file differs from what the font produces.
"""
import io
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

NAVY, WHITE = "#0a2463", "#ffffff"
SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="{}">'


def number(value):
    return ("%.2f" % value).rstrip("0").rstrip(".")


class Outfit:
    def __init__(self, path):
        self.path = path
        self.instances = {}

    def instance(self, weight):
        if weight not in self.instances:
            self.instances[weight] = instantiateVariableFont(TTFont(self.path), {"wght": weight})
        return self.instances[weight]


def monogram_path(font, m_weight, q_weight, font_px, size=64.0, base=42.0):
    """Two glyphs set on their advance widths with a fixed tracking, centred on the ink of both
    letters horizontally and on the cap height of the M vertically; the Q tail hangs below."""
    track = -0.6 * font_px / 28
    m, q = font.instance(m_weight), font.instance(q_weight)
    gm, gq = m.getGlyphSet(), q.getGlyphSet()
    nm, nq = m.getBestCmap()[ord("M")], q.getBestCmap()[ord("Q")]
    scale = font_px / m["head"].unitsPerEm

    def bounds(glyphs, name, dx):
        pen = BoundsPen(glyphs)
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, dx, base)))
        return pen.bounds

    x_q = gm[nm].width * scale + track
    bm, bq = bounds(gm, nm, 0.0), bounds(gq, nq, x_q)
    ink_l, ink_r = min(bm[0], bq[0]), max(bm[2], bq[2])
    shift_x = (size - (ink_r - ink_l)) / 2 - ink_l
    shift_y = (size - (bm[3] - bm[1])) / 2 - bm[1]

    def path(glyphs, name, dx):
        pen = SVGPathPen(glyphs, ntos=number)
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, dx + shift_x, base + shift_y)))
        return pen.getCommands()

    return path(gm, nm, 0.0) + path(gq, nq, x_q)


def monogram_svg(d, rx):
    return (SVG_OPEN.format("0 0 64 64") + f'<rect width="64" height="64" rx="{rx}" fill="{NAVY}"/>'
            f'<path fill="{WHITE}" d="{d}"/></svg>\n')


WORDMARK_PX = 48
WORDMARK_RUNS = (("Med", 600), ("Quantis", 300))


def shape(font, text, weight):
    """Glyph names and pen positions (font units) with the font's kerning, as a browser sets
    one run of live text. Runs of different weights are shaped apart, as browsers do."""
    instance = font.instance(weight)
    data = io.BytesIO()
    # HarfBuzz cannot read woff2, the flavour the instance inherits from its source.
    instance.flavor = None
    instance.save(data)
    hb_font = hb.Font(hb.Face(data.getvalue()))
    buffer = hb.Buffer()
    buffer.add_str(text)
    buffer.guess_segment_properties()
    hb.shape(hb_font, buffer, {"kern": True, "liga": True})
    order = instance.getGlyphOrder()
    pen_x, placed = 0, []
    for info, pos in zip(buffer.glyph_infos, buffer.glyph_positions):
        placed.append((order[info.codepoint], pen_x + pos.x_offset, pos.y_offset))
        pen_x += pos.x_advance
    return instance.getGlyphSet(), placed, pen_x, instance["head"].unitsPerEm


def wordmark(font):
    """Returns the viewBox, the live-text origin and the outline path, sharing one ink box."""
    runs, x = [], 0.0
    for text, weight in WORDMARK_RUNS:
        glyphs, placed, advance, upm = shape(font, text, weight)
        scale = WORDMARK_PX / upm
        runs.append((glyphs, placed, scale, x))
        x += advance * scale

    def draw(pen_factory, dx, dy):
        for glyphs, placed, scale, run_x in runs:
            for name, gx, gy in placed:
                pen = pen_factory(glyphs)
                glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, dx + run_x + gx * scale, dy - gy * scale)))
                yield pen

    boxes = [pen.bounds for pen in draw(BoundsPen, 0.0, 0.0) if pen.bounds]
    left, top = min(b[0] for b in boxes), min(b[1] for b in boxes)
    right, bottom = max(b[2] for b in boxes), max(b[3] for b in boxes)
    origin_x, origin_y = round(-left, 2), round(-top, 2)
    view_box = f"0 0 {number(right - left)} {number(bottom - top)}"
    d = "".join(pen.getCommands() for pen in draw(lambda glyphs: SVGPathPen(glyphs, ntos=number), origin_x, origin_y))
    return view_box, origin_x, origin_y, d


def wordmark_svgs(font):
    view_box, origin_x, origin_y, d = wordmark(font)
    spans = "".join(f'<tspan font-weight="{weight}">{text}</tspan>' for text, weight in WORDMARK_RUNS)
    files = {}
    for variant, fill in (("on-light", NAVY), ("on-navy", WHITE)):
        files[f"wordmark-{variant}.svg"] = (
            SVG_OPEN.format(view_box) + f'<text x="{number(origin_x)}" y="{number(origin_y)}" '
            f'font-family="Outfit, system-ui, sans-serif" font-size="{WORDMARK_PX}" fill="{fill}">{spans}</text></svg>\n')
        files[f"wordmark-{variant}-print.svg"] = SVG_OPEN.format(view_box) + f'<path fill="{fill}" d="{d}"/></svg>\n'
    return files


def render(font_path):
    font = Outfit(font_path)
    regular = monogram_path(font, 700, 400, 28.0)
    small = monogram_path(font, 800, 600, 34.0)
    files = {
        "monogram.svg": monogram_svg(regular, 8),
        "monogram-square.svg": monogram_svg(regular, 0),
        "monogram-small.svg": monogram_svg(small, 8),
        "favicon/favicon.svg": monogram_svg(regular, 8),
    }
    files.update(wordmark_svgs(font))
    return files


def main(argv):
    check = "--check" in argv
    args = [arg for arg in argv if arg != "--check"]
    if len(args) != 2:
        sys.exit(__doc__)
    font_path, out = args[0], Path(args[1])
    files = render(font_path)
    if check:
        stale = [name for name, text in files.items() if not (out / name).is_file() or (out / name).read_text() != text]
        for name in stale:
            print(f"outline-brand: {out / name} differs from the outlines of {Path(font_path).name}")
        print(f"outline-brand: {len(files) - len(stale)} of {len(files)} files reproduce")
        sys.exit(1 if stale else 0)
    for name, text in files.items():
        (out / name).parent.mkdir(parents=True, exist_ok=True)
        (out / name).write_text(text)
    print(f"outline-brand: wrote {len(files)} files to {out}")


if __name__ == "__main__":
    main(sys.argv[1:])
