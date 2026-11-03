# State bars, work efficiency and money

This page explains the bar under every character, how it relates to your income, and what the shop sells.

## The bar under each character

- Every person, animal and plant has a bar under its name. It is their mood.
- Mood moves towards a target that depends on how well their needs are looked after: the more urgent their worst need, the lower the target. It does not jump, it relaxes towards the target over a few game hours.
- Mood is not a score. Nothing bad happens when it is low, characters just look and sound a little worse, and they are a little less willing to help.

## Work efficiency

- Efficiency depends on how much care is waiting, not on the average mood. Each person adds a load: how unmet their needs are (one minus the mood) times how much they depend on others. A baby counts 1, a toddler 0.8, a child 0.4, a teenager 0.15, an adult 0.1, an elder 0.4 (double when bedridden), an animal 0.15, a plant 0.03, and you yourself 0.3.
- The load is divided by your capacity, which starts at 1. Each adult or teenager at home who is in a decent mood and not in bed adds 0.3. Efficiency is 40% plus 60% of the share of capacity that is not used up, and never below 40%.
- So more people and more dependents mean more load and lower efficiency, while helpers lift capacity. Plants cannot be stacked to raise income.
- The household also adds a small bonus: each family member other than you whose mood is at least 0.6 adds 0.08 to the multiplier, up to a total of 0.6. Plants and animals do not count.
- Efficiency is shown in the small block at the top right of the game window, for example "60%". The money counter next to it shows your money and the household income per game hour, for example "301 +13.8/h". Tap the money counter to open the shop.

## Money

- Money comes from work. Only a couple in the household earns, or you do if there is no couple.
- Pay is 20 per game hour multiplied by the efficiency and the family bonus, and only while you are sitting at the desk during work hours. Time spent caring for someone away from the desk, or on an outing, does not earn.
- An elder you play receives a fixed pension of 2 per game hour.
- Money has no penalty. There are no debts and no deadlines. Saving is meant to be slow, so the game works as well for a few focused minutes as for leaving it open.

## The shop

- Items are bought once and stay: a toy, a better bed, a stroller, a wheelchair and three tiers of decoration. Prices follow a play day of about five minutes: a toy 80, fruit 200, a better bed 350, better bedding 700, a bookshelf 400, a stroller 400, a wheelchair 600, decoration 160, 350 and 550, a bigger house 2000. You start with 200, or more or less depending on how the story begins.
- The shop has two parts. The first is for the home. The second is gifts for visitors, 27 small and curious things from a cup of tea to a microscope; you can keep up to three of each in your bag, and give one by pressing and holding "give a gift" in a guest's ring, see [visitors.md](visitors.md).
- They change a few numbers in a small way and add things to the house. Where each item appears is a table per house, `frontend/src/data/houses.js`, so a different house can place the same items in its own spots. No time limits, no discounts, and the game is complete without buying anything.

## Where it is defined

- `G.efficiency`, `G.burden`, `G.capacity`, `G.householdBonus`, and the shop table are in `frontend/src/core/economy.js`.
- The tests are in `frontend/tests/logic_test.js`.
