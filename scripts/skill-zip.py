#!/usr/bin/env python3
"""Zip the Claude skill for upload to claude.ai (Settings, Features).

Usage: python3 scripts/skill-zip.py SKILL_DIR OUT.zip

The archive holds one top-level folder named after the skill, as claude.ai expects. The evals/
folder is for the repository's eval runner only and stays out. Entries are sorted and dated
1980-01-01 so two builds of the same tree are byte-identical.
"""

import sys
import zipfile
from pathlib import Path

EXCLUDED = {"evals", "__pycache__"}


def main(argv):
    if len(argv) != 2:
        print(__doc__.strip().splitlines()[2], file=sys.stderr)
        return 2
    skill, out = Path(argv[0]), Path(argv[1])
    if not (skill / "SKILL.md").is_file():
        print(f"error: {skill} holds no SKILL.md", file=sys.stderr)
        return 2
    out.parent.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in skill.rglob("*") if p.is_file() and not EXCLUDED.intersection(p.relative_to(skill).parts))
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in files:
            info = zipfile.ZipInfo(f"{skill.name}/{path.relative_to(skill).as_posix()}", date_time=(1980, 1, 1, 0, 0, 0))
            info.external_attr = 0o644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, path.read_bytes())
    print(f"wrote {out}: {len(files)} files, {out.stat().st_size} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
