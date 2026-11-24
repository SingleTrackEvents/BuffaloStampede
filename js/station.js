// The Aid Station Manager screen: the field app's Station tab (docs/SCOPE.md 4.3). The manager picks where they are,
// then signs in with that station's code from Event HQ, and only ever sees their own station.
//
//   My station    the station's sessions today (events/<id>/cover.js) and, for each race passing, the first runner and
//                 a countdown to the cut-off (races.js). Live runner counts come with the tracking feed.
//   Report in     open, every 2 hours, any change, close: stock, staff and crowding (green, amber, red) and a note.
//                 The app reminds the manager when the next 2-hourly report is due.
//   Stocktake     every 2 hours: each item on the station's pack list (events/<id>/stock.js) as Plenty, Half, Low or Out,
//                 with a count where it helps. It goes to the yard.
//   Restock runs  what the yard has sent, who's driving and when it's due; the manager marks it received.
//   Ask the yard  supplies in a tap (water, ice, food, cups, electrolyte, volunteers). The yard answers; HQ sees it too.
//   Holds         when HQ calls a hold, it shows here at once and the manager confirms the station is holding.
//   Withdrawals   bib and reason: to HQ, timing and the runner's followers (the medical log, js/care.js).
//   Handover      a note for the next shift, and the last shift's note.
// Everything waits on the phone with no signal and sends when there is.
//
// Yard and logistics sign in the same way (pick Yard, then the yard's code) and get the Yard screen instead: every
// station's latest stocktake (Low and Out first, late stocktakes flagged), requests to answer, the restock triggers,
// restock runs (build one, then loaded, on the way, delivered) and the yard and coolroom stocktake.
(function () {
  const $ = id => document.getElementById(id), box = $('stnBody');
  if (!box || !window.ST || !ST.has('aid')) return;
  const LV = window.GPTLive, R = window.GPT_RACES || { stages: {} }, P = window.ST_COVER || {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const K = 'st.stn.' + ST.event.id + '.';
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(K + k)); return v == null ? d : v; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch (e) { } };
  const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
  const tf = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const hm = t => tf.format(new Date(t)).replace(',', '');
  const mel = s => s ? Date.parse(s + ':00+11:00') : null;
  const dur = ms => { const m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); return h ? h + ' h ' + (m % 60) + ' min' : m + ' min'; };
  const clean = n => String(n || '').replace(/\s*\((second|third) (pass|visit)\)\s*$/i, '').replace(/^(Start|Finish),\s*/i, '').trim();
  const base = () => LV && LV.base ? LV.base() : '';
  const ITEMS = ['Water', 'Ice', 'Food', 'Cups', 'Electrolyte', 'Gas', 'Volunteers', 'First aid kit'];
  const LVLS = [['green', 'Good'], ['amber', 'Getting low'], ['red', 'Need help now']];
  const REPORT_MS = 2 * 3600e3;
  const S = window.ST_STOCK || null, IT = S ? Object.fromEntries(S.items.map(i => [i.id, i])) : {}, STOCK_MS = ((S && S.everyMin) || 120) * 60000;
  const SLV = [['plenty', 'Plenty'], ['half', 'Half'], ['low', 'Low'], ['out', 'Out']];
  const YARD = 'Yard';
  const PLACES = [...new Set((P.aid || []).map(s => s.name).concat(S ? Object.keys(S.stations) : []))];
  const isYard = () => me.post === YARD;
  const list = post => S && S.stations[post] ? Object.keys(S.stations[post]) : [];
  const unitOf = id => IT[id] ? IT[id].unit : '', nameOf = id => IT[id] ? IT[id].name : id;
  const melDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(new Date());

  let me = load('me', { code: '', who: '', post: '' }), q = load('q', []), rows = [], busy = false, msg = '', flash = '', flashT = 0;
  const rep = { type: 'status', stock: 'green', staff: 'green', crowd: 'green', note: '' }, ask = { items: [], note: '' }, wd = { bib: '', reason: '' };
  let handover = '';
  // Stocktake drafts (the station's, and the yard's by location), the run being built, and whether a render is waiting
  // for the manager to finish typing.
  let stk = { levels: {}, counts: {} }, ystk = { loc: S && S.yard ? S.yard[0] : YARD, levels: {}, counts: {} }, run = null, held = false;
  const say = t => { flash = t; flashT = Date.now(); const m = $('stnMsg'); if (m) m.textContent = t; };

  async function call(path, body) {
    const r = await fetch(base() + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || 'HTTP ' + r.status); e.status = r.status; throw e; }
    return j;
  }
  async function flush() {
    if (busy || !q.length || !me.code || !base()) return;
    busy = true;
    try {
      // Station entries and withdrawals (which go to the medical log) are sent each to their own place.
      const s = q.filter(e => e.to !== 'care'), c = q.filter(e => e.to === 'care');
      const done = new Set();
      if (s.length) (await call('/stn/add', { code: me.code, post: me.post, entries: s.slice(0, 20) })).saved.forEach(id => done.add(id));
      if (c.length) (await call('/care/add', { code: me.code, entries: c.slice(0, 20).map(e => Object.assign({}, e, { to: undefined })) })).saved.forEach(id => done.add(id));
      q = q.filter(e => !done.has(e.id)); save('q', q); msg = '';
      await refresh(true);
    } catch (e) { msg = e.status === 401 ? 'Your station code has changed. Sign in again.' : e.status ? e.message : 'No signal. Kept on this phone and sent when there is.'; if (e.status === 401) { me.post = ''; save('me', me); } }
    busy = false; render();
  }
  // Don't redraw under the manager's thumb: while they're typing, the redraw waits until they leave the box.
  const typing = () => { const a = document.activeElement; return a && box.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName); };
  function draw() { if (typing()) { held = true; return; } held = false; render(); }
  box.addEventListener('focusout', () => setTimeout(() => { if (held && !typing()) draw(); }, 400));
  async function refresh(now) {
    if (!me.code || !base()) return;
    try { const r = await call('/stn/list', { code: me.code, post: me.post }); rows = r.rows || []; } catch (e) { }
    now ? render() : draw();
  }
  function add(e) { q.push(Object.assign({ id: rid(), t: Date.now(), who: me.who }, e)); save('q', q); render(); flush(); }
  const all = () => { const m = new Map(rows.map(x => [x.id, x])); q.filter(x => x.to !== 'care').forEach(x => m.set(x.id, Object.assign({ post: x.kind === 'run' ? x.to : me.post }, x))); return [...m.values()]; };
  // A run's state: the latest word on it from the yard or the station.
  const runState = (A, r) => { const s = A.filter(x => x.kind === 'runstate' && x.run === r.id).sort((a, b) => b.t - a.t)[0]; return s ? s.state : 'planned'; };
  const RUNS = { planned: 'Being packed', loaded: 'Loaded', onway: 'On the way', delivered: 'Delivered', received: 'Received' };
  const lastStock = (A, post, loc) => A.filter(x => x.kind === 'stock' && x.post === post && (loc == null || x.loc === loc)).sort((a, b) => b.t - a.t)[0];

  // This station's sessions and the races passing it.
  function sessions() { return (P.aid || []).filter(s => s.name === me.post).map(s => ({ a: mel(s.from), z: mel(s.to) })); }
  function passes() {
    const out = [];
    Object.values(R.stages || {}).forEach(st => (st.points || []).forEach((p, k, pts) => {
      if (clean(p.name) !== me.post || p.kind === 'start') return;
      const r = (R.races || []).find(x => x.stages.length === 1 && x.stages[0] === st.id);
      out.push({ race: r ? r.short : st.label, pass: /second/i.test(p.name) ? 'second pass' : '', first: mel(p.first), cut: mel(p.cutoff), drop: p.drop, crew: p.crew === 'yes', team: p.team, pacer: p.pacer });
    }));
    return out.sort((a, b) => a.first - b.first);
  }
  function holds() {
    const A = all(), now = Date.now();
    return A.filter(x => x.kind === 'hold' && (x.post === '*' || x.post === me.post) && !A.some(y => y.kind === 'release' && y.hold === x.hold) && now - x.t < 24 * 3600e3)
      .map(h => Object.assign({ acked: A.some(y => y.kind === 'holdack' && y.hold === h.hold && y.post === me.post) }, h));
  }

  function signIn() {
    box.innerHTML = `<section class="fd-card"><h2>Aid station</h2>
      <p class="fd-hint">For Aid Station Managers and the yard team. Pick where you are, then put in that place's code from ${esc(ST.hq)}. This phone then only shows your station: reports, stocktakes, supplies, holds, withdrawals and the handover.</p>
      <form id="stnIn"><label class="fd-label" for="stnWhere">Where are you?</label><select id="stnWhere" class="stn-in"><option value="">Choose your station</option>${PLACES.map(p => `<option${me.last === p ? ' selected' : ''}>${esc(p)}</option>`).join('')}${S ? `<option value="${YARD}"${me.last === YARD ? ' selected' : ''}>Yard and logistics</option>` : ''}</select>
      <label class="fd-label" for="stnWho">Your name</label><input id="stnWho" type="text" maxlength="40" value="${esc(me.who)}" autocomplete="name">
      <label class="fd-label" for="stnCode">Code for that place</label><input id="stnCode" type="text" maxlength="12" autocapitalize="characters" autocomplete="off">
      <button class="btn primary" type="submit">Sign in</button><p id="stnInMsg" class="fd-hint" role="status"></p></form></section>`;
    $('stnIn').addEventListener('submit', async ev => {
      ev.preventDefault();
      const where = $('stnWhere').value, who = $('stnWho').value.trim(), code = $('stnCode').value.trim().toUpperCase();
      if (!where) { $('stnInMsg').textContent = 'Choose where you are first.'; return; }
      if (!who || !code) { $('stnInMsg').textContent = 'Your name and the code, please.'; return; }
      $('stnInMsg').textContent = 'Checking…';
      try { const r = await call('/stn/in', { code, post: where }); me = { code, who, post: r.post, last: r.post }; save('me', me); stk = { levels: {}, counts: {} }; render(); refresh(); flush(); }
      catch (e) { $('stnInMsg').textContent = e.status ? e.message : 'No signal. Try again when there is.'; }
    });
  }
  const chips = (f, opts, cur, multi) => `<div class="care-chips" data-f="${f}">${opts.map(([k, l]) => `<button type="button" class="care-chip${(multi ? cur.includes(k) : cur === k) ? ' on' : ''}" data-v="${esc(k)}">${esc(l)}</button>`).join('')}</div>`;
  // A stocktake list: each item with Plenty, Half, Low, Out and an optional count. plan: the planned amount to show.
  const stockRows = (ids, d, plan, prev) => `<div class="stk">${ids.map(id => `<div class="stk-row" data-id="${esc(id)}"><div class="stk-name"><b>${esc(nameOf(id))}</b><small>${esc(unitOf(id))}${plan && plan[id] ? ' · planned ' + esc(plan[id]) : ''}${prev && prev.levels[id] ? ' · last ' + esc(prev.levels[id]) : ''}</small></div>
      <div class="care-chips stk-lv" data-stk="${esc(id)}">${SLV.map(([k, l]) => `<button type="button" class="care-chip lv-${k}${d.levels[id] === k ? ' on' : ''}" data-v="${k}">${l}</button>`).join('')}</div>
      <input class="stk-n" data-n="${esc(id)}" inputmode="decimal" maxlength="7" placeholder="Count" value="${esc(d.counts[id] == null ? '' : d.counts[id])}"></div>`).join('')}</div>`;
  const stockSummary = x => { if (!x) return ''; const o = Object.keys(x.levels).filter(k => x.levels[k] === 'out'), l = Object.keys(x.levels).filter(k => x.levels[k] === 'low');
    return (o.length ? '<b class="stk-out">Out: ' + esc(o.map(nameOf).join(', ')) + '</b> ' : '') + (l.length ? '<span class="stk-low">Low: ' + esc(l.map(k => nameOf(k) + (x.counts[k] != null ? ' (' + x.counts[k] + ')' : '')).join(', ')) + '</span>' : '') + (!o.length && !l.length ? 'All good' : ''); };
  const sendStock = (d, extra) => {
    const levels = Object.assign({}, d.levels), counts = {};
    Object.keys(d.counts).forEach(k => { const n = parseFloat(d.counts[k]); if (isFinite(n) && n >= 0) { counts[k] = n; if (!levels[k]) levels[k] = n ? 'half' : 'out'; } });
    if (!Object.keys(levels).length) { say('Tap a level for at least one item.'); return false; }
    add(Object.assign({ kind: 'stock', levels, counts, names: Object.fromEntries(Object.keys(levels).map(k => [k, nameOf(k)])) }, extra));
    return true;
  };
  const runLine = (A, r) => { const st = runState(A, r); return `<b>${esc(r.items.map(x => (x.qty ? x.qty + ' ' : '') + x.name).join(', '))}</b><small>${esc(RUNS[st])}${r.driver ? ' · ' + esc(r.driver) : ''}${r.vehicle ? ' (' + esc(r.vehicle) + ')' : ''}${r.eta ? ' · due ' + esc(hm(r.eta)) : ''} · sent ${esc(hm(r.t))}${r.note ? ' · ' + esc(r.note) : ''}</small>`; };

  function render() {
    if (!me.post) return signIn();
    if (isYard()) return renderYard();
    const now = Date.now(), A = all(), H = holds(), ss = sessions(), ps = passes();
    const reports = A.filter(x => x.kind === 'report' && x.post === me.post).sort((a, b) => b.t - a.t), last = reports[0];
    const openNow = ss.find(s => s.a <= now && now < s.z), next = ss.find(s => s.a > now);
    const isOpen = last && last.type !== 'close';
    const due = isOpen ? last.t + REPORT_MS : null;
    const reqs = A.filter(x => x.kind === 'request' && x.post === me.post).sort((a, b) => b.t - a.t).slice(0, 8);
    const hand = A.filter(x => x.kind === 'handover' && x.post === me.post).sort((a, b) => b.t - a.t)[0];
    const unsent = q.length || msg ? `<p class="care-unsent">${q.length ? q.length + ' waiting to send. ' : ''}${esc(msg)}</p>` : '';
    box.innerHTML = `${H.map(h => `<section class="fd-card stn-hold${h.acked ? ' acked' : ''}"><h2>Hold</h2><p>${esc(h.text)}</p><p class="fd-hint">Called ${esc(hm(h.t))}${h.who ? ' by ' + esc(h.who) : ''}.</p>
        ${h.acked ? '<p><b>You confirmed you\'re holding.</b> Keep runners here until ' + esc(ST.hq) + ' releases the hold.</p>' : `<button class="btn primary" data-hold="${esc(h.hold)}" type="button">We're holding runners</button>`}</section>`).join('')}
      <section class="fd-card"><h2>${esc(me.post)}</h2><p class="fd-hint">${esc(me.who)} · <button type="button" class="linkbtn" id="stnOut">Sign out</button></p>${unsent}
        <p>${openNow ? `Session now: <b>${esc(hm(openNow.a))} to ${esc(hm(openNow.z))}</b>.` : next ? `Next session: <b>${esc(hm(next.a))} to ${esc(hm(next.z))}</b> (in ${dur(next.a - now)}).` : 'No more sessions in the plan.'}
          ${isOpen ? ` Last report ${esc(hm(last.t))}. ${now > due ? '<b class="stn-late">Report due now.</b>' : 'Next report due ' + esc(hm(due)) + '.'}` : ' Not reported open yet.'}</p>
        ${ps.length ? `<table class="stn-t"><thead><tr><th>Race</th><th>First runner</th><th>Cut-off</th></tr></thead><tbody>${ps.map(p => `<tr class="${p.cut && now > p.cut ? 'past' : ''}"><td>${esc(p.race)}${p.pass ? ' (' + esc(p.pass) + ')' : ''}${p.drop ? '<small>Drop bags</small>' : ''}${p.team ? '<small>Relay change</small>' : ''}${p.pacer ? '<small>Pacers</small>' : ''}</td><td>${esc(hm(p.first))}</td><td>${p.cut ? esc(hm(p.cut)) + (now < p.cut && p.cut - now < 6 * 3600e3 ? '<small>in ' + dur(p.cut - now) + '</small>' : '') : 'None'}</td></tr>`).join('')}</tbody></table>
          <p class="fd-hint">First runners are the race sheet's prediction. Live counts of who's due come with the tracking feed.</p>` : ''}</section>
      <section class="fd-card"><h2>Report in</h2><p class="fd-hint">When you open, every 2 hours, whenever something changes, and when you close.</p>
        ${chips('type', [['open', 'Open'], ['status', 'Update'], ['close', 'Closed']], rep.type)}
        <p class="fd-label">Stock</p>${chips('stock', LVLS, rep.stock)}<p class="fd-label">Staff</p>${chips('staff', LVLS, rep.staff)}<p class="fd-label">Crowding</p>${chips('crowd', LVLS, rep.crowd)}
        <input id="stnNote" class="stn-in" maxlength="300" placeholder="Anything else (optional)" value="${esc(rep.note)}">
        <button class="btn primary care-save" id="stnReport" type="button">Send report</button><p id="stnMsg" class="fd-hint care-msg" role="status">${now - flashT < 8000 ? esc(flash) : ''}</p></section>
      ${stockCard(A, now)}
      <section class="fd-card"><h2>Ask the yard</h2><p class="fd-hint">The yard answers; ${esc(ST.hq)} sees it too.</p>${chips('items', ITEMS.map(i => [i, i]), ask.items, true)}
        <input id="stnAsk" class="stn-in" maxlength="300" placeholder="How much, or what else" value="${esc(ask.note)}"><button class="btn" id="stnSendAsk" type="button">Send request</button>
        ${reqs.length ? `<ul class="care-list">${reqs.map(r => `<li><b>${esc(r.items.join(', ') || 'Request')}</b>${r.note ? ' ' + esc(r.note) : ''}<small>Sent ${esc(hm(r.t))} · ${r.state === 'done' ? 'done' : r.state === 'onway' ? '<b>on its way</b> (' + esc(hm(r.st_t)) + ')' : 'waiting for the yard'}</small></li>`).join('')}</ul>` : ''}</section>
      <section class="fd-card"><h2>Runner pulling out</h2><input id="stnBib" class="stn-in" inputmode="numeric" maxlength="8" placeholder="Bib" value="${esc(wd.bib)}">
        ${chips('reason', ['Injury', 'Unwell', 'Missed cut-off', 'Chose to stop', 'Other'].map(r => [r, r]), wd.reason)}
        <p class="fd-hint">Unwell or injured: the Medical Team sees them first. This tells ${esc(ST.hq)}, timing and the runner's crew straight away.</p><button class="btn" id="stnWd" type="button">Log withdrawal</button></section>
      <section class="fd-card"><h2>Shift handover</h2>${hand ? `<p class="fd-hint">Last handover, ${esc(hm(hand.t))}${hand.who ? ' from ' + esc(hand.who) : ''}:</p><p class="stn-hand">${esc(hand.note)}</p>` : '<p class="fd-hint">No handover yet.</p>'}
        <textarea id="stnHand" class="stn-in" rows="3" maxlength="1000" placeholder="For the next shift: what's running low, who's still due, anything to watch">${esc(handover)}</textarea><button class="btn" id="stnSendHand" type="button">Save handover</button>
        <button type="button" class="btn small" id="stnRef">Refresh</button></section>`;
    bind();
  }
  function stockCard(A, now) {
    const ids = list(me.post), prev = lastStock(A, me.post), due = prev ? prev.t + STOCK_MS : null;
    const runs = A.filter(x => x.kind === 'run' && x.post === me.post).sort((a, b) => b.t - a.t);
    const inbound = runs.filter(r => runState(A, r) !== 'received'), got = runs.filter(r => runState(A, r) === 'received').slice(0, 3);
    return `${inbound.length || got.length ? `<section class="fd-card"><h2>Restock runs</h2><ul class="care-list">${inbound.map(r => `<li>${runLine(A, r)}<button class="btn small" data-got="${esc(r.id)}" type="button">Received</button></li>`).join('')}${got.map(r => `<li class="past">${runLine(A, r)}</li>`).join('')}</ul></section>` : ''}
      ${ids.length ? `<section class="fd-card"><h2>Stocktake</h2><p class="fd-hint">Every ${Math.round(STOCK_MS / 60000 / 60 * 10) / 10} hours to the yard. A quick level for each item; a count only where it helps.
        ${prev ? 'Last ' + esc(hm(prev.t)) + '. ' + (now > due ? '<b class="stn-late">Stocktake due now.</b>' : 'Next due ' + esc(hm(due)) + '.') : '<b>No stocktake yet.</b>'}</p>
        ${prev ? `<p class="stk-sum">${stockSummary(prev)}</p>` : ''}
        <details${!prev || now > due ? ' open' : ''}><summary>Do the stocktake</summary>${stockRows(ids, stk, S.stations[me.post], prev)}<button class="btn primary care-save" id="stkSend" type="button">Send stocktake</button></details></section>` : ''}`;
  }

  // ---------- the yard ----------
  const runForm = A => {
    const dests = PLACES.filter(p => list(p).length || (P.aid || []).some(s => s.name === p));
    return `<section class="fd-card" id="runCard"><h2>${run ? 'Build a run' : 'Restock run'}</h2>${run ? `
      <label class="fd-label" for="runTo">To</label><select id="runTo" class="stn-in"><option value="">Choose a station</option>${dests.map(p => `<option${run.to === p ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select>
      <p class="fd-hint">${run.why ? esc(run.why) + ' ' : ''}A quantity against each item going. The station's planned amount is in brackets.</p>
      <div class="stk">${S.items.map(i => `<div class="stk-row run-row"><div class="stk-name"><b>${esc(i.name)}</b><small>${esc(i.unit)}${run.to && S.stations[run.to] && S.stations[run.to][i.id] ? ' (' + S.stations[run.to][i.id] + ')' : ''}${run.flag[i.id] ? ' · <b class="stk-' + run.flag[i.id] + '">' + run.flag[i.id] + '</b>' : ''}</small></div><input class="stk-n" data-q="${esc(i.id)}" inputmode="decimal" maxlength="7" placeholder="Qty" value="${esc(run.qty[i.id] || '')}"></div>`).join('')}</div>
      <input id="runDriver" class="stn-in" maxlength="40" placeholder="Driver" value="${esc(run.driver)}"><input id="runVeh" class="stn-in" maxlength="40" placeholder="Vehicle" value="${esc(run.vehicle)}">
      <label class="fd-label" for="runEta">Due at the station</label><input id="runEta" type="time" class="stn-in" value="${esc(run.eta)}">
      <input id="runNote" class="stn-in" maxlength="300" placeholder="Note (optional)" value="${esc(run.note)}">
      <div class="rk-btns"><button class="btn primary" id="runSend" type="button">Send the run</button><button class="btn" id="runX" type="button">Cancel</button></div>` : '<button class="btn primary" data-build="" type="button">Build a run</button>'}</section>`;
  };
  function startRun(to, why, flag, qty, trigger) { run = { to: to || '', why: why || '', flag: flag || {}, qty: qty || {}, driver: '', vehicle: '', eta: '', note: '', trigger: trigger || '' }; render(); const c = $('runCard'); if (c && c.scrollIntoView) c.scrollIntoView(); }
  function renderYard() {
    const now = Date.now(), A = all(), trig = (S && S.triggers) || [];
    const reqs = A.filter(x => x.kind === 'request' && x.state !== 'done').sort((a, b) => a.t - b.t);
    const runs = A.filter(x => x.kind === 'run').sort((a, b) => b.t - a.t), live = runs.filter(r => !['delivered', 'received'].includes(runState(A, r))), done = runs.filter(r => ['delivered', 'received'].includes(runState(A, r))).slice(0, 6);
    const stns = PLACES.filter(p => list(p).length).map(p => {
      const x = lastStock(A, p), rep = A.filter(y => y.kind === 'report' && y.post === p).sort((a, b) => b.t - a.t)[0], open = rep && rep.type !== 'close';
      const bad = x ? Object.keys(x.levels).filter(k => ['low', 'out'].includes(x.levels[k])).length + Object.keys(x.levels).filter(k => x.levels[k] === 'out').length * 10 : 0;
      return { p, x, open, late: open && (!x || now - x.t > STOCK_MS + 15 * 60000), bad };
    }).sort((a, b) => (b.late - a.late) || (b.bad - a.bad));
    const unsent = q.length || msg ? `<p class="care-unsent">${q.length ? q.length + ' waiting to send. ' : ''}${esc(msg)}</p>` : '';
    const ylocs = (S && S.yard) || [YARD], yprev = lastStock(A, YARD, ystk.loc);
    const hand = A.filter(x => x.kind === 'handover' && x.post === YARD).sort((a, b) => b.t - a.t)[0];
    box.innerHTML = `<section class="fd-card"><h2>Yard and logistics</h2><p class="fd-hint">${esc(me.who)} · <button type="button" class="linkbtn" id="stnOut">Sign out</button></p>${unsent}<p id="stnMsg" class="fd-hint care-msg" role="status">${now - flashT < 8000 ? esc(flash) : ''}</p></section>
      <section class="fd-card"><h2>Requests${reqs.length ? ' (' + reqs.length + ')' : ''}</h2>${reqs.length ? `<ul class="care-list">${reqs.map(r => `<li><b>${esc(r.post)}</b>: ${esc(r.items.join(', ') || 'request')}${r.note ? ' (' + esc(r.note) + ')' : ''}<small>Asked ${esc(hm(r.t))}${r.who ? ' by ' + esc(r.who) : ''}${r.state === 'onway' ? ' · on its way since ' + esc(hm(r.st_t)) : ''}</small>
        ${r.state !== 'onway' ? `<button class="btn small" data-req="${esc(r.id)}" data-s="onway" type="button">On its way</button>` : ''}<button class="btn small" data-req="${esc(r.id)}" data-s="done" type="button">Done</button></li>`).join('')}</ul>` : '<p class="fd-hint">Nothing waiting.</p>'}</section>
      <section class="fd-card"><h2>Stock at the stations</h2><p class="fd-hint">Each station's latest stocktake. Stations stocktake every ${Math.round(STOCK_MS / 60000)} minutes while open.</p>
        <ul class="care-list">${stns.map(s => `<li class="${s.late ? 'stk-late' : ''}"><b>${esc(s.p)}</b>${s.late ? ' <b class="stn-late">Stocktake overdue</b>' : ''}<small>${s.x ? esc(hm(s.x.t)) + (s.x.who ? ' by ' + esc(s.x.who) : '') : 'No stocktake yet'}${s.open ? ' · open' : ''}</small>${s.x ? `<p class="stk-sum">${stockSummary(s.x)}</p>` : ''}
          <button class="btn small" data-build="${esc(s.p)}" type="button">Build a run</button></li>`).join('')}</ul></section>
      ${trig.length ? `<section class="fd-card"><h2>Restock triggers</h2><ul class="care-list">${trig.map(t => { const d = A.find(x => x.kind === 'trigger' && x.trigger === t.id), est = mel(t.est);
        return `<li class="${d ? 'past' : ''}"><b>${esc(t.name)}</b>: ${esc(t.when)}<small>Estimated ${esc(hm(est))}${!d && est > now ? ' (in ' + dur(est - now) + ')' : ''} · to ${esc(t.to.join(', '))}${t.note ? ' · ' + esc(t.note) : ''}${d ? ' · done ' + esc(hm(d.t)) : ''}</small>
          ${d ? '' : t.to.map(p => `<button class="btn small" data-build="${esc(p)}" data-trig="${esc(t.id)}" type="button">Run to ${esc(p)}</button>`).join('') + `<button class="btn small" data-tdone="${esc(t.id)}" type="button">Done</button>`}</li>`; }).join('')}</ul></section>` : ''}
      ${runForm(A)}
      <section class="fd-card"><h2>Runs out</h2>${live.length ? `<ul class="care-list">${live.map(r => { const st = runState(A, r); return `<li><b>${esc(r.post)}</b> ${runLine(A, r)}
          ${st === 'planned' ? `<button class="btn small" data-run="${esc(r.id)}" data-s="loaded" type="button">Loaded</button>` : ''}${st !== 'onway' ? `<button class="btn small" data-run="${esc(r.id)}" data-s="onway" type="button">On the way</button>` : ''}<button class="btn small" data-run="${esc(r.id)}" data-s="delivered" type="button">Delivered</button></li>`; }).join('')}</ul>` : '<p class="fd-hint">No runs out.</p>'}
        ${done.length ? `<p class="fd-label">Recent</p><ul class="care-list">${done.map(r => `<li class="past"><b>${esc(r.post)}</b> ${runLine(A, r)}</li>`).join('')}</ul>` : ''}</section>
      <section class="fd-card"><h2>Yard and coolroom stocktake</h2><label class="fd-label" for="ystkLoc">Where</label><select id="ystkLoc" class="stn-in">${ylocs.map(l => `<option${ystk.loc === l ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
        <p class="fd-hint">${ylocs.map(l => { const x = lastStock(A, YARD, l); return esc(l) + ': ' + (x ? esc(hm(x.t)) : 'not yet'); }).join(' · ')}</p>
        ${yprev ? `<p class="stk-sum">${stockSummary(yprev)}</p>` : ''}
        <details><summary>Do the stocktake</summary>${stockRows(S.items.map(i => i.id), ystk, null, yprev)}<button class="btn primary care-save" id="ystkSend" type="button">Send stocktake</button></details></section>
      <section class="fd-card"><h2>Shift handover</h2>${hand ? `<p class="fd-hint">Last handover, ${esc(hm(hand.t))}${hand.who ? ' from ' + esc(hand.who) : ''}:</p><p class="stn-hand">${esc(hand.note)}</p>` : '<p class="fd-hint">No handover yet.</p>'}
        <textarea id="stnHand" class="stn-in" rows="3" maxlength="1000" placeholder="For the next shift: runs out, what's short, what's due">${esc(handover)}</textarea><button class="btn" id="stnSendHand" type="button">Save handover</button>
        <button type="button" class="btn small" id="stnRef">Refresh</button></section>`;
    bindYard(A);
  }
  function bindStock(d) {
    box.querySelectorAll('.care-chips[data-stk]').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.care-chip'); if (!b) return; const id = g.dataset.stk;
      d.levels[id] = d.levels[id] === b.dataset.v ? undefined : b.dataset.v; if (!d.levels[id]) delete d.levels[id];
      g.querySelectorAll('.care-chip').forEach(c => c.classList.toggle('on', d.levels[id] === c.dataset.v));
    }));
    box.querySelectorAll('input[data-n]').forEach(i => i.addEventListener('input', () => { const v = i.value.replace(/[^0-9.]/g, ''); if (v === '') delete d.counts[i.dataset.n]; else d.counts[i.dataset.n] = v; }));
  }
  function bindCommon() {
    $('stnOut').addEventListener('click', () => { if (confirm('Sign out of ' + (isYard() ? 'the yard' : me.post) + ' on this phone?')) { me = { code: '', who: me.who, post: '', last: me.post }; save('me', me); rows = []; run = null; render(); } });
    $('stnHand').addEventListener('input', e => { handover = e.target.value; });
    $('stnSendHand').addEventListener('click', () => { if (!handover.trim()) { say('Write the handover first.'); return; } add({ kind: 'handover', note: handover.trim() }); handover = ''; say('Handover saved.'); render(); });
    $('stnRef').addEventListener('click', () => { refresh(true); flush(); });
  }
  function bindYard(A) {
    bindCommon(); bindStock(ystk);
    $('ystkLoc').addEventListener('change', e => { ystk = { loc: e.target.value, levels: {}, counts: {} }; render(); });
    $('ystkSend').addEventListener('click', () => { if (sendStock(ystk, { loc: ystk.loc })) { say('Stocktake saved: ' + ystk.loc + '.'); ystk = { loc: ystk.loc, levels: {}, counts: {} }; render(); } });
    box.querySelectorAll('button[data-req]').forEach(b => b.addEventListener('click', () => { add({ kind: 'reqstate', request: b.dataset.req, state: b.dataset.s }); const r = rows.find(x => x.id === b.dataset.req); if (r) Object.assign(r, { state: b.dataset.s, st_t: Date.now() }); say(b.dataset.s === 'done' ? 'Request done.' : 'Station told it\'s on its way.'); render(); }));
    box.querySelectorAll('button[data-tdone]').forEach(b => b.addEventListener('click', () => { const t = S.triggers.find(x => x.id === b.dataset.tdone); add({ kind: 'trigger', trigger: t.id, name: t.name }); say(t.name + ': done.'); }));
    box.querySelectorAll('button[data-run]').forEach(b => b.addEventListener('click', () => { add({ kind: 'runstate', run: b.dataset.run, state: b.dataset.s }); say('Run ' + RUNS[b.dataset.s].toLowerCase() + '.'); }));
    box.querySelectorAll('button[data-build]').forEach(b => b.addEventListener('click', () => {
      const to = b.dataset.build, trig = b.dataset.trig ? S.triggers.find(x => x.id === b.dataset.trig) : null, x = to ? lastStock(A, to) : null, flag = {}, qty = {};
      // From a stocktake: Low and Out items, topped up to the station's planned amount. From a trigger: the station's plan.
      if (trig && S.stations[to]) Object.assign(qty, S.stations[to]);
      if (x) Object.keys(x.levels).forEach(k => { if (['low', 'out'].includes(x.levels[k])) { flag[k] = x.levels[k]; const plan = S.stations[to] && S.stations[to][k]; if (!trig) qty[k] = plan ? Math.max(0, Math.round((plan - (x.counts[k] || 0)) * 10) / 10) || plan : ''; } });
      startRun(to, trig ? trig.name + ': ' + trig.when + '. Filled with the station\'s planned amounts; trim to what\'s needed.' : x ? 'From ' + to + '\'s stocktake at ' + hm(x.t) + ': Low and Out items, topped up to the planned amount.' : '', flag, qty, trig ? trig.id : '');
    }));
    if (run) {
      $('runTo').addEventListener('change', e => { run.to = e.target.value; render(); });
      box.querySelectorAll('input[data-q]').forEach(i => i.addEventListener('input', () => { const v = i.value.replace(/[^0-9.]/g, ''); if (v) run.qty[i.dataset.q] = v; else delete run.qty[i.dataset.q]; }));
      [['runDriver', 'driver'], ['runVeh', 'vehicle'], ['runEta', 'eta'], ['runNote', 'note']].forEach(([id, k]) => $(id).addEventListener('input', e => { run[k] = e.target.value; }));
      $('runX').addEventListener('click', () => { run = null; render(); });
      $('runSend').addEventListener('click', () => {
        const items = Object.keys(run.qty).map(id => ({ id, name: nameOf(id), unit: unitOf(id), qty: parseFloat(run.qty[id]) })).filter(x => x.qty > 0);
        if (!run.to) { say('Choose the station.'); return; }
        if (!items.length) { say('Put a quantity against what\'s going.'); return; }
        let eta = run.eta ? mel(melDay() + 'T' + run.eta) : null; if (eta && eta < Date.now() - 6 * 3600e3) eta += 24 * 3600e3;
        add({ kind: 'run', to: run.to, items, driver: run.driver.trim(), vehicle: run.vehicle.trim(), eta, note: run.note.trim(), trigger: run.trigger });
        say('Run to ' + run.to + ' sent. The station sees it.'); run = null; render();
      });
    }
  }

  function bind() {
    bindCommon(); if (S) bindStock(stk);
    if ($('stkSend')) $('stkSend').addEventListener('click', () => { if (sendStock(stk, {})) { say('Stocktake sent to the yard.'); stk = { levels: {}, counts: {} }; render(); } });
    box.querySelectorAll('button[data-got]').forEach(b => b.addEventListener('click', () => { add({ kind: 'runstate', run: b.dataset.got, state: 'received' }); say('Marked received.'); }));
    box.querySelectorAll('.care-chips:not([data-stk])').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.care-chip'); if (!b) return; const f = g.dataset.f, v = b.dataset.v;
      if (f === 'items') ask.items = ask.items.includes(v) ? ask.items.filter(x => x !== v) : ask.items.concat(v);
      else if (f === 'reason') wd.reason = wd.reason === v ? '' : v;
      else rep[f] = v;
      g.querySelectorAll('.care-chip').forEach(c => c.classList.toggle('on', f === 'items' ? ask.items.includes(c.dataset.v) : (f === 'reason' ? wd.reason : rep[f]) === c.dataset.v));
    }));
    $('stnNote').addEventListener('input', e => { rep.note = e.target.value; });
    $('stnAsk').addEventListener('input', e => { ask.note = e.target.value; });
    $('stnBib').addEventListener('input', e => { wd.bib = e.target.value.replace(/[^0-9A-Za-z]/g, ''); });
    $('stnReport').addEventListener('click', () => {
      add({ kind: 'report', type: rep.type, stock: rep.stock, staff: rep.staff, crowd: rep.crowd, note: rep.note.trim() });
      const t = rep.type; Object.assign(rep, { type: 'status', note: '' }); say(t === 'open' ? 'Reported open.' : t === 'close' ? 'Reported closed.' : 'Report sent.'); render();
    });
    $('stnSendAsk').addEventListener('click', () => {
      if (!ask.items.length && !ask.note.trim()) { say('Tap what you need.'); return; }
      add({ kind: 'request', items: ask.items, note: ask.note.trim() }); Object.assign(ask, { items: [], note: '' }); say('Request sent to the yard.'); render();
    });
    $('stnWd').addEventListener('click', () => {
      if (!wd.bib) { say('The bib, please.'); return; }
      add({ to: 'care', kind: 'wd', bib: wd.bib, reason: wd.reason, post: me.post }); say('Bib ' + wd.bib + ' withdrawn.'); Object.assign(wd, { bib: '', reason: '' }); render();
    });
    box.querySelectorAll('button[data-hold]').forEach(b => b.addEventListener('click', () => { add({ kind: 'holdack', hold: b.dataset.hold }); say('Confirmed: holding.'); }));
  }
  render(); refresh(); flush();
  // Holds and answers come in quickly: every 20 seconds while the app is on screen. A new hold buzzes the phone.
  let seenHolds = new Set(holds().map(h => h.hold)), seenDue = null;
  setInterval(async () => {
    if (document.visibilityState !== 'visible' || !me.post) return;
    // A stocktake coming due buzzes the station's phone once.
    if (!isYard() && list(me.post).length) { const p = lastStock(all(), me.post); if (p && Date.now() > p.t + STOCK_MS && seenDue !== p.id) { seenDue = p.id; try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) { } } }
    await flush(); await refresh();
    holds().forEach(h => { if (!seenHolds.has(h.hold)) { seenHolds.add(h.hold); try { navigator.vibrate && navigator.vibrate([500, 200, 500, 200, 500]); } catch (e) { } } });
  }, 20000);
  addEventListener('online', flush);
})();
