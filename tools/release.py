"""Publishes a version to GitHub, and through the GitHub release to Zenodo.

    python tools/release.py                 dry run: checks, tests, builds the zip, prints what it would do
    python tools/release.py 0.70.1          dry run for a new version number
    python tools/release.py 0.70.1 --yes    really publish
    options: --notes FILE   release notes in a file; without it the notes come from the commit subjects since the last tag
             --skip-tests   skip the test suites (dry runs only, publishing always runs them)

What it does, in order: refuses to run on a dirty tree or off main, sets the version in meta.js, index.html and CITATION.cff
when a version is given, runs predeploy and the test suites, builds the lean playable zip, then with --yes commits, tags
vX.Y.Z, pushes main and the tag, creates the GitHub release with the zip attached, and looks for the Zenodo record.
Zenodo takes a version only from a published GitHub release, a tag alone is not enough, and the repository must already be
switched on in Zenodo's GitHub settings. Needs git and gh (logged in) on the path."""
import datetime, json, os, re, subprocess, sys, time, urllib.parse, urllib.request

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
FRONT = os.path.join(ROOT, 'frontend')
SUITES = ['logic', 'play', 'dispatch', 'ledger', 'cond', 'qa_matrix', 'account']
FOOTER = '\nMIT licensed. Art by Kenney (CC0), see the README for credits.\n'


def run(cmd, **kw):
    print('$', ' '.join(cmd) if isinstance(cmd, list) else cmd)
    return subprocess.run(cmd, cwd=kw.pop('cwd', ROOT), **kw)


def out(cmd):
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding='utf-8').stdout.strip()


def die(msg):
    sys.exit('release: ' + msg)


def read(p):
    return open(p, encoding='utf-8').read()


def write(p, s):
    open(p, 'w', encoding='utf-8', newline='').write(s)


def current_version():
    return re.search(r"version: '([^']+)'", read(os.path.join(FRONT, 'src', 'core', 'meta.js'))).group(1)


def set_version(v):
    today = datetime.date.today().isoformat()
    p = os.path.join(FRONT, 'src', 'core', 'meta.js')
    write(p, re.sub(r"version: '[^']+'(, schema: \d+, released: )'[^']+'", lambda m: "version: '%s'%s'%s'" % (v, m.group(1), today), read(p)))
    p = os.path.join(FRONT, 'index.html')
    write(p, re.sub(r'\?v=[0-9.]+', '?v=' + v, read(p)))
    p = os.path.join(ROOT, 'CITATION.cff')
    s = read(p)
    s = re.sub(r'^version: .*$', 'version: "%s"' % v, s, flags=re.M) if re.search(r'^version:', s, re.M) else s.replace('type: software\n', 'type: software\nversion: "%s"\n' % v, 1)
    s = re.sub(r'^date-released: .*$', 'date-released: "%s"' % today, s, flags=re.M) if re.search(r'^date-released:', s, re.M) else s.replace('version: "%s"\n' % v, 'version: "%s"\ndate-released: "%s"\n' % (v, today), 1)
    write(p, s)


def notes_text(args, prev):
    if '--notes' in args:
        return read(args[args.index('--notes') + 1])
    log = out(['git', 'log', '--no-merges', '--pretty=- %s', (prev + '..HEAD') if prev else 'HEAD'])
    return 'Changes since %s:\n\n%s\n%s' % (prev or 'the start', log, FOOTER)


def zenodo_record(tag):
    url = 'https://zenodo.org/api/records?q=%s&sort=mostrecent&size=5' % urllib.parse.quote('"care-for-you"')
    try:
        hits = json.load(urllib.request.urlopen(url, timeout=30))['hits']['hits']
    except Exception as e:
        return 'could not ask Zenodo (%s), check zenodo.org by hand' % e
    for h in hits:
        if h['metadata'].get('version') == tag:
            return 'Zenodo record found: doi %s' % h.get('doi')
    return None


def main():
    args = sys.argv[1:]
    yes = '--yes' in args
    pos = [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or args[i - 1] != '--notes')]
    version = pos[0] if pos else current_version()
    tag = 'v' + version
    branch = out(['git', 'branch', '--show-current'])
    if branch != 'main':
        die('on branch %s, switch to main first' % branch)
    if out(['git', 'status', '--porcelain']):
        die('the working tree is not clean, commit or stash first')
    if out(['git', 'tag', '-l', tag]):
        die('tag %s already exists, give a new version number' % tag)
    if run(['gh', 'auth', 'status'], capture_output=True).returncode:
        die('gh is not logged in')

    changed = pos and version != current_version()
    if changed:
        set_version(version)
    zip_path = os.path.join(ROOT, '..', 'care-for-you-%s-web.zip' % version)   # outside the repo, so git add -A never picks it up
    try:
        r = run(['node', 'tools/predeploy.js'])
        if r.returncode:
            die('predeploy failed')
        if '--skip-tests' in args and not yes:
            print('tests skipped')
        else:
            for s in SUITES:
                r = run(['node', 'frontend/tests/%s_test.js' % s], capture_output=True, text=True, encoding='utf-8')
                bad = [l for l in r.stdout.splitlines() if l.startswith('失败')]
                if r.returncode or bad or 'Error' in r.stderr:
                    die('test suite %s failed: %s' % (s, '; '.join(bad[:3]) or r.stderr[-300:]))
                print('  %s ok' % s)
        if run([sys.executable, 'tools/build_itch.py', zip_path]).returncode:
            die('building the zip failed')
        prev = out(['git', 'describe', '--tags', '--abbrev=0', '--match', 'v*'])
        notes = notes_text(args, prev)
        print('\n--- release %s, notes ---\n%s\n--- end ---' % (tag, notes))
        if not yes:
            print('\nDry run only. %s would be committed, tagged, pushed and released with %s attached.' % ('The version change' if changed else 'The current commit', os.path.basename(zip_path)))
            print('Run again with --yes to publish.')
            return
        if changed:
            run(['git', 'add', '-A'])
            if run(['git', 'commit', '-m', 'release %s: version, citation metadata' % version]).returncode:
                die('commit failed')
        run(['git', 'tag', '-a', tag, '-m', 'Care for You %s' % version])
        if run(['git', 'push', 'origin', 'main']).returncode or run(['git', 'push', 'origin', tag]).returncode:
            die('push failed, nothing was released')
        notes_file = os.path.join(ROOT, '.release_notes.tmp')
        write(notes_file, notes)
        try:
            r = run(['gh', 'release', 'create', tag, zip_path, '--title', 'Care for You %s' % version, '--notes-file', notes_file, '--latest'])
        finally:
            os.remove(notes_file)
        if r.returncode:
            die('gh release create failed, the tag is pushed, create the release by hand')
        print('\nGitHub release done. Waiting for Zenodo, it usually takes under a minute.')
        for _ in range(8):
            time.sleep(15)
            found = zenodo_record(tag)
            if found:
                print(found)
                return
        print('No Zenodo record yet. Check zenodo.org, and that the repository is switched on in its GitHub settings.')
    finally:
        if not yes and changed:
            run(['git', 'checkout', '--', '.'])   # a dry run leaves the tree as it was
        if os.path.exists(zip_path) and not yes:
            os.remove(zip_path)


if __name__ == '__main__':
    main()
