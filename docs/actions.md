# Actions: what you can do for others, and what you do for yourself

This page explains which actions appear when you click a person, and why.

## Two kinds of actions

- Care actions: you do something for someone else. Pour a glass of water, cook a meal for them, help them take their medicine, give a bath.
- Self actions: you do something for yourself. Drink some water, cook and eat, take your own pills, take a shower, watch TV.

## What you see

- Click someone else: only care actions. Self actions are never shown, because you cannot take someone else's medicine for them.
- Click yourself, the person you are playing: only self actions, plus any care action that has no self version.
- Going out is not part of this. It is a care action on someone else, and you go along. See [outings.md](outings.md).

This keeps a need from having two buttons that do the same thing. For example you will not see both "pour water" and "pour water to drink" on yourself, or both "help with medicine" and "take my own pills".

## Pairs

| Need | Care action, on someone else | Self action, on yourself |
| --- | --- | --- |
| Thirst | Pour water | Pour water to drink |
| Hunger | Cook a meal for them | Cook and eat; children grab a snack |
| Hygiene | Help with a bath | Take a shower |
| Rest | Help them lie down | A short nap |
| Company, play | Chat, pat on the shoulder, hold hands | Watch TV |
| Mobility | Walk with them | Move the arms and legs |
| Medicine | Help with medicine | Take my own pills |
| Blood pressure, joints | Measure | Measure it myself, apply heat |

When an action has no self version, for example measuring blood sugar, it stays available on yourself.

## Cooking feeds the household

- An action marked `household: true` applies its effect to everyone who is at home, awake and old enough to eat, not only to its target. Cooking is like this, whether you cook a meal for someone or cook for yourself. Babies and toddlers are not included, they have their own feeding action.
- Drinking water is different. Each person has their own thirst, so pouring a glass of water only helps one person.

## Self actions happen somewhere

- A self action can name a room with `at`, and a posture with `pose`. When you do it, you walk to that room and stay in that posture until the action's time is up: pouring water happens in the kitchen, washing in the bathroom, watching TV in the living room, and a nap puts you to sleep in your own bed.
- Any other action wakes you and moves you to whoever you are looking after.
- At night, if you stand in your bedroom doing nothing for a few seconds, you lie down and sleep as well. Everyone else sleeps by their own schedule and how tired they are, you sleep by where you are.

## Where it is defined

- Each species and condition template lists its actions. A `selfonly: true` action is a self action, with a `self` list of the stages that can do it.
- `G.actionsOf` in `frontend/src/core/game.js` picks which ones to show.
- `frontend/tests/logic_test.js` checks that clicking yourself shows no duplicate care action and clicking someone else shows no self action.
