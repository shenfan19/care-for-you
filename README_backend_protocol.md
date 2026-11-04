# Care for You: backend protocol

This document is the authoritative description of the backend protocol, for people who want to write their own backend. The game itself does only two things: it packs up each character's current state and sends it out, and it executes the directives that come back. Who speaks, what happens and how needs grow can all be decided by the backend.

The repository has three backends, all using the same protocol:

- Built-in backend: runs as JS in the browser together with the game. Its rules are plain YAML in the data folder. It is the default. The code is local.js and local_plan.js in frontend/src/backend.
- Basic backend: backend_basic/server.py, standard library only, a first-order linear need model. It shows the minimum a backend has to implement.
- Integrator backend: runs as JS in the browser, frontend/src/backend/lm.js. It integrates needs, mood and frailty as model state. The models are YAML files in frontend/src/data/lm. Choose it with backend_provider set to lm in the settings. It does not use the network interface and produces directives in the same format directly. A Python version used to live in this repository and has been moved out.

## Switching

In the advanced section of the settings:

- backend_provider: builtin or http. After switching to http the game sends requests to backend_url. On errors it falls back to the built-in backend automatically and says so only once.
- backend_url: address of the remote backend, for example http://127.0.0.1:8787/ for the basic backend and http://127.0.0.1:8788/ for an integrator backend.
- backend_timeout: timeout of a single request in milliseconds, default 4000.
- backend_send_names: when true, snapshots carry the characters' names. Default is off.
- needs_source: builtin or backend. backend means the backend supplies all needs and the game no longer grows them itself. When a drives declaration is present (see below) this does not need to be set.

Switching takes effect immediately: after a settings change, the next request goes to the new backend. If a remote backend drops out midway, the variables it was driving are handed back to the game at once, so nothing gets stuck.

## Transport

- Method and address: POST to backend_url. Request body and response are UTF-8 JSON. A GET to the same address may return handshake information, which is handy for manual checks.
- Version: every request and response carries "v": 1. A response whose v is not 1 is treated as an error.
- Cross-origin: when the game page is opened from localhost or file://, requests are cross-origin. The backend must send Access-Control-Allow-Origin and answer the OPTIONS preflight.
- Errors: a non-2xx HTTP status, a timeout, invalid JSON or a wrong v counts as a failure, and the built-in backend's result is used for that call.
- Request rate: the game advances once per second. Drive tick requests to a remote backend are sent at most once every 5 seconds, with the accumulated game minutes sent together. Plan requests go out every 20 seconds (plan.interval_seconds in system.yaml). Line requests are sent when a line is needed.
- Validation: everything that comes back is checked by the game. Unknown things are dropped, values are clamped into range, characters that do not exist are dropped, and text is length limited. A mistake in a backend cannot corrupt the save.

## Requests at a glance

| kind | When sent | Response |
| --- | --- | --- |
| hello | The first time after switching to http, after backend_url changes, and 30 seconds after a failed handshake | Who the backend is and what it handles |
| drive, trigger tick | Time advances, at most once every 5 seconds | Directive list, may carry drives |
| drive, trigger action | The player has just done an action | Directive list |
| plan | Every 20 seconds | State table and strategies |
| line | A line of dialogue is needed | One sentence, or null |

### hello

Request:

```json
{ "v": 1, "kind": "hello", "client": { "name": "care-for-you", "version": "0.65.2" } }
```

Response:

```json
{ "v": 1, "name": "care-lm-backend", "version": "0.1.0",
  "handles": { "events": false, "strategies": false, "lines": false } }
```

- handles declares what the backend takes care of. A key that is missing counts as true, and a missing handles object altogether (an old backend) counts as handling everything:
  - events: random events such as getting up at night, falling, going to hospital and coming back, which correspond to the directives in a drive request other than integration. When false, the game still runs the built-in backend's event rules and merges both sets of directives, the built-in ones first and the remote ones after.
  - strategies: who asks whom for help, and location wishes, which correspond to the plan request. When false, the game no longer sends plan to it and uses the built-in one directly.
  - lines: dialogue, which corresponds to the line request. When false, the game does not send line to it.
