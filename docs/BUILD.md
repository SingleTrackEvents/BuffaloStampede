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

- **Aid Station Manager screen** (scope 4.3), in the field app's **Station** tab:
  - **Sign-in.** Each manager picks their station, then signs in with its code from HQ, and sees only that station.
  - **My station.** Its sessions, and each race passing with its first runner, cut-off countdown, drop bags, relay changes and pacers.
  - **Report in.** Open, update or closed, with stock, staff and crowding and a 2-hour reminder.
  - **Stocktake.** Every 2 hours, each item on the station's pack list (events/buffalo-2027/stock.js, built by tools/events/buffalo/stock.py from the Aid Station Consumptions sheet) as Plenty, Half, Low or Out, count optional. The phone buzzes when one is due.
  - **Runners through** (js/through.js): the share of the session's runners through, per race and pass. Live from the timing mats; until then from the 2026 100k arrival curves (events/buffalo-2027/arrivals.js, fitted by tools/events/buffalo/arrivals.mjs to the 2026 Living It Live GPS tracks) or, for races not tracked in 2026, the race sheet. Stocktake counts are checked against what the rest of the field needs.
  - **Restock runs** from the yard, marked received.
  - **Ask the yard.** Supplies in a tap; the yard answers and HQ sees it.
- **Yard screen** (scope 4.3a): the same tab signed in as Yard. Every station's latest stocktake (Low and Out first, late ones flagged), requests, restock triggers, building and tracking restock runs, and the yard and coolroom stocktake.
  - **Holds.** Confirmed in a tap, and the phone buzzes when one is called.
  - **Withdrawals and handover.** Withdrawals go into the medical log, and a shift handover note is kept.
- **Staff app, Stations tab.**
  - Every station's session and last report, marked **Report overdue** when an open station hasn't reported for 2 hours or hasn't opened 15 minutes into its session.
  - The request queue, with On its way and Done.
  - **Call a hold** at every station or chosen ones, with each station's confirmation, and release it.
  - Each station's runners through, latest stocktake, and the restock runs and yard stocktake.
  - The station codes, and the yard's.
- **Risk tab.** The **Station reports** line is live, and a HOLD decision can be sent to every station.

- **Saved topo map.** The topo map 2 km either side of every Buffalo course, zoom 8 to 15, hosted with the app so phones can save it for use without signal (`node tools/fetch_topo_tiles.mjs buffalo-2027`, which now works per event).
- **Splits fitted to the 2026 field.** From the 2026 Living It Live GPS tracks (`20260328buffalostamp`, the 100k only: 195 tracked starters, 168 finishers), `tools/events/buffalo/arrivals.mjs` fits each checkpoint's share of a finisher's time (events/buffalo-2027/splits.js). The runner app's expected times and HQ's late and overdue flags use it. Predicting the next checkpoint from the one before, it's within 6 minutes for half the 2026 legs and 22 minutes for 90% (the old blend: 9 and 28). The same tracks give the arrival curves for runners through each station.

## Next, for Buffalo (scope section 10, phases 1 to 3)

- Drive times from Bright to each access point (checked routes), what3words along the courses, and demo runners for rehearsals.
- Safety Officer and marshal posts, the BSF27 Risk Management Plan triggers, the medical plan once Race Day Medical signs, the race medical number and the mandatory gear lists.
- The new lanes: Aid Station Manager, patient record, crews told of withdrawals, restock triggers, sweep progress (scope section 4).
