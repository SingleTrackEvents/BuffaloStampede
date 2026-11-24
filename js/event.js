// Which event this page is for, and where its data lives. Loaded first on every page, before any event data.
//
//   ?event=<id> on any page picks an event (and the phone remembers it). Otherwise the phone's last pick, as long as
//   that event isn't more than 3 days over; otherwise the event that's on now or next (events/events.js).
//
//   ST.load('course.js')   writes the event pack's copy of a data file into the page, in order, with this build's
//                          number, so the service worker saves it with the rest of the build.
//   ST.path('x')           the address of a file in the event pack (tiles, the medical plan).
//   ST.has('medical')      whether this event switches a module on.
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
    // Another event: this page again with ?event=, which the phone then remembers.
    pick: id => { const u = new URL(location.href); u.searchParams.set('event', id); location.href = u.href; }
  };
  // The event's own logo and name in the header, and its name in the page title.
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img.brand-logo').forEach(img => {
      if (ev.logo) { img.src = base + ev.logo; img.width = ev.logoW || img.width; }
      img.alt = ev.series === ev.name ? ev.name : ev.series + ' ' + ev.name;
    });
    document.title = document.title.replace(/^(Running Wild|GPT100|SingleTrack)\b/, ev.short || ev.name);
  });
})();
