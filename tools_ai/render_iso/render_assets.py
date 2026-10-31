"""把 Kenney 的 CC0 三维模型渲染成斜视的 PNG 精灵。
用法：python render_assets.py furniture|characters
需要：playwright，以及 three.js 的 build 和 examples/jsm 放在 THREE_DIR 里（默认临时目录 r3，见 THREE_URL）。
输出：frontend/assets/iso/<类别>/<名字>_<朝向>.png，和 manifest.json（每张图的像素锚点和模型尺寸）。
朝向 0 到 3：面朝 gy 增加，gx 增加，gy 减少，gx 减少，也就是屏幕上的左下，右下，右上，左上。"""
import base64, http.server, json, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'frontend', 'assets', 'iso')
THREE_DIR = os.environ.get('THREE_DIR', os.path.join(os.environ.get('TEMP', '/tmp'), 'r3'))
FURN = os.environ.get('KENNEY_FURNITURE', 'C:/fight/kenney_furniture-kit/Models/GLTF format')
CHAR = os.environ.get('KENNEY_CHARS', 'C:/fight/kenney_mini-characters/Models/GLB format')
MAP = {'/three/': THREE_DIR, '/furn/': FURN, '/char/': CHAR, '/': HERE}

class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = path.split('?', 1)[0]
        for pre in ('/three/', '/furn/', '/char/'):
            if path.startswith(pre): return os.path.join(MAP[pre], *path[len(pre):].split('/')).replace('%20', ' ')
        return os.path.join(HERE, path.lstrip('/') or 'render.html')
    def log_message(self, *a): pass

def serve():
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(('127.0.0.1', 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]

FURN_SCALE = 1.9   # Kenney 家具的一个单位约 1.8 米，乘 1.9 后一格地砖约 1 米，单人床约 1.1 格宽 2.1 格长
FURNITURE = json.load(open(os.path.join(HERE, 'furniture_list.json'), encoding='utf-8'))

def main(kind):
    srv, port = serve()
    manifest_path = os.path.join(OUT, 'manifest.json')
    manifest = json.load(open(manifest_path, encoding='utf-8')) if os.path.exists(manifest_path) else {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', headless=True)
        pg = b.new_page(viewport={'width': 700, 'height': 700})
        pg.on('pageerror', lambda e: print('page error', e))
        pg.goto('http://127.0.0.1:%d/render.html' % port); pg.wait_for_function('window.ready === true')
        if kind == 'furniture':
            os.makedirs(os.path.join(OUT, 'furn'), exist_ok=True)
            for name in FURNITURE:
                m = manifest.setdefault('furn', {}).setdefault(name, {})
                for rot in range(4):
                    r = pg.evaluate('o => window.renderModel(o)', {'url': '/furn/%s.glb' % name, 'rot': rot, 'scale': FURN_SCALE})
                    open(os.path.join(OUT, 'furn', '%s_%d.png' % (name, rot)), 'wb').write(base64.b64decode(r['png'].split(',', 1)[1]))
                    bx = r['box']; m[str(rot)] = {'w': r['w'], 'h': r['h'], 'ax': r['ax'], 'ay': r['ay'], 'cx': round((bx[0] + bx[2]) / 2, 3), 'cz': round((bx[1] + bx[3]) / 2, 3), 'sx': round(bx[2] - bx[0], 3), 'sz': round(bx[3] - bx[1], 3)}
                    m['size'] = [round(v, 3) for v in r['size']] if rot == 0 else m.get('size')
                print(name, m['size'])
        b.close()
    os.makedirs(OUT, exist_ok=True)
    json.dump(manifest, open(manifest_path, 'w', encoding='utf-8'), indent=1)
    head = '/* 斜视精灵的锚点表，由 tools_ai/render_iso/render_assets.py 生成。ax，ay 是模型原点在图里的像素位置，cx，cz 是模型包围盒中心相对原点的偏移，sx，sz 是占地。素材来自 Kenney 的 CC0 模型 */' + chr(10)
    open(os.path.join(OUT, 'manifest.js'), 'w', encoding='utf-8', newline=chr(10)).write(head + '(globalThis.CY = globalThis.CY || {}).isoSprites = ' + json.dumps(manifest, separators=(',', ':')) + ';' + chr(10))
    srv.shutdown()

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'furniture')
