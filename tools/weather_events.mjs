// The events the weather watch runs for now: from 120 days before an event (so the Weather tab has its replays of
// past race weekends and the models for planning; phone alerts wait for alertsFrom in the event's config.js) to the
// day after it.
//   node tools/weather_events.mjs   prints their ids, one per line
import { readFileSync } from 'node:fs';
const window = {}; new Function('window', readFileSync(new URL('../events/events.js', import.meta.url), 'utf8'))(window);
const now = Date.now(), DAY = 864e5;
for (const e of window.ST_EVENTS) {
  const from = Date.parse(e.from + 'T00:00:00+11:00') - 120 * DAY, to = Date.parse(e.to + 'T23:59:59+11:00') + DAY;
  if (now >= from && now <= to) console.log(e.id);
}
