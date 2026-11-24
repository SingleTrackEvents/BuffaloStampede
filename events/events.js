// Every event the app knows, in date order. Each one's data lives in events/<id>/ (its event pack): courses, races,
// aid stations, posts, weather settings, schedule, gear and its own saved topo map. js/event.js picks one.
//   logo: for the dark header bar; logoLight: for light backgrounds (the first-run intro).
//   modules: the parts of the app this event switches on (see js/event.js, ST.has).
//   precache: saved on every phone when the app installs, so it works offline before anyone opens it. Keep this to
//   the events coming up (a pack can be over 1 MB); any other event is saved the first time someone opens it.
window.ST_EVENTS = [
  { id: 'buller-2026', name: 'Mt Buller SkyRun', short: 'Buller', series: 'Running Wild', place: 'Mt Buller, Victoria',
    from: '2026-12-06', to: '2026-12-06', logo: 'logo.png', logoW: 77, logoLight: 'logo-light.png',
    modules: ['find', 'weather', 'control', 'field', 'tracking'] },
  { id: 'buffalo-2027', name: 'Buffalo Stampede', short: 'Buffalo', series: 'SingleTrack', place: 'Bright, Victoria',
    from: '2027-03-19', to: '2027-03-21', logo: 'logo.png', logoW: 84, logoLight: 'logo-light.png', precache: true,
    modules: ['find', 'weather', 'control', 'field', 'tracking', 'timing', 'medical', 'risk', 'runner', 'crew', 'aid'] }
];
