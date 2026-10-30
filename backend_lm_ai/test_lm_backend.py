"""LM 后端的测试。用法：python test_lm_backend.py
覆盖：表达式的白名单，模型和类载入，派生，对表（快照是权威），增量指令，耦合，稳定性，HTTP 协议。"""
import json
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer

import lm_engine
import server


def snap(pid="a", species="human", stage="adult", needs=None, **kw):
    s = {"id": pid, "species": species, "stage": stage, "age": 30, "needs": needs if needs is not None else {"thirst": 0.2, "hunger": 0.2, "rest": 0.2, "company": 0.2, "hygiene": 0.1},
         "mood": 0.8, "frailty": 0.1, "sleeping": False, "conditions": [], "flags": {}, "rate_mult": {}, "mood_offset": 0.0, "frailty_mult": 1.0}
    s.update(kw)
    return s


def run(eng, s, minutes, hour=12.0, chunk=5.0):
    """像游戏那样一段一段推进，把回来的增量加到快照上。"""
    t = 0.0
    while t < minutes - 1e-9:
        m = min(chunk, minutes - t)
        out, _ = eng.drive({"minutes": m, "people": [s], "world": {"hour": (hour + t / 60.0) % 24}})
        for d in out:
            if "need" in d:
                s["needs"][d["need"]] = min(1.0, max(0.0, s["needs"][d["need"]] + d["delta"]))
            else:
                s[d["op"]] = min(1.0, max(0.0, s[d["op"]] + d["delta"]))
        t += m
    return s


class Expressions(unittest.TestCase):
    def test_rejects_escape(self):
        for bad in ["__import__('os').system('x')", "().__class__", "(lambda: 1)()", "open('f')", "'a' + 'b'", "x[0]", "[1]"]:
            with self.assertRaises(lm_engine.ModelError, msg=bad):
                lm_engine.Expr(bad, "t")

    def test_accepts_lm_style(self):
        e = lm_engine.Expr("x + (max(0.0, min(1.0, 2.0 * y)) - x) * (1.0 - exp(-step / 4.0)) if a > 0 and not b else 0.0", "t")
        self.assertTrue(e.names >= {"x", "y", "step", "a", "b"})
        self.assertAlmostEqual(lm_engine.Expr("pow(2.0, 3.0) + sqrt(4.0)", "t")({}), 10.0)


