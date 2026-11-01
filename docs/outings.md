# Outings: who goes, who comes along, and how everyone gets back

This page describes how going out works in the game, so that players, modders and people writing a backend know what to expect.

## The short version

- When you send someone out, you go with them. You do not stay at home while they walk around the street alone.
- Babies, toddlers, children and elders at home join an outing that is marked as a group outing.
- Everyone is back when the outing time is over, and you walk home when nobody is left at the place.
- People can also go out on their own, for example a dog that wants a walk. Those outings do not move you.

## Where outings are defined

An action can carry an `outing` block in its species or condition template:

```yaml
street: { label: A walk in the street, hold: 6, min: 30, away: true, outing: { place: street, room: road, minutes: 6, group: true }, effect: { ... } }
```

- `place` and `room`: where they go. Places are `home`, `park`, `street`, `hospital`, `office`.
- `minutes`: how long the outing lasts, in game minutes.
- `group`: if true, other people at home may come along.

## Who comes along

When you perform an outing action on a person, that person goes. If `group` is true, these people also go, if they are at home, awake, not in hospital and not already out:

- babies, toddlers, children and elders.

You are never part of the group list. You go as the person who takes them out, and you move to the same place.

## What you do

- Your position moves to the destination place. The page switches to that place if it is the one you are watching.
- While you are out with them, you do not walk back by yourself even if you stop doing things for a few seconds. This is on purpose: you came along.
- When the outing time ends, everyone returns home. Once nobody else is at the place, you return too and go back to where your daily routine says you should be.
- The wage only counts while you are sitting at the desk, so time spent on an outing does not earn money. This is part of the cost of taking someone out.

## Autonomous outings

Characters can also decide to go out by themselves, for example a dog that wants a walk, or an elder who feels like some air. These come from the "wants" table in the internal settings and from backend strategies.

- The people involved go out, you stay where you are.
- They still return when the time is over.

## What outings change

- The person you took out gets the action's `effect`, as for any action.
- Companions get +0.05 mood, and babies and toddlers get +0.04 more if the household owns a stroller.
- An outing is logged for each person who went, and one line is added for you.

## Related tests

`frontend/tests/logic_test.js` checks that taking an elder out moves you too, that you do not go home while they are still out, and that you go home once everyone is back.
