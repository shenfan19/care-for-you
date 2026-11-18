# Save format

This page describes how Care for You keeps a game: the files of a save, how a save is read, and how it grows without breaking older saves.

Status: the files, the rules and the core-schema reading below are what the game does today. `tasks.yaml`, `format`, `min_reader`, `clock.unit` and `clock.step`, `parked.yaml`, the alias table and the deep merge of defaults are specified here and not yet in the game.

## Files

A save is a folder of plain text files, YAML for records and CSV for series. An export is a zip of the same folder with a `manifest.json`.

| File | Holds |
|---|---|
| `manifest.json` | format, app version, schema, min_reader, file list |
| `world/<world id>/world.yaml` | the shared world: clock, money, focus, owned things, visitors |
| `world/<world id>/calendar.yaml` | one summary per game day |
| `world/<world id>/tasks.yaml` | the task table, see Time and tasks |
| `world/<world id>/curves_world.csv` | money, focus, efficiency and family bonus, last 600 rows |
| `people/<id>/person.yaml`, `state.yaml`, `story.yaml`, `sayings.yaml` | one folder per character |
| `people/<id>/curves.csv` | mood, frailty and every need, last 600 rows |
| `people/<id>/journal/YYYY-MM.yaml` | what happened, by real month |
| `custom/` | things the player added, such as disease packs and visitor cards |
| `settings.ini` | preferences |

Any new kind of record is a new YAML or CSV file in these folders; the importer accepts it without changes. Data of add-on modules goes in `world/<world id>/ext/<module>.yaml`.

## Rules

- Permanent ids. People, diseases, visitors, items and task kinds have permanent ids, never renamed or reused; a renamed one is listed in the alias table.
- Tables keyed by id. Disease progress is stored in `story.yaml` under `arcs`, keyed by disease id, so a new disease is a new key.
- Facts in the save, rules in the program. Limits, durations and step lengths live in the rule templates; the save records what happened and where things stand.
- Absolute times. Every time is in game minutes, never a count of simulation steps.
- Only add, never change. A published field keeps its name, type, unit and meaning; a field no longer used is ignored on reading and written back as it was.

## Manifest

- `format`: always `careforyou-save`.
- `schema`: the version of the file structure.
- `min_reader`: the lowest schema that can read this save safely. Adding fields and files leaves it as it is, so an older game can still read a newer save.

## Time and tasks

- `world.yaml` has `clock` with `unit: game_minute` and the current `step`. Changing the step changes the rules and `step`, not the meaning of the times already saved.
- `tasks.yaml` is one table of tasks. Each has `id`, `kind`, `who`, `start`, `duration`, `status`, `seq` for its sequence, `order` within it, and `data` owned by its kind. A short action is a task with `duration: 0`; longer tasks and sequences are more kinds in the same table.
- A task under way when the game was closed is continued or cancelled by the rule of its kind.

## Reading a save

1. Files are parsed with the YAML core schema, so a string that looks like a date stays a string; JSON files are read as well.
2. If `min_reader` is above the game's schema, the save is refused and the player is asked to update. Otherwise it is read and unknown keys are kept.
3. A save from a lower schema is upgraded by the registered steps, after copying the files it changes to `_backup/`.
4. Every file is deep-merged with its defaults.
5. A record that names content that no longer exists is looked up in the alias table, and otherwise kept aside in `world/<world id>/parked.yaml` instead of dropping the save.
6. Only if no character is left or the clock is not a finite number does a new game start, after a backup.
