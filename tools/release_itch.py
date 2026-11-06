"""Builds the zip for itch.io, checks it the way itch will run it, and optionally pushes it with itch's butler tool.

    python tools/release_itch.py                          build and check, then print what to do by hand
    python tools/release_itch.py --push USER/GAME:html5   also upload with butler (channel name is yours to choose)
    options: --no-check   skip the browser check

The check unpacks the zip to a temporary folder, serves it, loads index.html inside a 960 x 640 frame the way itch does and
looks for missing files, script errors, the embed mode (no page header, settings in the window corner). It needs
Python playwright with Chromium. The upload needs butler on the path and BUTLER_API_KEY set or a prior `butler login`;
without --push nothing is uploaded and the manual steps are printed. The zip stays outside the repository."""
import os, re, shutil, subprocess, sys, tempfile, threading, zipfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
META = open(os.path.join(ROOT, 'frontend', 'src', 'core', 'meta.js'), encoding='utf-8').read()
VERSION = re.search(r"version: '([^']+)'", META).group(1)
ZIP = os.path.normpath(os.path.join(ROOT, '..', 'care-for-you-%s-itch.zip' % VERSION))


def die(msg):
    sys.exit('release_itch: ' + msg)


def check(zip_path):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('playwright is not installed, browser check skipped')
        return True
    tmp = tempfile.mkdtemp()
    try:
        game = os.path.join(tmp, 'game')
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(game)
        open(os.path.join(tmp, 'wrap.html'), 'w', encoding='utf-8').write(
            '<!doctype html><body style="margin:0"><iframe id="g" src="/game/index.html" width="960" height="640" style="border:0"></iframe>')
        class Quiet(SimpleHTTPRequestHandler):
            def log_message(self, *args):
                pass
        handler = lambda *a, **k: Quiet(*a, directory=tmp, **k)
        srv = ThreadingHTTPServer(('127.0.0.1', 0), handler)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        base = 'http://127.0.0.1:%d' % srv.server_address[1]
        bad, errs = [], []
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_context(viewport={'width': 1000, 'height': 700}).new_page()
            pg.on('response', lambda r: bad.append('%d %s' % (r.status, r.url.replace(base, ''))) if r.status >= 400 else None)
            pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            pg.goto(base + '/wrap.html')
            pg.wait_for_timeout(3000)
            f = pg.frames[1]
            f.evaluate("""async()=>{const G=CY.game; for(const a of ['dad','mom']){await G.createPerson({arch:a,name:a})} await G.load(); G.world.intro_done=true; await G.save(true); await new Promise(r=>setTimeout(r,600));}""")
            f.evaluate('location.reload()')
            pg.wait_for_timeout(3000)
            f = pg.frames[1]
            embed = f.evaluate("document.body.classList.contains('embed') && getComputedStyle(document.querySelector('header')).display === 'none'")
            corner = f.evaluate("!!document.querySelector('.cornerbox #gearBtn') && !!document.querySelector('.cornerbox #aboutBtn')")
            people = f.evaluate("document.querySelectorAll('.cx[data-id]').length")
            b.close()
        srv.shutdown()
        ok = not bad and not errs and embed and corner and people >= 2
        print('check: embed mode %s, settings in corner %s, %d characters drawn, missing files %s, script errors %s -> %s'
              % (embed, corner, people, bad[:5] or 'none', errs[:3] or 'none', 'ok' if ok else 'FAILED'))
        return ok
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    args = sys.argv[1:]
    if subprocess.run(['node', 'tools/predeploy.js'], cwd=ROOT).returncode:
        die('predeploy failed, the packed scripts may be out of date')
    if subprocess.run([sys.executable, 'tools/build_itch.py', ZIP], cwd=ROOT).returncode:
        die('building the zip failed')
    if '--no-check' not in args and not check(ZIP):
        die('the browser check failed, not uploading')
    if '--push' in args:
        target = args[args.index('--push') + 1]
        if not shutil.which('butler'):
            die('butler is not on the path, get it from itch.io/docs/butler, or upload %s by hand' % ZIP)
        r = subprocess.run(['butler', 'push', ZIP, target, '--userversion', VERSION])
        sys.exit(r.returncode)
    print('\nZip ready: %s' % ZIP)
    print('By hand on itch.io: edit the game, upload this zip and tick "This file will be played in the browser",')
    print('then Embed options: Embed in page, viewport 960 x 640, Mobile friendly on, automatic start off.')


if __name__ == '__main__':
    main()