- Other fields are free. name and version are truncated to 48 and 24 characters and are used only for display.
- An old backend that does not know hello can answer it like an ordinary request with {"v":1,"directives":[]}. The game then treats it as handling everything, and behaviour is exactly as before.
- When the handshake fails (cannot connect or the response is invalid) the built-in backend is used this time and the game retries after 30 seconds.

### drive, tick

Request:

```json
{ "v": 1, "kind": "drive", "trigger": "tick", "minutes": 0.0833,
  "world": { }, "people": [ { } ], "expired": [ { "person": "p1", "name": "wc" } ] }
```

- minutes: game minutes since the last drive tick, possibly fractional. Integrator backends use it as the step size. Game time has a speed setting time.speed, default 24, so a tick every 5 seconds carries about 2 minutes, about 5 minutes at 60 times. Do not assume it is small.
- world: world snapshot, see below.
- people: snapshots of all characters present, see below, not including archived ones.
- expired: timed flags that have just run out, for example the night trip ended, so a rule can decide between a fall and going back to bed.

Response:

```json
{ "v": 1, "directives": [ { "op": "need", "person": "p1", "need": "thirst", "delta": 0.0007 } ],
  "drives": { "p1": ["thirst", "hunger", "rest", "mood", "frailty"] } }
```

- directives: the directive list, see below.
- drives: optional. Which variables the backend computed for which characters this time. Keys are character ids and values are arrays of variable names, where a variable name is a need name, or mood, or frailty. For declared variables the game no longer advances them itself (no need growth, no mood calculation, no frailty calculation) and only executes the backend's directives. Variables that are not declared are still computed by the game. Each response replaces the previous declaration as a whole, so if the backend stops declaring a variable, it goes back to the game immediately. When the remote fails, everything goes back to the game.

### drive, action

Request:

```json
{ "v": 1, "kind": "drive", "trigger": "action", "world": { }, "minutes": 0,
  "person": { }, "action": { "id": "feed", "label": "Feed", "min": 25, "effect": { "hunger": -0.9 } } }
```

The player did an action. The response is the same as for tick. If a say directive in it has kind speech, the game uses it as the cared-for person's reply to this action. A response to an action trigger should be fast, because the game waits for it. When the backend's handles.events is false, the game does not send action to it and uses the built-in result directly.

### plan

Request:

```json
{ "v": 1, "kind": "plan", "world": { }, "minutes": 20, "people": [ { } ],
  "pending": [ { "from": "p1", "to": "p2", "key": "hunger" } ],
  "declined": [ { "from": "p1", "to": "p3", "key": "hunger" } ] }
```

- pending: requests still on their way. declined: requests just turned down. The backend uses them to avoid repeating itself. key is a need name or an outing action name.

Response:

```json
{ "v": 1,
  "states": [ { "person": "p1", "needs": { "hunger": 0.4 }, "mood": 0.7, "frailty": 0.1, "want": { "id": "dog_park", "action": "walk" } } ],
  "strategies": [ { "from": "p1", "to": "p2", "kind": "care", "need": "hunger" } ] }
```

- states has one row per person. needs, mood and frailty can all be omitted, and when given they are the new absolute values. want is a location wish: id is the wish id and action is the outing action name.
- Each entry of strategies is a request from from to to. kind is care (someone else does it for them), self (they do it themselves) or go (go somewhere). care and self need a need, go needs an action.
- The game checks again on receipt: if the receiver is absent, asleep, in hospital, out, or lacks the ability, the entry is dropped.
- Needs are not the main purpose of plan. Do integration in the drive tick.

### line

Request: `{ "v": 1, "kind": "line", "person": { }, "group": "events", "key": "discharge", "situation": { }, "world": { } }`

Response: `{ "v": 1, "text": "One sentence" }`, or `"text": null` if there is none. The game first uses the built-in line and swaps in the remote one when it arrives.

## Directives

Each directive in the directives of a drive response has an op and a person. op can only be one of the following, and anything else is dropped:

