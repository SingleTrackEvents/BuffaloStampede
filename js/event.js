// Which event this page is for, and where its data lives. Loaded first on every page, before any event data.
//
//   ?event=<id> on any page picks an event (and the phone remembers it). Otherwise the phone's last pick, as long as
//   that event isn't more than 3 days over; otherwise the event that's on now or next (events/events.js).
//
//   ST.load('course.js')   writes the event pack's copy of a data file into the page, in order, with this build's
//                          number, so the service worker saves it with the rest of the build.
//   ST.path('x')           the address of a file in the event pack (tiles, the medical plan).
//   ST.has('medical')      whether this event switches a module on.
//   ST.app('Field')        this event's name for one of the apps ("Buffalo Stampede Field").
//   ST.hq                  the event's own name for its control room ("Event HQ", "Race Control", "Race HQ").
//   data-module="medical"  on any element: shown only for an event that switches that module on.
// Every page gets an event button in its header (the event's short name): it lists the events, coming up first, and
// opens the same page for the one picked.
// Nothing here names any event but the one picked: each event keeps its own name, logo, icon and install file.
(function () {
  const EVENTS = window.ST_EVENTS || [], KEY = 'stEvent', DAY = 864e5;
  const me = document.currentScript, build = me ? new URL(me.src, location.href).searchParams.get('v') || '' : '';
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) { } };
  const end = ev => Date.parse(ev.to + 'T23:59:59+11:00');
  const byId = id => EVENTS.find(e => e.id === id);
  const asked = new URLSearchParams(location.search).get('event');
  let ev = asked && byId(asked);
  if (ev) set(ev.id);
  if (!ev) { const k = byId(get()); if (k && end(k) + 3 * DAY > Date.now()) ev = k; }
  if (!ev) ev = EVENTS.find(e => end(e) + 2 * DAY > Date.now()) || EVENTS[EVENTS.length - 1];
  const base = 'events/' + ev.id + '/';
  window.ST = {
    event: ev, events: EVENTS, build,
    path: f => base + f,
    load: f => document.write('<script src="' + base + f + (build ? '?v=' + build : '') + '"><\/script>'),
    has: m => !ev.modules || ev.modules.includes(m),
    app: k => ev.name + ' ' + k,
    hq: ev.hq || 'Event HQ',
    // Another event: this page again with ?event=, which the phone then remembers.
    pick: id => { const u = new URL(location.href); u.searchParams.set('event', id); location.href = u.href; }
  };
  // The page's install file and home screen icon: the event's own (events/<id>/), so a phone that adds this page to
  // its home screen gets this event's name and icon, and opens on this event.
  const kind = /field\.html$/.test(location.pathname) ? 'field' : /runner\.html$/.test(location.pathname) ? 'runner' : 'staff';
  const link = (rel, href, extra) => { const l = document.querySelector('link[rel="' + rel + '"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel })); l.href = href; Object.assign(l, extra || {}); };
  link('manifest', base + 'manifest-' + kind + '.webmanifest');
  link('apple-touch-icon', base + 'icon-180.png');
  link('icon', base + 'icon-48.png', { type: 'image/png' });
  // The event's own logo and name in the header and the page title (the pages themselves only say "SingleTrack").
  const NAMES = { staff: 'Safety', field: 'Field', runner: 'Runner' };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img.brand-logo').forEach(img => { if (ev.logo) { img.src = base + ev.logo; img.width = ev.logoW || img.width; } img.alt = ev.name; });
    document.querySelectorAll('img.gate-logo').forEach(img => { if (ev.logoLight) img.src = base + ev.logoLight; img.alt = ev.name; });
    document.querySelectorAll('a.brand').forEach(a => a.setAttribute('aria-label', ev.name + ' ' + NAMES[kind]));
    document.querySelectorAll('[data-st-name]').forEach(el => { el.textContent = ev.name + ' ' + el.getAttribute('data-st-name'); });
    document.title = document.title.replace(/^SingleTrack\b/, ev.name);
    document.querySelectorAll('[data-module]').forEach(el => { if (!window.ST.has(el.getAttribute('data-module'))) { el.hidden = true; el.style.display = 'none'; } });
    picker();
  });
  // ---------- the event picker ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dates = e => { const f = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne' }), a = new Date(e.from + 'T12:00:00+11:00'), b = new Date(e.to + 'T12:00:00+11:00');
    return e.from === e.to ? f.format(a) : a.getMonth() === b.getMonth() ? a.getDate() + ' to ' + f.format(b) : f.format(a) + ' to ' + f.format(b); };
  function picker() {
    const top = document.querySelector('header.top .brand');
    if (!top || EVENTS.length < 2 || document.getElementById('stEvBtn')) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'stEvBtn'; btn.className = 'st-evbtn'; btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML = esc(ev.short || ev.name) + ' <span aria-hidden="true">▾</span>'; btn.title = 'Change event';
    top.after(btn);
    btn.addEventListener('click', () => {
      const now = Date.now(), on = EVENTS.filter(e => end(e) + 3 * DAY > now), past = EVENTS.filter(e => end(e) + 3 * DAY <= now).reverse();
      const row = e => `<button type="button" class="st-evrow${e.id === ev.id ? ' on' : ''}" data-id="${esc(e.id)}"><b>${esc(e.name)}</b><span>${esc(e.place || '')} · ${esc(dates(e))}</span></button>`;
      const d = document.createElement('dialog');
      d.className = 'st-evdlg';
      d.innerHTML = `<h2>Events</h2>${on.length ? '<h3>Coming up</h3>' + on.map(row).join('') : ''}${past.length ? '<h3>Past events</h3>' + past.map(row).join('') : ''}<button type="button" class="btn st-evclose">Close</button>`;
      document.body.appendChild(d);
      d.addEventListener('click', e => { const r = e.target.closest('.st-evrow'); if (r) { if (r.dataset.id !== ev.id) window.ST.pick(r.dataset.id); else d.close(); } else if (e.target.closest('.st-evclose') || e.target === d) d.close(); });
      d.addEventListener('close', () => d.remove());
      d.showModal();
    });
  }
})();
