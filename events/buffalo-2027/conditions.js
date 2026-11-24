// Buffalo Stampede 2027: the Conditions board's lines, review points and checklist (docs/MEDICAL_AND_RISK.md, section 4).
// Triggers and pre-agreed responses from the BSF27 Risk Management Plan v1.5, section 6 (PROPOSED until confirmed with
// the Medical Director, Parks Victoria, Alpine Shire Council and the CFA: RMP open action 2). The checklist is the RMP's
// Appendix A, cut to what the board can't already see. Only the Event Manager holds or stops the event (RMP section 6).
//   src: what drives the line. wx:<key> is the hourly weather watch's trigger (latest.json, next 48 hours); the others are
//   worked out in the app from the medical log, cover, incidents, runners of concern and transport.
window.ST_CONDITIONS = {
  decides: 'Event Manager',
  responses: ['PROCEED', 'MODIFY', 'HOLD', 'SUSPEND', 'CANCEL'],
  lines: [
    { id: 'fire', group: 'Weather and fire', name: 'Fire danger', src: ['wx:fire'],
      trigger: 'Catastrophic rating, or a Total Fire Ban, in the North East district',
      response: 'CANCEL the affected races. Extreme: consult the land managers and CFA, then modify, shorten or delay; runs only on the Event Manager\'s written decision with land manager agreement.' },
    { id: 'storm', group: 'Weather and fire', name: 'Lightning', src: ['wx:storm'],
      trigger: 'Storm cell within 10 km of the plateau or exposed ridgelines, or flash to thunder under 30 seconds',
      response: 'Lightning hold (Emergency Management Plan): runners held at aid stations and sheltered points, starts suspended; restart 30 minutes after the last thunder.' },
    { id: 'heat', group: 'Weather and fire', name: 'Heat', src: ['wx:heat'],
      trigger: 'Above 32°C in the valley during a race window (close). 36°C or WBGT 30 is extreme heat (met)',
      response: 'Heat plan: earlier starts, extra water and ice, shorten courses, cancel the kids\' formats. Extreme heat: Event Manager decision required and recorded (modify, shorten, hold through the peak or cancel).' },
    { id: 'cold', group: 'Weather and fire', name: 'Cold, wind and snow on the plateau', src: ['wx:cold', 'wx:wind'],
      trigger: 'Wind chill below 0°C, snow forecast on the plateau, or gusts above 60 km/h on exposed sections',
      response: 'Enforce full mandatory gear at gear check; hold at Mt Buffalo Chalet and Cresta Valley; low-course alternative for plateau sections.' },
    { id: 'rain', group: 'Weather and fire', name: 'Rain and flooding', src: ['wx:rain'],
      trigger: 'More than 25 mm in 24 hours before a race day, or any crossing above knee height',
      response: 'Inspect the course; activate the pre-agreed detours for affected sections.' },
    { id: 'smoke', group: 'Weather and fire', name: 'Smoke and air quality', src: ['wx:smoke'],
      trigger: 'EPA AirWatch category agreed with the Medical Director (STE-SOP-105 s5.7)',
      response: 'Delay; shorten or cancel the long formats.' },
    { id: 'heatmed', group: 'Medical load', name: 'Heat presentations', src: ['med:heat'],
      trigger: 'Three or more heat presentations anywhere on course in one hour (Medical and Rescue Plan, section 08)',
      response: 'Straight to the Event Manager and Medical Director, whatever the measured temperature. Consider the heat plan.' },
    { id: 'medload', group: 'Medical load', name: 'Presentations at one post', src: ['med:post'],
      trigger: 'Five or more presentations at one post in the last hour',
      response: 'Check the post\'s medical cover and stock; send support; look for a cause on the course before it.' },
    { id: 'cover', group: 'Cover', name: 'Medical posts on post', src: ['cover:now'],
      trigger: 'A medical post due open with nobody checked on after 15 minutes',
      response: 'Call the Medical Team contact; cover the gap from the Medical Base or a roving crew; hold runners at the post if needed.' },
    { id: 'transport', group: 'Cover', name: 'Transport', src: ['transport'],
      trigger: 'A vehicle sent with no answer after 5 minutes, or a driver who can\'t go',
      response: 'Call the driver; send the next nearest vehicle.' },
    { id: 'missing', group: 'Field', name: 'Missing runner', src: ['field:missing'],
      trigger: 'No contact for 60 minutes (30 minutes on night sections), or unaccounted for at consecutive timing points',
      response: 'STE-SOP-104: search from the last known position. The Event Manager notifies Victoria Police at 3 hours (90 minutes at night). Injured or in danger: 000 straight away.' },
    { id: 'incidents', group: 'Field', name: 'Open incidents', src: ['field:incidents'],
      trigger: 'Any injury, lost runner or help request open; red over an hour',
      response: 'Work each one on the Control tab. Several at once: consider holding the field behind them.' },
    { id: 'comms', group: 'Comms', name: 'Station reports', src: ['comms'],
      trigger: 'A station that hasn\'t reported for its 2-hour check',
      response: 'Call the station; send someone if it can\'t be raised. (Comes with the Aid Station Manager screen.)' }
  ],
  // When a check is due (RMP section 6, review points). Each opens the checklist below.
  reviews: ['7 days out', '48 hours out', 'Race eve (after the CFA rating at 16:00, decision by 17:00)', 'Race morning: Friday', 'Race morning: Saturday', 'Race morning: Sunday', 'Event HQ shift change', 'Every 6 hours during the 100k', 'After a significant change'],
  // RMP Appendix A, without the rows the board fills in itself (weather, fire, air quality, triggers reached).
  checklist: [
    'Course condition changes: fallen limbs, washed-out or slippery granite, crossing levels, snow or ice on the plateau',
    'Tracking and timing: tracker platform live for the 42km and 100km; timing points tested',
    'Staffing: gaps against rosters and medical cover, and how they are covered',
    'Comms: WhatsApp groups, Starlink at every station, Mystic Park handsets, sweepers\' inReach Minis',
    'New hazards identified',
    'Today\'s top 3 hazards for the safety briefing'
  ]
};
