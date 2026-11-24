// The Aid Station Manager screen: the field app's Station tab (docs/SCOPE.md 4.3). Only the station's manager signs in,
// with the station code Event HQ gives them, and only ever sees their own station.
//
//   My station    the station's sessions today (events/<id>/cover.js) and, for each race passing, the first runner and
//                 a countdown to the cut-off (races.js). Live runner counts come with the tracking feed.
//   Report in     open, every 2 hours, any change, close: stock, staff and crowding (green, amber, red) and a note.
//                 The app reminds the manager when the next 2-hourly report is due.
//   Ask HQ        supplies in a tap (water, ice, food, cups, electrolyte, volunteers), and HQ's answer comes back.
//   Holds         when HQ calls a hold, it shows here at once and the manager confirms the station is holding.
//   Withdrawals   bib and reason: to HQ, timing and the runner's followers (the medical log, js/care.js).
//   Handover      a note for the next shift, and the last shift's note.
// Everything waits on the phone with no signal and sends when there is.
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

  let me = load('me', { code: '', who: '', post: '' }), q = load('q', []), rows = [], busy = false, msg = '', flash = '', flashT = 0;
  const rep = { type: 'status', stock: 'green', staff: 'green', crowd: 'green', note: '' }, ask = { items: [], note: '' }, wd = { bib: '', reason: '' };
  let handover = '';
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
      if (s.length) (await call('/stn/add', { code: me.code, entries: s.slice(0, 20) })).saved.forEach(id => done.add(id));
      if (c.length) (await call('/care/add', { code: me.code, entries: c.slice(0, 20).map(e => Object.assign({}, e, { to: undefined })) })).saved.forEach(id => done.add(id));
      q = q.filter(e => !done.has(e.id)); save('q', q); msg = '';
      await refresh();
    } catch (e) { msg = e.status === 401 ? 'Your station code has changed. Sign in again.' : e.status ? e.message : 'No signal. Kept on this phone and sent when there is.'; if (e.status === 401) { me.post = ''; save('me', me); } }
    busy = false; render();
  }
  async function refresh() {
    if (!me.code || !base()) return;
    try { const r = await call('/stn/list', { code: me.code }); rows = r.rows || []; } catch (e) { }
    render();
  }
  function add(e) { q.push(Object.assign({ id: rid(), t: Date.now(), who: me.who }, e)); save('q', q); render(); flush(); }
  const all = () => { const m = new Map(rows.map(x => [x.id, x])); q.filter(x => x.to !== 'care').forEach(x => m.set(x.id, Object.assign({ post: me.post }, x))); return [...m.values()]; };

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
      <p class="fd-hint">For the Aid Station Manager. Your station code comes from ${esc(ST.hq)}, and this phone then only shows your station: reports, supplies, holds, withdrawals and the handover.</p>
      <form id="stnIn"><label class="fd-label" for="stnWho">Your name</label><input id="stnWho" type="text" maxlength="40" value="${esc(me.who)}" autocomplete="name">
      <label class="fd-label" for="stnCode">Station code</label><input id="stnCode" type="text" maxlength="12" autocapitalize="characters" autocomplete="off">
      <button class="btn primary" type="submit">Sign in</button><p id="stnInMsg" class="fd-hint" role="status"></p></form></section>`;
    $('stnIn').addEventListener('submit', async ev => {
      ev.preventDefault();
      const who = $('stnWho').value.trim(), code = $('stnCode').value.trim().toUpperCase();
      if (!who || !code) { $('stnInMsg').textContent = 'Your name and the station code, please.'; return; }
      $('stnInMsg').textContent = 'Checking…';
      try { const r = await call('/stn/in', { code }); me = { code, who, post: r.post }; save('me', me); render(); refresh(); flush(); }
      catch (e) { $('stnInMsg').textContent = e.status ? e.message : 'No signal. Try again when there is.'; }
    });
  }
  const chips = (f, opts, cur, multi) => `<div class="care-chips" data-f="${f}">${opts.map(([k, l]) => `<button type="button" class="care-chip${(multi ? cur.includes(k) : cur === k) ? ' on' : ''}" data-v="${esc(k)}">${esc(l)}</button>`).join('')}</div>`;
  function render() {
    if (!me.post) return signIn();
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
      <section class="fd-card"><h2>Ask ${esc(ST.hq)}</h2>${chips('items', ITEMS.map(i => [i, i]), ask.items, true)}
        <input id="stnAsk" class="stn-in" maxlength="300" placeholder="How much, or what else" value="${esc(ask.note)}"><button class="btn" id="stnSendAsk" type="button">Send request</button>
        ${reqs.length ? `<ul class="care-list">${reqs.map(r => `<li><b>${esc(r.items.join(', ') || 'Request')}</b>${r.note ? ' ' + esc(r.note) : ''}<small>Sent ${esc(hm(r.t))} · ${r.state === 'done' ? 'done' : r.state === 'onway' ? '<b>on its way</b> (' + esc(hm(r.st_t)) + ')' : 'waiting for ' + esc(ST.hq)}</small></li>`).join('')}</ul>` : ''}</section>
      <section class="fd-card"><h2>Runner pulling out</h2><input id="stnBib" class="stn-in" inputmode="numeric" maxlength="8" placeholder="Bib" value="${esc(wd.bib)}">
        ${chips('reason', ['Injury', 'Unwell', 'Missed cut-off', 'Chose to stop', 'Other'].map(r => [r, r]), wd.reason)}
        <p class="fd-hint">Unwell or injured: the Medical Team sees them first. This tells ${esc(ST.hq)}, timing and the runner's crew straight away.</p><button class="btn" id="stnWd" type="button">Log withdrawal</button></section>
      <section class="fd-card"><h2>Shift handover</h2>${hand ? `<p class="fd-hint">Last handover, ${esc(hm(hand.t))}${hand.who ? ' from ' + esc(hand.who) : ''}:</p><p class="stn-hand">${esc(hand.note)}</p>` : '<p class="fd-hint">No handover yet.</p>'}
        <textarea id="stnHand" class="stn-in" rows="3" maxlength="1000" placeholder="For the next shift: what's running low, who's still due, anything to watch">${esc(handover)}</textarea><button class="btn" id="stnSendHand" type="button">Save handover</button>
        <button type="button" class="btn small" id="stnRef">Refresh</button></section>`;
    bind();
  }
  function bind() {
    $('stnOut').addEventListener('click', () => { if (confirm('Sign out of ' + me.post + ' on this phone?')) { me = { code: '', who: me.who, post: '' }; save('me', me); rows = []; render(); } });
    box.querySelectorAll('.care-chips').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.care-chip'); if (!b) return; const f = g.dataset.f, v = b.dataset.v;
      if (f === 'items') ask.items = ask.items.includes(v) ? ask.items.filter(x => x !== v) : ask.items.concat(v);
      else if (f === 'reason') wd.reason = wd.reason === v ? '' : v;
      else rep[f] = v;
      g.querySelectorAll('.care-chip').forEach(c => c.classList.toggle('on', f === 'items' ? ask.items.includes(c.dataset.v) : (f === 'reason' ? wd.reason : rep[f]) === c.dataset.v));
    }));
    $('stnNote').addEventListener('input', e => { rep.note = e.target.value; });
    $('stnAsk').addEventListener('input', e => { ask.note = e.target.value; });
    $('stnBib').addEventListener('input', e => { wd.bib = e.target.value.replace(/[^0-9A-Za-z]/g, ''); });
    $('stnHand').addEventListener('input', e => { handover = e.target.value; });
    $('stnReport').addEventListener('click', () => {
      add({ kind: 'report', type: rep.type, stock: rep.stock, staff: rep.staff, crowd: rep.crowd, note: rep.note.trim() });
      const t = rep.type; Object.assign(rep, { type: 'status', note: '' }); say(t === 'open' ? 'Reported open.' : t === 'close' ? 'Reported closed.' : 'Report sent.'); render();
    });
    $('stnSendAsk').addEventListener('click', () => {
      if (!ask.items.length && !ask.note.trim()) { say('Tap what you need.'); return; }
      add({ kind: 'request', items: ask.items, note: ask.note.trim() }); Object.assign(ask, { items: [], note: '' }); say('Request sent to ' + ST.hq + '.'); render();
    });
    $('stnWd').addEventListener('click', () => {
      if (!wd.bib) { say('The bib, please.'); return; }
      add({ to: 'care', kind: 'wd', bib: wd.bib, reason: wd.reason, post: me.post }); say('Bib ' + wd.bib + ' withdrawn.'); Object.assign(wd, { bib: '', reason: '' }); render();
    });
    $('stnSendHand').addEventListener('click', () => { if (!handover.trim()) { say('Write the handover first.'); return; } add({ kind: 'handover', note: handover.trim() }); handover = ''; say('Handover saved.'); render(); });
    $('stnRef').addEventListener('click', () => { refresh(); flush(); });
    box.querySelectorAll('button[data-hold]').forEach(b => b.addEventListener('click', () => { add({ kind: 'holdack', hold: b.dataset.hold }); say('Confirmed: holding.'); }));
  }
  render(); refresh(); flush();
  // Holds and answers come in quickly: every 20 seconds while the app is on screen. A new hold buzzes the phone.
  let seenHolds = new Set(holds().map(h => h.hold));
  setInterval(async () => {
    if (document.visibilityState !== 'visible' || !me.post) return;
    await flush(); await refresh();
    holds().forEach(h => { if (!seenHolds.has(h.hold)) { seenHolds.add(h.hold); try { navigator.vibrate && navigator.vibrate([500, 200, 500, 200, 500]); } catch (e) { } } });
  }, 20000);
  addEventListener('online', flush);
})();
