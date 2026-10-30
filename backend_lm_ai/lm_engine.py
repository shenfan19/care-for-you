"""Care for You 的轻量 LM 后端：积分引擎。只用标准库加 PyYAML 读模型。

模型文件沿用 Life Matters 的写法：metadata，parameters，variables，equations，每条方程的 dynamics 是一个
Python 语法的表达式字符串，step 是这一小步的小时数，写成 x + (目标 - x) * (1 - exp(-step / tau)) 这样的松弛式。
和 LM 引擎的差别只有一处：这里不做校验、优化和蒙特卡洛，只做前向积分。

一个角色 = 一组状态变量。状态变量分属几个模型，模型之间可以互相读（睡眠债影响心情，脱水影响疲劳）。
角色的差别不在代码里：classes.yaml 里一个 human 类，按年龄阶段、物种、疾病、性格一层层派生出这个角色的参数。

游戏里的需求、心情、虚弱度是 drives：每个 drive 把一个状态变量线性映射到 0 到 1。
游戏里玩家的动作会直接改这些数，后端每次收到快照时发现数和上次回的不一样，就按映射反推回状态变量，
所以快照永远是权威，后端不需要知道玩家做了什么动作。
"""
import ast
import math
import os

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
MAX_SUBSTEP_H = 0.25
MAX_SUBSTEPS = 240
RESYNC_EPS = 0.004   # 快照里的数保留四位小数，量化误差最大 0.00005；比这大的差就是游戏自己动了它

FUNCS = {
    "min": min, "max": max, "abs": abs, "exp": math.exp, "log": math.log, "sqrt": math.sqrt,
    "pow": pow, "floor": math.floor, "tanh": math.tanh, "sin": math.sin, "cos": math.cos,
}
_ALLOWED = (
    ast.Expression, ast.BinOp, ast.UnaryOp, ast.BoolOp, ast.Compare, ast.IfExp, ast.Call, ast.Name,
    ast.Constant, ast.Load, ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow, ast.Mod, ast.USub, ast.UAdd,
    ast.And, ast.Or, ast.Not, ast.Lt, ast.LtE, ast.Gt, ast.GtE, ast.Eq, ast.NotEq,
)


class ModelError(Exception):
    pass


def compile_expr(src, where=""):
    """表达式只允许数字，变量名，四则乘方，比较，and or not，三元式和 FUNCS 里的函数。"""
    try:
        tree = ast.parse(str(src).strip(), mode="eval")
    except SyntaxError as e:
        raise ModelError("%s: 表达式语法错误 %r: %s" % (where, src, e))
    names = set()
    for n in ast.walk(tree):
        if not isinstance(n, _ALLOWED):
            raise ModelError("%s: 表达式里不允许 %s" % (where, type(n).__name__))
        if isinstance(n, ast.Call):
            if not isinstance(n.func, ast.Name) or n.func.id not in FUNCS or n.keywords:
                raise ModelError("%s: 只能调用 %s" % (where, "，".join(sorted(FUNCS))))
        elif isinstance(n, ast.Name) and n.id not in FUNCS:
            names.add(n.id)
        elif isinstance(n, ast.Constant) and not isinstance(n.value, (int, float, bool)):
            raise ModelError("%s: 表达式里只能有数字" % where)
    return compile(tree, "<lm:%s>" % where, "eval"), names


_GLOBALS = dict(FUNCS, __builtins__={})


class Expr:
    def __init__(self, src, where=""):
        self.src = str(src)
        self.code, self.names = compile_expr(src, where)

    def __call__(self, env):
        return eval(self.code, _GLOBALS, env)


class Drive:
    """游戏变量和状态变量的线性映射：游戏值 = (状态 - lo) / (hi - lo)，裁到 0 到 1。lo 大于 hi 就是反向。"""

    def __init__(self, name, spec, model):
        self.name, self.model = name, model
        self.state, self.lo, self.hi = spec["state"], float(spec.get("lo", 0.0)), float(spec.get("hi", 1.0))
        self.kinds = spec.get("kinds") or ["human", "animal", "plant"]
        if self.lo == self.hi:
            raise ModelError("%s: drive %s 的 lo 和 hi 不能相等" % (model, name))

    def value(self, x):
        return min(1.0, max(0.0, (x - self.lo) / (self.hi - self.lo)))

    def invert(self, v):
        return self.lo + min(1.0, max(0.0, v)) * (self.hi - self.lo)


