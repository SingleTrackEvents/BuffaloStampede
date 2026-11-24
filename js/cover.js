// Cover warnings (docs/MEDICAL_AND_RISK.md 3.4): the cover each post has, against when runners are there.
//
// From the plan (events/<id>/cover.js) and the races (races.js), for every aid station and finish on every race:
//   - no medical post covers it while runners pass,
//   - its medical post or the aid station opens later than the first runner less the margin,
//   - its medical post or the aid station closes before that race's cut-off there.
// On the day, from who has checked on and off post in the field app's Log tab (care entries 'on' and 'off'):
//   - a medical post that should be open now with nobody checked on.
// The GPT100 review found each of these the hard way: Dunkeld opened after the first finisher, Borough Huts lost its
// medic at 23:00 with runners due to 02:15, and nobody could see either until someone noticed.
(function () {
  const P = window.ST_COVER, R = window.GPT_RACES;
  const mel = s => s ? Date.parse(s + ':00+11:00') : null;
  const tf = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const at = t => tf.format(new Date(t)).replace(',', '');
  const clean = n => String(n || '').replace(/\s*\((second|third) (pass|visit)\)\s*$/i, '').replace(/^(Start|Finish),\s*/i, '').trim();
  const label = st => { const r = (R.races || []).find(x => x.stages.length === 1 && x.stages[0] === st.id); return r ? r.short : st.label || st.id; };

  // Every time runners are due at a post: from the first runner to that race's cut-off there.
  function windows() {
    const out = [];
    Object.values(R.stages || {}).forEach(st => {
      const pts = st.points || [];
      pts.forEach((p, k) => {
        if (p.kind === 'start' || p.kind === 'water') return;
        // A point with no cut-off of its own (Bakers Gully and Dingo Ridge on the 42k): estimated from the cut-offs
        // either side, in proportion to the distance.
        let last = mel(p.cutoff), est = false;
        if (!last) {
          const a = pts.slice(0, k).reverse().find(q => q.cutoff), b = pts.slice(k + 1).find(q => q.cutoff);
          if (!a || !b) return;
          last = mel(a.cutoff) + (mel(b.cutoff) - mel(a.cutoff)) * (p.km - a.km) / ((b.km - a.km) || 1); est = true;
        }
        if (!p.first) return;
        out.push({ post: clean(p.name), race: label(st), kind: p.kind, first: mel(p.first), last, est });
      });
    });
    return out;
  }
  function plan() {
    if (!P || !R) return [];
    const M = (P.medical || []).map(s => Object.assign({}, s, { a: mel(s.from), z: mel(s.to) })), A = (P.aid || []).map(s => Object.assign({}, s, { a: mel(s.from), z: mel(s.to) }));
    const margin = (P.marginMin || 20) * 60000, out = [], noMed = new Map();
    windows().forEach(w => {
      // Medical: the sessions that cover this post and overlap the window (with the margin before the first runner).
      const med = M.filter(s => (s.covers || [s.name]).includes(w.post) && s.z > w.first - margin && s.a < w.last).sort((x, y) => x.a - y.a);
      if (!med.length) { const n = noMed.get(w.post) || []; n.push(w); noMed.set(w.post, n); }
      else {
        if (med[0].a > w.first - margin) out.push({ level: 'amber', post: w.post, text: `${w.post}: medical (${med[0].name}) starts ${at(med[0].a)}, but the first ${w.race} runner is due ${at(w.first)}.` });
        const end = Math.max(...med.map(s => s.z));
        if (end < w.last) out.push({ level: 'red', post: w.post, text: `${w.post}: medical (${med[med.length - 1].name}) finishes ${at(end)}, before the last ${w.race} runners${w.est ? ' (about ' : ' (cut-off '}${at(w.last)}).` });
      }
      // The aid station itself (not the finish, which is the village).
      if (w.kind === 'aid') {
        const aid = A.filter(s => s.name === w.post && s.z > w.first - margin && s.a < w.last).sort((x, y) => x.a - y.a);
        if (!aid.length) out.push({ level: 'red', post: w.post, text: `${w.post}: no aid station session covers the ${w.race}, ${at(w.first)} to ${at(w.last)}.` });
        else {
          if (aid[0].a > w.first - margin) out.push({ level: 'amber', post: w.post, text: `${w.post}: the aid station opens ${at(aid[0].a)}, but the first ${w.race} runner is due ${at(w.first)}.` });
          const end = Math.max(...aid.map(s => s.z));
          if (end < w.last) out.push({ level: 'red', post: w.post, text: `${w.post}: the aid station packs down ${at(end)}, before the last ${w.race} runners${w.est ? ' (about ' : ' (cut-off '}${at(w.last)}).` });
        }
      }
    });
    // One line for each post with no medical cover at all, listing the races and when they're there.
    noMed.forEach((ws, post) => {
      const by = new Map(); ws.forEach(w => { const r = by.get(w.race) || { a: w.first, z: w.last }; r.a = Math.min(r.a, w.first); r.z = Math.max(r.z, w.last); by.set(w.race, r); });
      out.push({ level: 'amber', post, noMedical: true, text: `No medical post at ${post}: ${[...by].map(([r, t]) => `${r} runners ${at(t.a)} to ${at(t.z)}`).join('; ')}.` });
    });
    return out.sort((a, b) => (a.level === 'red' ? 0 : 1) - (b.level === 'red' ? 0 : 1) || a.post.localeCompare(b.post));
  }
  // On the day: the medical posts that should be open now, and who has checked on (the latest on or off for each person).
  function now(entries, t) {
    if (!P) return [];
    t = t || Date.now();
    const last = new Map();
    (entries || []).filter(e => e.kind === 'on' || e.kind === 'off').sort((a, b) => a.t - b.t).forEach(e => last.set((e.who || '') + '|' + (e.role || ''), e));
    const onPost = [...last.values()].filter(e => e.kind === 'on');
    return (P.medical || []).filter(s => mel(s.from) <= t && t < mel(s.to)).map(s => {
      const here = onPost.filter(e => (s.covers || [s.name]).includes(e.post) || e.post === s.name);
      return { name: s.name, crew: s.crew, from: mel(s.from), to: mel(s.to), covers: s.covers, on: here.map(e => ({ who: e.who, since: e.t, post: e.post })), late: !here.length && t - mel(s.from) > 15 * 60000 };
    });
  }
  // The posts people check on at: every post a medical session or aid station names.
  const posts = () => P ? [...new Set([].concat(...(P.medical || []).map(s => s.covers || [s.name]), (P.aid || []).map(s => s.name)))] : [];
  window.STCover = { plan, now, posts, at };
})();
