// Buffalo Stampede: how the 2026 100k field actually arrived at each aid station, from the Living It Live GPS tracks,
// for the share of runners through a station (js/through.js) until the 2027 timing mats are live.
//
//   node tools/events/buffalo/arrivals.mjs path/to/folder-with-init.txt-and-data.lst
//
// The folder holds the 2026 event's files from https://tulospalvelu.fi/gps/20260328buffalostamp/ (init.txt, data.lst).
// They hold names and tracks, so they stay out of the repository; only the arrival curves are written, to
// events/buffalo-2027/arrivals.js and the splits to splits.js. For each 100k aid station pass: how many tracked runners got there, and the
// minutes after the start by which each 5% of them had arrived. Each runner is followed along the course line, so
// the out and back passes are told apart.
//
// splits.js: for each point, the share of a finisher's time used to get there, as a + b × finish hours (least squares
// over the 2026 finishers), as js/races.js and js/tracking.js read it. The fit is checked by predicting each finisher's
// later arrivals from their Eurobin Creek arrival.
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
const stage = R.stages['100k'], passes = stage.points.filter(p => p.kind !== 'start').map(p => { const q = at(p.gk); return { name: p.name, gk: p.gk, lat: q[0], lon: q[1] }; });

const out = {}, per = []; let starters = 0;
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
  let cur = 0, ri = 0, lastT = start, lastKm = 0, pi = 0; const mine = {}; per.push(mine);
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
        const e = (lastT + f * (p[0] - lastT) - start) / 60;
        mine[passes[pi].name] = e;
        if (passes[pi].gk < stage.points[stage.points.length - 1].gk - 0.5) (out[passes[pi].name] = out[passes[pi].name] || []).push(e);
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

// ---------- splits ----------
const FIN = stage.points[stage.points.length - 1].name, fin = per.filter(m => m[FIN] && Object.keys(m).length === passes.length);
const sp = { source: res.source, finishers: fin.length, points: {} };
for (const ps of passes.slice(0, -1)) {
  const X = fin.map(m => m[FIN] / 60), Y = fin.map(m => m[ps.name] / m[FIN]), n = X.length, mx = X.reduce((a, b) => a + b) / n, my = Y.reduce((a, b) => a + b) / n;
  const b = X.reduce((a, x, i) => a + (x - mx) * (Y[i] - my), 0) / X.reduce((a, x) => a + (x - mx) ** 2, 0), a = my - b * mx;
  sp.points[ps.name] = { a: +a.toFixed(5), b: +b.toFixed(6), gk: ps.gk };
}
// Check: from each finisher's arrival at Eurobin Creek, their finish time and then each later point.
const share = (k, h) => k === FIN ? 1 : sp.points[k].a + sp.points[k].b * h, err = [];
for (const m of fin) {
  const e0 = m['Eurobin Creek'] / 60; let lo = 5, hi = 40;
  for (let i = 0; i < 40; i++) { const h = (lo + hi) / 2; if (share('Eurobin Creek', h) * h < e0) lo = h; else hi = h; }
  const h = (lo + hi) / 2;
  passes.filter(p => p.gk > 27).forEach(p => err.push(Math.abs(share(p.name, h) * h * 60 - m[p.name])));
}
err.sort((a, b) => a - b);
console.log(fin.length, 'finishers fitted. From Eurobin Creek, later arrivals off by a median of', Math.round(err[err.length >> 1]), 'min (80% within', Math.round(err[Math.floor(err.length * 0.8)]) + ')');
// And the next point from each point, as the late flags use it: the fit against the same share of the way from the
// first runner's to the last finisher's time at every point (the blend, without a fit).
const solve = (k, e) => { let lo = 5, hi = 40; for (let i = 0; i < 40; i++) { const h = (lo + hi) / 2; if (share(k, h) * h < e) lo = h; else hi = h; } return (lo + hi) / 2; };
const ends = {}; passes.forEach(p => { const v = fin.map(m => m[p.name]); ends[p.name] = [Math.min(...v), Math.max(...v)]; });
const e1 = [], e2 = [];
for (const m of fin) for (let i = 0; i < passes.length - 1; i++) {
  const A = passes[i].name, B = passes[i + 1].name, h = solve(A, m[A] / 60);
  e1.push(Math.abs(share(B, h) * h * 60 - m[B]));
  const f = (m[A] - ends[A][0]) / (ends[A][1] - ends[A][0]); e2.push(Math.abs(ends[B][0] + f * (ends[B][1] - ends[B][0]) - m[B]));
}
const med = e => { e.sort((x, y) => x - y); return Math.round(e[e.length >> 1]) + ' min (90% within ' + Math.round(e[Math.floor(e.length * 0.9)]) + ')'; };
console.log('Next checkpoint: fitted splits off by', med(e1), '; the blend', med(e2));
fs.writeFileSync(path.join(ROOT, 'events/buffalo-2027/splits.js'),
  '// Buffalo Stampede: the 100k splits fitted to the 2026 finishers (tools/events/buffalo/arrivals.mjs, from the Living It Live GPS\n' +
  '// tracks). Each point: the share of a runner\'s finish time used to get there, a + b × finish hours, and its course km (gk).\n' +
  '// js/races.js reads it by stage (100k); js/tracking.js by the timing feed\'s race key (miler, the app\'s name for the main race).\n' +
  'window.GPT_SPLITS = (function () { const f = ' + JSON.stringify(sp) + '; return { \'100k\': f, miler: f }; })();\n');
fs.writeFileSync(path.join(ROOT, 'events/buffalo-2027/arrivals.js'),
  '// Buffalo Stampede: how the 2026 100k field arrived at each aid station (tools/events/buffalo/arrivals.mjs, from the Living It Live\n' +
  '// GPS tracks). Per pass: runners tracked there (arrived, of starters) and minutes after the start by which each 5% had\n' +
  '// arrived (q[0] the first, q[10] the median, q[20] the last). js/through.js uses it until the timing mats are live.\n' +
  'window.ST_ARRIVALS = { \'100k\': ' + JSON.stringify(res) + ' };\n');
