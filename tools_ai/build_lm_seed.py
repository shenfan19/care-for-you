"""把 backend_lm_ai 的模型文件打成浏览器里用的初始数据：frontend/src/data/lm_seed.js。
Python 版和浏览器版共用同一份 YAML，改了模型以后重新运行这个脚本。"""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SRC = os.path.join(ROOT, 'backend_lm_ai')
out = {}
with open(os.path.join(SRC, 'classes.yaml'), encoding='utf-8') as f: out['templates/lm/classes.yaml'] = f.read()
mdir = os.path.join(SRC, 'models')
for n in sorted(os.listdir(mdir)):
    if n.endswith('.yaml'):
        with open(os.path.join(mdir, n), encoding='utf-8') as f: out['templates/lm/models/' + n] = f.read()
head = '/* 浏览器里数值积分后端用的模型文件，由 tools_ai/build_lm_seed.py 从 backend_lm_ai 生成，不要手改。载入时写进数据文件夹的 templates/lm。 */\n'
body = '(function (CY) {\n  CY.lmSeed = %s;\n  const files = CY.seed.files;\n  CY.seed.files = function () { return Object.assign(files.call(this), CY.lmSeed); };\n})(globalThis.CY = globalThis.CY || {});\n' % json.dumps(out, ensure_ascii=False)
open(os.path.join(ROOT, 'frontend', 'src', 'data', 'lm_seed.js'), 'w', encoding='utf-8', newline='\n').write(head + body)
print(len(out), 'files')
