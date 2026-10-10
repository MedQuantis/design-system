#!/usr/bin/env python3
"""Check HTML, SVG or CSS output against the MedQuantis design system.

Usage: python3 validate.py [--medium document|app] FILE [FILE ...]

Fails (exit 1) on:
  - a colour outside the token set (hex, rgb(), hsl() and other colour functions, named colours),
    in CSS, style attributes, SVG colour attributes and quoted script values;
  - an unknown --mq-* token, a deprecated one, or a redefined one (consumers never override);
  - in documents (the default medium), any status colour, which is for apps only (ADR-0004);
  - an em dash or en dash in visible text;
  - a font or stylesheet loaded from a remote font service.
Exit 0 when every file is clean, 2 on a usage error. Standard library only (Python 3.11).
"""

import argparse
import colorsys
import html
import json
import re
import sys
from pathlib import Path

TOKENS = Path(__file__).resolve().parent.parent / "assets" / "tokens.json"

# The CSS Color 4 named colours. A name is a literal colour: write var(--mq-*) instead.
NAMED = set(
    """aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet
    brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue
    darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange
    darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise
    darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia
    gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo
    ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
    lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue
    lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon
    mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue
    mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
    navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
    paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
    rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue
    slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white
    whitesmoke yellow yellowgreen""".split()
)

# Properties whose bare words can be colour names; elsewhere a word such as "white" is not a colour.
COLOUR_PROPERTY = re.compile(
    r"colou?r|background|border|outline|fill|stroke|shadow|caret|accent|column-rule|text-decoration|stop|flood|lighting|^--",
    re.I,
)
SVG_COLOUR_ATTRIBUTES = ("fill", "stroke", "stop-color", "flood-color", "lighting-color", "color", "bgcolor")
HEX = re.compile(r"#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z_-])")
FUNCTION = re.compile(r"\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|device-cmyk|light-dark)\(", re.I)
VAR = re.compile(r"var\(\s*(--mq-[\w-]+)")
REMOTE_FONT = re.compile(r"fonts\.(googleapis|gstatic)\.com|use\.typekit\.net|fonts\.bunny\.net", re.I)
DASHES = {"\u2014": "em dash", "\u2013": "en dash"}


def load_tokens(medium):
    """Allowed colours and token names for a medium, from the synced tokens.json."""
    tokens = json.loads(TOKENS.read_text(encoding="utf-8"))
    names, deprecated, status, allowed = set(tokens), {}, set(), set()
    for name, token in tokens.items():
        path = token.get("path", [])
        if token.get("deprecated"):
            deprecated[name] = token["deprecated"]
        is_status = len(path) > 2 and path[0] == "semantic" and (path[2] == "status" or path[2] in ("warning-fill", "warning-tint"))
        if is_status:
            status.add(name)
        # Only semantic values are allowed: a value that exists only as a core token is not a role.
        if name.startswith("--mq-core-") or (is_status and medium != "app"):
            continue
        for literal in colour_literals(str(token.get("value", ""))):
            rgba = to_rgba(literal)
            if rgba:
                allowed.add(rgba)
    return names, deprecated, status, allowed


def colour_literals(value):
    """Hex values and colour functions in a CSS value, each as its source text."""
    found = [m.group(0) for m in HEX.finditer(value)]
    for match in FUNCTION.finditer(value):
        depth, end = 0, match.end() - 1
        for index in range(end, len(value)):
            depth += {"(": 1, ")": -1}.get(value[index], 0)
            if depth == 0:
                end = index
                break
        found.append(value[match.start() : end + 1])
    return found


def to_rgba(literal):
    """(r, g, b, alpha) for hex, rgb() and hsl() values; None for functions we cannot resolve."""
    text = literal.strip().lower()
    if text.startswith("#"):
        digits = text[1:]
        if len(digits) in (3, 4):
            digits = "".join(c * 2 for c in digits)
        if len(digits) not in (6, 8):
            return None
        alpha = int(digits[6:8], 16) / 255 if len(digits) == 8 else 1.0
        return (int(digits[0:2], 16), int(digits[2:4], 16), int(digits[4:6], 16), round(alpha, 2))
    match = re.match(r"(rgba?|hsla?)\((.*)\)$", text)
    if not match:
        return None
    parts = [p for p in re.split(r"[\s,/]+", match.group(2).strip()) if p]
    if len(parts) not in (3, 4):
        return None

    def number(part, scale):
        return float(part[:-1]) * scale / 100 if part.endswith("%") else float(part.rstrip("deg"))

    try:
        alpha = number(parts[3], 1) if len(parts) == 4 else 1.0
        if match.group(1).startswith("rgb"):
            rgb = [round(number(p, 255)) for p in parts[:3]]
        else:
            hue, sat, light = number(parts[0], 360) / 360, number(parts[1], 1), number(parts[2], 1)
            rgb = [round(c * 255) for c in colorsys.hls_to_rgb(hue % 1, light, sat)]
    except ValueError:
        return None
    return (rgb[0], rgb[1], rgb[2], round(alpha, 2))


