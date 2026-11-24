// The staff app's Medical tab: the medical log as Event HQ sees it (docs/MEDICAL_AND_RISK.md). Every presentation,
// minor care count and withdrawal from the field app's Log tab, by post and as they come in, and the report by post,
// race, hour, type and outcome as a spreadsheet. Clinical notes never come here: they stay with the Medical Team.
// Unlocked with the staff password (the same as Control). HQ sets the medical code the Medical Team signs in with.
(function () {
  const $ = id => document.getElementById(id), box = $('careHqBody');
  if (!box || !window.ST || !ST.has('medical')) return;
  const C = window.GPT100_CONFIG || {}, W = C.weather || {}, BASE = (W.refreshUrl || '').replace(/\/$/, '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tf = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const TYPES = { skin: 'Skin, blisters, cuts', msk: 'Muscle or joint', gut: 'Gut', exhaust: 'Exhaustion or dehydration', cold: 'Cold', heat: 'Heat', head: 'Head injury', snake: 'Snake bite', cardio: 'Heart or breathing', other: 'Other' };
  const OUT = { continued: 'Continued', withdrawn: 'Withdrawn', transported: 'To hospital' };
  let rows = [], medCode = '', timer = null, shown = false, filter = '', err = '';
  const pw = () => window.MedPlan && window.MedPlan.pw && window.MedPlan.pw();

  async function api(path, body) {
    const r = await fetch(BASE + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-RC-Password': pw() }, body: JSON.stringify(body) } : { headers: { 'X-RC-Password': pw() }, cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
    return j;
  }
  async function load() {
    if (!BASE || !pw()) return render();
    try {
      const [c, s] = await Promise.all([api('/rc/care'), api('/rc/state?since=' + Date.now())]);
      rows = c.care || []; medCode = (s.live && s.live.med_code) || ''; err = '';
    } catch (e) { err = e.message; }
    render();
  }
  const isWd = x => x.kind === 'wd' || x.outcome === 'withdrawn' || x.outcome === 'transported';
  // Runners of concern still open: flagged, not cleared, not withdrawn since. Longest unseen first.
  function concerns() {
    return rows.filter(c => c.kind === 'concern').map(c => {
      if (rows.some(x => x.kind === 'clear' && x.type === c.id)) return null;
      if (rows.some(x => x.bib === c.bib && x.t >= c.t && isWd(x))) return null;
      return Object.assign({ seen: rows.filter(x => x.kind === 'seen' && x.type === c.id).sort((a, b) => b.t - a.t) }, c);
    }).filter(Boolean).sort((a, b) => (a.seen[0] || a).t - (b.seen[0] || b).t);
  }
  // Cover (3.4): who is on post now against the plan, and what the plan check finds against the races.
  let coverOpen = false;
  function coverHtml() {
    const S = window.STCover; if (!S || !window.ST_COVER) return '';
    const nowRows = S.now(rows), plan = S.plan(), late = nowRows.filter(r => r.late);
    return `<details class="care-hq-cover"${coverOpen || late.length ? ' open' : ''}><summary><h3>Cover${late.length ? ' <span class="care-hq-bad">' + late.length + ' post' + (late.length > 1 ? 's' : '') + ' with nobody checked on</span>' : ''}${plan.length ? ' · ' + plan.length + ' to check in the plan' : ''}</h3></summary>
      ${nowRows.length ? `<table class="care-hq-t"><thead><tr><th>Medical post now</th><th>Planned</th><th>On post</th></tr></thead><tbody>${nowRows.map(r => `<tr class="${r.late ? 'late' : ''}"><td>${esc(r.name)}<small> ${esc(r.crew || '')}</small></td><td>${esc(S.at(r.from))} to ${esc(S.at(r.to))}</td><td>${r.on.length ? r.on.map(o => esc(o.who) + ' (' + esc(o.post) + ', since ' + esc(tf.format(new Date(o.since))) + ')').join('<br>') : (r.late ? '<b>Nobody checked on</b>' : 'Not yet')}</td></tr>`).join('')}</tbody></table>`
        : '<p class="muted">No medical posts planned for now. Medics and Safety Officers tap <b>I\'m on post here</b> on the field app\'s Log tab, and show here against the plan.</p>'}
      <h4>The plan against the races</h4>
      ${plan.length ? `<ul class="care-hq-plan">${plan.map(p => `<li class="${p.level}">${esc(p.text)}</li>`).join('')}</ul>` : '<p class="muted">Every post is covered from before its first runner to its cut-off.</p>'}
      <p class="muted">From events/${esc(ST.event.id)}/cover.js (the Medical and Rescue Plan and the Aid Station Operation Plan) against each race's first runner and cut-off. Posts should open ${(window.ST_COVER.marginMin || 20)} minutes before the first runner.</p></details>`;
  }
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };
  function render() {
    if (!shown) return;
    if (!BASE) { box.innerHTML = `<div class="rc-msg"><h2>Medical</h2><p>The medical log needs the SingleTrack Worker (tools/SINGLETRACK_WORKER.md).</p></div>`; return; }
    if (!pw()) { box.innerHTML = `<div class="rc-msg"><h2>Medical</h2><p>Unlock ${esc(ST.hq)} on the Control tab with the staff password first.</p></div>`; return; }
    const seen = rows.filter(x => x.kind === 'med'), minor = rows.filter(x => x.kind === 'minor'), wd = rows.filter(isWd), hosp = rows.filter(x => x.outcome === 'transported');
    const posts = [...new Set(rows.map(x => x.post || 'Not stated'))].sort();
    const by = posts.map(p => { const r = rows.filter(x => (x.post || 'Not stated') === p); return { p, seen: r.filter(x => x.kind === 'med').length, minor: r.filter(x => x.kind === 'minor').length, wd: r.filter(isWd).length, hosp: r.filter(x => x.outcome === 'transported').length,
      last: Math.max(...r.map(x => x.t)) }; });
    const C = concerns();
    const list = rows.filter(x => (x.kind === 'med' || x.kind === 'wd') && (!filter || (x.post || 'Not stated') === filter)).slice(0, 200);
    box.innerHTML = `<div class="care-hq">
      <div class="care-hq-head"><h2>Medical</h2><span class="care-hq-err">${esc(err)}</span>
        <button class="btn small" id="chqCsv" type="button">Download report</button><button class="btn small" id="chqRef" type="button">Refresh</button></div>
      <div class="care-hq-tiles"><div><b>${seen.length}</b>seen by medical</div><div><b>${minor.length}</b>minor care</div><div><b>${wd.length}</b>withdrawn</div><div><b>${hosp.length}</b>to hospital</div></div>
      <section class="care-hq-concern"><h3>Runners of concern${C.length ? ' (' + C.length + ')' : ''}</h3>
        ${C.length ? `<ul class="care-hq-list">${C.map(c => { const last = c.seen[0], since = (last || c).t, late = Date.now() - since > 3600e3;
          return `<li class="${late ? 'wd' : ''}"><b>Bib ${esc(c.bib)}</b> ${esc(c.reason || '')}<small>Flagged at ${esc(c.post || 'on course')}, ${esc(tf.format(new Date(c.t)))}${c.who ? ' by ' + esc(c.who) : ''}. ${last ? 'Last seen at ' + esc(last.post || 'on course') + ', ' + esc(tf.format(new Date(last.t))) + '.' : 'Not seen since.'} ${late ? '<b>Unseen for ' + ago(since) + '.</b>' : ago(since) + ' ago.'}</small></li>`; }).join('')}</ul>`
          : '<p class="muted">None. Posts flag them from the field app\'s Log tab, and every post watches for them.</p>'}</section>
      ${coverHtml()}
      <div class="care-hq-cols">
        <section><h3>By post</h3>${by.length ? `<table class="care-hq-t"><thead><tr><th>Post</th><th>Seen</th><th>Minor</th><th>Withdrawn</th><th>Hospital</th><th>Last</th></tr></thead><tbody>${by.map(b => `<tr data-p="${esc(b.p)}" class="${b.p === filter ? 'on' : ''}"><td>${esc(b.p)}</td><td>${b.seen}</td><td>${b.minor}</td><td>${b.wd}</td><td>${b.hosp}</td><td>${esc(tf.format(new Date(b.last)))}</td></tr>`).join('')}</tbody></table><p class="muted">Tap a post to see only its entries.</p>` : '<p class="muted">Nothing logged yet.</p>'}
          <h3>Medical code</h3><p class="muted">The Medical Team signs in to the field app's Log tab with this. Safety Officers and Aid Station Managers use the team code (Control, Settings) and can log withdrawals only.</p>
          <form id="chqCode" class="search-row"><input id="chqCodeIn" type="text" maxlength="20" placeholder="e.g. MED27" value="${esc(medCode)}"><button class="btn" type="submit">${medCode ? 'Change' : 'Set'}</button></form><p id="chqCodeMsg" class="muted" role="status"></p></section>
        <section><h3>${filter ? esc(filter) : 'Latest'}${filter ? ' <button class="btn small" id="chqAll" type="button">All posts</button>' : ''}</h3>
          ${list.length ? `<ul class="care-hq-list">${list.map(x => `<li class="${isWd(x) ? 'wd' : ''}"><b>${esc(x.bib ? 'Bib ' + x.bib : 'No bib')}</b> ${x.kind === 'wd' ? 'Withdrawn' + (x.reason ? ': ' + esc(x.reason) : '') : esc(TYPES[x.type] || x.type || '') + ' · ' + esc(OUT[x.outcome] || '')}
            <small>${esc(tf.format(new Date(x.t)))} · ${esc(x.post || 'Not stated')}${x.who ? ' · ' + esc(x.who) : ''}</small></li>`).join('')}</ul>` : '<p class="muted">Nothing logged yet.</p>'}</section>
      </div></div>`;
    const cv = box.querySelector('.care-hq-cover'); if (cv) cv.addEventListener('toggle', () => { coverOpen = cv.open; });
    $('chqRef').addEventListener('click', load);
    $('chqCsv').addEventListener('click', csv);
    if ($('chqAll')) $('chqAll').addEventListener('click', () => { filter = ''; render(); });
    box.querySelectorAll('tr[data-p]').forEach(tr => tr.addEventListener('click', () => { filter = filter === tr.dataset.p ? '' : tr.dataset.p; render(); }));
    $('chqCode').addEventListener('submit', async ev => {
      ev.preventDefault(); const v = $('chqCodeIn').value.trim();
      try { await api('/rc/settings', { patch: { med_code: v } }); medCode = v; $('chqCodeMsg').textContent = v ? 'Medical code set.' : 'Medical code removed.'; }
      catch (e) { $('chqCodeMsg').textContent = e.message; }
    });
  }
  // The report: one row per entry, with the day and hour, for the post-event medical review.
  function csv() {
    const day = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'short' }), hr = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', hourCycle: 'h23' });
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const lines = [['Time', 'Day', 'Hour', 'Post', 'Bib', 'Entry', 'What', 'Outcome', 'Reason', 'Logged by', 'Role'].map(q).join(',')]
      .concat(rows.slice().reverse().map(x => [tf.format(new Date(x.t)), day.format(new Date(x.t)), hr.format(new Date(x.t)), x.post, x.bib, { med: 'Seen by medical', minor: 'Minor care', wd: 'Withdrawal' }[x.kind], TYPES[x.type] || x.type, OUT[x.outcome] || x.outcome, x.reason, x.who, x.role].map(q).join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = ST.event.id + '-medical-log-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.csv';
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  window.CareHQ = {
    onShow() { shown = true; render(); load(); clearInterval(timer); timer = setInterval(load, 30000); },
    onHide() { shown = false; clearInterval(timer); },
    onAuth() { if (shown) { render(); load(); } }
  };
})();
