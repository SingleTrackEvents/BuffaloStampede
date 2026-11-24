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
  });
})();
