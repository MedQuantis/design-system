#!/usr/bin/env python3
"""Make an HTML page self-contained: inline its local stylesheets, fonts and images.

Usage: python3 bundle.py PAGE.html OUT.html

Each <link rel="stylesheet" href="local.css"> becomes a <style> block; url(...) references inside
it (the woff2 files of fonts.css) and local <img src> files become data URIs. Remote URLs are
left alone. Use it to deliver one file (an artifact, an attachment) after building a page that
links the skill's assets/ folder.
"""

import base64
import mimetypes
import re
import sys
from pathlib import Path

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/svg+xml", ".svg")


def is_local(ref):
    return not re.match(r"^(?:[a-z]+:|//|#)", ref, re.I)


def data_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"


def inline_css(css, base):
    def url(match):
        ref = match.group(2)
        target = (base / ref.split("#")[0].split("?")[0]).resolve()
        if not is_local(ref) or not target.is_file():
            return match.group(0)
        return f"url({data_uri(target)})"

    return re.sub(r"url\(\s*(['\"]?)([^'\")]+)\1\s*\)", url, css)


def bundle(page):
    text = page.read_text(encoding="utf-8")
    base = page.parent

    def link(match):
        tag = match.group(0)
        if not re.search(r"rel\s*=\s*[\"']?stylesheet", tag, re.I):
            return tag
        href = re.search(r"href\s*=\s*[\"']([^\"']+)", tag, re.I)
        if not href or not is_local(href.group(1)):
            return tag
        sheet = (base / href.group(1)).resolve()
        if not sheet.is_file():
            raise FileNotFoundError(f"stylesheet {href.group(1)} not found next to {page.name}")
        return f"<style>\n{inline_css(sheet.read_text(encoding='utf-8'), sheet.parent)}\n</style>"

    def image(match):
        ref = match.group(2)
        target = (base / ref).resolve()
        if not is_local(ref) or not target.is_file():
            return match.group(0)
        return f"{match.group(1)}{data_uri(target)}{match.group(3)}"

    text = re.sub(r"<link\b[^>]*>", link, text, flags=re.I)
    text = re.sub(r"(<img\b[^>]*\bsrc\s*=\s*[\"'])([^\"']+)([\"'])", image, text, flags=re.I)
    return re.sub(r"(<style[^>]*>)(.*?)(</style>)", lambda m: m.group(1) + inline_css(m.group(2), base) + m.group(3), text, flags=re.S | re.I)


def main(argv):
    if len(argv) != 2:
        print(__doc__.strip().splitlines()[2], file=sys.stderr)
        return 2
    page, out = Path(argv[0]), Path(argv[1])
    if not page.is_file():
        print(f"error: no such file {page}", file=sys.stderr)
        return 2
    try:
        out.write_text(bundle(page), encoding="utf-8")
    except FileNotFoundError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print(f"wrote {out} ({out.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
