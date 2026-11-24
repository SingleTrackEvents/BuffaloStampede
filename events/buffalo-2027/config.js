// Race-day settings shared by the staff app and the admin page.
// Buffalo Stampede Festival, Bright, Friday 19 to Sunday 21 March 2027 (docs/SCOPE.md).
window.GPT100_CONFIG = {
  event: 'Buffalo Stampede',
  // Response base. Keys match the drive_<key>_s fields on each access point (none have drive times yet).
  bases: [
    { key: 'br', name: 'Pioneer Park, Bright', color: '#c0392b' }
  ],
  // Estimate assumptions (the GPT100's).
  walkPace: 12,     // responder on foot, min per km
  evacPace: 30,     // stretcher / carry-out, min per km
  carryFactor: { hard: 1.75, unassessed: 1.5 },  // no track grades for Buffalo (scope decision 10): every carry-out is "not yet assessed"
  slowWalk: [],
  climbPenalty: 0.10, // min per metre of ascent (10 min per 100 m, Naismith), walking in and carrying out
  nightFactor: 1.3, // walk-in and carry-out take this much longer between sunset and sunrise (not the drive)
  driveFactor: 1.2, // multiplier on measured drive times for access roads
  // Races on the main course (the 100k), for converting a runner's race km. The 42k, 20k and 10k have courses of their own.
  races: [
    { id: '100k', label: '100k', from: 'Pioneer Park, Bright (Start)', to: 'Pioneer Park, Bright (Finish)' }
  ],
  // Run sheet ratings, in minutes to reach a casualty. The Medical and Rescue Plan asks for a medic within 1 hour
  // wherever a vehicle can reach, and a carry team on scene within 2 hours on foot-only sections.
  amberMin: 60,
  redMin: 120,
  // Weather. The trigger levels are the GPT100's until the BSF27 Risk Management Plan v1.5 triggers are typed in.
  weather: {
    // The hourly weather watch isn't set up for this repository yet: the Weather tab says its data is old until it is.
    dataUrl: 'https://raw.githubusercontent.com/SingleTrackEvents/singletrack-app/weather-data/buffalo-2027/',
    // The Worker (Control board, the line to the phones). Not set up for Buffalo yet: the Control board stays offline.
    refreshUrl: '',
    event: { start: '2027-03-19T18:00', end: '2027-03-21T18:00' },  // first start (Twilight 10k) to last cut-off (42k)
    alertsFrom: '2027-03-12T00:00',
    dailyUpdate: { from: '2027-03-12', hour: 9 },
    districts: ['North East'],  // CFA fire district and BOM warning area for the course
    ridgeMinEle: 1300,  // course points at or above this height (m) count as ridges and high ground: the plateau and The Horn
    staleHours: 3,
    models: ['ecmwf_ifs025', 'ecmwf_aifs025_single', 'gfs_seamless', 'icon_seamless', 'ukmo_seamless',
      'meteofrance_seamless', 'gem_seamless', 'jma_seamless', 'cma_grapes_global'],
    modelEveryHours: 3,
    replayYears: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    ensembles: { models: ['ecmwf_ifs025', 'ecmwf_aifs025', 'gfs025', 'ukmo_global_ensemble_20km', 'icon_seamless', 'gem_global'], everyHours: 6, closeChance: 30 },
    verify: { days: 7, minHours: 48, minWeight: 0.4 },
    obsRadiusKm: 60,
    incidentKm: 40,
    fireNearKm: 20,
    bomForecastPlaces: ['Bright', 'Mount Buffalo', 'Porepunkah', 'Myrtleford'],
    epaSites: 3, epaMaxKm: 60,
    warningWords: ['North East', 'Bright', 'Mount Buffalo', 'Mt Buffalo', 'Porepunkah', 'Buckland', 'Wandiligong', 'Myrtleford', 'Alpine'],
    triggers: {
      heat: { met: 36, close: 32, wbgtMet: 30, wbgtClose: 28 },
      wind: { met: 60, close: 50, proposed: true },
      rain: { met: 40, close: 20 },
      cold: { met: 0, close: 3, rainMm: 1, windKmh: 40, hours: 3, proposed: true },
      storm: { close: 2, met: 3, capeClose: 800, proposed: true },
      smoke: { met: 150, close: 100, proposed: true },
      // The plateau (100k km 34.6 to 67.6, from the GPX heights: tools/events/buffalo/build.py).
      cloud: { hours: 3, agree: 50, rh: 93, minEle: 1300, advisory: true,
        zones: [{ name: 'Mt Buffalo plateau', fromKm: 34.6, toKm: 67.6 }] },
      fire: { districts: ['North East'] }
    }
  },
  planPlaces: {},
  // Live runner positions: Living It Live trackers (with SOS) on every 42k and 100k runner, and RaceResult timing at
  // each station. gps takes the 2027 event ids once Living It Live sets them up. To replay 2026 in the meantime, open
  // any page with ?gps=20260328buffalostamp (README, Live runner tracking).
  tracking: { url: '', results: '', label: 'Live tracking', gps: [], chip: '', credit: 'Living It Live', mapshare: '' },
  // what3words API key. It's locked in the what3words dashboard to singletrackevents.github.io,
  // so it only works from the live site. Leave blank to be asked once on each device instead.
  what3wordsKey: 'LBTPEWCQ'
};
