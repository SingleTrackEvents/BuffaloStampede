// Buffalo Stampede 2027: the made-up field for the practice mode (?demo=1, js/demo.js), written to
// events/buffalo-2027/demo-runners.js. Every name is invented. The race times come from races.js.
//
//   node tools/events/buffalo/demo.mjs
//
// The demo opens 3 hours into the 100k (09:00 Saturday): the 100k spread from Buckland Valley to The Chalet, the 20k
// on course, and the Control board's incidents coming in. ?demo=sun09:00 opens on the 42k, ?demo=fri18:30 the 10k.
// Trackers on the 100k, relay and 42k only (as on the day); the 20k and 10k are placed by the timing chips.
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'events/buffalo-2027/races.js'), 'utf8'), ctx);
const R = ctx.window.GPT_RACES, start = id => R.stages[id].points[0].first;

const FIRST = ['Alex', 'Sam', 'Jordan', 'Kate', 'Ben', 'Mia', 'Tom', 'Grace', 'Liam', 'Zoe', 'Josh', 'Ruby', 'Nick', 'Ella', 'Dan', 'Chloe', 'Matt', 'Isla', 'Luke', 'Amy',
  'Ryan', 'Hannah', 'Sean', 'Lucy', 'Jack', 'Emma', 'Will', 'Tess', 'Owen', 'Maya', 'Hugh', 'Jess', 'Fergus', 'Nina', 'Toby', 'Leah', 'Rory', 'Anna', 'Callum', 'Bree'];
const LAST = ['Walsh', 'Nguyen', 'Kelly', 'Morgan', 'Fraser', 'Patel', 'Brooks', 'Hayes', 'Reid', 'Quinn', 'Doyle', 'Shaw', 'Lowe', 'Pearce', 'Bell', 'Hunt', 'Ross', 'Lane',
  'Grant', 'Burke', 'Wood', 'Price', 'Dunn', 'Marsh', 'Tran', 'Moss', 'Kerr', 'Ford', 'Gill', 'Hart', 'Cole', 'Nash', 'Rowe', 'Webb', 'Stone', 'Lynch', 'Byrne', 'Holt'];
const TEAMS = ['Bright Sparks', 'Gully Goats', 'Plateau Pacers', 'Chalet Chasers', 'Eurobin Express', 'Mystic Movers', 'Ovens Ramblers', 'Porepunkah Packs', 'Wandi Wanderers', 'Buckland Bolters'];
// A repeatable spread: no Math.random, so the demo is the same on every phone.
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const contests = {
  '100k': { stage: '100k', start: start('100k'), feed: 'Buffalo Stampede 100k' },
  'Relay': { stage: '100k', start: start('100k'), feed: '100k Teams Relay' },
  '42k': { stage: '42k', start: start('42k'), feed: 'SkyMarathon 42k' },
  '20k': { stage: '20k', start: start('20k'), feed: 'SkyRun 20k', gps: false },
  '10k': { stage: '10k', start: start('10k'), feed: 'Twilight 10k', gps: false }
};
const runners = [];
const add = (contest, bib0, n, teams) => { for (let i = 0; i < n; i++) {
  const u = rnd(), name = teams ? TEAMS[i % TEAMS.length] : FIRST[Math.floor(rnd() * FIRST.length)] + ' ' + LAST[Math.floor(rnd() * LAST.length)];
  // Pace between the first runner (0) and the cut-offs (1): most of the field in the middle, a few near the back.
  runners.push({ bib: bib0 + i, name, contest, pace: +(0.06 + 0.82 * Math.pow(u, 1.15)).toFixed(3) });
} };
add('100k', 1001, 70); add('Relay', 1501, 10, true); add('42k', 3001, 40); add('20k', 4001, 30); add('10k', 6001, 20);
// The ones with something going on (course km on each race's own course).
const kase = (bib, c, km) => Object.assign(runners.find(r => r.bib === bib), { case: c }, km != null ? { km } : {});
kase(1012, 'stopped', 30.2); kase(1027, 'quiet', 21.5); kase(1033, 'lost', 33.8); kase(1041, 'off', 15.6); kase(1048, 'dnf', 26.5); kase(1055, 'nogps'); kase(1060, 'missed', 18.3);
kase(4007, 'dnf', 8.3); kase(3012, 'stopped', 21.0);

