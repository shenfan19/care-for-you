# State bars, work efficiency and money

This page explains the bar under every character, how it relates to your income, and what the nanny and the shop do.

## The bar under each character

- Every person, animal and plant has a bar under its name. It is their mood.
- Mood moves towards a target that depends on how well their needs are looked after: the more urgent their worst need, the lower the target. It does not jump, it relaxes towards the target over a few game hours.
- Mood is not a score. Nothing bad happens when it is low, characters just look and sound a little worse, and they are a little less willing to help.

## Work efficiency

- The average of everyone's bar, yourself included, is the working efficiency of whoever is at work. It is shown in the small block at the top right of the game window, for example "60%".
- The nanny does not count in the average. Her own mood is separate, see below.
- The average never counts for less than 40%, so a bad day does not spiral into having no income.
- Looking after everyone, including the person you are playing, is what keeps income high. There is no separate mood meter for you.

## Money

- Money comes from work. Only a couple in the household earns, or you do if there is no couple.
- Pay is 40 per game hour multiplied by the efficiency, and only while you are sitting at the desk during work hours. Time spent caring for someone away from the desk, or on an outing, does not earn.
- An elder you play receives a fixed pension of 4 per game hour.
- Money has no penalty. There are no debts and no deadlines.

## The nanny

- Hiring costs 120 per day, paid when she arrives. If there is not enough money she rests that day and comes back when there is.
- She helps the family during work hours, does not interrupt you with questions, and leaves a few quiet lines in the log.
- She has her own mood. It drops slowly while she works and recovers when she is off duty. It makes her help a little less effective, never below 80%.
- You can give a bonus once a day while she is on duty. It costs 40 and lifts her mood. There is no way to criticise or squeeze her, and she never leaves because of a low mood.

## The shop

- Items are bought once and stay: a toy, a better bed, a stroller, a wheelchair and three tiers of decoration.
- They change a few numbers in a small way and add things to the house. Where each item appears is a table per house, `frontend/src/data/houses.js`, so a different house can place the same items in its own spots. No time limits, no discounts, and the game is complete without buying anything.

## Where it is defined

- `G.efficiency`, `G.familyState`, the nanny and shop tables are in `frontend/src/core/economy.js`.
- The tests are in `frontend/tests/logic_test.js`.
