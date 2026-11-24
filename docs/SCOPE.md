# Buffalo Stampede App: Scope

Draft v0.1, 24 November 2026. Prepared for Chad Freak, Operations Manager. For discussion.

This scopes a race-weekend app for the Buffalo Stampede Festival (Bright, 19 to 21 March 2027). It starts from what the GPT100 Safety app already does, takes the future-proofing work from the Running Wild app, and then goes further: the app is built around the people who use it on the day and the handoffs between them, not around tabs.

Built from: the GPT100 app ([SingleTrackEvents/GPT100](https://github.com/SingleTrackEvents/GPT100)), the Running Wild scope v0.3 ([SingleTrackEvents/runningwild](https://github.com/SingleTrackEvents/runningwild), `docs/SCOPE.md`), the volunteer rego scope v0.7 ([SingleTrackEvents/volunteer](https://github.com/SingleTrackEvents/volunteer)) and buffalostampede.au as at 24 November 2026.

Questions that need an answer before the build starts are in section 11.

## 1. What we're building

The GPT100 app answers one question fast: **a runner needs help at this spot, who do we send and how long will it take?** The Buffalo app keeps that question at its heart and adds a second one:

**Does everyone who needs to know, know, without anyone having to tell them twice?**

At the GPT100 most of the app was used by Race Control and the safety team. At Buffalo we expect it to be used by everyone on the weekend:

| Who | What they need from the app |
| --- | --- |
| **Runners** | My race, the map, the next aid station and cut-off, help when I need it |
| **Crew and supporters** | Where my runner is, where I can meet them, when to leave, what happens if they pull out |
| **Aid station managers and volunteers** | Who's coming and when, who's through, cut-offs, withdrawals, what we're running low on, who to call |
| **Safety Officers, sweeps and marshals** | Where am I, who's near me, the way out, send my location, sweep progress |
| **Medical team (EMS)** | Who needs me, where, how bad, the patient record and handover |
| **Event HQ** | One picture of the whole weekend: every runner, incident, team, aid station and weather trigger |

The goal is one connected flow. A runner's help request, the Safety Officer who goes to them, the medic who treats them, the aid station that records the withdrawal and the crew who pick them up all work off the same record, and each sees only what they need.

## 2. The event

| | |
| --- | --- |
| **Dates** | Friday 19 to Sunday 21 March 2027 |
| **Base** | Event Village, Pioneer Park Recreation Reserve, Bright |
| **Size** | Over 3,500 runners across the weekend, plus crews, families and volunteers |
| **Country** | Alpine: Mystic, Clearspot, Buckland Valley, Mt Buffalo, The Horn. Steep climbs, long descents, remote valleys and 4WD-only access in places |
| **Medical and safety provider** | Endurance Medical Services (EMS) |
| **Tracking** | GPS trackers on the 100k and Team Relay, with an SOS button (GPS-seuranta, tulospalvelu.fi, the same feed the GPT100 app already reads) |

| Race | When | What matters for the app |
| --- | --- | --- |
| Twilight 10k | Friday evening | Emily's Spur and Mystic, finishing near dark. No crewing |
| 100k | Saturday 6:00 am, 28 hour cut-off (Sunday 10:00 am finish) | Runs through the night. 11 cut-offs. Out and back via Clearspot, Buckland Valley, Eurobin Creek, The Chalet and Cresta Valley. Drop bags, pacers from the second pass of The Chalet (65 km), trackers |
| 100k Team Relay | With the 100k | Teams of four, handovers to track, trackers |
| SkyRun 20k | Weekend | Bright to Mystic and Clearspot loop. Crewing allowed at set points |
| SkyMarathon 42k | Sunday, wave starts from Mt Buffalo Chalet from 7:20 am | Point to point down to Bright. Shuttles to the start |
| Grand Slam (72k) and Ultra Slam (152k) | Across all three days | One runner, three races. The Ultra Slam runner must finish the 100k by 5:20 am Sunday to catch the 42k shuttle |
| Family Trail 5k and Kids Trail 2k | Weekend | Large numbers of children and families in the village |

Every number above comes from buffalostampede.au and needs checking against the race sheet (section 11). The site's 2027 100k page still links the 2026 course.

### What makes Buffalo different from the GPT100

- **Volume.** About three times the runners, seven races and two multi-race series over three days. Many more people need the app at once, and many of them are first-timers.
- **Night.** The 100k runs through Saturday night into Sunday morning, so Event HQ and the remote aid stations work a full overnight shift and hand over.
- **Out and back.** The 100k passes Clearspot, Buckland Valley, Eurobin Creek, The Chalet and Cresta Valley twice. Every aid station needs to know which pass a runner is on.
- **Crew access is tightly set.** Crewing only at named points, never at Mystic or (for the 42k) The Chalet. Clearspot is 4WD recommended, Dingo Ridge 4WD only. Crews driving the wrong way is a real risk.
- **Hard access.** Clearspot, Dingo Ridge and the Buckland valley sections are slow to reach by vehicle, and the Mt Buffalo climbs and descents make carry-outs long.
- **Shared roads.** Traffic control at Buckland Valley Road, Harris Lane and Egglestons Lane, and cyclists on Mount Buffalo Tourist Road.

## 3. Design rules

These guide every screen.

1. **Built around roles, not tabs.** Each person opens the app to a home screen for their job on the day. The GPT100 app has three separate apps (staff, field, runner). The Buffalo app is one app with role lanes, so a volunteer who is also crewing their partner can switch without installing anything twice.
2. **One record, many views.** An incident, a withdrawal, a runner's position or a request for ice is written once and flows to everyone who needs it. Nobody re-types it into WhatsApp, a clipboard and a spreadsheet.
3. **Pass the Margaret test.** From the volunteer rego scope: if a 70 year old aid station volunteer with one careful finger can use it, everyone can. Big buttons, plain words ("Runner pulling out", not "DNF event"), one question per screen.
4. **Works with no signal.** Everything queues on the phone and sends when it can, and every screen says how old its information is. Messages read the same over the radio.
5. **Never replaces 000.** Call 000 and Call race medical stay one tap away on every runner and field screen.
6. **Private by default.** Runners' medical details, phone numbers and live positions are seen only by the roles that need them, and every read goes through one gateway (section 9).
7. **Build once for every SingleTrack event.** Buffalo is an event pack, not a one-off app (section 8).

## 4. The role lanes

### 4.1 Runners

Everything the GPT100 runner app does, set up for Buffalo, plus:

- **My weekend.** A Grand Slam or Ultra Slam runner sees all three of their races in order, with the next start, shuttle and cut-off up top.
- **Live cut-off buffer.** At my pace, how much time I have in hand at the next cut-off, in plain words ("about 40 minutes ahead of the Eurobin cut-off").
- **Off-course alert** (from the GPT100 app), tuned for the out and back so a runner on the way back isn't told they're lost.
- **Help.** Call 000, Call race medical and Tell Event HQ, with my position, what3words and nearest emergency marker. On the 100k the tracker's SOS button lands in the same place on the HQ board.
- **I'm pulling out.** The runner tells the app (or an aid station records it), and their crew is told straight away with where to collect them.
- **Drop bags, pacers and mandatory gear** for the 100k: what's in which bag, where my pacer can join, and a gear checklist.

### 4.2 Crew and supporters

- **Follow my runner** (from the GPT100 Track tab): where they are, pace, place, next crew point and expected time.
- **Crew rules built in.** The Crew tab shows only the points a crew can use for that race. It never offers Mystic, never offers The Chalet to a 42k crew, and won't offer a route to Clearspot or Dingo Ridge without a 4WD warning and the event's own directions (the website says not to use Google Maps for Clearspot).
- **Leave by.** Drive time to the next crew point and when to leave, as the GPT100 app does, using our own checked routes.
- **When plans change.** If the runner withdraws, misses a cut-off or is with medical, the crew gets a notification with what happened, where the runner is and where to collect them. This is the call Event HQ spends hours on today.
- **Pacer handover** at The Chalet for 100k pacers.

### 4.3 Aid station managers and volunteers

This lane is new. The GPT100 app had nothing for aid stations.

- **Due now.** The next runners due, from trackers, chips and pace, with the first expected time and how many are on the way ("12 runners due in the next 30 minutes, first at 14:20").
- **In and out.** Tap or scan bibs as runners arrive and leave. This fills the gaps between timing mats and tells HQ who has passed. On a two-pass station it knows which pass it is.
- **Cut-off clock.** A countdown to the station's cut-off, with the runners still due before it and the ones who won't make it at their pace. When the cut-off passes, the list of runners to hold is on screen.
- **Withdrawals.** Record a runner pulling out in three taps: bib, reason, how they're getting back. It goes to HQ, timing and the runner's crew at once, and onto the transport list.
- **Ask HQ.** Low on water, ice, food, cups or volunteers? One tap sends a request to HQ logistics with the station's name, and the station sees when it's on its way.
- **Who's here.** The volunteers on the roster for this station, who has checked in, and the station's contacts (station lead, nearest medic, HQ).
- **Shift handover.** A summary for the next shift: runners through, still due, withdrawals, open requests and notes. Matters for the overnight 100k stations.
- **Station status.** Green, amber or red for stock, staff and crowding, shown on the HQ board.

### 4.4 Safety Officers, sweeps and marshals

Everything the GPT100 field app does (Where am I?, nearest way out, track grade and carry-out, Send my location, Urgent: casualty here, Show me on the Control map, runners near you), plus:

- **On post.** Check in when on post. HQ sees every post as staffed or not, and Find knows who is nearest.
- **Runner passed.** A quick bib log at remote posts with no mat, feeding the same checkpoint record as the aid stations.
- **Welfare check.** Flag a runner who looks unwell but carries on. Their bib goes on the HQ watch list and the next aid station is told to look out for them.
- **Sweep progress.** The sweep confirms each section clear. Runners not yet passed by the sweep stay on the "still out" list. On the 100k the app knows which way the sweep is going.
- **Assigned to an incident.** When HQ sends a Safety Officer, their phone shows the casualty, the route, what's known so far, and steps to tap (on my way, on scene, leaving scene).
- **Traffic marshals** at the road crossings get their post, shift and the runners due.

### 4.5 Medical team (EMS)

The GPT100 medical plan view (who is where, runner numbers by hour, vehicle movements) carries over. New:

- **Patient record.** When a medic reaches a casualty or a runner presents at a medical tent, they open a record from the incident (or by bib). It carries the runner's details and, with consent from rego, emergency contact and medical notes. Time, observations, treatment, outcome and handover are recorded on the phone, offline if needed.
- **Outcome flows on.** "Continue", "Withdrawn" or "Transported" updates the incident, the runner's race status, the aid station and the crew notification, with no second call.
- **Handover.** A one-page handover for Ambulance Victoria or the hospital, ready to read out or show.
- **Medical board.** Open patients, where each medic and vehicle is, and who is waiting for medical.
- The clinical detail stays in the medical lane. HQ sees the status and outcome, not the notes.

### 4.6 Event HQ

The GPT100 Find, Weather, Medical, Control and Risk tabs, rebuilt as one board for a busy room and a big screen:

- **The whole picture on one screen.** The map with every runner, team, post and aid station; open incidents with timers; aid station status; weather triggers; the watch list; notices.
- **Find** as it is today, but it ranks the people on duty by where they are now (Safety Officers, sweeps, medics, vehicles), not only fixed bases (from the Running Wild scope).
- **Runner watch** (from the GPT100 app): not moving, off course, late, tracker quiet, SOS pressed, welfare flagged, not seen at a checkpoint. Each with one tap to open an incident.
- **Who's still out.** Started, not finished, not withdrawn, by race. The list HQ has to close at the end of every race, and especially at the end of the 100k.
- **Logistics queue.** Requests from aid stations, with who is taking them.
- **Transport list.** Withdrawn runners, where they are and how they're getting back. Shuttle loads for the 42k start and the Ultra Slam 5:20 am cut.
- **Notices** to everyone, runners, crews, one aid station or one role, as banners and push alerts.
- **Shift handover** for HQ, with open incidents, the watch list and actions.
- **Risk** (the race-morning dynamic risk assessment from the GPT100 app) with the Buffalo Risk Management Plan's triggers.
- **After the event.** Incident report, withdrawals, timeline and radio log exported for the debrief, and the race archive for next year's splits.

## 5. How the handoffs work

Four walk-throughs show the flow end to end. Each step is one tap or less for the person doing it.

**A runner rolls an ankle on the descent from Clearspot.**
1. The runner taps Tell Event HQ (or the tracker's SOS). It lands on the HQ board with their bib, km, what3words and nearest emergency marker.
2. HQ taps Acknowledge. The runner's phone says help is on the way. Find suggests the nearest Safety Officer on foot and the medic, with ETAs.
3. HQ assigns them. The Safety Officer's phone shows the casualty and route and they tap On my way.
4. The medic arrives and opens the patient record from the incident. Outcome: walk out to Clearspot with the Safety Officer, withdrawn.
5. The withdrawal goes to Clearspot aid station, timing and the transport list. The runner's crew is told where to collect them. The incident closes with every step timed.

**A runner pulls out at Eurobin Creek.**
1. The aid station volunteer taps Runner pulling out, the bib and the reason.
2. HQ, timing and the crew see it at once. The runner goes on the transport list and off the watch list. Nobody makes a phone call.

**A runner is overdue at The Chalet.**
1. The watch list flags them: last seen leaving Eurobin, should have arrived 40 minutes ago, tracker quiet.
2. The Chalet aid station sees them as still due. The sweep has them as not yet passed.
3. HQ opens an incident from the watch list. Find ranks who is nearest to the runner's estimated position. Their crew can be called from the record.

**A storm trigger is getting close on Saturday afternoon.**
1. The weather watch sends a phone alert and the trigger goes amber on the HQ board, with which runners will be on the exposed tops and when.
2. HQ starts a risk assessment from the trigger. The decision and actions go out as notices to the affected aid stations, Safety Officers and runners.

## 6. What carries over and what's new

| Carry over from the GPT100 app | Rework | New for Buffalo |
| --- | --- | --- |
| Find: team, parking, walk-in, ETA, carry-out, night factor, escalation warnings | Three separate apps into one with role lanes | Aid station lane: due now, in and out, cut-off clock, withdrawals, requests, handover |
| what3words, stored words offline | Response bases into people on duty (from Running Wild) | Patient record and medical outcome flow |
| GPS-seuranta tracking, chip timing, runner watch | Out and back logic for five two-pass stations | Crew notified of withdrawals and cut-offs |
| Weather: triggers, models, ensembles, BOM, CFA, VicEmergency, EPA, simulator | Weather triggers to Buffalo's Risk Management Plan | Checkpoint and sweep logging (shared with Running Wild) |
| Control board: incidents, units, radio log, notices, help requests | Crew tab rules (no Mystic, 4WD points, 42k Chalet) | Multi-race weekends: Grand Slam, Ultra Slam, relay handovers |
| Risk tab and dynamic risk assessment | Event setup from GPX and a spreadsheet (from Running Wild) | Logistics and transport lists |
| Runner app: map, cut-offs, Help, Schedule, Gear, off-course alert | | Volunteer roster import and post check-in |
| Offline first, build numbers, demo mode, crash tests | | Push alerts by role |

## 7. Data the event needs

Set up once with the event setup tool, then checked by hand:

- GPX for every course, with aid stations, water points and checkpoints, and which pass each one is.
- Access points with drive times from Bright, Porepunkah and The Chalet (race team times for Clearspot, Dingo Ridge and other gated or 4WD roads).
- Track grades, emergency markers and helicopter landing sites from Parks Victoria and DEECA for Mt Buffalo National Park and the Alpine region (to confirm they exist, as we did for the Grampians).
- what3words for the whole course, stored for offline.
- Cut-offs, drop bags, crew points and rules, and shuttles from the race sheet.
- Safety Officer, marshal and traffic posts with shifts, and the EMS medical plan.
- The runner list from rego and the volunteer roster from the volunteer platform (section 9).
- The 2026 Buffalo tracking archive (event `20260328buffalostamp`) to fit real splits, as we did for the GPT100.

## 8. Future proofing

This is where we take the Running Wild work further.

- **One core, many event packs.** Running Wild is already pulling everything event-specific into event packs. Buffalo becomes the first "epic" event pack on that core, and the GPT100 2027 can follow. We maintain one codebase for every SingleTrack event, and every improvement made for Buffalo (aid stations, medical, crews) is there for Running Wild and the GPT100 too.
- **Roles, not pages.** Role lanes are set in the event pack, so an event with no Safety Officers (Kilcunda) simply doesn't show that lane.
- **Fixed IDs.** Every event, race, aid station, post, runner and volunteer has an ID that doesn't change year to year, with Race Roster's IDs stored now and our own rego's later.
- **One gateway.** Every private read and write goes through the Worker, so moving from shared passwords to logins only changes the Worker.
- **Feeds as plug-ins.** GPS trackers, chips, phones and aid station taps are all position and checkpoint feeds with the same shape. A new tracking or timing provider is a new plug-in, not a rebuild.
- **Ready for the app stores.** The Running Wild Android build (Capacitor) gives background location. The same wrapper gives iPhone and Android apps when we're ready, from the same code.

## 9. Rego, volunteers and logins

The same plan as section 10 of the Running Wild scope, with Buffalo as the place it first matters at scale.

- **Runners from rego.** One import from Race Roster: bib, name, races (including Grand Slam and Ultra Slam), wave, phone, crew contacts and, with consent, emergency contact and medical notes. Our own rego fills the same shape later.
- **Volunteers from the volunteer platform.** The new volunteer platform's roster (who is at which aid station, post or sweep, and when) loads into the app, so a volunteer opens it on their own station and shift. Check-in on the day writes back to the volunteer platform.
- **Joining on the day.** Season 1: role codes and QR codes on the volunteer brief and at each aid station, with the staff password for HQ and medical. Later: one SingleTrack sign-in by link or code (no passwords, as the volunteer scope sets out).
- **Data protection.** Runners' locations, phone numbers and medical notes go through the architecture and data protection review agreed on Day 2 before anything links to rego.

## 10. Build plan

Buffalo is six days after Razorback (13 March), so the shared core has to be ready by Snow Gum Run (28 February) and Buffalo-specific work runs alongside.

| Phase | Ready by | What ships |
| --- | --- | --- |
| 0. Decide and gather | 15 December 2026 | Answers to section 11. Race sheet, GPX, crew points, medical plan and Risk Management Plan for 2027. 2026 tracking archive pulled |
| 1. Buffalo pack on the core | 31 January 2027 | Courses, aid stations (two-pass), access, weather triggers, Find, field lane, runner and crew lanes with Buffalo crew rules, HQ board. Demo with a made-up Buffalo field |
| 2. Aid stations and handoffs | 28 February 2027 | Aid station lane, withdrawals flowing to crews and transport, checkpoint and sweep logging, push alerts by role. Tested at Snow Gum Run (shared core) |
| 3. Medical and volunteers | 7 March 2027 | Patient record and outcome flow, volunteer roster import and check-in, runner list import |
| 4. Rehearsal | 12 March 2027 | Full demo of the weekend with HQ, an aid station team, EMS and Safety Officers. Crash tests. Volunteer and medic induction. Code freeze |
| 5. Race weekend | 19 to 21 March 2027 | Live, with a support person in HQ |
| 6. Debrief | April 2027 | What worked, archive for 2028 splits, feeds into the GPT100 2027 move |

If time runs short, phase 3's patient record is the first thing to hold back. The GPT100 medical tools still work without it.

## 11. Decisions needed

| # | Question | Suggested answer |
| --- | --- | --- |
| 1 | Build Buffalo on the Running Wild core as an event pack, or copy the GPT100 app as Running Wild did? The Running Wild scope says Buffalo's move is decided after the Prom (May), but Buffalo is in March | On the Running Wild core. One codebase, and Buffalo's new lanes help every event. This moves the Running Wild decision forward |
| 2 | One app with role lanes, or keep separate runner, field and staff apps? | One app with role lanes, with the public runner and crew lanes open to all and the rest behind role codes |
| 3 | Will the aid station volunteers be asked to use phones for bib in and out and withdrawals? | Yes at the 100k stations, with paper as the backup. Optional at the short course stations |
| 4 | Will EMS use the patient record, or keep their own system? | Ask EMS. If they have their own, we record status and outcome only and link to theirs |
| 5 | Can we collect crew contacts and medical notes (with consent) in 2027 rego? | Yes, if Race Roster entries are still open to new questions |
| 6 | Timing provider and feed for 2027? | To confirm. The app reads RaceResult today |
| 7 | Web app or the Android and iPhone apps for Buffalo? | Web app for runners and crews. Offer the Android app to Safety Officers and sweeps who need background location |
| 8 | Where does it live? | GitHub Pages beside the GPT100 and Running Wild for 2027. A SingleTrack address between seasons |
| 9 | Languages? | English, with the language setup kept (the GPT100 app has five) |
| 10 | Does Parks Victoria have track grades, emergency markers and helicopter sites for Mt Buffalo National Park? | To ask. Without them, carry-outs use the "not yet assessed" times |
