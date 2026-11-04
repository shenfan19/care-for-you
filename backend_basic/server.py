"""Care for You 远程后端的基础后端，最小可用，只用标准库。
游戏设置里 backend_provider 改成 http，backend_url 填 http://127.0.0.1:8787/ 即可。
协议见仓库根目录 README_backend_protocol.md。

这里放一个一阶的需求模型当占位：每个需求按自己的速率往上涨，涨多少由 minutes 决定。
把 step() 换成你的 ODE，或者把快照转给聊天 AI，再把它的回答整理成指令列表就行。

hello 声明：这个基础后端只管需求的涨法，事件、台词、谁向谁求助都交给游戏的内置后端。
心情和虚弱度它不管，游戏自己算。
"""
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

RATE_PER_HOUR = 0.05
NAME = "care-basic-backend"
VERSION = "0.3.0"


def hello():
    return {"v": 1, "name": NAME, "version": VERSION, "handles": {"events": False, "strategies": False, "lines": False}}


def step(person, minutes):
    """返回这个人的指令列表和它驱动的变量名。person 是协议里的角色快照。"""
    out = []
    for need, v in person["needs"].items():
        delta = max(0.0, v - RATE_PER_HOUR * minutes / 60) - v   # 状态是水平，1 满足，0 见底；每小时降一点
        out.append({"op": "need", "person": person["id"], "need": need, "delta": round(delta, 5)})
    # 例子：饿得厉害的人（饱食度低于 0.2），请游戏让他走去厨房待两分钟
    if person["needs"].get("hunger", 1) < 0.2 and not person.get("sleeping"):
        out.append({"op": "move", "person": person["id"], "room": "kitchen", "minutes": 2})
    return out, list(person["needs"])


def drive(req):
    directives, drives = [], {}
    if req.get("trigger") == "tick":
        for p in req.get("people", []):
            ds, names = step(p, req.get("minutes", 0))
            directives += ds
            drives[p["id"]] = names
    return {"v": 1, "directives": directives, "drives": drives}


def line(req):
    return {"v": 1, "text": None}


def handle(req):
    kind = req.get("kind")
    if kind == "hello":
        return hello()
    if kind == "line":
        return line(req)
    if kind == "plan":
        return {"v": 1, "states": [], "strategies": []}
    return drive(req)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _send(self, res):
        body = json.dumps(res, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._send(hello())

    def do_POST(self):
        req = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        self._send(handle(req))

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    print("%s listening on http://127.0.0.1:%d/" % (NAME, port))
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