class Model:
    def __init__(self, path):
        with open(path, encoding="utf-8") as f:
            d = yaml.safe_load(f)
        md = d.get("metadata") or {}
        self.name = md.get("name") or os.path.basename(path)[:-5]
        self.path = path
        self.meta = md
        self.params = {k: float(v) for k, v in (d.get("parameters") or {}).items()}
        self.vars = {}
        for k, v in (d.get("variables") or {}).items():
            b = v.get("bounds") or [-1e9, 1e9]
            self.vars[k] = {"value": float(v.get("value", 0.0)), "lo": float(b[0]), "hi": float(b[1]), "unit": v.get("unit", "")}
        self.aux = [(k, Expr(e, "%s.auxiliary.%s" % (self.name, k))) for k, e in (d.get("auxiliary") or {}).items()]
        self.eqs = []
        for k, e in (d.get("equations") or {}).items():
            if e.get("step_unit", "hour") != "hour":
                raise ModelError("%s.%s: 后端只支持 step_unit: hour" % (self.name, k))
            for var, src in (e.get("dynamics") or {}).items():
                if var not in self.vars:
                    raise ModelError("%s.%s: 方程写的是没声明的状态 %s" % (self.name, k, var))
                self.eqs.append((float(e.get("priority", 0)), var, Expr(src, "%s.%s.%s" % (self.name, k, var))))
        self.drives = {k: Drive(k, v, self.name) for k, v in (d.get("drives") or {}).items()}
        for dr in self.drives.values():
            if dr.state not in self.vars:
                raise ModelError("%s: drive %s 指向没声明的状态 %s" % (self.name, dr.name, dr.state))


class Library:
    """全部模型加全部类。load 一次，之后给每个角色派生出一个 Person。"""

    def __init__(self, root=HERE):
        self.root = root
        mdir = os.path.join(root, "models")
        self.models = [Model(os.path.join(mdir, f)) for f in sorted(os.listdir(mdir)) if f.endswith(".yaml")]
        with open(os.path.join(root, "classes.yaml"), encoding="utf-8") as f:
            self.classes = yaml.safe_load(f)
        seen = {}
        for m in self.models:
            for k in list(m.params) + list(m.vars) + [a for a, _ in m.aux]:
                if k in seen:
                    raise ModelError("名字 %s 在 %s 和 %s 里重复，所有模型共用一个命名空间" % (k, seen[k], m.name))
                seen[k] = m.name
        self.names = set(seen) | {"step", "hour", "asleep", "awake", "age", "health", "inpatient", "is_human", "is_animal", "is_plant", "mood_now", "need_max"}
        self.eqs = sorted(((p, m, v, e) for m in self.models for p, v, e in m.eqs), key=lambda t: -t[0])
        self.aux = [(m.name, k, e) for m in self.models for k, e in m.aux]
        self.drive_by_name = {}
        for m in self.models:
            for n, dr in m.drives.items():
                self.drive_by_name.setdefault(n, []).append(dr)
        self._check_names()

    def _check_names(self):
        for m in self.models:
            for _, e in m.aux + [(v, x) for _, v, x in m.eqs]:
                for n in e.names:
                    if n in self.names or n.startswith(("n_", "speed_", "has_")):
                        continue
                    raise ModelError("%s: 表达式 %r 里的 %s 没有定义" % (m.name, e.src, n))

    def kind_of(self, species):
        return (self.classes.get("kinds") or {}).get(species, "animal")

    def chain(self, species, stage):
        """类的派生链：organism，大类（human 或 animal 或 plant），物种或阶段。越靠后越具体。"""
        kind = self.kind_of(species)
        out = ["organism", kind]
        if kind == "human":
            out.append("human_" + stage)
        else:
            out.append(species)
        return kind, [c for c in out if c in self.classes["classes"]]

    def derive(self, snap):
        """从一个角色快照派生出这个角色的参数。返回 (kind, params, 链)。"""
        species, stage = snap.get("species", "human"), snap.get("stage", "adult")
        kind, chain = self.chain(species, stage)
        params = {}
        for m in self.models:
            params.update(m.params)
        for c in chain:
            params.update((self.classes["classes"][c] or {}).get("params") or {})
        conds = (self.classes.get("conditions") or {})
        for c in snap.get("conditions") or []:
            params.update((conds.get(c) or {}).get("params") or {})
        return kind, params, chain


