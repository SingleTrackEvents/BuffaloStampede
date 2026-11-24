# SingleTrack App

One race-weekend app for every SingleTrack event: runners, crews, aid stations, Safety Officers, the medical team and Event HQ on one connected app. It grew from the GPT100 Safety app ([SingleTrackEvents/GPT100](https://github.com/SingleTrackEvents/GPT100)) and the Running Wild app ([SingleTrackEvents/runningwild](https://github.com/SingleTrackEvents/runningwild)).

- **Buffalo Stampede 2027** (Bright, 19 to 21 March 2027) is the first event built on it. Scope and decisions: [docs/SCOPE.md](docs/SCOPE.md).
- **Running Wild** and the **GPT100** move onto the same core as event packs (Running Wild scope, decision 12).

## Where it's up to

Build in progress. The code is seeded from the Running Wild app (build 7, 24 November 2026) with the GPT100's runner and crew app put back (`runner.html`, `js/runner.js`, `js/track-tab.js`). Next: event packs (`events/<id>/`), so one copy of the code runs every event.

| Page | For |
| --- | --- |
| `index.html` | Event HQ: Find, Weather and Control |
| `field.html` | Safety Officers, sweeps, marshals and medics on the course |
| `runner.html` | Runners and their crews |
| `map.html` | The whole course on one screen |
| `admin.html` | Planning map and access point editor |

How the app works in full (from the GPT100): [docs/GPT100_README.md](docs/GPT100_README.md).

## Hosting and storage

GitHub Pages for now, then app.singletrack.com.au. The app shares `singletrackevents.github.io` with the live GPT100 and Running Wild apps, so every cache and saved setting here starts `st`, and the app only ever clears its own.

## Checking a change

- `node tools/smoke.mjs [event]` opens every page in a real browser and lists errors (about 20 seconds).
- `node tools/crashtest/run.js quick` is the full crash test from the GPT100 (see `tools/crashtest/README.md`).
- `node tools/bump_version.mjs` before every release, so phones take the new files as one set.
