"""比较三个后端：内置查表（浏览器里的 JS），基础后端（Python 进程，一阶线性需求），积分后端（浏览器里的 lm.js，六个模型积分）。
用法：python tests/backend_compare.py [天数=1] [种子数=3] [压测请求数=3000]

分两段，不能同时跑，否则耗时被互相拖慢：
  第一段 微基准：只测服务进程。用 9 个角色的快照直接 POST，测往返耗时、服务端处理耗时、吞吐、请求和回应大小、内存。
  第二段 游戏仿真：tests/sim_eval.js 在虚拟时钟里过若干天，同一个种子，三个后端各跑一遍，比较玩家看到的指标。
结果以 Markdown 表格打到标准输出。"""
import json
import os
import statistics
import subprocess
import sys
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
EX_PORT = 18787
days = float(sys.argv[1]) if len(sys.argv) > 1 else 1
seeds = int(sys.argv[2]) if len(sys.argv) > 2 else 3
N = int(sys.argv[3]) if len(sys.argv) > 3 else 3000
PY = sys.executable


def post(url, obj):
    data = json.dumps(obj).encode()
    r = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(r) as f:
        body = f.read()
    return len(data), len(body), json.loads(body)


def start(script, cwd, port):
    p = subprocess.Popen([PY, script, str(port)], cwd=cwd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(100):
        try:
            urllib.request.urlopen("http://127.0.0.1:%d/" % port, timeout=1).read()
            return p
        except Exception:
            time.sleep(0.1)
    raise RuntimeError("起不来 " + script)


def mem_mb(pid):
    out = subprocess.run(["tasklist", "/FI", "PID eq %d" % pid, "/FO", "CSV", "/NH"], capture_output=True, text=True).stdout
    try:
        return int(out.strip().split('","')[-1].replace(",", "").replace(" K", '').replace('"', "")) / 1024.0
    except Exception:
        return float("nan")


NEEDS = {
    "human": {"adult": ["thirst", "hunger", "rest", "company", "hygiene"], "infant": ["thirst", "hunger", "rest", "company", "play", "diaper", "hygiene"], "elder": ["thirst", "hunger", "rest", "company", "hygiene", "mobility", "medicine"]},
    "cat": {"adult": ["thirst", "hunger", "company", "play", "clean"]},
    "dog": {"adult": ["thirst", "hunger", "company", "play"]},
}


def family():
    spec = [("human", "elder"), ("human", "elder"), ("human", "adult"), ("human", "adult"), ("human", "infant"), ("human", "infant"), ("human", "adult"), ("cat", "adult"), ("dog", "adult")]
    out = []
    for i, (sp, st) in enumerate(spec):
        out.append({"id": "p%d" % i, "species": sp, "stage": st, "age": 30, "needs": {n: 0.3 for n in NEEDS[sp][st]}, "mood": 0.8, "frailty": 0.1, "sleeping": False,
                    "conditions": [], "flags": {}, "rate_mult": {}, "mood_offset": 0.0, "frailty_mult": 1.0, "traits": [], "location": {"place": "home", "room": "living"}, "care_total": 0, "counters": {}, "seen": {}})
    return out


def micro(name, port, script, cwd):
    p = start(script, cwd, port)
    url = "http://127.0.0.1:%d/" % port
    try:
        post(url, {"v": 1, "kind": "hello"})
        people = family()
        world = {"hour": 12.0, "date": {"day_index": 1}}
        lat, bo, bi = [], 0, 0
        for i in range(N):
            world["hour"] = (12.0 + i * 5 / 3600.0) % 24
            t = time.perf_counter()
            a, b, res = post(url, {"v": 1, "kind": "drive", "trigger": "tick", "minutes": 5 / 60.0, "world": world, "people": people, "expired": []})
            lat.append((time.perf_counter() - t) * 1000)
            bo, bi = bo + a, bi + b
            for d in res.get("directives", []):
                if "need" in d:
                    for q in people:
                        if q["id"] == d["person"]:
                            q["needs"][d["need"]] = min(1.0, max(0.0, q["needs"][d["need"]] + d["delta"]))
        lat.sort()
        # 并发吞吐：4 个客户端同时打
        K = 4
        per = max(200, N // 2)
        t0 = time.perf_counter()

        def worker(_):
            for _i in range(per):
                post(url, {"v": 1, "kind": "drive", "trigger": "tick", "minutes": 5 / 60.0, "world": world, "people": people, "expired": []})
        with ThreadPoolExecutor(K) as ex:
            list(ex.map(worker, range(K)))
        thr = K * per / (time.perf_counter() - t0)
        try:
            st = json.load(urllib.request.urlopen(url + "stats"))
            proc = st.get("proc_ms_avg")
        except Exception:
            proc = None
        return {"name": name, "p50": lat[len(lat) // 2], "p95": lat[int(len(lat) * 0.95)], "p99": lat[int(len(lat) * 0.99)], "mean": statistics.mean(lat), "thr": thr,
                "kb_out": bo / N / 1024.0, "kb_in": bi / N / 1024.0, "mem": mem_mb(p.pid), "proc": proc}
    finally:
        p.terminate()


def sim(name, url, seed):
    env = dict(os.environ, CARE_SEED=str(seed), CARE_SIM_JSON="1")
    env.pop("CARE_PROVIDER", None)
    if url == "lm":
        env["CARE_PROVIDER"] = "lm"; env.pop("CARE_BACKEND_URL", None)
    elif url:
        env["CARE_BACKEND_URL"] = url
    else:
        env.pop("CARE_BACKEND_URL", None)
    t = time.time()
    out = subprocess.run(["node", "tests/sim_eval.js", str(days), "120", "family"], cwd=os.path.join(ROOT, "frontend"), env=env, capture_output=True, text=True).stdout
    line = [l for l in out.splitlines() if l.startswith("JSON ")]
    if not line:
        raise RuntimeError(name + " 仿真没有输出\n" + out[-800:])
    r = json.loads(line[0][5:])
    r["wall"] = time.time() - t
    r["name"], r["seed"] = name, seed
    return r


def fmt(x, n=2):
    return "-" if x is None or x != x else ("%.*f" % (n, x))


if __name__ == "__main__":
    print("## 微基准（%d 次顺序请求，9 个角色的快照，4 路并发另测）\n" % N)
    rows = [micro("基础后端", EX_PORT, "server.py", os.path.join(ROOT, "backend_basic"))]
    print("| 后端 | 往返中位 ms | p95 ms | p99 ms | 服务端处理均值 ms | 4 路吞吐 req/s | 请求 KB | 回应 KB | 内存 MB |")
    print("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    for r in rows:
        print("| %s | %s | %s | %s | %s | %.0f | %s | %s | %s |" % (r["name"], fmt(r["p50"]), fmt(r["p95"]), fmt(r["p99"]), fmt(r["proc"], 3), r["thr"], fmt(r["kb_out"], 1), fmt(r["kb_in"], 1), fmt(r["mem"], 1)))
    sys.stdout.flush()

    print("\n## 游戏仿真（%s 天，玩家每 120 秒看一眼，一家九口，%d 个种子取均值）\n" % (days, seeds))
    ex = start("server.py", os.path.join(ROOT, "backend_basic"), EX_PORT)
    try:
        jobs = [(n, u, s) for s in range(1, seeds + 1) for n, u in (("内置", ""), ("基础后端", "http://127.0.0.1:%d/" % EX_PORT), ("积分后端", "lm"))]
        with ThreadPoolExecutor(3) as exr:
            res = list(exr.map(lambda j: sim(*j), jobs))
    finally:
        ex.terminate()
    print("| 后端 | 清醒时平均需求 | 平均心情 | 平均虚弱度 | 急需占比 % | 每小时被打扰 | 玩家每小时动作 | 不变量失败 | 请求次数 | 往返中位 ms | 墙钟 s |")
    print("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    for n in ("内置", "基础后端", "积分后端"):
        rs = [r for r in res if r["name"] == n]
        m = lambda k: statistics.mean(r[k] for r in rs)
        net = [r["net"] for r in rs if r["net"]]
        print("| %s | %s | %s | %s | %s | %s | %s | %d | %s | %s | %s |" % (n, fmt(m("need_mean"), 3), fmt(m("mood"), 3), fmt(m("frailty"), 3), fmt(100 * m("urgent"), 1), fmt(m("reqs_per_h"), 1), fmt(m("acts_per_h"), 1), sum(r["bad"] for r in rs),
              "-" if not net else "%.0f" % statistics.mean(x["calls"] for x in net), "-" if not net else fmt(statistics.mean(x["p50"] for x in net)), fmt(m("wall"), 0)))
    json.dump(res, open(os.path.join(HERE, "temp_backend_compare.json"), "w"), ensure_ascii=False, indent=1)