class Person:
    """一个角色的积分状态。"""

    def __init__(self, lib, snap):
        self.lib = lib
        self.id = snap["id"]
        self.kind, self.params, self.chain = lib.derive(snap)
        self.species, self.stage = snap.get("species"), snap.get("stage")
        self.sig = self.signature(snap)
        self.state = {}
        for m in lib.models:
            for k, v in m.vars.items():
                self.state[k] = v["value"]
        self.drives = {}
        for n, drs in lib.drive_by_name.items():
            for dr in drs:
                if n in ("mood", "frailty") or (self.kind in dr.kinds and n in (snap.get("needs") or {})):
                    self.drives[n] = dr
                    break
        self.active = {m.name for m in lib.models if not m.drives or any(n in self.drives for n in m.drives)}
        self.emitted = {}
        self.base_frailty = None
        self.age_h = 0.0
        self.first = True

    @staticmethod
    def signature(snap):
        return (snap.get("species"), snap.get("stage"), tuple(sorted(snap.get("conditions") or [])))

    def game_value(self, name, snap):
        if name == "mood":
            return snap.get("mood", 0.5)
        if name == "frailty":
            return snap.get("frailty", 0.0)
        return (snap.get("needs") or {}).get(name)

    def sync(self, snap):
        """按快照对表。第一次见到：状态按快照反推；之后：和上次回的差得多，说明玩家的动作改了它，按快照反推。"""
        for n, dr in self.drives.items():
            v = self.game_value(n, snap)
            if v is None:
                continue
            if self.first or abs(v - self.emitted.get(n, v)) > RESYNC_EPS:
                self.state[dr.state] = min(self.lib_var(dr.state)["hi"], max(self.lib_var(dr.state)["lo"], dr.invert(v)))
            self.emitted[n] = v
        if self.first:
            self.base_frailty = snap.get("frailty", 0.0)
            self.state["frailty_base"] = self.base_frailty
        self.first = False

    def lib_var(self, name):
        for m in self.lib.models:
            if name in m.vars:
                return m.vars[name]
        raise KeyError(name)

    def step(self, snap, minutes, world):
        """积分 minutes 个游戏分钟，返回 [(drive 名, 新值)]。"""
        self.sync(snap)
        dt = max(0.0, float(minutes)) / 60.0
        if dt > 0:
            n = min(MAX_SUBSTEPS, max(1, math.ceil(dt / MAX_SUBSTEP_H)))
            h = dt / n
            hour0 = (float(world.get("hour", 12.0)) - dt) % 24.0
            env = self.base_env(snap)
            for i in range(n):
                env["step"] = h
                env["hour"] = (hour0 + i * h) % 24.0
                self.substep(env)
            self.age_h += dt
        out = []
        for n, dr in self.drives.items():
            if self.game_value(n, snap) is None:
                continue
            out.append((n, dr.value(self.state[dr.state])))
        return out

    def base_env(self, snap):
        env = dict(self.params)
        flags = snap.get("flags") or {}
        age = snap.get("age")
        env.update({
            "asleep": 1.0 if snap.get("sleeping") else 0.0, "awake": 0.0 if snap.get("sleeping") else 1.0,
            "age": float(age) if age is not None else 30.0, "health": 1.0 - float(snap.get("frailty", 0.0)),
            "inpatient": 1.0 if flags.get("hospital") else 0.0,
            "is_human": 1.0 if self.kind == "human" else 0.0, "is_animal": 1.0 if self.kind == "animal" else 0.0, "is_plant": 1.0 if self.kind == "plant" else 0.0,
            "mood_now": float(snap.get("mood", 0.5)),
        })
        env["mood_offset"] = self.params.get("mood_offset", 0.0) + float(snap.get("mood_offset", 0.0))
        env["frailty_vuln"] = self.params.get("frailty_vuln", 1.0) * float(snap.get("frailty_mult", 1.0))
        mult = snap.get("rate_mult") or {}
        needs = snap.get("needs") or {}
        for k, v in needs.items():
            env["n_" + k] = float(v)
            env["speed_" + k] = float(mult.get(k, 1.0))
        for k, v in mult.items():
            env.setdefault("speed_" + k, float(v))
        for c in snap.get("conditions") or []:
            env["has_" + c] = 1.0
        for _, k, _e in self.lib.aux:
            env.setdefault(k, 0.0)
        env["_other_max"] = max([float(v) for k, v in needs.items() if k not in self.drives] or [0.0])
        return _Env(env)

    def substep(self, env):
        env.update(self.state)
        for n, dr in self.drives.items():
            env["n_" + n] = dr.value(self.state[dr.state])
        env["need_max"] = max([env["_other_max"]] + [env["n_" + n] for n in self.drives if n not in ("mood", "frailty")])
        act = self.active
        for mn, k, e in self.lib.aux:
            if mn in act:
                env[k] = e(env)
        for _, m, var, e in self.lib.eqs:
            if m.name not in act:
                continue
            x = e(env)
            if not (x == x) or x in (math.inf, -math.inf):
                x = self.state[var]
            vv = m.vars[var]
            x = min(vv["hi"], max(vv["lo"], x))
            self.state[var] = x
            env[var] = x


