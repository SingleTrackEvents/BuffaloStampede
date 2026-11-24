// The share of runners through an aid station, so a manager can judge how far their stock has to stretch, and the yard
// can size a restock run to what's still to come. Shared by the Station tab (js/station.js) and the Stations tab.
//
// For a station's session now (events/<id>/cover.js), every race passing it in that session (races.js):
//   Live      from the timing mats (js/timing.js): runners through the station (a read there, or further on) out of
//             those who started and haven't pulled out before it.
//   Estimate  until the timing feed is on: the race's runners (stock.js field, the 2027 targets) arriving as the 2026
//             field did (arrivals.js, fitted to the 2026 GPS tracks: the 100k), fewer on later passes as 2026's did.
//             A race without 2026 tracks (the 42k, 20k, 10k) arrives between the first runner and the cut-off, bunched
//             early in that window.
// The station's figure weights each race by its runners. need(): what a planned amount comes to for the rest.
(function () {
  if (!window.ST) return;
  const R = window.GPT_RACES || { stages: {} }, P = window.ST_COVER || {}, S = window.ST_STOCK || {}, F = S.field || {}, AR = window.ST_ARRIVALS || {};
  // The share of a pass's runners there by e minutes after the start, from 2026's 5% steps.
  const curve = (q, e) => { if (e <= q[0]) return 0; if (e >= q[20]) return 1; let k = 0; while (q[k + 1] <= e) k++; return (k + (e - q[k]) / ((q[k + 1] - q[k]) || 1)) / 20; };
  const mel = s => s ? Date.parse(s + ':00+11:00') : null;
  const clean = n => String(n || '').replace(/\s*\((second|third) (pass|visit)\)\s*$/i, '').replace(/^(Start|Finish),\s*/i, '').trim();
  // Arrivals between the first runner and the cut-off: a triangle peaking 40% of the way through the window.
  const tri = (t, a, b) => { if (t <= a) return 0; if (t >= b) return 1; const c = a + 0.4 * (b - a), x = t - a;
    return t <= c ? x * x / ((b - a) * (c - a)) : 1 - (b - t) * (b - t) / ((b - a) * (b - c)); };
  // A point with no cut-off (Bakers Gully in the 42k) takes one between the cut-offs either side, by km.
  function cutOf(pts, k) {
    if (pts[k].cutoff) return mel(pts[k].cutoff);
    let i = k - 1, j = k + 1;
    while (i >= 0 && !pts[i].cutoff) i--; while (j < pts.length && !pts[j].cutoff) j++;
    if (i < 0 || j >= pts.length) return null;
    const a = mel(pts[i].cutoff), b = mel(pts[j].cutoff), f = (pts[k].km - pts[i].km) / ((pts[j].km - pts[i].km) || 1);
    return a + f * (b - a);
  }
  function session(post, t) {
    const ss = (P.aid || []).filter(s => s.name === post).map(s => ({ a: mel(s.from), z: mel(s.to) })).sort((x, y) => x.a - y.a);
    return ss.find(s => s.a <= t && t < s.z) || ss.find(s => s.a > t) || ss[ss.length - 1] || null;
  }
  // The timing feed's race for a runner: its stage (or 'miler', the app's name for the main race, as the 100k).
  const stageOf = r => R.stages[r.raceKey] ? r.raceKey : r.raceKey === 'miler' ? Object.keys(R.stages)[0] : null;
  function liveRunners() {
    const T = window.GPTTiming;
    if (!T || !T.on() || !T.ready()) return null;
    const rs = T.runners().filter(r => stageOf(r));
    return rs.length ? rs : null;
  }
  // The race clock: the practice mode's when it's on (js/demo.js), else the real time.
  const clock = () => window.GPT && GPT.now ? GPT.now() : Date.now();
  function station(post, t) {
    t = t || clock();
    const s = session(post, t);
    if (!s) return null;
    const live = liveRunners(), passes = [];
    Object.values(R.stages || {}).forEach(st => (st.points || []).forEach((p, k, pts) => {
      if (clean(p.name) !== post || p.kind !== 'aid') return;
      const first = mel(p.first), cut = cutOf(pts, k);
      if (!first || first < s.a - 2 * 3600e3 || first >= s.z) return;
      const race = (R.races || []).find(x => x.stages.length === 1 && x.stages[0] === st.id), x = { race: race ? race.short : st.label, stage: st.id, pass: /second|again/i.test(p.name) ? 'second pass' : '', km: p.gk != null ? p.gk : p.km, first, cut };
      const mine = live && live.filter(r => stageOf(r) === st.id);
      if (mine && mine.length) {
        const started = mine.filter(r => r.status !== 'dns' && (r.reads.length || r.status));
        const through = started.filter(r => r.reads.some(d => d.km >= x.km - 0.5)).length;
        const out = started.filter(r => !r.reads.some(d => d.km >= x.km - 0.5) && ['dnf', 'dsq', 'cut off'].includes(r.status)).length;
        Object.assign(x, { live: true, through, total: started.length - out });
      } else if (F[st.id]) {
        const a = AR[st.id], fit = a && a.passes[p.name], go = mel(pts[0].first);
        if (fit) {
          const n = Math.round(F[st.id] * fit.arrived / a.starters);
          Object.assign(x, { live: false, from2026: true, through: Math.round(n * curve(fit.q, (t - go) / 60000)), total: n });
        } else {
          const n = F[st.id];
          Object.assign(x, { live: false, through: Math.round(n * (cut ? tri(t, first, cut) : t >= first ? 1 : 0)), total: n });
        }
      } else return;
      x.pct = x.total ? x.through / x.total : 0;
      passes.push(x);
    }));
    if (!passes.length) return null;
    const through = passes.reduce((a, x) => a + x.through, 0), total = passes.reduce((a, x) => a + x.total, 0);
    return { post, session: s, passes, through, total, pct: total ? through / total : 0, live: passes.some(x => x.live), estimate: passes.some(x => !x.live) };
  }
  // What a planned amount comes to for the runners still to come, rounded up to a whole unit (or a tenth of a box).
  const need = (plan, pct) => { const v = plan * (1 - pct); return plan < 10 ? Math.ceil(v * 10) / 10 : Math.ceil(v); };
  const pc = p => Math.round(p * 100) + '%';
  window.STThrough = { station, need, pc, clock };
})();
