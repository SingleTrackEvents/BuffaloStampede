// Transport jobs on a vehicle's phone (docs/MEDICAL_AND_RISK.md 3.3). A field phone that shares its position as a
// 4WD or medical vehicle can be sent by Event HQ to an access point to pick up a runner. The job shows at the top of
// every tab, with directions, and the driver answers: On my way, Arrived or Can't go. Each answer goes to the board
// and HQ's log. Checked every 20 seconds while the app is open and sharing, and at once when it comes back on screen.
(function () {
  const LV = window.GPTLive;
  if (!LV || !LV.field || !window.ST) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tf = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const SEEN = 'st.jobs.seen.' + ST.event.id;
  let jobs = [], timer = null, busy = false, err = '';
  const box = document.createElement('div');
  box.id = 'fdJob'; box.className = 'fd-job'; box.hidden = true; box.setAttribute('role', 'alert');
  (document.querySelector('header.top') || document.body).after(box);
  const seen = () => { try { return JSON.parse(localStorage.getItem(SEEN)) || []; } catch (e) { return []; } };
  const markSeen = id => { try { localStorage.setItem(SEEN, JSON.stringify(seen().concat(id).slice(-30))); } catch (e) { } };

  async function post(path, body) {
    const r = await fetch(LV.base() + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status);
    return j;
  }
  const vehicle = () => { const c = LV.field.cfg(); return c.on && c.code && c.id && (c.unit === 'vehicle' || c.unit === 'medical') ? c : null; };
  async function check() {
    const c = vehicle();
    if (!c || !LV.base() || busy) { if (!c) { jobs = []; draw(); } return; }
    busy = true;
    try {
      const r = await post('/field/jobs', { code: c.code, id: c.id });
      jobs = (r.jobs || []).filter(j => j.state === 'sent' || j.state === 'onway'); err = '';
      // A new job: buzz, so the driver notices with the phone on the dash.
      const s = seen(), fresh = jobs.filter(j => !s.includes(j.id));
      if (fresh.length) { fresh.forEach(j => markSeen(j.id)); try { navigator.vibrate && navigator.vibrate([400, 150, 400, 150, 400]); } catch (e) { } }
    } catch (e) { err = /fetch|network/i.test(e.message) ? 'No signal: the job list may be out of date.' : e.message; }
    busy = false; draw();
  }
  async function answer(j, state) {
    const c = vehicle(); if (!c) return;
    let why = '';
    if (state === 'cant') { why = prompt('Why can\'t you go? (optional)') || ''; }
    try { await post('/field/job', { code: c.code, id: c.id, job: j.id, state, why }); j.state = state; if (state !== 'onway') jobs = jobs.filter(x => x.id !== j.id); err = ''; }
    catch (e) { err = 'Not sent: ' + e.message + '. Call ' + ST.hq + ' on the radio.'; }
    draw();
  }
  function draw() {
    box.hidden = !jobs.length && !err;
    if (box.hidden) { box.innerHTML = ''; return; }
    box.innerHTML = jobs.map(j => {
      const dir = j.lat != null ? `https://www.google.com/maps/dir/?api=1&destination=${(+j.lat).toFixed(5)},${(+j.lon).toFixed(5)}` : '';
      return `<div class="fd-job-card" data-id="${esc(j.id)}"><p class="fd-job-k">${j.state === 'onway' ? 'On your way' : 'Transport job from ' + esc(ST.hq)}</p>
        <p class="fd-job-w">Go to <b>${esc(j.where || 'the incident')}</b>${j.num ? ' for #' + j.num : ''}${j.bib ? ', bib ' + esc(j.bib) : ''}.</p>
        ${j.note ? `<p>${esc(j.note)}</p>` : ''}<p class="fd-job-t">Sent ${esc(tf.format(new Date(j.t)))}${j.by ? ' by ' + esc(j.by) : ''}.${j.state === 'onway' ? ' You said on your way at ' + esc(tf.format(new Date(j.st_t))) + '.' : ''}</p>
        <div class="fd-job-b">${j.state === 'sent' ? '<button type="button" class="btn primary" data-s="onway">On my way</button>' : '<button type="button" class="btn primary" data-s="arrived">Arrived</button>'}
        ${dir ? `<a class="btn" href="${dir}" target="_blank" rel="noopener">Directions</a>` : ''}<button type="button" class="btn" data-s="cant">Can't go</button></div></div>`;
    }).join('') + (err ? `<p class="fd-job-err">${esc(err)}</p>` : '');
    box.querySelectorAll('.fd-job-card').forEach(el => el.querySelectorAll('button[data-s]').forEach(b => b.addEventListener('click', () => { const j = jobs.find(x => x.id === el.dataset.id); if (j) answer(j, b.dataset.s); })));
  }
  const start = () => { clearInterval(timer); if (vehicle()) { check(); timer = setInterval(() => { if (document.visibilityState === 'visible') check(); }, 20000); } else { jobs = []; draw(); } };
  LV.onChange(start);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  start();
})();
