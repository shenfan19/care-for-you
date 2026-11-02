# Time door, visitors and the daily calendar

This page explains the daily rhythm, the visitors who come through the time door, gifts and the display cabinet, and how to write your own visitor cards.

## A day

- A play day runs from 14:00 to midnight and takes about five real minutes. There is no speed button.
- At midnight the game stops and shows a short summary of the day: three to five sentences built from what happened. Turn the page to continue. The night and the morning are played by the engine, and the next day starts at 14:00.
- Every day is kept in the calendar, which you can browse at any time. The summaries are stored as text keys, so they switch language with the interface.
- If you leave the page for more than three hours, the game catches up when you return: one day per three hours away, at most three days. Needs rise slowly while you are away and nothing pops up.
- Needs follow the real-second rhythm, not the clock face. Compressing a day into five minutes does not make people need more care per minute.

## The time door and visitors

- Every home has a time door. Guests step through it, stay for a few days and go back. A guest needs a free guest bed, and there is one at the start. The bigger house adds another.
- The first guest arrives on the first afternoon and is chosen by the interface language. Everyone else arrives at random, and guests you have not yet satisfied come more often than ones you already have.
- A guest stays for the number of days written on their card. They do not always leave content. If they leave unsatisfied they may come back later.
- Visitors are simple cards. They have no body model, no diagnosis and no needs bars. Each card holds one or two real needs and a pair of gifts that would help.
- Visitors are fictionalised short visits. They go back through the door afterwards and history is not changed. All they leave behind is a harmless keepsake.

## Gifts and the cabinet

- Talk to a guest to hear hints. Some guests only need a night's rest. Others need a specific gift that you can buy in the gift shop on the door screen.
- You can care for guests or give gifts twice a day in total.
- A gift only works if it matches what the guest needs. A wrong gift is accepted and used up, and nothing is said about it at the time. A line at the end of their stay can tell you what they would really have liked.
- When a guest is content they leave a keepsake, which goes into the cabinet on the door screen.

## Writing a visitor card

Official cards live in `frontend/src/data/visitors.js` and `frontend/src/data/visitors_cards.js`. You can add your own cards without changing any code by putting YAML files in the data folder under `templates/visitors/`. Cards you add yourself are marked as unofficial in the game, are never uploaded and are not hosted by this project.

```yaml
cards:
  - id: example
    region: Somewhere
    age: 40
    pronoun: 他        # 他, 她 or 它, used by the portrait
    stay: [1, 2]       # fewest and most days
    wants: [tea, book] # gift ids from the gift list, or use care: rest instead
    look: { skin: '#f6d2b4', hairColor: black, hairStyle: short, glasses: none, clothes: '#7f9580' }
    souvenir: { id: example_keepsake, icon: 📜 }
    src: Where the facts come from.
    review: Date and result of the controversy check.
    t:
      name: { zh-CN: 名字, en: Name }
      era: { zh-CN: 时代, en: Era }
      souvenir: { zh-CN: 一页笔记, en: A page of notes }
      arrive_note: { zh-CN: ..., en: ... }
      hint:
        - { zh-CN: ..., en: ... }
        - { zh-CN: ..., en: ... }
      ok_line: { zh-CN: ..., en: ... }
      leave_ok: { zh-CN: ..., en: ... }
      leave_miss: { zh-CN: ..., en: ... }
      wrong_late: { zh-CN: '', en: '' }
```

Gift ids are the keys of `V.GIFTS` in `visitors.js`. Check the result with `node frontend/tests/play_test.js`, which verifies the fields, the languages and the gifts of every official card.

## What the official cards follow

- The person died more than fifty years ago, or is a literary character.
- Widely regarded as a positive figure. No political leaders, no founders of religions, nothing about wars or colonialism.
- The text only uses well-documented habits and interests. No diagnosis, and nothing about death.
- Every card records its sources and the result of a controversy check, with a date.
- If you find a fact that is wrong or a card that should not be here, please open an issue.

## License

Code is MIT. The official visitor cards and their texts are released under CC BY 4.0, so you may reuse and adapt them with attribution. Third-party card packs are the responsibility of their authors.
