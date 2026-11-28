#!/usr/bin/env python3
"""
Subset the Material Symbols variable font to the icons the app actually uses.

The full variable font is ~15 MB (every icon, 4 axes) and the app waits for it
before showing the UI, so it dominated LCP. Icon names are ligatures ("search",
"view_agenda", ...): this script keeps only the ligatures whose name appears as a
token somewhere in the sources, keeps every variation axis (FILL, wght, GRAD,
opsz) so icons render exactly as before, and writes a real WOFF2.

Any lowercase token in the sources that is also an icon name is kept, so names in
JS strings and maps (roleIcons, badgeIcon, ...) are covered too. Extra matches
from ordinary words only add a few KB.

Usage (needs fonttools + brotli: `pip install fonttools brotli`):
    python3 scripts/subset-icons.py

Outputs:
    src/assets/fonts/material-symbols-subset.woff2   font used by material-icons.css
    src/assets/fonts/material-symbols-subset.json    icon names it contains
    scripts/material-symbols-names.json              every icon name of the full font
The last two let the build (vite.config.js) warn when a new icon is used but is not
in the subset yet: then run this script again.
"""
import json
import re
import sys
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE_FONT = ROOT / 'src/assets/fonts/Material_Symbols_Rounded/MaterialSymbolsRounded-VariableFont_FILL,GRAD,opsz,wght.ttf'
OUT_FONT = ROOT / 'src/assets/fonts/material-symbols-subset.woff2'
OUT_USED = ROOT / 'src/assets/fonts/material-symbols-subset.json'
OUT_ALL = ROOT / 'scripts/material-symbols-names.json'

SCAN_DIRS = [ROOT / 'src', ROOT / 'public']
SCAN_FILES = [ROOT / 'index.html']
SCAN_EXT = {'.vue', '.js', '.css', '.html', '.json', '.webmanifest'}
TOKEN = re.compile(r'[a-z0-9_]+')


def ligature_subtables(font):
    gsub = font['GSUB'].table
    for lookup in gsub.LookupList.Lookup:
        for sub in lookup.SubTable:
            if lookup.LookupType == 7:  # extension
                sub = sub.ExtSubTable
            if sub.LookupType == 4:
                yield sub


def char_of_glyph(font):
    """glyph -> character; letters map from both cases, keep the lowercase one."""
    rev = {}
    for cp, glyph in font.getBestCmap().items():
        if glyph not in rev or chr(cp).islower():
            rev[glyph] = chr(cp)
    return rev


def ligature_names(font):
    """{icon name: output glyph} from the GSUB ligatures."""
    rev = char_of_glyph(font)
    names = {}
    for sub in ligature_subtables(font):
        for first, ligs in sub.ligatures.items():
            for lig in ligs:
                chars = [rev.get(g) for g in [first, *lig.Component]]
                if None in chars:
                    continue
                names[''.join(chars)] = lig.LigGlyph
    return names


def source_tokens():
    tokens = set()
    files = list(SCAN_FILES)
    for d in SCAN_DIRS:
        files += [p for p in d.rglob('*') if p.is_file() and p.suffix in SCAN_EXT and p != OUT_USED
                  and '__tests__' not in p.parts]
    for p in files:
        try:
            tokens.update(TOKEN.findall(p.read_text(encoding='utf-8', errors='ignore')))
        except OSError:
            pass
    return tokens


def main():
    font = TTFont(SOURCE_FONT)
    all_names = ligature_names(font)
    used = sorted(n for n in source_tokens() if n in all_names)
    keep = set(used)

    # Drop every ligature that is not used, so the subsetter's GSUB closure keeps only those.
    rev = char_of_glyph(font)
    for sub in ligature_subtables(font):
        for first in list(sub.ligatures):
            kept = [
                lig for lig in sub.ligatures[first]
                if ''.join(rev.get(g, '\0') for g in [first, *lig.Component]) in keep
            ]
            if kept:
                sub.ligatures[first] = kept
            else:
                del sub.ligatures[first]

    options = Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.notdef_outline = True
    options.name_IDs = ['*']
    options.hinting = False
    subsetter = Subsetter(options)
    chars = set(''.join(used))
    # Upper case too: ligatures match either case, as in the full font.
    text = ''.join(sorted(chars | {c.upper() for c in chars})) + ' '
    subsetter.populate(text=text, glyphs=[all_names[n] for n in used])
    subsetter.subset(font)
    font.flavor = 'woff2'
    font.save(OUT_FONT)

    OUT_USED.write_text(json.dumps(used, indent=0) + '\n')
    OUT_ALL.write_text(json.dumps(sorted(all_names)) + '\n')
    print(f'{len(used)} icons kept of {len(all_names)} -> {OUT_FONT.relative_to(ROOT)} '
          f'({OUT_FONT.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    sys.exit(main())
