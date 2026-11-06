"""Updates the website on Cloudflare with wrangler, using the same lean zip as itch.io.

    python tools/deploy_site.py              dry run: build, unpack and let wrangler check, nothing is uploaded
    python tools/deploy_site.py --yes        really deploy
    options: --name WORKER   the Worker to update, default below; its custom domain stays attached
             --full          the full version with the mini figures, instead of the lean one

Update in place: deploying to the same Worker name replaces the files and keeps careforyou.dev attached. The first time on
this computer run `npx wrangler login`, it opens Cloudflare in the browser and you click Allow. After that this script is
all that is needed. wrangler is fetched by npx when missing, which needs node and a network."""
import os, re, shutil, subprocess, sys, tempfile, zipfile

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
DEFAULT_WORKER = 'long-sun-1359'
COMPAT_DATE = '2025-11-01'
META = open(os.path.join(ROOT, 'frontend', 'src', 'core', 'meta.js'), encoding='utf-8').read()
VERSION = re.search(r"version: '([^']+)'", META).group(1)


def die(msg):
    sys.exit('deploy_site: ' + msg)


def main():
    args = sys.argv[1:]
    yes = '--yes' in args
    full = '--full' in args
    name = args[args.index('--name') + 1] if '--name' in args else DEFAULT_WORKER
    if subprocess.run(['node', 'tools/predeploy.js'], cwd=ROOT).returncode:
        die('predeploy failed')
    tmp = tempfile.mkdtemp()
    try:
        zip_path = os.path.join(tmp, 'site.zip')
        cmd = [sys.executable, 'tools/build_itch.py'] + (['--site'] if full else []) + [zip_path]
        if subprocess.run(cmd, cwd=ROOT).returncode:
            die('building the zip failed')
        folder = os.path.join(tmp, 'site')
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(folder)
        deploy = ['npx', '--yes', 'wrangler', 'deploy', '--assets', folder, '--name', name, '--compatibility-date', COMPAT_DATE, '--message', 'Care for You %s' % VERSION]
        if not yes:
            deploy.append('--dry-run')
        print('$', ' '.join(deploy))
        r = subprocess.run(deploy, cwd=tmp, shell=(os.name == 'nt'))
        if r.returncode:
            die('wrangler failed; if it asks for a login run: npx wrangler login')
        print('\n%s' % ('Deployed %s to the Worker %s.' % (VERSION, name) if yes else 'Dry run only, add --yes to deploy.'))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