class _Env(dict):
    """未提供的 speed_ 和 n_ 变量按 1 和 0 算，这样一个模型可以服务有这种需求和没有这种需求的角色。"""

    def __missing__(self, k):
        if k.startswith("speed_"):
            return 1.0
        if k.startswith(("n_", "has_")):
            return 0.0
        raise KeyError(k)


class Engine:
    """按角色编号保存 Person。快照里的种类、阶段、疾病、性格变了就重新派生，状态按快照重新对表。"""

    def __init__(self, lib=None):
        self.lib = lib or Library()
        self.people = {}

    def person(self, snap):
        p = self.people.get(snap["id"])
        if p is None or p.sig != Person.signature(snap):
            p = self.people[snap["id"]] = Person(self.lib, snap)
        return p

    def drive(self, req):
        """处理一次 tick 的 drive 请求，返回 (指令列表, drives 声明)。指令全部是增量，所以玩家在请求飞行期间的动作不会被覆盖。"""
        minutes = float(req.get("minutes") or 0.0)
        world = req.get("world") or {}
        out, declared = [], {}
        for snap in req.get("people") or []:
            if not snap.get("id"):
                continue
            p = self.person(snap)
            vals = p.step(snap, minutes, world)
            names = []
            for n, v in vals:
                cur = p.game_value(n, snap)
                delta = round(v - cur, 5)
                names.append(n)
                p.emitted[n] = min(1.0, max(0.0, cur + delta))
                if abs(delta) < 1e-5:
                    continue
                if n in ("mood", "frailty"):
                    out.append({"op": n, "person": snap["id"], "delta": delta})
                else:
                    out.append({"op": "need", "person": snap["id"], "need": n, "delta": delta})
            declared[snap["id"]] = names
        alive = {s.get("id") for s in req.get("people") or []}
        for pid in [k for k in self.people if k not in alive]:
            del self.people[pid]
        return out, declared


def selfcheck(days=14):
    """每一类角色空放若干天：状态不越界，没有 NaN。返回 [(类描述, 问题)]。"""
    lib = Library()
    probes = []
    for st in ("infant", "toddler", "child", "teen", "adult", "elder"):
        probes.append(("human", st, ["thirst", "hunger", "rest", "company", "play", "diaper", "hygiene", "homework", "mobility"]))
    for sp in (lib.classes.get("kinds") or {}):
        k = lib.classes["kinds"][sp]
        if k == "animal":
            probes.append((sp, "adult", ["thirst", "hunger", "company", "play", "clean"]))
        elif k == "plant":
            probes.append((sp, "adult", ["water", "sun", "fertilize", "prune"]))
    bad = []
    eng = Engine(lib)
    for sp, st, needs in probes:
        snap = {"id": "x", "species": sp, "stage": st, "age": 30, "needs": {n: 0.2 for n in needs}, "mood": 0.7, "frailty": 0.1, "sleeping": False, "conditions": [], "traits": [], "flags": {}}
        eng.people.clear()
        tmin = 5.0
        for i in range(int(days * 24 * 60 / tmin)):
            snap["sleeping"] = ((i * tmin / 60.0) % 24) < 7
            out, _ = eng.drive({"minutes": tmin, "people": [snap], "world": {"hour": (i * tmin / 60.0) % 24}})
            for d in out:
                key = d.get("need") or d["op"]
                cur = snap["needs"].get(key) if "need" in d else snap[d["op"]]
                nv = min(1.0, max(0.0, cur + d["delta"]))
                if not (nv == nv):
                    bad.append((sp + "/" + st, "NaN " + key))
                    break
                if "need" in d:
                    snap["needs"][key] = nv
                else:
                    snap[d["op"]] = nv
        p = eng.people["x"]
        for k, v in p.state.items():
            if not (v == v):
                bad.append((sp + "/" + st, "状态 %s 是 NaN" % k))
    return bad


if __name__ == "__main__":
    import sys
    lib = Library()
    print("载入 %d 个模型：%s" % (len(lib.models), "，".join(m.name for m in lib.models)))
    problems = selfcheck()
    for p in problems:
        print("问题", p)
    print("自检%s" % ("通过" if not problems else "失败"))
    sys.exit(1 if problems else 0)
