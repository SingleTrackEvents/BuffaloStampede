// The staff app's Risk tab, rebuilt (docs/MEDICAL_AND_RISK.md, section 4): not a long form for meetings, but a board that
// is always current, with the event's own pre-agreed responses ready to act on.
//
//   Conditions  one line for each condition in the event's Risk Management Plan (events/<id>/conditions.js), green,
//               amber or red: the weather watch's triggers, and what the app already knows from the medical log, cover,
//               transport, incidents and runners of concern.
//   Decide      on any line: the response (PROCEED, MODIFY, HOLD, SUSPEND, CANCEL), a few words, the actions with who
//               and by when, and the notice to the phones, drafted. One tap records it, with the conditions at the time.
//   Checks      the review points (race eve, each race morning, shift change, every 6 hours): a short checklist, the
//               board's lines filled in, signed off in one tap.
// Decisions and checks are kept in the Worker's assessment table (/rc/ra) and in HQ's log; signed ones are locked except
// for ticking actions off. Unlocked with the staff password (the same as Control).
(function () {
  const $ = id => document.getElementById(id), box = $('riskBody');
  const D = window.ST_CONDITIONS;
  if (!box || !window.ST || !ST.has('risk') || !D) return;
  const C = window.GPT100_CONFIG || {}, W = C.weather || {}, BASE = (W.refreshUrl || '').replace(/\/$/, ''), DATA = (W.dataUrl || '').replace(/\/?$/, '/');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tf = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const hm = t => t ? tf.format(new Date(t)).replace(',', '') : '';
  const pw = () => window.MedPlan && window.MedPlan.pw && window.MedPlan.pw();
  const who = () => { try { return localStorage.getItem('st_rc_name') || ''; } catch (e) { return ''; } };
  const rid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  let wx = null, care = [], state = null, recs = [], shown = false, timer = null, err = '', deciding = null, checking = null, draft = {};

  async function api(path, body) {
    const r = await fetch(BASE + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-RC-Password': pw() }, body: JSON.stringify(body) } : { headers: { 'X-RC-Password': pw() }, cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
    return j;
  }
  async function load() {
    const jobs = [];
    if (DATA && DATA !== '/') jobs.push(fetch(DATA + 'latest.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => { wx = j; }).catch(() => { }));
    if (BASE && pw()) {
      jobs.push(api('/rc/care').then(j => { care = j.care || []; }).catch(e => { err = e.message; }));
      jobs.push(api('/rc/state?since=' + Date.now()).then(j => { state = j; }).catch(e => { err = e.message; }));
      jobs.push(api('/rc/ra?since=0').then(j => { recs = (j.ra || []).filter(r => r.kind === 'decision' || r.kind === 'check'); }).catch(() => { }));
    }
    await Promise.all(jobs); render();
  }

  // ---------- the lines ----------
  const RANK = { red: 3, amber: 2, green: 1, grey: 0 };
  const WXL = { met: 'red', close: 'amber', ok: 'green', nodata: 'grey' };
  function line(L) {
    const now = Date.now(), parts = [];
    L.src.forEach(s => {
      if (s.startsWith('wx:')) {
        const t = wx && wx.triggers && wx.triggers.next48 && wx.triggers.next48.triggers[s.slice(3)];
        if (!wx) parts.push({ lvl: 'grey', text: 'No weather data yet.' });
        else if (t) parts.push({ lvl: WXL[t.status] || 'grey', text: (t.text || t.note || t.label + ': ' + t.status) + (t.status === 'ok' ? '' : '') });
        else parts.push({ lvl: 'grey', text: 'Not watched for this event.' });
      } else if (s === 'med:heat') {
        const n = care.filter(x => x.kind === 'med' && x.type === 'heat' && now - x.t < 3600e3).length;
        parts.push({ lvl: n >= 3 ? 'red' : n ? 'amber' : 'green', text: n ? `${n} heat presentation${n > 1 ? 's' : ''} in the last hour.` : 'None in the last hour.' });
      } else if (s === 'med:post') {
        const by = new Map(); care.filter(x => x.kind === 'med' && now - x.t < 3600e3).forEach(x => by.set(x.post || 'Not stated', (by.get(x.post || 'Not stated') || 0) + 1));
        const top = [...by].sort((a, b) => b[1] - a[1])[0];
        parts.push({ lvl: top && top[1] >= 5 ? 'red' : top && top[1] >= 3 ? 'amber' : 'green', text: top ? `Busiest in the last hour: ${top[0]}, ${top[1]}.` : 'No presentations in the last hour.' });
      } else if (s === 'cover:now') {
        const S = window.STCover, nowRows = S && window.ST_COVER ? S.now(care) : [], late = nowRows.filter(r => r.late);
        parts.push({ lvl: late.length ? 'red' : nowRows.length ? 'green' : 'grey', text: late.length ? 'Nobody checked on: ' + late.map(r => r.name).join(', ') + '.' : nowRows.length ? `All ${nowRows.length} medical posts due now have someone on.` : 'No medical posts due now.' });
      } else if (s === 'transport') {
        const tr = (state && state.live && state.live.transport || []).filter(x => x.state === 'sent' || x.state === 'cant');
        const late = tr.filter(x => x.state === 'cant' || now - x.t > 5 * 60000);
        parts.push({ lvl: late.length ? 'red' : tr.length ? 'amber' : 'green', text: late.length ? late.map(x => x.name + (x.state === 'cant' ? ' can\'t go' : ' hasn\'t answered')).join('; ') + '.' : tr.length ? tr.length + ' waiting for an answer.' : 'No transport waiting.' });
      } else if (s === 'field:missing') {
        const cs = care.filter(c => c.kind === 'concern' && !care.some(x => (x.kind === 'clear' && x.type === c.id) || (x.bib === c.bib && x.t >= c.t && (x.kind === 'wd' || x.outcome === 'withdrawn' || x.outcome === 'transported'))));
        const unseen = cs.map(c => { const s2 = care.filter(x => x.kind === 'seen' && x.type === c.id).sort((a, b) => b.t - a.t)[0]; return { c, since: (s2 || c).t }; }).filter(x => now - x.since > 3600e3);
        const lost = (state && state.incidents || []).filter(i => i.status !== 'closed' && i.kind === 'lost');
        parts.push({ lvl: unseen.length || lost.length ? 'red' : cs.length ? 'amber' : 'green',
          text: [lost.length ? lost.length + ' lost or overdue open on Control' : '', unseen.length ? 'unseen for over an hour: ' + unseen.map(x => 'bib ' + x.c.bib).join(', ') : '', cs.length && !unseen.length ? cs.length + ' runner' + (cs.length > 1 ? 's' : '') + ' of concern being watched' : ''].filter(Boolean).join('; ') || 'Nobody missing.' });
      } else if (s === 'field:incidents') {
        const open = (state && state.incidents || []).filter(i => i.status !== 'closed');
        const old = open.filter(i => now - ((i.times || {}).call || i.created) > 3600e3);
        parts.push({ lvl: old.length ? 'red' : open.length ? 'amber' : 'green', text: open.length ? `${open.length} open${old.length ? ', ' + old.length + ' over an hour' : ''}.` : 'None open.' });
      } else if (s === 'comms') parts.push({ lvl: 'grey', text: 'Station report-ins come with the Aid Station Manager screen.' });
    });
    const lvl = parts.reduce((a, p) => RANK[p.lvl] > RANK[a] ? p.lvl : a, 'grey');
    return { L, lvl: parts.some(p => p.lvl !== 'grey') && lvl === 'grey' ? 'green' : lvl, text: parts.map(p => p.text).join(' ') };
  }
  const lines = () => D.lines.map(line);
  const snapshot = ls => ls.map(x => ({ id: x.L.id, name: x.L.name, lvl: x.lvl, text: x.text }));
  const LBL = { red: 'Met', amber: 'Getting close', green: 'Clear', grey: 'No data' };

  // ---------- screens ----------
  function render() {
    if (!shown) return;
    if (!BASE) { box.innerHTML = '<div class="rc-msg"><h2>Risk</h2><p>The Risk tab needs the SingleTrack Worker (tools/SINGLETRACK_WORKER.md).</p></div>'; return; }
    if (!pw()) { box.innerHTML = `<div class="rc-msg"><h2>Risk</h2><p>Unlock ${esc(ST.hq)} on the Control tab with the staff password first.</p></div>`; return; }
    const ls = lines(), worst = ls.reduce((a, x) => RANK[x.lvl] > RANK[a] ? x.lvl : a, 'grey');
    const decs = recs.filter(r => r.kind === 'decision').sort((a, b) => b.created - a.created), chks = recs.filter(r => r.kind === 'check').sort((a, b) => b.created - a.created);
    const open = [].concat(...decs.map(d => (d.actions || []).map((a, k) => ({ d, a, k })))).filter(x => !x.a.done);
    let groups = '';
    [...new Set(D.lines.map(l => l.group))].forEach(g => {
      groups += `<h3 class="rk-g">${esc(g)}</h3>` + ls.filter(x => x.L.group === g).map(x => `<div class="rk-line ${x.lvl}" data-id="${esc(x.L.id)}">
        <div class="rk-top"><span class="rk-dot"></span><b>${esc(x.L.name)}</b><span class="rk-st">${LBL[x.lvl]}</span>${x.L.src[0] === 'comms' ? '' : `<button class="btn small" data-act="decide" type="button">Decide</button>`}</div>
        <p class="rk-now">${esc(x.text)}</p>
        <details><summary>Trigger and pre-agreed response</summary><p><b>Trigger:</b> ${esc(x.L.trigger)}</p><p><b>Response:</b> ${esc(x.L.response)}</p></details>
        ${deciding === x.L.id ? decideHtml(x) : ''}</div>`).join('');
    });
    box.innerHTML = `<div class="rk">
      <div class="rk-head"><h2>Conditions</h2><span class="rk-sum ${worst}">${worst === 'red' ? 'Trigger met' : worst === 'amber' ? 'Getting close' : 'Clear'}</span>
        <span class="muted">${wx ? 'Weather ' + hm(wx.updated * 1000) + '. ' : 'No weather data yet. '}Updated ${hm(Date.now())}. ${esc(err)}</span>
        <button class="btn small" id="rkRef" type="button">Refresh</button></div>
      <p class="muted">Only the ${esc(D.decides)} holds or stops the event. Each line's trigger and response are from the Risk Management Plan.</p>
      <div class="rk-cols"><div>${groups}</div>
      <div>
        <section class="rk-box"><h3>Checks</h3><p class="muted">Race eve, each race morning, each shift change and every 6 hours: a short checklist, with the conditions filled in.</p>
          ${checking ? checkHtml(ls) : `<select id="rkReview">${D.reviews.map(r => `<option>${esc(r)}</option>`).join('')}</select> <button class="btn small primary" id="rkStart" type="button">Start check</button>`}
          ${chks.length ? `<ul class="rk-list">${chks.slice(0, 8).map(c => `<li><b>${esc(c.review)}</b> ${c.signed ? 'signed off ' + esc(hm(c.signed.at)) + ' by ' + esc(c.signed.by) : 'not signed off'}${c.decision ? ' · ' + esc(c.decision) : ''}</li>`).join('')}</ul>` : ''}</section>
        <section class="rk-box"><h3>Open actions${open.length ? ' (' + open.length + ')' : ''}</h3>${open.length ? `<ul class="rk-list">${open.map(x => `<li><label><input type="checkbox" data-d="${esc(x.d.id)}" data-k="${x.k}"> ${esc(x.a.what)}</label><small>${esc(x.a.who || '')}${x.a.by ? ', by ' + esc(x.a.by) : ''} · from ${esc(x.d.name)} (${esc(x.d.response)})</small></li>`).join('')}</ul>` : '<p class="muted">None.</p>'}</section>
        <section class="rk-box"><h3>Decisions</h3>${decs.length ? `<ul class="rk-list">${decs.slice(0, 20).map(d => `<li class="${d.response === 'PROCEED' ? '' : 'rk-dec'}"><b>${esc(d.response)}</b> ${esc(d.name)}${d.detail ? ': ' + esc(d.detail) : ''}<small>${esc(hm(d.created))} by ${esc((d.signed || {}).by || '')}${d.noticeSent ? ' · notice sent' : ''}</small></li>`).join('')}</ul>` : '<p class="muted">None yet.</p>'}</section>
      </div></div></div>`;
    bind();
  }
  function decideHtml(x) {
    const d = draft[x.L.id] || (draft[x.L.id] = { response: '', detail: '', actions: [{ what: '', who: '', by: '' }], notice: '', send: false });
    return `<div class="rk-decide"><p class="rk-l">Response</p><div class="care-chips">${D.responses.map(r => `<button type="button" class="care-chip${d.response === r ? ' on' : ''}" data-r="${r}">${r}</button>`).join('')}</div>
      <label class="rk-l">What and why (a few words)</label><input class="rk-in" data-f="detail" maxlength="300" value="${esc(d.detail)}" placeholder="e.g. hold runners at the Chalet until the cell passes">
      <p class="rk-l">Actions</p>${d.actions.map((a, k) => `<div class="rk-act"><input class="rk-in" data-a="${k}" data-k="what" placeholder="What" value="${esc(a.what)}"><input class="rk-in" data-a="${k}" data-k="who" placeholder="Who" value="${esc(a.who)}"><input class="rk-in" data-a="${k}" data-k="by" placeholder="By when" value="${esc(a.by)}"></div>`).join('')}
      <button class="btn small" data-act="addact" type="button">Another action</button>
      <label class="rk-l">Notice to every phone (optional)</label><textarea class="rk-in" data-f="notice" rows="2" maxlength="280">${esc(d.notice)}</textarea>
      <label class="rk-chk"><input type="checkbox" data-f="send"${d.send ? ' checked' : ''}> Send it as an important notice when I record this</label>
      <div class="rk-btns"><button class="btn primary" data-act="record" type="button">Record decision</button><button class="btn" data-act="cancel" type="button">Cancel</button></div><p class="muted" id="rkMsg"></p></div>`;
  }
  function checkHtml(ls) {
    const c = checking;
    return `<div class="rk-check"><p><b>${esc(c.review)}</b>, started ${esc(hm(c.t))}.</p>
      <p class="rk-l">The board now</p><ul class="rk-snap">${ls.map(x => `<li class="${x.lvl}">${esc(x.L.name)}: ${LBL[x.lvl]}</li>`).join('')}</ul>
      ${D.checklist.map((it, k) => `<div class="rk-item"><p>${esc(it)}</p><div class="care-chips">${['OK', 'Issue'].map(v => `<button type="button" class="care-chip${c.items[k].v === v ? ' on' : ''}" data-ci="${k}" data-v="${v}">${v}</button>`).join('')}</div><input class="rk-in" data-cn="${k}" placeholder="Note" value="${esc(c.items[k].note)}"></div>`).join('')}
      <p class="rk-l">Decision</p><div class="care-chips">${D.responses.map(r => `<button type="button" class="care-chip${c.decision === r ? ' on' : ''}" data-cd="${r}">${r}</button>`).join('')}</div>
      <div class="rk-btns"><button class="btn primary" id="rkSign" type="button">Sign off</button><button class="btn" id="rkDrop" type="button">Cancel</button></div><p class="muted" id="rkCMsg"></p></div>`;
  }
  function bind() {
    $('rkRef').addEventListener('click', load);
    box.querySelectorAll('.rk-line').forEach(el => {
      const id = el.dataset.id, L = D.lines.find(l => l.id === id), d = () => draft[id];
      el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', async () => {
        const a = b.dataset.act;
        if (a === 'decide') { deciding = deciding === id ? null : id; render(); return; }
        if (a === 'cancel') { deciding = null; render(); return; }
        if (a === 'addact') { d().actions.push({ what: '', who: '', by: '' }); render(); return; }
        if (a === 'record') {
          const x = d(), m = el.querySelector('#rkMsg');
          if (!x.response) { m.textContent = 'Pick the response.'; return; }
          if (!who()) { m.textContent = 'Put your name in the box at the top of the Control tab first.'; return; }
          const ls = lines(), now = Date.now(), id2 = rid('dec-');
          const rec = { kind: 'decision', line: id, name: L.name, response: x.response, detail: x.detail.trim(), actions: x.actions.filter(a => a.what.trim()).map(a => ({ what: a.what.trim(), who: a.who.trim(), by: a.by.trim(), done: null })),
            conditions: snapshot(ls), level: (ls.find(y => y.L.id === id) || {}).lvl, signed: { at: now, by: who() }, noticeSent: !!(x.send && x.notice.trim()) };
          try {
            await api('/rc/ra', { id: id2, patch: rec, who: who(), note: `Decision: ${x.response} for ${L.name}${rec.detail ? ' (' + rec.detail + ')' : ''}` });
            if (rec.noticeSent) await api('/rc/notice', { text: x.notice.trim(), level: 'alert', aud: 'all', mins: 240, who: who() });
            delete draft[id]; deciding = null; await load();
          } catch (e) { m.textContent = 'Not recorded: ' + e.message; }
        }
      }));
      el.querySelectorAll('.care-chip[data-r]').forEach(b => b.addEventListener('click', () => { d().response = b.dataset.r; el.querySelectorAll('.care-chip[data-r]').forEach(c => c.classList.toggle('on', c === b)); }));
      el.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener(inp.type === 'checkbox' ? 'change' : 'input', () => { d()[inp.dataset.f] = inp.type === 'checkbox' ? inp.checked : inp.value; }));
      el.querySelectorAll('[data-a]').forEach(inp => inp.addEventListener('input', () => { d().actions[+inp.dataset.a][inp.dataset.k] = inp.value; }));
    });
    box.querySelectorAll('input[type=checkbox][data-d]').forEach(cb => cb.addEventListener('change', async () => {
      const r = recs.find(x => x.id === cb.dataset.d); if (!r) return;
      const acts = r.actions.map((a, k) => k === +cb.dataset.k ? Object.assign({}, a, { done: { at: Date.now(), by: who() } }) : a);
      try { await api('/rc/ra', { id: r.id, patch: { actions: acts }, who: who(), note: 'Action done: ' + r.actions[+cb.dataset.k].what }); await load(); } catch (e) { cb.checked = false; }
    }));
    if ($('rkStart')) $('rkStart').addEventListener('click', () => { checking = { id: rid('chk-'), review: $('rkReview').value, t: Date.now(), items: D.checklist.map(() => ({ v: '', note: '' })), decision: '' }; render(); });
    if (checking) {
      box.querySelectorAll('[data-ci]').forEach(b => b.addEventListener('click', () => { checking.items[+b.dataset.ci].v = b.dataset.v; render(); }));
      box.querySelectorAll('[data-cn]').forEach(inp => inp.addEventListener('input', () => { checking.items[+inp.dataset.cn].note = inp.value; }));
      box.querySelectorAll('[data-cd]').forEach(b => b.addEventListener('click', () => { checking.decision = b.dataset.cd; render(); }));
      $('rkDrop').addEventListener('click', () => { checking = null; render(); });
      $('rkSign').addEventListener('click', async () => {
        const m = $('rkCMsg');
        if (checking.items.some(i => !i.v)) { m.textContent = 'Mark every item OK or Issue.'; return; }
        if (!checking.decision) { m.textContent = 'Pick the decision.'; return; }
        if (!who()) { m.textContent = 'Put your name in the box at the top of the Control tab first.'; return; }
        const c = checking, ls = lines();
        try {
          await api('/rc/ra', { id: c.id, patch: { kind: 'check', review: c.review, started: c.t, items: D.checklist.map((it, k) => ({ item: it, v: c.items[k].v, note: c.items[k].note.trim() })), decision: c.decision, conditions: snapshot(ls), signed: { at: Date.now(), by: who() } },
            who: who(), note: `Check signed off: ${c.review}, ${c.decision}` + (c.items.some(i => i.v === 'Issue') ? ' (' + c.items.filter(i => i.v === 'Issue').length + ' issue' + (c.items.filter(i => i.v === 'Issue').length > 1 ? 's' : '') + ')' : '') });
          checking = null; await load();
        } catch (e) { m.textContent = 'Not signed off: ' + e.message; }
      });
    }
  }
  window.RiskTab = {
    onShow() { shown = true; render(); load(); clearInterval(timer); timer = setInterval(() => { if (!deciding && !checking) load(); }, 60000); },
    onHide() { shown = false; clearInterval(timer); },
    // The staff password was just entered or removed (js/medplan.js).
    onAuth() { if (shown) { render(); load(); } }
  };
})();