class Library(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.lib = lm_engine.Library()

    def test_models_loaded(self):
        self.assertEqual(sorted(m.name for m in self.lib.models), ["body", "energy", "hydration", "sleep", "social", "upkeep"])

    def test_every_game_variable_has_a_drive(self):
        for n in ["thirst", "hunger", "rest", "company", "play", "diaper", "hygiene", "homework", "mobility", "clean", "water", "sun", "fertilize", "prune", "mood", "frailty"]:
            self.assertIn(n, self.lib.drive_by_name, n)

    def test_derive_chain(self):
        kind, p, chain = self.lib.derive(snap(stage="infant"))
        self.assertEqual((kind, chain), ("human", ["organism", "human", "human_infant"]))
        self.assertAlmostEqual(p["k_hunger"], 0.22)
        kind, p, chain = self.lib.derive(snap(species="dog", stage="adult"))
        self.assertEqual((kind, chain), ("animal", ["organism", "animal", "dog"]))
        self.assertAlmostEqual(p["k_play"], 0.12)
        kind, p, _ = self.lib.derive(snap(stage="elder", conditions=["diabetes", "arthritis"]))
        self.assertAlmostEqual(p["glucose_impair"], 1.5)
        self.assertAlmostEqual(p["k_mobility"], 0.045)
        self.assertEqual(self.lib.derive(snap(species="flower", stage="adult"))[0], "plant")

    def test_stable_without_care(self):
        self.assertEqual(lm_engine.selfcheck(days=3), [])


class Integration(unittest.TestCase):
    def setUp(self):
        self.eng = lm_engine.Engine()

    def test_first_sight_follows_snapshot(self):
        s = snap(needs={"thirst": 0.55, "hunger": 0.7, "rest": 0.1})
        self.eng.drive({"minutes": 0, "people": [s], "world": {"hour": 12}})
        st = self.eng.people["a"].state
        self.assertAlmostEqual(st["water_deficit"], 0.55)
        self.assertAlmostEqual(st["satiety"], 0.3)
        self.assertAlmostEqual(st["sleep_pressure"], 0.1)

    def test_rates_match_the_builtin_table(self):
        s = run(self.eng, snap(needs={"thirst": 0.0, "hunger": 0.0, "rest": 0.0, "company": 0.0}), 600)
        self.assertAlmostEqual(s["needs"]["thirst"], 0.8, delta=0.03)
        self.assertAlmostEqual(s["needs"]["hunger"], 0.8, delta=0.03)
        self.assertAlmostEqual(s["needs"]["company"], 0.5, delta=0.03)

    def test_care_action_is_resynced(self):
        s = run(self.eng, snap(needs={"thirst": 0.0}), 300)
        self.assertGreater(s["needs"]["thirst"], 0.3)
        s["needs"]["thirst"] = 0.05
        s = run(self.eng, s, 60)
        self.assertAlmostEqual(s["needs"]["thirst"], 0.05 + 0.08, delta=0.01)

    def test_deltas_not_absolute(self):
        out, drives = self.eng.drive({"minutes": 30, "people": [snap()], "world": {"hour": 12}})
        self.assertTrue(all(d["op"] in ("need", "mood", "frailty") and "delta" in d for d in out))
        self.assertIn("thirst", drives["a"])
        self.assertIn("mood", drives["a"])
        self.assertIn("frailty", drives["a"])

    def test_speed_multiplier_from_traits(self):
        a = run(lm_engine.Engine(), snap(needs={"thirst": 0.0}), 300)
        b = run(lm_engine.Engine(), snap(needs={"thirst": 0.0}, rate_mult={"thirst": 1.5}), 300)
        self.assertAlmostEqual(b["needs"]["thirst"] / a["needs"]["thirst"], 1.5, delta=0.05)

    def test_sleep_recovers_and_slows_thirst(self):
        s = run(self.eng, snap(needs={"thirst": 0.0, "rest": 0.8}, sleeping=True), 480, hour=23)
        self.assertLess(s["needs"]["rest"], 0.4)
        self.assertLess(s["needs"]["thirst"], 0.3)

    def test_dehydration_deepens_fatigue(self):
        dry = run(lm_engine.Engine(), snap(needs={"thirst": 0.9, "rest": 0.1, "hunger": 0.1}), 480)
        wet = run(lm_engine.Engine(), snap(needs={"thirst": 0.0, "rest": 0.1, "hunger": 0.1}), 480)
        self.assertGreater(dry["needs"]["rest"], wet["needs"]["rest"])

    def test_neglect_raises_frailty_and_care_lowers_it(self):
        s = snap(needs={"thirst": 0.95, "hunger": 0.95, "rest": 0.95, "company": 0.95}, frailty=0.1)
        s = run(self.eng, s, 72 * 60, chunk=20.0)
        self.assertGreater(s["frailty"], 0.25)
        raised = s["frailty"]
        s["needs"] = {"thirst": 0.1, "hunger": 0.1, "rest": 0.1, "company": 0.1}
        for i in range(10 * 24):
            s["sleeping"] = (i % 24) < 7
            run(self.eng, s, 60, chunk=30.0, hour=i % 24)
            s["needs"] = {"thirst": 0.1, "hunger": 0.1, "rest": 0.1, "company": 0.1}
        self.assertLess(s["frailty"], raised - 0.05)

    def test_game_set_frailty_is_respected(self):
        s = run(self.eng, snap(), 30)
        s["frailty"] = 0.6
        out, _ = self.eng.drive({"minutes": 0, "people": [s], "world": {"hour": 12}})
        self.assertAlmostEqual(self.eng.people["a"].state["frailty"], 0.6)

    def test_plant_and_pet(self):
        s = run(self.eng, snap("p", "flower", "adult", needs={"water": 0.0, "sun": 0.0, "fertilize": 0.0, "prune": 0.0}), 600)
        self.assertAlmostEqual(s["needs"]["water"], 0.25, delta=0.03)
        s = run(self.eng, snap("c", "cat", "adult", needs={"thirst": 0.0, "hunger": 0.0, "clean": 0.0, "play": 0.0}), 600)
        self.assertAlmostEqual(s["needs"]["hunger"], 0.9, delta=0.04)
        self.assertGreater(s["needs"]["clean"], 0.3)

    def test_step_size_convergence(self):
        """一次推进一小时，和每五分钟推进一次，结果要接近。接近才说明游戏的请求间隔不影响结果。"""
        a = run(lm_engine.Engine(), snap(), 12 * 60, chunk=60.0)
        b = run(lm_engine.Engine(), snap(), 12 * 60, chunk=5.0)
        for k in a["needs"]:
            self.assertAlmostEqual(a["needs"][k], b["needs"][k], delta=0.03, msg=k)
        self.assertAlmostEqual(a["mood"], b["mood"], delta=0.05)

    def test_no_jitter_with_rounded_snapshots(self):
        """游戏发出的快照保留四位小数，游戏自己的值是不取整的。每次只推进五秒，需求必须单调上升，不能在阈值附近来回跳，否则游戏里的叫人逻辑会被反复触发。"""
        eng = lm_engine.Engine()
        true = {"thirst": 0.3, "hunger": 0.3}
        prev = dict(true)
        for i in range(3000):
            s = snap(needs={k: round(v, 4) for k, v in true.items()})
            out, _ = eng.drive({"minutes": 5 / 60.0, "people": [s], "world": {"hour": 12 + i * 5 / 3600.0}})
            for d in out:
                if "need" in d:
                    true[d["need"]] = min(1.0, max(0.0, true[d["need"]] + d["delta"]))
            for k in true:
                self.assertGreaterEqual(true[k], prev[k] - 1e-9, "%s 在第 %d 步下降" % (k, i))
            prev = dict(true)
        self.assertGreater(true["thirst"], 0.3 + 0.08 * 3000 * 5 / 3600 * 0.9)

    def test_models_without_a_drive_stay_idle(self):
        """猫没有疲倦这个需求，睡眠模型就不该对它积分，否则睡眠债会无止境地涨并拖低心情。"""
        eng = lm_engine.Engine()
        c = run(eng, snap("c", "cat", "adult", needs={"thirst": 0.1, "hunger": 0.1, "clean": 0.1, "play": 0.1}), 72 * 60, chunk=30.0)
        st = eng.people["c"].state
        self.assertEqual((st["sleep_debt"], st["sleep_pressure"]), (0.0, 0.2))
        self.assertNotIn("sleep", eng.people["c"].active)
        f = run(eng, snap("f", "flower", "adult", needs={"water": 0.1, "sun": 0.1}), 24 * 60, chunk=30.0)
        self.assertGreater(f["needs"]["water"], 0.1)

    def test_small_game_side_bonus_is_kept(self):
        """游戏在心情上直接加的零点零二以上的奖励，后端要认下，不能下一次又被拉回去。"""
        eng = lm_engine.Engine()
        s = snap()
        run(eng, s, 30)
        base = s["mood"]
        s["mood"] = min(1.0, base + 0.05)
        run(eng, s, 1)
        self.assertGreater(s["mood"], base + 0.03)

    def test_departed_people_are_forgotten(self):
        self.eng.drive({"minutes": 1, "people": [snap("a"), snap("b")], "world": {"hour": 12}})
        self.eng.drive({"minutes": 1, "people": [snap("a")], "world": {"hour": 12}})
        self.assertEqual(list(self.eng.people), ["a"])

    def test_class_change_rederives(self):
        s = snap(stage="adult")
        self.eng.drive({"minutes": 1, "people": [s], "world": {"hour": 12}})
        self.assertEqual(self.eng.people["a"].chain[-1], "human_adult")
        s["stage"] = "elder"
        self.eng.drive({"minutes": 1, "people": [s], "world": {"hour": 12}})
        self.assertEqual(self.eng.people["a"].chain[-1], "human_elder")

    def test_large_step_is_bounded(self):
        out, _ = self.eng.drive({"minutes": 60 * 24 * 30, "people": [snap()], "world": {"hour": 12}})
        for d in out:
            self.assertTrue(-1.0 <= d["delta"] <= 1.0)


class Http(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.port = cls.srv.server_address[1]
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def post(self, obj):
        r = urllib.request.Request("http://127.0.0.1:%d/" % self.port, data=json.dumps(obj).encode(), headers={"Content-Type": "application/json"})
        return json.load(urllib.request.urlopen(r))

    def test_hello(self):
        h = self.post({"v": 1, "kind": "hello", "client": {"name": "t"}})
        self.assertEqual(h["v"], 1)
        self.assertEqual(h["handles"], {"events": False, "strategies": False, "lines": False})
        self.assertIn("hydration", h["models"])

    def test_get_root_is_hello(self):
        h = json.load(urllib.request.urlopen("http://127.0.0.1:%d/" % self.port))
        self.assertEqual(h["name"], server.NAME)

    def test_drive_tick(self):
        r = self.post({"v": 1, "kind": "drive", "trigger": "tick", "minutes": 10, "world": {"hour": 12}, "people": [snap("h1")], "expired": []})
        self.assertEqual(r["v"], 1)
        self.assertTrue(r["directives"])
        self.assertIn("thirst", r["drives"]["h1"])

    def test_drive_action_and_plan_and_line_are_harmless(self):
        self.assertEqual(self.post({"v": 1, "kind": "drive", "trigger": "action", "person": snap(), "action": {"id": "pet"}})["directives"], [])
        p = self.post({"v": 1, "kind": "plan", "people": [snap()], "minutes": 1})
        self.assertEqual((p["states"], p["strategies"]), ([], []))
        self.assertIsNone(self.post({"v": 1, "kind": "line", "person": snap()})["text"])

    def test_bad_request_is_500_not_crash(self):
        r = urllib.request.Request("http://127.0.0.1:%d/" % self.port, data=b"{not json", headers={"Content-Type": "application/json"})
        with self.assertRaises(urllib.error.HTTPError) as cm:
            urllib.request.urlopen(r)
        self.assertEqual(cm.exception.code, 500)
        self.assertEqual(self.post({"v": 1, "kind": "hello"})["v"], 1)

    def test_stats(self):
        s = json.load(urllib.request.urlopen("http://127.0.0.1:%d/stats" % self.port))
        self.assertIn("proc_ms_avg", s)


if __name__ == "__main__":
    unittest.main(verbosity=1)
