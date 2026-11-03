# Time door, visitors and the daily calendar

This page explains the daily rhythm, the visitors who come through the time door, gifts and the display cabinet, and how to write your own visitor cards.

## A day

- A play day runs from 14:00 to midnight and takes about five real minutes. There is no speed button.
- At midnight a small card slides in with a short, plain account of the day, one thing per sentence. It does not pause the game; it fades after a countdown, and unread days are marked in the calendar and on the time bar. Visitors come first, in the order things happened, then what the family did. For example: "Zhuge Liang stepped out of the time door. Zhuge Liang had a good sleep. Zhuge Liang left, but left a feather fan behind as a gift." The night and the morning are played by the engine, and the next day starts at 14:00.
- Every day is kept in the calendar. Open it from the time at the top right of the game window. The summaries are stored as text keys, so they switch language with the interface.
- If you leave the page for more than three hours, the game catches up when you return: one day per three hours away, at most three days. Needs rise slowly while you are away and nothing pops up.
- Needs follow the real-second rhythm, not the clock face. Compressing a day into five minutes does not make people need more care per minute.

## The time door and visitors

- The time door is a piece of furniture on the right of the yard. Guests step out of it and then move around the house like anyone else.
- A guest is a temporary member of the household. They have needs, and you look after them with the usual actions. One extra action only appears for guests: invite them to rest. They do not help around the house and do not add to the family bonus.
- A guest stays one to three days and may leave at random. They leave whether or not they are content. The ones who left unsatisfied may come back later.
- A guest needs a free guest bed. There is one at the start, and the bigger house adds another.
- The first guest is always Florence Nightingale. She steps out of the time door in the opening story, says it is an interesting place and that she will leave soon. Everyone else arrives at random, and guests you have not yet satisfied come more often than ones you already have.
- All texts, including the fifty cards, are available in the eight interface languages: Simplified and Traditional Chinese, English, Japanese, Korean, German, French and Spanish. The translations are machine-assisted and not proofread by native speakers, so corrections are welcome.
- There are fifty official cards. Each card carries a region and a field. Every region has the same total chance of being picked, so a region with more cards does not come more often. Medicine is slightly favoured, politics and the military slightly less. The interface language adds a small lean towards its home region; nothing is guessed from your location.
- Guests chat with the family now and then, one short line per guest per day, picked by the guest's field and the age of the family member.
- Rarely, two or three guests arrive together and share a line that belongs only to them, such as Li Bai, Du Fu and Basho, or Nightingale, Seacole and Hippocrates. Each combination happens at most once.
- Visitors are fictionalised short visits. They go back through the door afterwards and history is not changed. All they leave behind is a harmless keepsake.

## Gifts and the display cabinet

- Giving is one of the actions in the ring around a guest. Press and hold "give a gift" until the circle fills and a window with the gift list opens, then click an item. Only gifts in your bag can be given. Buy them in the gift section of the shop, which opens when you tap the money counter.
- Guests drop hints in what they say now and then. Some only need a rest. Others need a specific gift.
- A gift only works if it matches what the guest needs. A wrong gift is accepted and used up, and nothing is said about it at the time. A line in the day's account can tell you what they would really have liked.
- You can give two gifts a day.
- When a guest is content they leave a keepsake. The display cabinet is a piece of furniture you buy in the shop; it stands in the living room and shows the keepsakes you have collected, up to eighteen. Hover over one to see who left it.

## Writing a visitor card

Official cards live in `frontend/src/data/visitors.js` and `frontend/src/data/visitors_cards.js`. You can add your own cards without changing any code by putting YAML files in the data folder under `templates/visitors/`. Cards you add yourself are marked as unofficial in the game, are never uploaded and are not hosted by this project. A card with `care: invite_rest` is satisfied by inviting the guest to rest, and `tired: 0.85` makes them arrive exhausted.

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
