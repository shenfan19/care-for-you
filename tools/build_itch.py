"""Builds the zip for itch.io from frontend/: python tools/build_itch.py [output.zip]
With --site it builds the full version for the website instead (Cloudflare Pages takes up to 20000 files): the mini-figure and
pet sprites stay in, there is no file limit, and the output is care-for-you-<version>-site.zip.

itch.io accepts an HTML5 zip with at most 1000 files after extraction, and the game has more than that. The zip leaves out
what the page never loads (tests, tools, the source YAML that is already packed into scripts, the 3D demo, the lab page)
and the mini-figure and pet sprites, which are about 1100 small images. Without them the game offers only the dressed bean,
see CY.figuresAvailable in frontend/src/world/avatar.js. index.html sits at the root of the zip.
Run node tools/predeploy.js first so the packed scripts are current."""
import json, os, sys, zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'frontend')
META = open(os.path.join(SRC, 'src', 'core', 'meta.js'), encoding='utf-8').read()
VERSION = META.split("version: '")[1].split("'")[0]
SITE = '--site' in sys.argv
ARGS = [a for a in sys.argv[1:] if a != '--site']
OUT = ARGS[0] if ARGS else os.path.join(ROOT, 'care-for-you-%s-%s.zip' % (VERSION, 'site' if SITE else 'itch'))
LIMIT = None if SITE else 1000

SKIP_TOP = {'tests', 'temp_bean', 'demo3d', 'config'}
SKIP_PREFIX = ('src/data/cards/', 'src/data/visitors/', 'src/data/lm/') + (() if SITE else ('assets/iso/char/', 'assets/iso/pet/'))
SKIP_FILES = {'lab.html', 'assets/iso/manifest.json'} | (set() if SITE else {'assets/iso/LICENSE_Kenney_Mini_Characters_CC0.txt', 'assets/iso/LICENSE_Kenney_Cube_Pets_CC0.txt'})


def wanted(rel):
    if rel.split('/')[0] in SKIP_TOP or rel in SKIP_FILES or rel.startswith(SKIP_PREFIX):
        return False
    return not (os.path.basename(rel).startswith('temp_') or rel.endswith('.md'))


def sprite_manifest():
    """The anchor table without the character and pet entries, so the game knows those sprites are not in this build."""
    path = os.path.join(SRC, 'assets', 'iso', 'manifest.js')
    s = open(path, encoding='utf-8').read()
    i = s.index('isoSprites = ') + len('isoSprites = ')
    j = s.rindex('};') + 1
    d = json.loads(s[i:j])
    for k in ('char', 'pet'):
        d.pop(k, None)
    return s[:i] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + s[j:]


names = []
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for root, _, files in os.walk(SRC):
        for f in sorted(files):
            full = os.path.join(root, f)
            rel = os.path.relpath(full, SRC).replace('\\', '/')
            if not wanted(rel):
                continue
            if rel == 'assets/iso/manifest.js' and not SITE:
                z.writestr(rel, sprite_manifest())
            else:
                z.write(full, rel)
            names.append(rel)

size = os.path.getsize(OUT)
print('%d files, %.1f MB -> %s' % (len(names), size / 1048576, os.path.normpath(OUT)))
if 'index.html' not in names:
    sys.exit('index.html is not at the root of the zip')
if LIMIT and len(names) > LIMIT:
    sys.exit('too many files for itch.io: %d, the limit is %d' % (len(names), LIMIT))
