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
PETS = os.environ.get('KENNEY_PETS', 'C:/fight/kenney_cube-pets/Models/GLB format')
CARS = os.environ.get('KENNEY_CARS', 'C:/fight/kenney_car-kit/Models/GLB format')
BLOCKY = os.environ.get('KENNEY_BLOCKY', 'C:/fight/kenney_blocky-characters_20/Models/GLB format')
CITY = os.environ.get('KENNEY_CITY', 'C:/fight/kenney_city-kit-commercial_2.1/Models/GLB format')
MAP = {'/blocky/': BLOCKY, '/city/': CITY, '/cars/': CARS, '/three/': THREE_DIR, '/furn/': FURN, '/char/': CHAR, '/pets/': PETS, '/': HERE}

class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = path.split('?', 1)[0]
        for pre in ('/three/', '/furn/', '/char/', '/pets/', '/cars/', '/blocky/', '/city/'):
            if path.startswith(pre): return os.path.join(MAP[pre], *path[len(pre):].split('/')).replace('%20', ' ')
        return os.path.join(HERE, path.lstrip('/') or 'render.html')
    def log_message(self, *a): pass

def serve():
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(('127.0.0.1', 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]

FURN_SCALE = 1.9   # Kenney 家具的一个单位约 1.8 米，乘 1.9 后一格地砖约 1 米，单人床约 1.1 格宽 2.1 格长
CITY_SCALE = 1.1   # 街道背景的楼，只做远景，宽约 1 格，高约 1.5 格
BLOCKY_SCALE = 0.55   # Blocky Characters，成年人约 80 像素高
CAR_SCALE = 0.8   # 小汽车约 2.2 格长，和人物的比例合适
CHAR_SCALE = 1.6   # Mini Characters 乘 1.6 后成人约 76 像素高，和现在的人物大小相当
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
        if kind == 'props':
            os.makedirs(os.path.join(OUT, 'furn'), exist_ok=True)
            for name in ['wheelchair']:
                m = manifest.setdefault('furn', {}).setdefault(name, {})
                for rot in range(4):
                    r = pg.evaluate('o => window.renderModel(o)', {'url': '/char/%s.glb' % name, 'rot': rot, 'scale': CHAR_SCALE})
                    open(os.path.join(OUT, 'furn', '%s_%d.png' % (name, rot)), 'wb').write(base64.b64decode(r['png'].split(',', 1)[1]))
                    bx = r['box']; m[str(rot)] = {'w': r['w'], 'h': r['h'], 'ax': r['ax'], 'ay': r['ay'], 'cx': round((bx[0] + bx[2]) / 2, 3), 'cz': round((bx[1] + bx[3]) / 2, 3), 'sx': round(bx[2] - bx[0], 3), 'sz': round(bx[3] - bx[1], 3)}
                m['size'] = [round(v, 3) for v in r['size']]
                print(name, m['size'])
        if kind == 'city':
            os.makedirs(os.path.join(OUT, 'furn'), exist_ok=True)
            for name in ['building-b', 'building-e', 'building-g', 'building-k', 'building-skyscraper-b', 'building-skyscraper-d']:
                m = manifest.setdefault('furn', {}).setdefault('city-' + name, {})
                for rot in range(4):
                    r = pg.evaluate('o => window.renderModel(o)', {'url': '/city/%s.glb' % name, 'rot': rot, 'scale': CITY_SCALE})
                    open(os.path.join(OUT, 'furn', 'city-%s_%d.png' % (name, rot)), 'wb').write(base64.b64decode(r['png'].split(',', 1)[1]))
                    bx = r['box']; m[str(rot)] = {'w': r['w'], 'h': r['h'], 'ax': r['ax'], 'ay': r['ay'], 'cx': round((bx[0] + bx[2]) / 2, 3), 'cz': round((bx[1] + bx[3]) / 2, 3), 'sx': round(bx[2] - bx[0], 3), 'sz': round(bx[3] - bx[1], 3)}
                m['size'] = [round(v, 3) for v in r['size']]
                print(name, m['size'])
        if kind == 'blocky':
            os.makedirs(os.path.join(OUT, 'blocky'), exist_ok=True)
            POSES = {'stand': ('idle', 0.0), 'walk': ('walk', 0.12), 'sit': ('sit', 5.0), 'sleep': ('die', 5.0)}
            for c in 'abcdefghijklmnopqr':
                name = 'character-' + c; m = manifest.setdefault('blocky', {}).setdefault(c, {})
                for pose, (clip, t) in POSES.items():
                    for rot in range(4):
                        r = pg.evaluate('o => window.renderModel(o)', {'url': '/blocky/%s.glb' % name, 'rot': rot, 'scale': BLOCKY_SCALE, 'clip': clip, 't': t})
                        open(os.path.join(OUT, 'blocky', '%s_%s_%d.png' % (c, pose, rot)), 'wb').write(base64.b64decode(r['png'].split(',', 1)[1]))
                        m.setdefault(pose, {})[str(rot)] = {'w': r['w'], 'h': r['h'], 'ax': r['ax'], 'ay': r['ay']}
                print(c, m['stand']['0'], r['clips'][:5])
        if kind == 'cars':
            os.makedirs(os.path.join(OUT, 'furn'), exist_ok=True)
            for name in ['taxi', 'ambulance', 'sedan', 'van', 'delivery', 'suv', 'police', 'firetruck', 'cone', 'garbage-truck']:
                m = manifest.setdefault('furn', {}).setdefault('car-' + name, {})
                for rot in range(4):
                    r = pg.evaluate('o => window.renderModel(o)', {'url': '/cars/%s.glb' % name, 'rot': rot, 'scale': CAR_SCALE})
                    open(os.path.join(OUT, 'furn', 'car-%s_%d.png' % (name, rot)), 'wb').write(base64.b64decode(r['png'].split(',', 1)[1]))
                    bx = r['box']; m[str(rot)] = {'w': r['w'], 'h': r['h'], 'ax': r['ax'], 'ay': r['ay'], 'cx': round((bx[0] + bx[2]) / 2, 3), 'cz': round((bx[1] + bx[3]) / 2, 3), 'sx': round(bx[2] - bx[0], 3), 'sz': round(bx[3] - bx[1], 3)}
                m['size'] = [round(v, 3) for v in r['size']]
                print(name, m['size'])
        if kind == 'pets':
            os.makedirs(os.path.join(OUT, 'pet'), exist_ok=True)
            # 游戏里的物种 -> (模型地址, 渲染倍数)。动物来自 Kenney Cube Pets，没有一一对应的用最接近的；花草用家具包里的植物模型放大
            PETMAP = {'cat': ('/pets/animal-cat.glb', 0.62), 'dog': ('/pets/animal-dog.glb', 0.78), 'rabbit': ('/pets/animal-bunny.glb', 0.55), 'hamster': ('/pets/animal-beaver.glb', 0.38),
                      'guineapig': ('/pets/animal-beaver.glb', 0.5), 'bird': ('/pets/animal-parrot.glb', 0.5), 'chicken': ('/pets/animal-chick.glb', 0.5), 'fish': ('/pets/animal-fish.glb', 0.5),
                      'duck': ('/pets/animal-penguin.glb', 0.55), 'hedgehog': ('/pets/animal-hog.glb', 0.5), 'ferret': ('/pets/animal-fox.glb', 0.55), 'turtle': ('/pets/animal-crab.glb', 0.45),
                      'snake': ('/pets/animal-caterpillar.glb', 0.55), 'gecko': ('/pets/animal-caterpillar.glb', 0.4), 'axolotl': ('/pets/animal-pig.glb', 0.45),
                      'succulent': ('/furn/plantSmall1.glb', 7.0), 'cactus': ('/furn/plantSmall3.glb', 7.0), 'flower': ('/furn/plantSmall2.glb', 7.0), 'orchid': ('/furn/plantSmall2.glb', 8.0),
                      'tree': ('/furn/pottedPlant.glb', 2.2), 'bamboo': ('/furn/pottedPlant.glb', 2.7)}
            for key, (url, sc) in PETMAP.items():
                m = manifest.setdefault('pet', {}).setdefault(key, {})
                plant = url.startswith('/furn/')
                for pose, (clip, t) in ({'stand': (None, 0)} if plant else {'stand': ('idle', 0.0), 'walk': ('walk', 0.12)}).items():
                    for rot in range(4):
                        o = {'url': url, 'rot': rot, 'scale': sc}
                        if clip: o.update({'clip': clip, 't': t})
                        r = pg.evaluate('o => window.renderModel(o)', o)
                        open(os.path.join(OUT, 'pet', '%s_%s_%d.png' % (key, pose, rot)), 'wb').write(base64.b64decode(r['png'].split(',', 1)[1]))
                        m.setdefault(pose, {})[str(rot)] = {'w': r['w'], 'h': r['h'], 'ax': r['ax'], 'ay': r['ay']}
                print(key, m['stand']['0'])
        if kind == 'characters':
            os.makedirs(os.path.join(OUT, 'char'), exist_ok=True)
            names = ['character-female-' + c for c in 'abcdef'] + ['character-male-' + c for c in 'abcdef']
            POSES = {'stand': ('idle', 0.0), 'walk': ('walk', 0.12), 'sit': ('sit', 5.0), 'sleep': ('die', 5.0), 'chair': ('wheelchair-sit', 0.5)}
            for name in names:
                key = name.replace('character-', '')
                m = manifest.setdefault('char', {}).setdefault(key, {})
                for pose, (clip, t) in POSES.items():
                    for rot in range(4):
                        r = pg.evaluate('o => window.renderModel(o)', {'url': '/char/%s.glb' % name, 'rot': rot, 'scale': CHAR_SCALE, 'clip': clip, 't': t, 'mask': True, 'extra': ['/char/wheelchair.glb'] if pose == 'chair' else []})
                        base = os.path.join(OUT, 'char', '%s_%s_%d' % (key, pose, rot))
                        open(base + '.png', 'wb').write(base64.b64decode(r['png'].split(',', 1)[1]))
                        open(base + '_m.png', 'wb').write(base64.b64decode(r['maskPng'].split(',', 1)[1]))
                        open(base + '_h.png', 'wb').write(base64.b64decode(r['maskHair'].split(',', 1)[1]))
                        open(base + '_c.png', 'wb').write(base64.b64decode(r['maskCloth'].split(',', 1)[1]))
                        m.setdefault(pose, {})[str(rot)] = {'w': r['w'], 'h': r['h'], 'ax': r['ax'], 'ay': r['ay']}
                        if r['skinAvg'] and 'skin' not in m: m['skin'] = r['skinAvg'][:3]
                        if r['hairAvg'] and 'hair' not in m: m['hair'] = r['hairAvg'][:3]
                        if r['clothAvg'] and 'cloth' not in m: m['cloth'] = r['clothAvg'][:3]
                print(key, m.get('skin'), m['stand']['0'])
        b.close()
    os.makedirs(OUT, exist_ok=True)
    json.dump(manifest, open(manifest_path, 'w', encoding='utf-8'), indent=1)
    head = '/* 斜视精灵的锚点表，由 tools_ai/render_iso/render_assets.py 生成。ax，ay 是模型原点在图里的像素位置，cx，cz 是模型包围盒中心相对原点的偏移，sx，sz 是占地。素材来自 Kenney 的 CC0 模型 */' + chr(10)
    open(os.path.join(OUT, 'manifest.js'), 'w', encoding='utf-8', newline=chr(10)).write(head + '(globalThis.CY = globalThis.CY || {}).isoSprites = ' + json.dumps(manifest, separators=(',', ':')) + ';' + chr(10))
    srv.shutdown()

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'furniture')
