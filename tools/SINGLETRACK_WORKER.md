# The SingleTrack Worker (Cloudflare)

One Cloudflare Worker, `singletrack-live`, serves every event on the shared app: the Control board, the line to the phones (notices, help requests, field phones on the map, alerts), the tracking and timing relays and the race archive. The code is [`refresh-worker.js`](refresh-worker.js), the GPT100 and Running Wild Worker made to serve many events.

The GPT100's `gpt100-refresh` and Running Wild's `runningwild-live` are separate Workers and stay as they are.

## How events are kept apart

- **Its own address.** Each event's apps talk to `https://singletrack-live.chad-ad3.workers.dev/e/<event id>`, set as `refreshUrl` in the event's `config.js`.
- **Its own database.** Each event has its own D1 database, bound to the Worker as `DB_<EVENT ID>` (capitals, dashes as underscores): Buffalo 2027 is `singletrack-buffalo-2027`, bound as `DB_BUFFALO_2027`. Clearing one event after race day never touches another.
- **The medical log** (`care` table): presentations, minor care and withdrawals from the field app's Log tab. Medics sign in with the medical code HQ sets on the Medical tab (setting `med_code`); clinical notes are only ever kept from, and shown to, a phone with that code.
- **Aid stations** (`stn` table): reports, supply requests, holds and handovers from the field app's Station tab. Each Aid Station Manager picks their station and signs in with its code (setting `stn_codes`, issued on the staff app's Stations tab) and only sees their own station. Stocktakes, restock runs and restock triggers are in the same table; the yard signs in with the `Yard` code and sees every station.
- **Its own staff password.** The secret `RC_PASSWORD_<EVENT ID>`, for example `RC_PASSWORD_BUFFALO_2027`. There is no shared staff password: an event without its own can't unlock Control.
- **Its own secrets** where it needs them, with the same ending: `TIMING_URL_`, `NTFY_TOPIC_`, `GARMIN_PASSWORD_`, `ARCHIVE_GPS_`. Without one, the Worker-wide secret of that name is used (except the staff password).
- **Its settings** (race window for the archive, the app's published config, the Garmin MapShare name) are in `EVENTS` at the bottom of `refresh-worker.js`.

## Set up so far (24 November 2026)

- The Worker `singletrack-live`, on `chad-ad3.workers.dev`, with two timers (every 15 minutes and every minute).
- Buffalo 2027: the database `singletrack-buffalo-2027`, bound as `DB_BUFFALO_2027`.

## To do by hand: Buffalo's staff password (2 minutes)

The password staff type on the Control tab. Nobody else sees it, so set it yourself in Cloudflare:

1. **Workers & Pages**, then **singletrack-live**, then **Settings**, then **Variables and Secrets**, then **Add**.
2. **Type:** Secret. **Variable name:** `RC_PASSWORD_BUFFALO_2027`. **Value:** a new password for Buffalo (not the GPT100's or Running Wild's).
3. **Deploy.**

Check it: `https://singletrack-live.chad-ad3.workers.dev/e/buffalo-2027/live` shows a line starting `{"now":`. Open the staff app for Buffalo, go to **Control**, type the password and **Unlock**: the top right shows a green **Live**.

## Adding an event

1. In Cloudflare, create a D1 database `singletrack-<event id>`.
2. Add an entry to `EVENTS` in `refresh-worker.js` and deploy the Worker with a binding `DB_<EVENT ID>` to that database.
3. Add the secret `RC_PASSWORD_<EVENT ID>`.
4. Set `refreshUrl` in the event's `config.js` to `https://singletrack-live.chad-ad3.workers.dev/e/<event id>`.

## Deploying a change

Paste the whole of `refresh-worker.js` into the Worker's editor in Cloudflare and **Deploy**, or through the Cloudflare API with the code-only upload (`PUT .../workers/scripts/singletrack-live/content`), which keeps every database binding and secret as it is. Test it first on this computer: the crash tests' `tools/crashtest/worker-local.mjs` runs the same code with a local database.

## After an event

Download the tracks and the incident log from Control first. Then open that event's database in Cloudflare, go to **Console**, and run:

```
DELETE FROM care; DELETE FROM stn; DELETE FROM transport; DELETE FROM settings WHERE k = 'stn_codes'; DELETE FROM field_track; DELETE FROM field_pos; DELETE FROM settings WHERE k LIKE 'garmin_%'; DELETE FROM notices; DELETE FROM faults; DELETE FROM incidents; DELETE FROM units; DELETE FROM log; DELETE FROM rate;
```

## Not set up yet

- **Weather refresh button** (`GITHUB_TOKEN`): the hourly weather watch runs on GitHub's own timer meanwhile, so Buffalo's Weather tab has no Refresh now button.
- **Timing feed** (`TIMING_URL_BUFFALO_2027`) and the 2027 GPS event ids: once Living It Live sets up the 2027 events.
- **Phone alerts for feed problems** (`NTFY_TOPIC_BUFFALO_2027`).
