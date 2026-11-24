// The medical log, in the field app's Log tab (docs/MEDICAL_AND_RISK.md, section 3.1). One entry per runner seen
// replaces the medical, safety and DNF WhatsApp groups: a withdrawal reaches Event HQ, timing and the runner's
// followers at once.
//
// Medics sign in with the medical code: they log a runner seen (what it is, the outcome, optional clinical notes) and
// +1 minor care. Safety Officers and Aid Station Managers sign in with the team code: they log a withdrawal (no
// clinical notes). Entries wait on the phone with no signal and go when there is (st.care.q). Each entry has its own
// id, so sending it twice changes nothing.
(function () {
  const $ = id => document.getElementById(id), box = $('careBody');
  if (!box || !window.ST || !ST.has('medical')) return;
  const LV = window.GPTLive, E = window.GPT;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // The practice mode (js/demo.js) keeps its own sign-in and queue, so nothing from a rehearsal reaches the race.
  const K = 'st.care.' + ST.event.id + (window.GPTDemo && GPTDemo.rcBase ? '.demo' : '') + '.';
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(K + k)); return v == null ? d : v; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch (e) { } };
  const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
  const tf = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const base = () => LV && LV.base ? LV.base() : '';

  // What it is: a short list a medic can tap with a glove on. Outcomes as the review counts them.
  const TYPES = [['skin', 'Skin, blisters, cuts'], ['msk', 'Muscle or joint'], ['gut', 'Gut'], ['exhaust', 'Exhaustion or dehydration'], ['cold', 'Cold'],
    ['heat', 'Heat'], ['head', 'Head injury'], ['snake', 'Snake bite'], ['cardio', 'Heart or breathing'], ['other', 'Other']];
  const OUTCOMES = [['continued', 'Continued'], ['withdrawn', 'Withdrawn'], ['transported', 'To hospital']];
  const REASONS = ['Injury', 'Unwell', 'Missed cut-off', 'Chose to stop', 'Other'];
  const typeName = k => (TYPES.find(t => t[0] === k) || [k, k || ''])[1];
  const outName = k => (OUTCOMES.find(t => t[0] === k) || [k, k || ''])[1];

  // Posts: the event's aid stations and water points on every course, once each, plus the village and "on course".
  const clean = n => String(n || '').replace(/\s*\((second|third) (pass|visit)\)\s*$/i, '').replace(/^(Start|Finish),\s*/i, '').replace(/ water point$/i, ' water point').trim();
  const POSTS = (() => {
    const seen = new Map();
    const add = (n, lat, lon) => { const c = clean(n); if (c && !seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), { name: c, lat, lon }); };
    (E && (E.courses || [E]) || []).forEach(C => (C.AID || []).forEach(a => add(a.name, a.lat, a.lon)));
    return [...seen.values()].concat([{ name: 'On course' }]);
  })();

  let me = load('me', { code: '', who: '', role: '' }), post = load('post', ''), q = load('q', []), list = [], busy = false, msg = '', flash = '', flashT = 0;
  // A confirmation that stays up for a few seconds, through the list refreshing.
  const say = t => { flash = t; flashT = Date.now(); const m = $('careMsg'); if (m) m.textContent = t; };
  const form = { kind: 'med', bib: '', type: '', outcome: '', reason: '', notes: '' }, flag = { bib: '', reason: '' };

  // ---------- runners of concern (docs/MEDICAL_AND_RISK.md, 3.2) ----------
  // Anyone flags a runner with a reason; every post sees them under Watch for; whoever sees them taps Seen here; the
  // Medical Team (or whoever flagged them) taps All clear. Entries still waiting to send count straight away.
  const all = () => { const m = new Map(list.map(x => [x.id, x])); q.forEach(x => m.set(x.id, Object.assign({}, m.get(x.id), x))); return [...m.values()].filter(x => !x.deleted); };
  function concerns() {
    const A = all(), out = [];
    A.filter(x => x.kind === 'concern').forEach(c => {
      if (A.some(x => x.kind === 'clear' && x.type === c.id)) return;
      // (A runner who has since withdrawn is off the list: their withdrawal is the outcome.)
      if (A.some(x => x.bib === c.bib && x.t >= c.t && (x.kind === 'wd' || x.outcome === 'withdrawn' || x.outcome === 'transported'))) return;
      const seen = A.filter(x => x.kind === 'seen' && x.type === c.id).sort((a, b) => b.t - a.t);
      out.push(Object.assign({ seen }, c));
    });
    return out.sort((a, b) => (a.seen[0] || a).t - (b.seen[0] || b).t);
  }
  // On post (cover, 3.4): this person's latest on or off. HQ sees who is actually on each post against the plan.
  const myPost = () => { const e = all().filter(x => (x.kind === 'on' || x.kind === 'off') && x.who === me.who).sort((a, b) => b.t - a.t)[0]; return e && e.kind === 'on' ? e : null; };
  function onPostLine() {
    const o = myPost();
    return o ? `<p class="care-onpost">On post at <b>${esc(o.post)}</b> since ${esc(tf.format(new Date(o.t)))}. <button type="button" class="btn small" id="careOff">Going off post</button></p>`
      : `<p class="care-onpost off">Not on post. <button type="button" class="btn small" id="careOn">I'm on post here</button></p>`;
  }
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? m + ' min ago' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min ago'; };

  async function call(path, body) {
    const r = await fetch(base() + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || 'HTTP ' + r.status); e.status = r.status; throw e; }
    return j;
  }
  // Send what's waiting, in batches. A refused code stops sending (and says so); no signal just waits.
  async function flush() {
    if (busy || !q.length || !me.code || !base()) return;
    busy = true;
    try {
      const batch = q.slice(0, 20), r = await call('/care/add', { code: me.code, entries: batch });
      const done = new Set(r.saved || []); q = q.filter(e => !done.has(e.id)); save('q', q); msg = '';
      await refresh();
    } catch (e) { msg = e.status === 401 ? 'Your code has changed. Sign in again.' : e.status ? e.message : 'No signal. Kept on this phone and sent when there is.'; if (e.status === 401) { me.role = ''; save('me', me); } }
    busy = false; render();
  }
  async function refresh() {
    if (!me.code || !base()) return;
    try { const r = await call('/care/list', { code: me.code }); list = r.care || []; me.role = r.role; save('me', me); } catch (e) { }
    render();
  }
  function add(entry) {
    const e = Object.assign({ id: rid(), t: Date.now(), post: post || '', who: me.who }, entry);
    q.push(e); save('q', q); render(); flush();
    return e;
  }

  // ---------- screens ----------
  function signIn() {
    box.innerHTML = `<section class="fd-card"><h2>Medical log</h2>
      <p class="fd-hint">For the Medical Team, Safety Officers and Aid Station Managers. One entry for each runner seen replaces the WhatsApp groups: a withdrawal reaches ${esc(ST.hq)}, timing and the runner's crew straight away.</p>
      <p class="fd-hint"><b>Medical Team:</b> the medical code. <b>Safety Officers and Aid Station Managers:</b> the team code. Both come from ${esc(ST.hq)}.</p>
      <form id="careIn" class="care-in"><label class="fd-label" for="careWho">Your name</label><input id="careWho" type="text" maxlength="40" value="${esc(me.who)}" autocomplete="name">
      <label class="fd-label" for="careCode">Code</label><input id="careCode" type="text" maxlength="20" autocapitalize="characters" autocomplete="off" value="">
      <button class="btn primary" type="submit">Sign in</button><p id="careInMsg" class="fd-hint" role="status"></p></form></section>`;
    $('careIn').addEventListener('submit', async ev => {
      ev.preventDefault();
      const who = $('careWho').value.trim(), code = $('careCode').value.trim();
      if (!who || !code) { $('careInMsg').textContent = 'Your name and the code, please.'; return; }
      $('careInMsg').textContent = 'Checking…';
      try { const r = await call('/care/list', { code }); me = { code, who, role: r.role }; list = r.care || []; save('me', me); render(); flush(); }
      catch (e) { $('careInMsg').textContent = e.status ? e.message : 'No signal. Try again when there is.'; }
    });
  }
  const chips = (name, opts, cur) => `<div class="care-chips" role="group" data-f="${name}">${opts.map(([k, l]) => `<button type="button" class="care-chip${cur === k ? ' on' : ''}" data-v="${esc(k)}">${esc(l)}</button>`).join('')}</div>`;
  function render() {
    if (!me.role) return signIn();
    const med = me.role === 'medical', P = post, mine = list.filter(x => !x.deleted && (!P || x.post === P));
    const unsent = q.length ? `<p class="care-unsent">${q.length} waiting to send. ${esc(msg)}</p>` : msg ? `<p class="care-unsent">${esc(msg)}</p>` : '';
    const minors = mine.filter(x => x.kind === 'minor').length;
    const rows = mine.filter(x => x.kind === 'med' || x.kind === 'wd').slice(0, 30).map(x => `<li><b>${esc(x.bib ? 'Bib ' + x.bib : 'No bib')}</b> ${x.kind === 'wd' ? 'Withdrawn' + (x.reason ? ': ' + esc(x.reason) : '') : esc(typeName(x.type)) + ' · ' + esc(outName(x.outcome))}
      <small>${esc(tf.format(new Date(x.t)))}${x.post && !P ? ' · ' + esc(x.post) : ''}${x.who ? ' · ' + esc(x.who) : ''}</small>${med && x.notes ? `<small class="care-notes">${esc(x.notes)}</small>` : ''}
      ${med || x.who === me.who ? `<button type="button" class="btn small care-del" data-id="${esc(x.id)}">Remove</button>` : ''}</li>`).join('');
    const C = concerns();
    const watch = `<section class="fd-card care-watch"><h2>Watch for${C.length ? ' (' + C.length + ')' : ''}</h2>
      ${C.length ? `<ul class="care-list">${C.map(c => { const last = c.seen[0], here = P && c.seen.find(x => x.post === P);
        return `<li class="${!last && Date.now() - c.t > 3600e3 ? 'care-late' : ''}"><b>Bib ${esc(c.bib)}</b> ${esc(c.reason || '')}
        <small>Flagged at ${esc(c.post || 'on course')}, ${esc(tf.format(new Date(c.t)))}${c.who ? ' by ' + esc(c.who) : ''}.</small>
        <small>${last ? 'Last seen at ' + esc(last.post || 'on course') + ', ' + esc(tf.format(new Date(last.t))) + ' (' + ago(last.t) + ').' : 'Not seen since (' + ago(c.t) + ').'}</small>
        ${here ? `<small>Seen here at ${esc(tf.format(new Date(here.t)))}.</small>` : `<button type="button" class="btn small care-seen" data-id="${esc(c.id)}">Seen here</button>`}
        ${med || c.who === me.who ? `<button type="button" class="btn small care-clear" data-id="${esc(c.id)}">All clear</button>` : ''}</li>`; }).join('')}</ul>`
        : '<p class="fd-hint">No runners of concern. Flag one below and every post will watch for them.</p>'}
      <details class="care-flag"${flag.bib ? ' open' : ''}><summary>Flag a runner of concern</summary>
        <label class="fd-label" for="careFBib">Bib</label><input id="careFBib" type="text" inputmode="numeric" maxlength="8" value="${esc(flag.bib)}">
        <label class="fd-label" for="careFWhy">Why? (what the next post should look for)</label><input id="careFWhy" type="text" maxlength="120" value="${esc(flag.reason)}" placeholder="e.g. shaky and cold, wouldn't eat">
        <button class="btn primary" id="careFlag" type="button">Flag runner</button></details></section>`;
    box.innerHTML = watch + `<section class="fd-card"><h2>${med ? 'Medical log' : 'Log a withdrawal'}</h2>
      <p class="fd-hint">Signed in as <b>${esc(me.who)}</b> (${med ? 'Medical Team' : 'team code'}). <button type="button" class="linkbtn" id="careOut">Sign out</button></p>
      ${onPostLine()}
      <label class="fd-label" for="carePost">Post</label><select id="carePost"><option value="">Choose your post</option>${POSTS.map(p => `<option${p.name === P ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
      ${navigator.geolocation ? '<button type="button" class="btn small" id="careHere">Nearest to me</button>' : ''}
      ${unsent}
      <label class="fd-label" for="careBib">Bib</label><input id="careBib" type="text" inputmode="numeric" maxlength="8" value="${esc(form.bib)}" placeholder="e.g. 123">
      ${med ? `<p class="fd-label">What is it?</p>${chips('type', TYPES, form.type)}<p class="fd-label">Outcome</p>${chips('outcome', OUTCOMES, form.outcome)}
        <label class="fd-label" for="careNotes">Clinical notes (Medical Team only, never shared)</label><textarea id="careNotes" rows="2" maxlength="1500">${esc(form.notes)}</textarea>`
        : `<p class="fd-label">Why are they stopping?</p>${chips('reason', REASONS.map(r => [r, r]), form.reason)}`}
      <button class="btn primary care-save" id="careSave" type="button">${med ? 'Save' : 'Log withdrawal'}</button><p id="careMsg" class="fd-hint care-msg" role="status">${Date.now() - flashT < 8000 ? esc(flash) : ''}</p>
      ${med ? `<div class="care-minor"><button class="btn" id="careMinor" type="button">+1 minor care</button><span>Band-aid, tape or ice pack, no bib needed. ${minors} here${P ? '' : ' (all posts)'}.</span></div>` : ''}
      </section>
      <section class="fd-card"><h2>${P ? esc(P) : 'All posts'}</h2>${rows ? `<ul class="care-list">${rows}</ul>` : '<p class="fd-hint">Nothing logged here yet.</p>'}
      <button type="button" class="btn small" id="careRefresh">Refresh</button></section>`;
    if ($('careOn')) $('careOn').addEventListener('click', () => { if (!post || post === 'On course') { say('Choose your post first.'); return; } add({ kind: 'on' }); render(); say('On post at ' + post + '. ' + ST.hq + ' can see you\'re here.'); });
    if ($('careOff')) $('careOff').addEventListener('click', () => { const o = myPost(); if (!o || !confirm('Going off post at ' + o.post + '?')) return; add({ kind: 'off', post: o.post }); render(); say('Off post at ' + o.post + '.'); });
    $('careOut').addEventListener('click', () => { if (confirm('Sign out of the medical log on this phone?')) { me = { code: '', who: me.who, role: '' }; save('me', me); list = []; render(); } });
    $('carePost').addEventListener('change', e => { post = e.target.value; save('post', post); render(); });
    if ($('careHere')) $('careHere').addEventListener('click', () => navigator.geolocation.getCurrentPosition(p => {
      let best = null, bd = Infinity;
      POSTS.forEach(x => { if (x.lat == null) return; const d = E.metres([p.coords.latitude, p.coords.longitude], [x.lat, x.lon]); if (d < bd) { bd = d; best = x; } });
      if (best) { post = bd < 1500 ? best.name : 'On course'; save('post', post); render(); }
    }, () => { say('Couldn\'t get your position. Choose your post from the list.'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }));
    $('careBib').addEventListener('input', e => { form.bib = e.target.value.replace(/[^0-9A-Za-z]/g, ''); });
    if ($('careNotes')) $('careNotes').addEventListener('input', e => { form.notes = e.target.value; });
    box.querySelectorAll('.care-chips').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('.care-chip'); if (!b) return; form[g.dataset.f] = form[g.dataset.f] === b.dataset.v ? '' : b.dataset.v; g.querySelectorAll('.care-chip').forEach(c => c.classList.toggle('on', c.dataset.v === form[g.dataset.f])); }));
    $('careSave').addEventListener('click', () => {
      const m = $('careMsg');
      if (!post) { m.textContent = 'Choose your post first.'; return; }
      if (med && !form.type) { m.textContent = 'What is it? Tap one.'; return; }
      if (med && !form.outcome) { m.textContent = 'Tap the outcome.'; return; }
      if (!med && !form.bib) { m.textContent = 'The bib, please.'; return; }
      if ((form.outcome === 'withdrawn' || form.outcome === 'transported' || !med) && !form.bib) { m.textContent = 'A withdrawal needs the bib.'; return; }
      add(med ? { kind: 'med', bib: form.bib, type: form.type, outcome: form.outcome, notes: form.notes.trim() } : { kind: 'wd', bib: form.bib, reason: form.reason || '' });
      const out = med ? outName(form.outcome) : 'Withdrawn';
      Object.assign(form, { bib: '', type: '', outcome: '', reason: '', notes: '' });
      render(); say('Saved: ' + out + '.');
    });
    if ($('careMinor')) $('careMinor').addEventListener('click', () => { if (!post) { say('Choose your post first.'); return; } add({ kind: 'minor' }); render(); say('+1 minor care saved.'); });
    $('careRefresh').addEventListener('click', () => { refresh(); flush(); });
    $('careFBib').addEventListener('input', e => { flag.bib = e.target.value.replace(/[^0-9A-Za-z]/g, ''); });
    $('careFWhy').addEventListener('input', e => { flag.reason = e.target.value; });
    $('careFlag').addEventListener('click', () => {
      if (!flag.bib) { say('The bib, please.'); return; }
      if (!flag.reason.trim()) { say('Say why, so the next post knows what to look for.'); return; }
      add({ kind: 'concern', bib: flag.bib, reason: flag.reason.trim(), post: post || 'On course' });
      Object.assign(flag, { bib: '', reason: '' }); render(); say('Flagged. Every post will watch for them.');
    });
    box.querySelectorAll('.care-seen').forEach(b => b.addEventListener('click', () => {
      if (!post) { say('Choose your post first, so they know where.'); return; }
      const c = concerns().find(x => x.id === b.dataset.id); if (!c) return;
      add({ kind: 'seen', bib: c.bib, type: c.id }); render(); say('Bib ' + c.bib + ' seen here.');
    }));
    box.querySelectorAll('.care-clear').forEach(b => b.addEventListener('click', () => {
      const c = concerns().find(x => x.id === b.dataset.id); if (!c || !confirm('Bib ' + c.bib + ': all clear?')) return;
      add({ kind: 'clear', bib: c.bib, type: c.id }); render(); say('Bib ' + c.bib + ': all clear.');
    }));
    box.querySelectorAll('.care-del').forEach(b => b.addEventListener('click', () => {
      const x = list.find(y => y.id === b.dataset.id); if (!x || !confirm('Remove this entry?')) return;
      q.push(Object.assign({}, x, { deleted: true })); save('q', q); x.deleted = 1; render(); flush();
    }));
  }
  render();
  refresh(); flush();
  setInterval(() => { flush(); if (document.visibilityState === 'visible') refresh(); }, 60000);
  addEventListener('online', flush);
})();
