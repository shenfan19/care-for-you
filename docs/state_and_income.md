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
- Efficiency is shown in the small block at the top right of the game window, for example "60%". The money counter next to it shows your money and the household income per game hour from everyone at their desk plus pensions, for example "301 +13.8/h". Tap the money counter to open the shop.

## Money

- Money comes from work, and every person who works earns on their own. The people who work are the couple in the household, or you if there is no couple. Two people at home sit at two desks in the study and both earn.
- A person earns only while they are awake and sitting at the desk during work hours. Sleeping, caring for someone away from the desk, or an outing earns nothing for that person. Someone who is away at their job elsewhere earns as before.
- Each worker's pay is the wage per real hour (26; in fast mode every game hour is scaled back, so speeding up earns nothing extra) multiplied by work focus, the efficiency and the family bonus. The efficiency and bonus are shared by the whole household. Focus applies to you only; a partner at the desk is not interrupted and works at full focus.
- Work focus is not instant. Sitting down starts it at 20% and it climbs in a straight line to 100% over 20 game minutes. Being called away, or going to sleep, takes the income to zero at once and resets focus to 20%. So one long stretch at the desk earns more than many short ones.
- The 20 minutes is a game setting. The direction comes from research on attention residue after interruptions (Leroy 2009); no reliable source gives a number of minutes. The in-game Knowledge page (Settings) lists every rhythm in the game with its source or says it is a setting.
- Every elder in the household (visitors excluded) receives a pension of 30% of what one person earns by sitting through the whole work period, spread over 24 hours (about 2.9 per game hour). It does not need the desk and does not depend on who you play.
- Calibration: two earners together make 52 per full hour, the pace the shop prices were set for. A single-parent household earns half of that, and a household of elders alone only the pension. These ratios are design anchors; they are not taken from household income statistics.
- Money has no penalty. There are no debts and no deadlines. Saving is meant to be slow, so the game works as well for a few focused minutes as for leaving it open.

## The shop

Tap the money counter to open it. Everything looks the same: an icon, a name, a price, and a hover text that explains it. There are four groups.

- Beds: beds decide how many people can live at home. Each family member and each visitor takes one; babies sleep in cradles, and animals and plants take none. You start with a spare bed, at least four in all, and can buy up to eight, each more expensive than the last: 600, 900, 1300 and 1800. When the beds are used up you cannot add people and no new visitor comes.
- Everyday things: a toy, fruit, a bookshelf, a stroller and a wheelchair. They change a few numbers in a small way.
- Decoration: a display cabinet and three tiers of decoration. They are purely for looks and have no effect on any number.
- Gifts for visitors: 27 small and curious things, kept in your bag, up to three of each, see [visitors.md](visitors.md).

Prices follow a play day of about five minutes: a toy 80, fruit 200, a bookshelf 400, a stroller 400, a wheelchair 600, decoration 160, 350 and 550, a display cabinet 300. You start with 200. There is only one house. No time limits, no discounts, and the game is complete without buying anything.

## Where it is defined

- `G.focus`, `G.focusStep`, `G.efficiency`, `G.burden`, `G.capacity`, `G.householdBonus`, and the shop table are in `frontend/src/core/economy.js`.
- The tests are in `frontend/tests/logic_test.js`.

## Standard and fast time

- Standard mode runs one real second as one game minute, so a game day takes 24 real minutes, and it can sit open beside your own work. Fast mode (2, 4 or 6 times standard) speeds the game up to feel the rhythm of caring quickly. Choose in the calendar menu (click the clock). Switching to fast asks you to confirm and says plainly that earning does not speed up.
- Money is earned at the standard pace per real second in both modes. Work focus climbs over 20 game minutes, which is 20 real seconds in standard mode.
- Rough pace in standard mode: the first guest bed after about half an hour, the second around an hour and a quarter, and a gift about every minute or two of full-load income.
