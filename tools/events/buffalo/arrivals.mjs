// Buffalo Stampede: how the 2026 100k field actually arrived at each aid station, from the Living It Live GPS tracks,
// for the share of runners through a station (js/through.js) until the 2027 timing mats are live.
//
//   node tools/events/buffalo/arrivals.mjs path/to/folder-with-init.txt-and-data.lst
//
// The folder holds the 2026 event's files from https://tulospalvelu.fi/gps/20260328buffalostamp/ (init.txt, data.lst).
// They hold names and tracks, so they stay out of the repository; only the arrival curves are written, to
// events/buffalo-2027/arrivals.js. For each 100k aid station pass: how many tracked runners got there, and the
// minutes after the start by which each 5% of them had arrived. Each runner is followed along the course line, so
// the out and back passes are told apart.
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const dir = process.argv[2];
if (!dir) { console.error('Usage: node tools/events/buffalo/arrivals.mjs folder'); process.exit(1); }
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['course.js', 'races.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'events/buffalo-2027', f), 'utf8'), ctx);
const D = ctx.window.GPT100_DATA, R = ctx.window.GPT_RACES, route = D.route;
const EPOCH = Date.UTC(2006, 0, 1) / 1000, ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Competitors and their start (HHMM, the event's time zone).
const init = fs.readFileSync(path.join(dir, 'init.txt'), 'utf8'), tz = +(init.match(/^TIMEZONE:(-?\d+)/m) || [0, 660])[1];
const runners = new Map();
for (const l of init.split('\n')) { const m = l.match(/^COMPETITOR:([^|]+)\|(\d{8})\|(\d+)\|/); if (m) runners.set(m[1], { date: m[2], start: +m[3], pts: [] }); }
// data.lst, as js/tracking.js reads it.
for (const line of fs.readFileSync(path.join(dir, 'data.lst'), 'utf8').split('\n')) {
  const c = line.split('.'); if (c.length < 2 || c[1].includes('*')) continue;
  const r = runners.get(c[0]); if (!r) continue;
  const u = c[1].split('_'); let t = +u[0], lon = +u[1], lat = +u[2];
  const add = () => { if (lat && lon) r.pts.push([t, lat / 1e5, lon / 5e4]); }; add();
  for (let k = 2; k < c.length; k++) {
    const tok = c[k]; if (tok.length < 3) continue; const v = tok.split('_');
    if (v.length >= 3) { t += +v[0] || 0; lon += +v[1] || 0; lat += +v[2] || 0; } else { t += ALPHA.indexOf(tok[0]) - 31; lon += ALPHA.indexOf(tok[1]) - 31; lat += ALPHA.indexOf(tok[2]) - 31; }
    add();
  }
}
const dist = (a, b, c, d) => { const x = (d - b) * Math.cos((a + c) / 2 * Math.PI / 180), y = c - a; return Math.sqrt(x * x + y * y) * 111.32; };
const at = km => { let i = route.findIndex(p => p[2] >= km); if (i < 0) i = route.length - 1; return route[i]; };
const stage = R.stages['100k'], passes = stage.points.filter(p => p.kind === 'aid').map(p => { const q = at(p.gk); return { name: p.name, gk: p.gk, lat: q[0], lon: q[1] }; });

const out = {}; let starters = 0;
for (const r of runners.values()) {
  const pts = r.pts.sort((a, b) => a[0] - b[0]);
  if (pts.length < 20) continue;
  // The start, in seconds of the feed's clock: the race day at the start time, local.
  const d = r.date, start = Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8)) / 1000 - EPOCH + (Math.floor(r.start / 100) * 60 + r.start % 100) * 60 - tz * 60;
  // Started: a fix more than 2 km from the start within the first 3 hours.
  if (!pts.some(p => p[0] > start && p[0] < start + 3 * 3600 && dist(p[1], p[2], route[0][0], route[0][1]) > 2)) continue;
  starters++;
  // Follow the runner along the course line: each fix moves them on to the nearest bit of course within 300 m, looking
  // from just behind where they were to 6 km ahead (so an out and back doesn't jump to the other leg). They arrive at a
  // pass when they're past its km, at a time taken between the two fixes either side.
  let cur = 0, ri = 0, lastT = start, lastKm = 0, pi = 0;
  for (const p of pts) {
    if (p[0] < start) continue;
    let best = null;
    for (let k = ri; k < route.length && route[k][2] <= cur + 6; k++) {
      if (route[k][2] < cur - 0.5) continue;
      const dd = dist(p[1], p[2], route[k][0], route[k][1]);
      if (dd < 0.3 && (!best || dd < best.d)) best = { d: dd, k };
    }
    if (!best) continue;
    const km = route[best.k][2];
    if (km > cur) {
      while (pi < passes.length && km >= passes[pi].gk - 0.15) {
        const f = km > lastKm ? Math.max(0, Math.min(1, (passes[pi].gk - lastKm) / (km - lastKm))) : 1;
        (out[passes[pi].name] = out[passes[pi].name] || []).push((lastT + f * (p[0] - lastT) - start) / 60);
        pi++;
      }
      cur = km; while (ri < route.length && route[ri][2] < cur - 0.5) ri++;
    }
    lastT = p[0]; lastKm = cur;
  }
}
const res = { source: 'Living It Live GPS, Buffalo Stampede 2026 100k (tulospalvelu.fi 20260328buffalostamp)', starters, passes: {} };
for (const ps of passes) {
  const a = (out[ps.name] || []).sort((x, y) => x - y);
  if (a.length < 10) continue;
  res.passes[ps.name] = { arrived: a.length, q: Array.from({ length: 21 }, (_, k) => Math.round(a[Math.min(a.length - 1, Math.round(k / 20 * (a.length - 1)))])) };
  console.log(ps.name.padEnd(32), String(a.length).padStart(4), 'first', res.passes[ps.name].q[0], 'median', res.passes[ps.name].q[10], 'last', res.passes[ps.name].q[20], 'min');
}
console.log(starters, 'tracked starters');
fs.writeFileSync(path.join(ROOT, 'events/buffalo-2027/arrivals.js'),
  '// Buffalo Stampede: how the 2026 100k field arrived at each aid station (tools/events/buffalo/arrivals.mjs, from the Living It Live\n' +
  '// GPS tracks). Per pass: runners tracked there (arrived, of starters) and minutes after the start by which each 5% had\n' +
  '// arrived (q[0] the first, q[10] the median, q[20] the last). js/through.js uses it until the timing mats are live.\n' +
  'window.ST_ARRIVALS = { \'100k\': ' + JSON.stringify(res) + ' };\n');