// The Control board in the first hours of the 100k. Race time [hours, minutes] after the 100k start.
const seed_ = [
  { id: 'demo1', severity: 'routine', where: 'Buckland Valley aid station', reporter: 'Aid Station Manager', desc: 'Spectator car parked across the crew exit at Buckland Valley. Driver found, moving it.',
    at: { call: [2, 20], closed: [2, 40] }, outcome: 'Other' },
  { id: 'demo2', severity: 'routine', km: 26.5, bib: '1048', name: runners.find(r => r.bib === 1048).name, race: '100k', reporter: 'Eurobin Creek aid station', desc: 'Withdrew at Eurobin Creek, blisters both heels, dressed by the Medical Team. Needs a lift back to Bright.',
    at: { call: [2, 35], closed: [3, 10] }, outcome: 'Treated, withdrew (DNF)' },
  { id: 'demo3', severity: 'urgent', km: 31.0, bib: '1019', name: runners.find(r => r.bib === 1019).name, race: '100k', reporter: 'Runner, by phone', unit: 'u-Sweep-1', desc: 'Fell on the climb from Eurobin Creek towards The Chalet, suspected broken wrist, walking slowly with another runner.',
    at: { call: [2, 50], dispatched: [2, 54], onScene: [3, 30] } },
  { id: 'demo4', severity: 'priority', km: 40.5, bib: '1023', name: runners.find(r => r.bib === 1023).name, race: '100k', reporter: 'Another runner, by phone', unit: 'u-Chalet-SO', desc: 'Dizzy and vomiting on the plateau past The Chalet, sitting in the shade, can\'t keep fluids down.',
    at: { call: [3, 5], dispatched: [3, 8], onScene: [3, 25], leaving: [3, 50], closed: [4, 20] }, outcome: 'Walked out with crew' },
  { id: 'demo5', severity: 'priority', km: 33.8, bib: '1033', name: runners.find(r => r.bib === 1033).name, race: '100k', reporter: 'Event HQ, from the tracking', unit: 'u-Sweep-2', desc: 'Tracker stopped 3 km short of The Chalet and gone quiet, no answer on the phone. Sweep 2 checking along the track.',
    at: { call: [3, 15], dispatched: [3, 18] } }
];
const out = { generic: true, name: 'Buffalo Stampede demo', anchor: '100k', startH: 3, days: { fri: '2027-03-19', sat: '2027-03-20', sun: '2027-03-21' },
  contests, runners, seed: seed_, units: { 'u-Sweep-1': 'Sweep 1', 'u-Sweep-2': 'Sweep 2', 'u-Chalet-SO': 'Chalet Safety Officers' },
  notes: [[2, 30, 'Eurobin Creek: ice delivered by the yard'], [3, 0, 'Weather: 24°C at The Chalet, under the heat trigger'], [3, 20, 'Clearspot: busy with the 20k, extra water on the way']] };
fs.writeFileSync(path.join(ROOT, 'events/buffalo-2027/demo-runners.js'),
  '// Buffalo Stampede 2027 practice mode: a made-up field (tools/events/buffalo/demo.mjs). Every name is invented.\n' +
  '// Open any app with ?demo=1 (3 hours into the 100k), ?demo=sun09:00 for the 42k or ?demo=fri18:30 for the 10k.\n' +
  'window.GPT100_DEMO = ' + JSON.stringify(out) + ';\n');
console.log(runners.length, 'runners,', runners.filter(r => r.case).length, 'cases');
