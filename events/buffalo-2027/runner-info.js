// Runner app details that aren't in the course details sheet. Buffalo Stampede 2027.
// Race start times from the BSF27 Medical and Rescue Plan v0.1 (from the EMP v3). Melbourne local time.
window.GPT_RUNNER_INFO = {
  // Race medical, shown as Call race medical. Left empty until the 2027 Medical Team number is confirmed: the Help tab
  // points to the number on the back of every bib meanwhile (tools/events/buffalo/safety-cards.mjs).
  medicalPhone: '',
  shuttleNote: '',
  // Mandatory gear by race id: not typed in yet. The Gear tab links to the event's own page meanwhile.
  gearSource: 'https://buffalostampede.au/mandatory-gear',
  gearNote: 'Check the mandatory gear for your race on the event website.',
  gear: {},
  notices: [],
  village: 'Event Village: Pioneer Park Recreation Reserve, 64 to 72 Coronation Ave, Bright',
  schedule: [
    { day: '2027-03-19', items: [['18:00', 'Twilight 10k start, Pioneer Park', '10k grand ultra']] },
    { day: '2027-03-20', items: [['06:00', '100k and 100k Team Relay start, Pioneer Park', '100k relay ultra'], ['07:30', 'SkyRun 20k start, Pioneer Park', '20k grand'],
                                 ['08:00', '5km Family Trail start', '5k'], ['08:45', '2km Kids Trail start', '2k']] },
    { day: '2027-03-21', items: [['05:20', 'Ultra Slam: last time to finish the 100k and catch the shuttle to the 42k start', 'ultra'],
                                 ['07:20', 'SkyMarathon 42k start (waves), Mt Buffalo', '42k grand ultra'], ['10:00', '100k final cut-off', '100k relay ultra'],
                                 ['18:00', '42k final cut-off', '42k grand ultra']] }
  ]
};
