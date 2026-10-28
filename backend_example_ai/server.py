"""Care for You 远程后端的最小示例，只用标准库。
游戏设置里 backend_provider 改成 http，backend_url 填 http://127.0.0.1:8787/ 即可。
要让需求完全由这里算，再把 needs_source 改成 backend。
协议见 prototype/src/backend/protocol.js 开头的注释。

这里放一个一阶的需求模型当占位：每个需求按自己的速率往上涨，涨多少由 minutes 决定。
把 step() 换成你的 ODE，或者把快照转给聊天 AI，再把它的回答整理成指令列表就行。
"""
import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

RATE_PER_HOUR = 0.05


def step(person, minutes):
    """返回这个人的指令列表。person 是协议里的角色快照。"""
    out = []
    for need, v in person["needs"].items():
        out.append({"op": "need_set", "person": person["id"], "need": need, "value": min(1.0, v + RATE_PER_HOUR * minutes / 60)})
    # 例子：饿得厉害的人，请游戏让他走去厨房待两分钟
    if person["needs"].get("hunger", 0) > 0.8 and not person.get("sleeping"):
        out.append({"op": "move", "person": person["id"], "room": "kitchen", "minutes": 2})
    return out


def drive(req):
    directives = []
    if req.get("trigger") == "tick":
        for p in req.get("people", []):
            directives += step(p, req.get("minutes", 0))
    return {"v": 1, "directives": directives}


def line(req):
    return {"v": 1, "text": None}


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        req = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        res = line(req) if req.get("kind") == "line" else drive(req)
        body = json.dumps(res, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    print("listening on http://127.0.0.1:%d/" % port)
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()
