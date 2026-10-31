"""浏览器里的积分后端（frontend/src/backend/lm.js）和 Python 版（backend_lm_ai/lm_engine.py）逐步对表：
同一组角色，同一个两天的睡眠作息，每五分钟一个 tick，两边吐出的指令必须一致，误差不超过 0.00002。
用法：python frontend/tests/lm_parity.py"""
import json, math, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'backend_lm_ai'))
import lm_engine

PEOPLE = [
    ('a', 'human', 'adult', 30, ['thirst', 'hunger', 'rest', 'company', 'hygiene'], []),
    ('b', 'human', 'elder', 75, ['thirst', 'hunger', 'rest', 'company', 'mobility'], ['diabetes']),
    ('c', 'cat', 'adult', None, ['thirst', 'hunger', 'company', 'play', 'clean'], []),
    ('d', 'flower', 'adult', None, ['water', 'sun', 'fertilize', 'prune'], []),
    ('e', 'human', 'infant', 0.5, ['thirst', 'hunger', 'rest', 'company', 'play', 'diaper'], []),
]
TICKS, TMIN = 2 * 24 * 12, 5.0

def scenario(drive):
    snaps = {}
    for pid, sp, st, age, needs, conds in PEOPLE:
        snaps[pid] = {'id': pid, 'species': sp, 'stage': st, 'age': age, 'needs': {n: 0.2 for n in needs}, 'mood': 0.7, 'frailty': 0.1, 'sleeping': False, 'conditions': conds, 'flags': {}}
    log = []
    for i in range(TICKS):
        hour = (i * TMIN / 60.0) % 24
        for s in snaps.values(): s['sleeping'] = hour < 7
        res = drive({'minutes': TMIN, 'people': [json.loads(json.dumps(s)) for s in snaps.values()], 'world': {'hour': hour}})
        for d in res['directives']:
            s = snaps[d['person']]
            if d['op'] == 'need': s['needs'][d['need']] = min(1, max(0, s['needs'][d['need']] + d['delta']))
            else: s[d['op']] = min(1, max(0, s[d['op']] + d['delta']))
        log.append(sorted((d['person'], d.get('need') or d['op'], d['delta']) for d in res['directives']))
    return log

def py_log():
    eng = lm_engine.Engine()
    def drive(req):
        out, _ = eng.drive(req); return {'directives': out}
    return scenario(drive)

def js_log():
    code = open(os.path.join(HERE, 'lm_parity_run.js'), encoding='utf-8').read()
    p = subprocess.run(['node', os.path.join(HERE, 'lm_parity_run.js'), json.dumps(PEOPLE), str(TICKS), str(TMIN)], capture_output=True, text=True, encoding='utf-8', cwd=HERE)
    if p.returncode: print(p.stderr); sys.exit(1)
    return json.loads(p.stdout)

a, b = py_log(), js_log()
worst, bad = 0.0, 0
for i, (x, y) in enumerate(zip(a, b)):
    if len(x) != len(y) or any(tuple(p[:2]) != tuple(q[:2]) for p, q in zip(x, y)):
        bad += 1
        if bad < 4: print('tick', i, 'python', x[:3], 'js', y[:3])
        continue
    for p, q in zip(x, y): worst = max(worst, abs(p[2] - q[2]))
print('ticks', len(a), len(b), '指令不一致的 tick', bad, '最大误差', worst)
sys.exit(0 if (len(a) == len(b) and bad == 0 and worst < 2.5e-5) else 1)
