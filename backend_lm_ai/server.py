"""Care for You 的轻量 LM 后端。只用标准库加 PyYAML，一个进程，不碰数据库。

游戏设置里 backend_provider 改成 http，backend_url 填 http://127.0.0.1:8788/ 即可。
它只做一件事：把每个角色的需求、心情、虚弱度当作 LM 模型的状态变量来积分。
事件、台词、谁向谁求助都不管，hello 里声明了，游戏会把这几样交给内置后端。

用法：python server.py [端口，默认 8788]
接口见仓库根目录 README_backend_protocol_ai.md。
"""
import json
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import lm_engine

NAME = "care-lm-backend"
VERSION = "0.1.0"


class State:
    def __init__(self):
        self.engine = lm_engine.Engine()
        self.lock = threading.Lock()
        self.t0 = time.time()
        self.stats = {"requests": 0, "drive": 0, "plan": 0, "line": 0, "hello": 0, "errors": 0, "proc_ms_sum": 0.0, "proc_ms_max": 0.0, "persons_stepped": 0}

    def hello(self):
        lib = self.engine.lib
        return {
            "v": 1, "name": NAME, "version": VERSION,
            "handles": {"events": False, "strategies": False, "lines": False},
            "models": [m.name for m in lib.models],
            "drives": sorted(lib.drive_by_name),
        }


ST = State()


def handle(req):
    kind = req.get("kind")
    ST.stats["requests"] += 1
    t = time.perf_counter()
    if kind == "hello":
        ST.stats["hello"] += 1
        res = ST.hello()
    elif kind == "plan":
        ST.stats["plan"] += 1
        res = {"v": 1, "states": [], "strategies": []}
    elif kind == "line":
        ST.stats["line"] += 1
        res = {"v": 1, "text": None}
    else:
        ST.stats["drive"] += 1
        if req.get("trigger") == "tick":
            with ST.lock:
                directives, drives = ST.engine.drive(req)
            ST.stats["persons_stepped"] += len(req.get("people") or [])
            res = {"v": 1, "directives": directives, "drives": drives}
        else:
            res = {"v": 1, "directives": []}
    ms = (time.perf_counter() - t) * 1000.0
    ST.stats["proc_ms_sum"] += ms
    ST.stats["proc_ms_max"] = max(ST.stats["proc_ms_max"], ms)
    return res


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _send(self, code, obj):
        body = b"" if code == 204 else json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        if self.path.startswith("/stats"):
            s = dict(ST.stats)
            n = max(1, s["requests"])
            s["proc_ms_avg"] = round(s["proc_ms_sum"] / n, 4)
            s["uptime_s"] = round(time.time() - ST.t0, 1)
            return self._send(200, s)
        if self.path.startswith("/state"):
            with ST.lock:
                out = {pid: {"kind": p.kind, "chain": p.chain, "state": {k: round(v, 4) for k, v in p.state.items()}} for pid, p in ST.engine.people.items()}
            return self._send(200, out)
        self._send(200, ST.hello())

    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
            req = json.loads(self.rfile.read(n) or b"{}")
            self._send(200, handle(req))
        except Exception as e:
            ST.stats["errors"] += 1
            self._send(500, {"v": 1, "error": str(e)})

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8788
    print("%s %s listening on http://127.0.0.1:%d/  models: %s" % (NAME, VERSION, port, "，".join(m.name for m in ST.engine.lib.models)), flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