| op | Fields | Effect | Range |
| --- | --- | --- | --- |
| need | need, delta | Add an increment to a need level; positive refills it | delta between -1 and 1, the result is clamped to 0 to 1 |
| need_set | need, value | Set a need level to a value | 0 to 1, 1 is fully satisfied |
| mood | delta | Add an increment to mood | same as above |
| mood_set | value | Set mood | 0 to 1 |
| frailty | delta | Add an increment to frailty | same as above |
| frailty_set | value | Set frailty | 0 to 1 |
| flag_set | name, minutes, value?, place?, room?, mode? | Set a timed flag, for example in hospital, up at night, hurt | minutes 0 to 43200; place is a place id, and a flag with place makes the person appear there; mode is stand, sleep or cradle |
| flag_clear | name | Remove a flag | |
| move | room, minutes? | Make the person walk to a room in the house and stay a while | minutes 0.2 to 30 |
| condition_add | id | Give the person a condition | id must be an existing condition |
| condition_remove | id | Remove a condition | |
| counter | name, delta | Add to or subtract from a counter | integer from -100 to 100 |
| seen | name | Record that something has fired today, used by once-a-day rules | |
| log | type, text or key+args | Add an entry to the happenings | type is one of care, talk, missed, cares_back, glance, event, frail, recovered, reveal, picked, nudge, cry, self |
| say | text or tkey or group+key, kind? | The character says a line | kind is soft, speech, cry, reveal or self |

- Integrator backends should use increments (need, mood, frailty) and not absolute values such as need_set. While a request is in flight the player may have just done an action, and an absolute value would overwrite it, while an increment would not.
- Numbers in snapshots keep four decimals, and the game's internal values are not rounded. When an integrator backend advances only a few seconds at a time, a single-step increment may be barely larger than the rounding error. So the backend should compute increments from its own internal state and not take the snapshot value as its state, unless it differs clearly from the value it returned last time (the LM backend's tolerance is 0.004). Otherwise values in the game jitter around thresholds and trigger calls for attention again and again.
- Text fields are length limited: text 240 characters, name 24, id 32.

## Snapshots

### World snapshot: world

| Field | Meaning |
| --- | --- |
| v | 1 |
| date | month, day, weekday (0 is Sunday), iso, day_index (days since 1970, local time zone) |
| working | Whether it is working hours now |
| at_desk | Whether the player is at the desk |
| days_together | How many days they have lived together |
| game_minutes | Total game minutes so far |
| day_minutes | Minutes elapsed today |
| hour | Hour of day, fractional, 0 to 24 |
| night | Whether it is night now |
| mode | Time mode, currently always real |
| player | place and room, where the player is |
| protagonist | Id of the controlled character, null if none |
| params | Free parameters, reserved, currently an empty object |

### Character snapshot: person

| Field | Meaning |
| --- | --- |
| id | Character id, stable |
| card | Card id, with which a backend can look up all the card's settings |
| health | Health, one minus frailty |
| name | Name, an empty string when backend_send_names is off |
| species | Species id: human, cat, dog, flower and so on |
| stage | For humans the life stage infant, toddler, child, teen, adult or elder; for non-humans the species id |
| age | Age in years, null for non-humans |
| age_band | A finer age band, null for non-humans |
| mood | Mood, 0 to 1, 1 is best, four decimals |
| frailty | Frailty, 0 to 1, 1 is most frail, four decimals |
| needs | Need levels: keys are need names, values 0 to 1, 1 is fully satisfied (full stomach, fully hydrated, fully rested) and 0 is empty, four decimals. This is the same direction as the state variables of an LM model. Different species have different needs, and conditions add needs |
| conditions | Array of condition ids |
| cond_set | Per-condition settings the player chose, for example { "diabetes": { "severity": "advanced" } }. Empty object when none |
| pulses | Tick snapshots only: the ids of the actions and story choices done since the last tick, for example ["sugar", "carb_heavy"]. Taken once, the next tick starts empty. A model may turn them into inputs |
| traits | Array of trait ids, at most two |
| voice | Voice id |
| flags | Timed flags: keys are flag names, values have until (game minutes), value, place, room, mode |
| rate_mult | Personal rate multiplier for each need: the trait multiplier times the card's need_rate, 1 when nothing special. Base rates are not sent, and the backend sets them by life stage and species |
| mood_offset | Mood offset from traits |
| frailty_mult | Frailty multiplier from traits |
| sleeping | Whether asleep |
| protagonist | Whether this is the controlled character |
| abilities | help (whether they can help others, with role and efficiency, null if not), care_needs (needs others can do for them), self_needs (needs they can do themselves), go_actions (outing actions they can go on) |
| want | Current location wish, null if none |
| location | place and room |
| care_total | Total number of times cared for |
| counters | Counters |
| seen | Record of once-a-day rules |

