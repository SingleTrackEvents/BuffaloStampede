# Build log and next steps

What's built on the shared core so far, and what's next. The scope is [SCOPE.md](SCOPE.md).

## Done (24 November 2026)

- **Seeded from Running Wild** (build 7), with the GPT100's runner and crew app put back (`runner.html`, Track tab, crew drives, Help tab).
- **Its own storage.** Every saved setting and cache starts `st`, since the app shares `singletrackevents.github.io` with the live GPT100 and Running Wild apps and must never touch theirs.
- **Event packs.** Everything event-specific now lives in `events/<id>/` (courses, races, posts, weather settings, runner info, logos, saved topo map). `events/events.js` lists the events; `js/event.js` picks one (`?event=<id>`, else the phone's last pick, else the event on now or next) and loads its pack. Each event's saved offline map is its own.
- **Offline.** Events marked `precache` are saved whole when the app installs (checked: all 22 Buffalo files land in the cache). Any other event is saved the first time someone opens it.
- **Two event packs.** `buller-2026` (the Running Wild tracking test, moved as it was) and `buffalo-2027`.
- **Buffalo 2027 pack** (`python3 tools/events/buffalo/build.py`, then `node tools/events/buffalo/safety-cards.mjs`): the 100k as the main course with its 10 aid station passes, the 42k, 20k, 10k and 5k, every race and cut-off from the BSF_2027 course details sheet, the Grand Slam and Ultra Slam as stage races (each stage on its own course), drop bags, relay changeovers and pacers, the plateau cloud zone, the race schedule, the English Help tab and the logos. Every aid station sits within 0.2 km of the sheet's km.
- **Fixes on the way:** the field app crashed for an event with no Safety Officer posts yet; the admin page crashed for any event without the GPT100's three bases.
- **Checks:** `node tools/smoke.mjs <event>` opens every page in a real browser and lists errors. All five pages pass for both events.

## Next, for the shared core

| # | What | Why |
| --- | --- | --- |
| 1 | Event picker on every page | Today an event is picked with `?event=` in the address |
| 2 | Modules switch tabs on and off (`ST.has`) | Buffalo needs Medical and Risk, Running Wild doesn't. The staff app still has Running Wild's three tabs |
| 3 | ~~One Worker for every event~~ Done: `singletrack-live` (tools/SINGLETRACK_WORKER.md). Buffalo's staff password still to set in Cloudflare | |
| 4 | ~~Weather watch per event~~ Done: runs from the default branch once `main` is it | |
| 5 | Setup tools take an event (`tools/*.mjs`, `tools/*.py` still write to `data/`) | So drive times, what3words, tiles and the medical plan can be made for any event |
| 6 | Time zone per event | Times assume Melbourne daylight saving (UTC+11). Fine for Buffalo; the Prom (1 May) is UTC+10 |
| 7 | Neutral names for the data globals (`GPT100_DATA` and the rest) | Tidy-up, once the above is settled |

## Done (24 November 2026, later)

- **Per-event branding**: names, logos, home screen icons, install files and the control room's name come from the event. Nothing in one event's app names another.
- **Find** marks the casualty clearly on the map for every event.
- **Event picker** on every page, and tabs switched on per event (`data-module`).
- **Medical log and withdrawals** (docs/MEDICAL_AND_RISK.md, section 7): the field app's Log tab and the staff app's Medical tab, on the Worker's `care` table.

## Next, for Buffalo (scope section 10, phases 1 to 3)

- Drive times from Bright to each access point (checked routes), what3words along the courses, the saved topo map, and demo runners for rehearsals.
- Splits fitted to the 2026 field, from the Living It Live archive (`20260328buffalostamp`).
- Safety Officer and marshal posts, the BSF27 Risk Management Plan triggers, the medical plan once Race Day Medical signs, the race medical number and the mandatory gear lists.
- The new lanes: Aid Station Manager, patient record, crews told of withdrawals, restock triggers, sweep progress (scope section 4).
