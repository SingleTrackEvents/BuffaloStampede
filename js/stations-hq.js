// The staff app's Stations tab: every aid station as Event HQ sees it (docs/SCOPE.md 4.6), from the Aid Station
// Managers' Station tab in the field app (js/station.js).
//   Requests   supplies asked for, oldest first, with On its way and Done (the station sees the answer).
//   Holds      call a hold at every station or chosen ones, see each station confirm, and release it.
//   Stations   each station's session now, its last report (stock, staff, crowding and note), and REPORT OVERDUE when
//              an open station hasn't reported for 2 hours or hasn't opened 15 minutes into its session.
//   Stocktake  each station's latest stocktake (Low and Out), and restock runs from the yard and where they're up to.
//   Codes      the code each Aid Station Manager signs in with (one per station, issued here), and the yard's.
// Unlocked with the staff password (the same as Control).
(function () {
  const $ = id => document.getElementById(id), box = $('stnHqBody');
  if (!box || !window.ST || !ST.has('aid')) return;
  const C = window.GPT100_CONFIG || {}, W = C.weather || {}, BASE = (W.refreshUrl || '').replace(/\/$/, ''), P = window.ST_COVER || {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tf = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const hm = t => t ? tf.format(new Date(t)).replace(',', '') : '';
  const mel = s => s ? Date.parse(s + ':00+11:00') : null;
  const pw = () => window.MedPlan && window.MedPlan.pw && window.MedPlan.pw();
  const who = () => { try { return localStorage.getItem('st_rc_name') || ''; } catch (e) { return ''; } };
  const SK = window.ST_STOCK || null, NM = SK ? Object.fromEntries(SK.items.map(i => [i.id, i.name])) : {};
  const STATIONS = [...new Set((P.aid || []).map(s => s.name))];
  // Everywhere that signs in to the Station tab: the stations, any stocked place that isn't an aid station, and the yard.
  const PLACES = [...new Set(STATIONS.concat(SK ? Object.keys(SK.stations) : []))].concat(SK ? ['Yard'] : []);
  const RUNS = { planned: 'Being packed', loaded: 'Loaded', onway: 'On the way', delivered: 'Delivered', received: 'Received' };
  const runState = r => { const s = rows.filter(x => x.kind === 'runstate' && x.run === r.id).sort((a, b) => b.t - a.t)[0]; return s ? s.state : 'planned'; };
  const lastStock = p => rows.filter(x => x.kind === 'stock' && x.post === p).sort((a, b) => b.t - a.t)[0];
  const lowOut = x => { if (!x) return ''; const o = Object.keys(x.levels).filter(k => x.levels[k] === 'out').map(k => NM[k] || k), l = Object.keys(x.levels).filter(k => x.levels[k] === 'low').map(k => NM[k] || k);
    return (o.length ? '<b class="care-hq-bad">Out: ' + esc(o.join(', ')) + '</b> ' : '') + (l.length ? 'Low: ' + esc(l.join(', ')) : '') + (!o.length && !l.length ? 'All good' : ''); };
  const LV = { green: 'Good', amber: 'Getting low', red: 'Need help now' };
  let rows = [], codes = {}, shown = false, timer = null, err = '', holdPick = null, showCodes = false;

  async function api(path, body) {
    const r = await fetch(BASE + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-RC-Password': pw() }, body: JSON.stringify(Object.assign({ who: who() }, body)) } : { headers: { 'X-RC-Password': pw() }, cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
    return j;
  }
  async function load() {
    if (!BASE || !pw()) return render();
    try { const j = await api('/rc/stn'); rows = j.rows || []; codes = j.codes || {}; err = ''; } catch (e) { err = e.message; }
    render();
  }
  // One station now: its session, last report and whether a report is overdue. Shared with the Risk tab.
  function status(post, R, t) {
    t = t || Date.now(); R = R || rows;
    const ses = (P.aid || []).filter(s => s.name === post).map(s => ({ a: mel(s.from), z: mel(s.to) }));
    const now = ses.find(s => s.a <= t && t < s.z), next = ses.find(s => s.a > t);
    const reps = R.filter(x => x.kind === 'report' && x.post === post).sort((a, b) => b.t - a.t), last = reps[0];
    const open = last && last.type !== 'close';
    const overdue = (open && t - last.t > 2 * 3600e3) || (now && !open && t - now.a > 15 * 60000 && (!last || last.t < now.a));
    return { post, now, next, last, open, overdue };
  }
  const activeHolds = () => {
    const H = rows.filter(x => x.kind === 'hold'), rel = new Set(rows.filter(x => x.kind === 'release').map(x => x.hold)), by = new Map();
    H.filter(h => !rel.has(h.hold)).forEach(h => { const g = by.get(h.hold) || { hold: h.hold, text: h.text, t: h.t, who: h.who, posts: h.posts || [h.post] }; by.set(h.hold, g); });
    return [...by.values()].map(g => { const ps = g.posts.includes('*') ? STATIONS : g.posts; return Object.assign(g, { list: ps.map(p => ({ p, ack: rows.find(x => x.kind === 'holdack' && x.hold === g.hold && x.post === p) })) }); });
  };
  function render() {
    if (!shown) return;
    if (!BASE) { box.innerHTML = '<div class="rc-msg"><h2>Stations</h2><p>Needs the SingleTrack Worker (tools/SINGLETRACK_WORKER.md).</p></div>'; return; }
    if (!pw()) { box.innerHTML = `<div class="rc-msg"><h2>Stations</h2><p>Unlock ${esc(ST.hq)} on the Control tab with the staff password first.</p></div>`; return; }
    const reqs = rows.filter(x => x.kind === 'request' && x.state !== 'done').sort((a, b) => a.t - b.t), H = activeHolds(), st = STATIONS.map(p => status(p));
    const hand = p => rows.filter(x => x.kind === 'handover' && x.post === p).sort((a, b) => b.t - a.t)[0];
    box.innerHTML = `<div class="sh">
      <div class="care-hq-head"><h2>Stations</h2><span class="care-hq-err">${esc(err)}</span><button class="btn small" id="shHold" type="button">Call a hold</button><button class="btn small" id="shRef" type="button">Refresh</button></div>
      ${holdPick ? `<div class="sh-holdform"><p><b>Hold runners at:</b></p><label><input type="checkbox" data-hp="*"${holdPick.posts.includes('*') ? ' checked' : ''}> Every station</label> ${STATIONS.map(p => `<label><input type="checkbox" data-hp="${esc(p)}"${holdPick.posts.includes(p) ? ' checked' : ''}> ${esc(p)}</label>`).join(' ')}
        <input id="shHoldText" class="rk-in" maxlength="300" value="${esc(holdPick.text)}"><div class="rk-btns"><button class="btn primary" id="shHoldGo" type="button">Call the hold</button><button class="btn" id="shHoldX" type="button">Cancel</button></div><p class="muted">Only the Event Manager holds or stops the event. Each station's phone buzzes and they confirm they're holding.</p></div>` : ''}
      ${H.map(h => `<div class="sh-hold"><b>HOLD</b> since ${esc(hm(h.t))}${h.who ? ' (' + esc(h.who) + ')' : ''}: ${esc(h.text)}<ul>${h.list.map(x => `<li class="${x.ack ? 'ok' : 'wait'}">${esc(x.p)}: ${x.ack ? 'holding, confirmed ' + esc(hm(x.ack.t)) : 'not confirmed yet'}</li>`).join('')}</ul><button class="btn small" data-rel="${esc(h.hold)}" type="button">Release the hold</button></div>`).join('')}
      <section class="rk-box"><h3>Requests${reqs.length ? ' (' + reqs.length + ')' : ''}</h3>${reqs.length ? `<ul class="rk-list">${reqs.map(r => `<li><b>${esc(r.post)}</b>: ${esc(r.items.join(', ') || 'request')}${r.note ? ' (' + esc(r.note) + ')' : ''}<small>Asked ${esc(hm(r.t))}${r.who ? ' by ' + esc(r.who) : ''}${r.state === 'onway' ? ' · on its way since ' + esc(hm(r.st_t)) : ''}</small>
        ${r.state !== 'onway' ? `<button class="btn small" data-req="${esc(r.id)}" data-s="onway" type="button">On its way</button>` : ''}<button class="btn small" data-req="${esc(r.id)}" data-s="done" type="button">Done</button></li>`).join('')}</ul>` : '<p class="muted">Nothing waiting.</p>'}</section>
      <table class="care-hq-t sh-t"><thead><tr><th>Station</th><th>Session</th><th>Last report</th><th>Stock</th><th>Staff</th><th>Crowding</th>${SK ? '<th>Stocktake</th>' : ''}</tr></thead><tbody>
      ${st.map(s => `<tr class="${s.overdue ? 'late' : ''}"><td><b>${esc(s.post)}</b>${s.overdue ? '<small class="care-hq-bad">Report overdue</small>' : ''}${hand(s.post) ? `<small title="${esc(hand(s.post).note)}">Handover ${esc(hm(hand(s.post).t))}</small>` : ''}</td>
        <td>${s.now ? esc(hm(s.now.a)) + ' to ' + esc(hm(s.now.z)) : s.next ? 'Next ' + esc(hm(s.next.a)) : 'Done'}</td>
        <td>${s.last ? esc(hm(s.last.t)) + (s.last.type === 'open' ? ' (opened)' : s.last.type === 'close' ? ' (closed)' : '') + (s.last.note ? '<small>' + esc(s.last.note) + '</small>' : '') : '<span class="muted">None</span>'}</td>
        ${['stock', 'staff', 'crowd'].map(k => `<td>${s.last ? `<span class="sh-lv ${s.last[k]}">${LV[s.last[k]] || ''}</span>` : ''}</td>`).join('')}${SK ? `<td>${lastStock(s.post) ? esc(hm(lastStock(s.post).t)) + '<small>' + lowOut(lastStock(s.post)) + '</small>' : '<span class="muted">None</span>'}</td>` : ''}</tr>`).join('')}</tbody></table>
      ${SK ? (() => { const R = rows.filter(x => x.kind === 'run').sort((a, b) => b.t - a.t), live = R.filter(r => !['delivered', 'received'].includes(runState(r))), y = rows.filter(x => x.kind === 'stock' && x.post === 'Yard').sort((a, b) => b.t - a.t);
        return `<section class="rk-box"><h3>Restock runs${live.length ? ' (' + live.length + ' out)' : ''}</h3><p class="muted">The yard builds and sends these from the field app's Station tab (Yard sign-in).</p>${R.length ? `<ul class="rk-list">${R.slice(0, 12).map(r => `<li><b>${esc(r.post)}</b>: ${esc(r.items.map(x => (x.qty ? x.qty + ' ' : '') + x.name).join(', '))}<small>${esc(RUNS[runState(r)])}${r.driver ? ' · ' + esc(r.driver) : ''}${r.vehicle ? ' (' + esc(r.vehicle) + ')' : ''}${r.eta ? ' · due ' + esc(hm(r.eta)) : ''} · sent ${esc(hm(r.t))}</small></li>`).join('')}</ul>` : '<p class="muted">No runs yet.</p>'}
          ${y.length ? `<p class="muted">Yard stocktake: ${[...new Set(y.map(x => x.loc))].map(l => { const x = y.find(z => z.loc === l); return '<b>' + esc(l || 'Yard') + '</b> ' + esc(hm(x.t)) + ' ' + lowOut(x); }).join(' · ')}</p>` : ''}</section>`; })() : ''}
      <section class="rk-box"><h3>Station codes</h3><p class="muted">Each Aid Station Manager picks their station on the field app's Station tab and signs in with its code, and sees only that station. Give each manager only theirs. The Yard code is for the yard and logistics team: it sees every station's stock.</p>
        ${showCodes ? `<table class="care-hq-t"><tbody>${PLACES.map(p => `<tr><td>${esc(p)}</td><td><b>${esc(codes[p] || 'not issued')}</b></td></tr>`).join('')}</tbody></table>` : ''}
        <button class="btn small" id="shShow" type="button">${showCodes ? 'Hide codes' : 'Show codes'}</button> <button class="btn small" id="shIssue" type="button">${PLACES.every(p => codes[p]) ? 'All codes issued' : Object.keys(codes).length ? 'Issue codes for new stations' : 'Issue station codes'}</button></section></div>`;
    bind();
  }
  function bind() {
    $('shRef').addEventListener('click', load);
    $('shShow').addEventListener('click', () => { showCodes = !showCodes; render(); });
    $('shIssue').addEventListener('click', async () => {
      const c = Object.assign({}, codes), A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      PLACES.forEach(p => { if (!c[p]) c[p] = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => A[b % A.length]).join(''); });
      try { const j = await api('/rc/stn', { codes: c }); codes = j.codes; showCodes = true; render(); } catch (e) { err = e.message; render(); }
    });
    $('shHold').addEventListener('click', () => { holdPick = holdPick ? null : { posts: ['*'], text: 'Hold runners at your station until ' + ST.hq + ' releases the hold.' }; render(); });
    if (holdPick) {
      box.querySelectorAll('input[data-hp]').forEach(cb => cb.addEventListener('change', () => {
        const v = cb.dataset.hp;
        holdPick.posts = v === '*' ? (cb.checked ? ['*'] : []) : (cb.checked ? holdPick.posts.filter(x => x !== '*').concat(v) : holdPick.posts.filter(x => x !== v));
        render();
      }));
      $('shHoldText').addEventListener('input', e => { holdPick.text = e.target.value; });
      $('shHoldX').addEventListener('click', () => { holdPick = null; render(); });
      $('shHoldGo').addEventListener('click', async () => {
        if (!holdPick.posts.length) return;
        if (!who()) { alert('Put your name in the box at the top of the Control tab first.'); return; }
        try { await api('/rc/stn', { hold: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), posts: holdPick.posts, text: holdPick.text.trim() }); holdPick = null; await load(); } catch (e) { err = e.message; render(); }
      });
    }
    box.querySelectorAll('button[data-rel]').forEach(b => b.addEventListener('click', async () => { if (!confirm('Release the hold? Stations can let runners go.')) return; try { await api('/rc/stn', { release: b.dataset.rel }); await load(); } catch (e) { err = e.message; render(); } }));
    box.querySelectorAll('button[data-req]').forEach(b => b.addEventListener('click', async () => { try { await api('/rc/stn', { request: b.dataset.req, state: b.dataset.s }); await load(); } catch (e) { err = e.message; render(); } }));
  }
  window.StationsHQ = {
    status, stations: () => STATIONS, api,
    onShow() { shown = true; render(); load(); clearInterval(timer); timer = setInterval(() => { if (!holdPick) load(); }, 20000); },
    onHide() { shown = false; clearInterval(timer); },
    onAuth() { if (shown) { render(); load(); } }
  };
})();