Need names for reference: thirst, hunger, rest, company, play, diaper, hygiene, homework and mobility are for people; clean is for small animals; water, sun, fertilize and prune are for plants; conditions add medicine, sugar, bp, joint, fever, breath, reorient and so on. If a backend meets a need name it does not know, it simply leaves it alone, and the game computes it itself.

## Who computes what: division of labour and combination

Every variable in the game (a person's need, mood or frailty) has exactly one owner at any moment:

- A variable not declared as driven by a remote backend is computed by the game: needs grow by rate, mood relaxes toward its target, and frailty rises and falls by rule.
- A variable declared by a remote backend in drives is computed by the backend, and the game only executes directives.
- Player actions always change the game's numbers directly. When an integrator backend receives a snapshot and finds that a variable differs from what it returned last time, the player has touched it, and the backend should resync to the snapshot. It does not need to know which action the player did. The LM backend works this way.

Events, strategies and lines are assigned by handles in hello. Anything nobody declares goes to the built-in backend.

## In-page and out-of-page interfaces

Besides the HTTP backend, the game page offers its own read and write interface, for programs in the same page or outside it:

- In the page: CY.api.state() reads the snapshot of everyone, CY.api.apply(directive list) writes, CY.api.cards() reads all character cards, and CY.api.onTick(fn) is called on every state change.
- Outside the page: set api_bridge to true in the settings and the page answers postMessage. Send { type: 'care.getState', id, names } and receive { type: 'care.state', id, state }; send { type: 'care.apply', id, directives } and receive { type: 'care.applied', id, applied }. It is off by default and has no origin allowlist, so turn it on only in your own environment.
- Directives are the same as for the HTTP backend and are checked in the same way.

## Character cards

Data folder templates/cards/card-id.yaml, one per typical kind of character. Card ids are English codes such as `maternal_grandma`, `young_woman` or `toddler_2`, and pronoun is `he`, `she` or `it`. Fields: id, label, group, species, age, stage, pronoun, voice, look, traits, health (score, mood, conditions), class (urgency, self_care, nag, cries), need_rate (need rate multipliers), self_actions, help (proactive, efficiency, interval), dialogue (voice, lines). The card in a snapshot is the card id. A backend can read all cards with CY.api.cards().

## Disease models

A condition (diabetes, high blood pressure, arthritis, low mood) can carry a model: a small LM-format YAML file that the game integrates in the browser, so that the person's numbers follow from what the carers do and what the day looks like. The same files can be written by hand or produced from a Life Matters model by the care_export plugin of the LM Reference Engine.

- Where: data folder templates/lm/models. A file whose metadata.condition names a condition is used only for people who have that condition. The four shipped ones are frontend/src/data/lm/cond_*.yaml, and tools/build_lm_seed.py bundles them into lm_seed.js.
- Switch: settings play.condition_models, true by default. With backend_provider builtin, only the disease part of people who have a model is integrated and everything else stays with the built-in backend. With backend_provider lm the same models run next to the other LM models. A remote backend (http) is not touched.
- Replacement: metadata.supersedes names the models this one replaces, so a model converted from Life Matters can take the place of the hand-written one for the same condition. Files with a newer metadata.version overwrite the older file in the data folder.

### What a model file may contain

LM format as read by the LM Reference Engine: parameters (or variables of type parameter), variables of type state and input, auxiliary, equations with step_unit second, minute, hour or day, an optional condition, a priority and dynamics. Expressions are the Python subset min, max, abs, exp, log, sqrt, pow, floor, tanh, sin, cos, if else, and, or, not, comparisons, ** and %. Names the game provides: step, hour, asleep, awake, age, health, inpatient, is_human, mood_now, need_max, mood_offset, frailty_vuln, n_<need> (the need now, 0 to 1), speed_<need> (the person's rate multiplier) and has_<condition>.

Two sections are the game's own:

| Section | Meaning |
| --- | --- |
| drives | need name to { state, lo, hi, kinds }: the state variable is mapped from lo..hi onto the need level 0..1, where 1 is fully satisfied. A variable that is a pressure (water deficit, sleep pressure) uses lo 1 and hi 0; a variable that is already a level (satiety) uses lo 0 and hi 1. Inside model equations the name n_thirst is still the pressure, 1 minus the level. A declared need is no longer grown by the game. A need that two conditions both have, such as medicine, is best left to the game; models read it as n_medicine |
| care.fixed_step_minutes | The model runs on its own clock with this step, as in LM. Inputs are spread over the steps of a window, and equations that add an input without multiplying by step are exact. Without it the model runs on substeps of at most care.max_step_minutes (default 15) |
| care.step_scale | Equation name to factor: this equation takes factor times longer steps, so a process that takes weeks can happen in a game day |
| care.schedule | Daily inputs: { var, hour, minutes, value, delivery?: total or level, days? }. total is spread over the window, level holds the value during the window and replaces the default. days uses 0 for Sunday |
| care.pulses | Care action id or story choice key to a list of { var, add } (add to a state) or { var, total, minutes } (an input window starting now) |
| care.presets, default_preset | Severity levels: parameters and starting state overridden when the player picks mild, moderate or advanced |
| care.readouts | What the player may observe: { id, label, label_en, value (an expression), unit, scale, decimals, reveal_by, bands }. A readout with reveal_by shows nothing until one of those actions is done, then shows the value of that moment. bands is a list of { upto, tone: ok, watch or alert, word, word_en }, the last one without upto |
| care.effects | Per hour rates for mood and frailty, expressions in the model's variables. They are added as ordinary mood and frailty increments, so the game's own rules keep pulling back and a model can only lean on them gently |
| care.story | intro and intro_en, shown when the condition is chosen |

Running a model needs no server: frontend/lab.html loads the same engine, lets you edit a model file in the page and see the curves for a chosen daily routine, and node frontend/tests/cond_sim.js diabetes 7 moderate care prints the same from a terminal. frontend/tests/cond_test.js checks the engine, the shipped models and the converted fixtures.

### From Life Matters

The plugin plugins/care_export in the LM Reference Engine repository converts an LM model with a recipe file and writes a pack: the renamed model, a condition template when the game does not have the condition yet, and a zip that the import dialog in the game's save settings accepts. The converted model reproduces the LM engine's numbers, and the game's engine reproduces the plugin's evaluator exactly; tests/fixtures/lm_pack holds a pack and the numbers the plugin's evaluator gives for it.

## Writing your own backend: checklist

- Answer OPTIONS and POST, reply with JSON and cross-origin headers.
- Put "v": 1 in every response.
- Declare handles in hello: if you only integrate, set all three to false.
- In drive tick use minutes as the step size, return increment directives, and declare the variables you are responsible for in drives.
- For a character you have not seen before, initialize from the snapshot values; for needs you do not know, leave them alone.
- Character ids are stable. When a character disappears (archived or deleted), clear your internal state for it.
- Start the basic backend with python backend_basic/server.py and change its step(), or look at frontend/src/data/lm to see how a model is written as YAML.
- Verify: CARE_BACKEND_URL=your-address node frontend/tests/logic_test.js runs through a real backend; CARE_BACKEND_URL=your-address node frontend/tests/sim_eval.js 1 120 family lets a family live a day on the virtual clock and prints the request count and round-trip time.
