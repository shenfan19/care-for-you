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

## Babies and toddlers

They cannot do anything for themselves, so they only have care actions: feeding, changing a diaper, bathing, soothing to sleep, playing. Some self actions exist for fun, for example shaking a rattle, but only the character does them, never you.

## When people look after themselves

If a need is high and nobody answers, some characters use their own self action. How often depends on their stage: elders and older children do it more, babies cannot. See the stage table in the internal settings for the numbers. This does not use your time.

## Where it is defined

- Each species and condition template lists its actions. A `selfonly: true` action is a self action, with a `self` list of the stages that can do it.
- `G.actionsOf` in `frontend/src/core/game.js` picks which ones to show.
- `frontend/tests/logic_test.js` checks that clicking yourself shows no duplicate care action and clicking someone else shows no self action.
