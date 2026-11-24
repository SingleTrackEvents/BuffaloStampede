// Buffalo Stampede 2027: the cover the plans set at each post, Melbourne local time. The app checks it against every
// race's first runner and cut-off at that post (races.js) and, on the day, against who has checked on post
// (docs/MEDICAL_AND_RISK.md 3.4).
//   medical: the BSF27 Medical and Rescue Plan v0.1, section 05 (posts SingleTrack has asked Race Day Medical to quote).
//            Options B1 (Friday doctor), B2 (Cresta) and B3 (Buckland) aren't decided, so they aren't here.
//   aid:     the BSF27 Aid Station Operation Plan v0.3, Part B (2027 bump in and bump out).
//   covers:  the aid stations a post looks after, by their names in races.js.
//   marginMin: how long before the first runner a post should be open (the GPT100 review: open against the fastest
//            runner with a margin, not the forecast).
window.ST_COVER = {
  marginMin: 20,
  medical: [
    { name: 'Medical Base', covers: ['Pioneer Park, Bright'], crew: 'Paramedic, doctor on call', from: '2027-03-19T17:00', to: '2027-03-19T21:30' },
    { name: '10k course', covers: ['Mystic'], crew: '2 L3 Responders', from: '2027-03-19T17:30', to: '2027-03-19T21:00' },
    { name: 'Medical Base', covers: ['Pioneer Park, Bright'], crew: 'Doctor, paramedic or CCRN, 2 L3 Responders', from: '2027-03-20T05:00', to: '2027-03-20T17:00' },
    { name: 'Medical Base', covers: ['Pioneer Park, Bright'], crew: 'Paramedic or CCRN, L3 Responder, doctor on call', from: '2027-03-20T17:00', to: '2027-03-21T06:30' },
    { name: 'Medical Base', covers: ['Pioneer Park, Bright'], crew: 'Doctor, paramedic or CCRN, 2 L3 Responders', from: '2027-03-21T06:30', to: '2027-03-21T18:30' },
    { name: 'Valley roving', covers: ['Mystic', 'Clearspot', 'Bakers Gully'], crew: 'Paramedic, L3 Responder', from: '2027-03-20T05:30', to: '2027-03-21T10:00' },
    { name: 'Valley roving', covers: ['Mystic', 'Clearspot', 'Bakers Gully'], crew: 'Paramedic, L3 Responder', from: '2027-03-21T07:00', to: '2027-03-21T15:30' },
    { name: 'Eurobin Creek', covers: ['Eurobin Creek'], crew: 'Nurse, L3 Responder', from: '2027-03-20T07:15', to: '2027-03-21T02:30' },
    { name: 'Eurobin Creek', covers: ['Eurobin Creek'], crew: 'Nurse, L3 Responder', from: '2027-03-21T07:25', to: '2027-03-21T12:00' },
    { name: 'The Chalet', covers: ['The Chalet'], crew: 'Paramedic, L3 Responder, 4WD', from: '2027-03-20T08:30', to: '2027-03-20T23:30' },
    { name: 'The Chalet', covers: ['The Chalet'], crew: 'Paramedic, L3 Responder, 4WD', from: '2027-03-21T06:30', to: '2027-03-21T10:00' }
  ],
  aid: [
    { name: 'Mystic', from: '2027-03-19T17:22', to: '2027-03-19T20:00' },
    { name: 'Mystic', from: '2027-03-20T06:52', to: '2027-03-20T09:20' },
    { name: 'Clearspot', from: '2027-03-20T05:58', to: '2027-03-20T13:00' },
    { name: 'Clearspot', from: '2027-03-20T13:41', to: '2027-03-21T08:00' },
    { name: 'Clearspot', from: '2027-03-21T08:59', to: '2027-03-21T15:50' },
    { name: 'Bakers Gully', from: '2027-03-20T07:16', to: '2027-03-20T10:40' },
    { name: 'Bakers Gully', from: '2027-03-21T09:21', to: '2027-03-21T17:50' },
    { name: 'Buckland Valley', from: '2027-03-20T06:42', to: '2027-03-20T11:00' },
    { name: 'Buckland Valley', from: '2027-03-20T13:11', to: '2027-03-21T05:10' },
    { name: 'Buckland Valley', from: '2027-03-21T08:08', to: '2027-03-21T13:20' },
    { name: 'Eurobin Creek', from: '2027-03-20T07:24', to: '2027-03-21T02:10' },
    { name: 'Eurobin Creek', from: '2027-03-21T07:33', to: '2027-03-21T11:45' },
    { name: 'The Chalet', from: '2027-03-20T08:39', to: '2027-03-20T23:20' },
    { name: 'The Chalet', from: '2027-03-21T06:20', to: '2027-03-21T09:40' },
    { name: 'Cresta Valley', from: '2027-03-20T09:29', to: '2027-03-20T20:00' }
  ]
};