class Report:
    def __init__(self, path, text):
        self.path, self.text, self.findings = path, text, []

    def add(self, offset, message):
        line = self.text.count("\n", 0, offset) + 1
        self.findings.append(f"{self.path}:{line}: {message}")


def check_value(report, offset, prop, value, rules):
    names, deprecated, status, allowed, medium = rules
    value = re.sub(r"url\([^)]*\)", "url()", value)
    for literal in colour_literals(value):
        rgba = to_rgba(literal)
        if rgba is None or rgba not in allowed:
            report.add(offset, f"colour {literal} is outside the {medium} token set; use var(--mq-*)")
    if COLOUR_PROPERTY.search(prop):
        for word in re.findall(r"(?<![\w#-])[a-zA-Z]+(?![\w(-])", value):
            if word.lower() in NAMED:
                report.add(offset, f"named colour {word} is outside the token set; use var(--mq-*)")
    for match in VAR.finditer(value):
        name = match.group(1)
        if name not in names:
            report.add(offset, f"unknown token {name}")
        elif name in deprecated:
            report.add(offset, f"deprecated token {name}: {deprecated[name]}")
        elif name in status and medium != "app":
            report.add(offset, f"status colour {name} is for apps only (ADR-0004); documents show state by mark style")


def check_css(report, css, base, rules):
    css = re.sub(r"/\*.*?\*/", lambda m: " " * len(m.group(0)), css, flags=re.S)
    for block in re.finditer(r"\{([^{}]*)\}", css):
        start = block.start(1)
        for declaration in re.finditer(r"([^;:]+):([^;]*)", block.group(1)):
            prop = declaration.group(1).strip()
            offset = base + start + declaration.start()
            if prop.startswith("--mq-"):
                report.add(offset, f"{prop}: redefines a design-system token; consumers never override --mq-* names")
            check_value(report, offset, prop, declaration.group(2), rules)
    for match in REMOTE_FONT.finditer(css):
        report.add(base + match.start(), "remote font service; load the self-hosted fonts.css")


def check_markup(report, text, rules):
    for match in re.finditer(r"<style[^>]*>(.*?)</style>", text, flags=re.S | re.I):
        check_css(report, match.group(1), match.start(1), rules)
    for match in re.finditer(r"\sstyle\s*=\s*(\"([^\"]*)\"|'([^']*)')", text, flags=re.I):
        body = html.unescape(match.group(2) if match.group(2) is not None else match.group(3))
        check_css(report, "{" + body + "}", match.start() - 1, rules)
    attributes = "|".join(SVG_COLOUR_ATTRIBUTES)
    for match in re.finditer(rf"\s({attributes})\s*=\s*(\"([^\"]*)\"|'([^']*)')", text, flags=re.I):
        value = match.group(3) if match.group(3) is not None else match.group(4)
        check_value(report, match.start(), match.group(1), value, rules)
    for match in re.finditer(r"<script[^>]*>(.*?)</script>", text, flags=re.S | re.I):
        for literal in re.finditer(r"(['\"`])(#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?)\([^)]*\))\1", match.group(1)):
            check_value(report, match.start(1) + literal.start(), "--script", literal.group(2), rules)
    for match in re.finditer(r"<link[^>]+href\s*=\s*[\"']([^\"']+)", text, flags=re.I):
        if REMOTE_FONT.search(match.group(1)):
            report.add(match.start(), "remote font service; load the self-hosted fonts.css")
    visible = re.sub(r"<(script|style)[^>]*>.*?</\1>", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S | re.I)
    visible = re.sub(r"<[^>]*>", lambda m: "\n" * m.group(0).count("\n"), visible)
    for number, line in enumerate(visible.split("\n"), start=1):
        for character, label in DASHES.items():
            if character in html.unescape(line):
                report.findings.append(f"{report.path}:{number}: {label} in visible text; use a comma, colon, full stop or middle dot")


def main(argv):
    parser = argparse.ArgumentParser(description="Check output against the MedQuantis design system.")
    parser.add_argument("--medium", choices=("document", "app"), default="document", help="document (default: navy-only) or app (status colours allowed)")
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args(argv)
    if not TOKENS.exists():
        print(f"error: token data missing at {TOKENS}", file=sys.stderr)
        return 2
    rules = (*load_tokens(args.medium), args.medium)
    findings = []
    for path in args.files:
        if not path.is_file():
            print(f"error: no such file {path}", file=sys.stderr)
            return 2
        text = path.read_text(encoding="utf-8", errors="replace")
        report = Report(path, text)
        if path.suffix.lower() == ".css":
            check_css(report, text, 0, rules)
        else:
            check_markup(report, text, rules)
        findings.extend(report.findings)
    for finding in findings:
        print(finding)
    if findings:
        print(f"FAIL: {len(findings)} finding(s) in {len(args.files)} file(s), medium {args.medium}")
        return 1
    print(f"PASS: {len(args.files)} file(s) clean, medium {args.medium}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
