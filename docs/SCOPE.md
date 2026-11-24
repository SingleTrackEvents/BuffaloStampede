# Buffalo Stampede App: Scope

Draft v0.3, 24 November 2026. v0.3 confirms the shared core (this repository, now `singletrack-app`), settles the 42k cut-off, Bakers Gully and the 20k course, and takes the 2027 entry targets from the 23 November entry report. v0.2 recorded the decisions on the scope questions (section 11), took the race data from the 2027 course details sheet, and lined up with the BSF27 Aid Station Operation Plan and Medical and Rescue Plan. Prepared for Chad Freak, Operations Manager.

This scopes a race-weekend app for the Buffalo Stampede Festival (Bright, 19 to 21 March 2027). It starts from what the GPT100 Safety app already does, takes the future-proofing work from the Running Wild app, and then goes further: the app is built around the people who use it on the day and the handoffs between them, not around tabs.

Built from:

- The GPT100 app ([SingleTrackEvents/GPT100](https://github.com/SingleTrackEvents/GPT100)) and the Running Wild scope v0.3 ([SingleTrackEvents/runningwild](https://github.com/SingleTrackEvents/runningwild), `docs/SCOPE.md`).
- The volunteer rego scope v0.7 ([SingleTrackEvents/volunteer](https://github.com/SingleTrackEvents/volunteer)).
- BSF_2027 course details (Course Manager's sheet), BSF27 Aid Station Operation Plan v0.3, BSF27 Medical and Rescue Plan v0.1.
- Buffalo Stampede 2027 entry report, 23 November 2026 (targets and entries to date).
- buffalostampede.au as at 24 November 2026.

## 1. What we're building

The GPT100 app answers one question fast: **a runner needs help at this spot, who do we send and how long will it take?** The Buffalo app keeps that question at its heart and adds a second one:

**Does everyone who needs to know, know, without anyone having to tell them twice?**

At the GPT100 most of the app was used by Race Control and the safety team. At Buffalo it will be used by everyone on the weekend:

| Who | What they need from the app |
| --- | --- |
| **Runners** | My race, the map, the next aid station and cut-off, help when I need it |
| **Crew and supporters** | Where my runner is, where I can meet them, when to leave, what happens if they pull out |
| **Aid Station Managers** | Who's coming and when, cut-offs, withdrawals, restocks, reporting in to HQ |
| **Safety Officers, sweeps and marshals** | Where am I, who's near me, the way out, send my location, sweep progress |
| **Medical Team** | Who needs me, where, how bad, the patient record and handover |
| **Event HQ** | One picture of the whole weekend: every runner, incident, team, aid station and weather trigger |

The goal is one connected flow. A runner's help request, the Safety Officer who goes to them, the medic who treats them, the aid station that records the withdrawal and the crew who pick them up all work off the same record, and each sees only what they need.

## 2. The event

| | |
| --- | --- |
| **Dates** | Friday 19 to Sunday 21 March 2027 |
| **Base** | Event Village, Medical Base and Event HQ at Pioneer Park, Bright |
| **Size** | 2027 target of 4,680 entries (1,639 at 23 November, 16 weeks out; 3,494 in 2026), 5,000 to 8,000 spectators and crew, 748 volunteer slots |
| **Country** | Alpine: Mystic, Clearspot, Buckland Valley, Mt Buffalo. Steep climbs, long descents, the plateau, and 4WD-only access in places |
| **Medical** | Race Day Medical (being engaged, quote request v0.6). Medical Base at Pioneer Park, posts at Eurobin and the Chalet, a valley roving crew for Mystic, Clearspot and Bakers Gully |
| **Timing and tracking** | Living It Live: RaceResult timing at each station, and a satellite tracker with SOS on every 42k and 100k runner, read live at Event HQ. They tracked Buffalo 2026, the race the GPT100 app's demo already replays |
| **Comms** | WhatsApp groups, mobile voice, Starlink at the village and every aid station, radios in Mystic Park, Garmin inReach Minis with each sweeper pair. Telstra is weak around Eurobin and on the plateau |

### The races

From the BSF_2027 course details sheet. First runner times are the Course Manager's predictions.

| Race | Start | Distance and climb | Aid stations (cut-off) | Final cut-off | 2027 target |
| --- | --- | --- | --- | --- | --- |
| Twilight 10k | Fri 18:00 | 10.5 km, +518 m | Mystic (19:30) | Fri 21:00 | 650 |
| 100k and Teams Relay | Sat 06:00 | 100.1 km, +4,810 m | Clearspot (08:30), Buckland Valley (10:30), Eurobin Creek (12:10), The Chalet (15:10), Cresta Valley (17:30), Cresta Valley again (19:30), The Chalet (22:50), Eurobin Creek (Sun 01:40), Buckland Valley (04:40), Clearspot (07:30) | Sun 10:00 | 600 solo, 400 relay teams |
| SkyRun 20k | Sat 07:30 | 20.2 km, +1,411 m | Mystic (08:50), Bakers Gully (10:30), Clearspot (12:30) | Sat 14:30 | 850 |
| Family Trail 5k | Sat 08:00 | | | Sat 09:30 | 500 |
| Junior Trail 2k | Sat 08:45 | | | Sat 09:30 | 500 |
| SkyMarathon 42k | Sun 07:20, waves | 42.4 km, +1,610 m | The Chalet (09:10), Eurobin Creek (11:15), Buckland Valley (12:50), Dingo Ridge (no cut-off), Clearspot (15:20), Bakers Gully (no cut-off) | Sun 18:00 | 700 |
| Grand Slam (10k, 20k, 42k) and Ultra Slam (10k, 100k, 42k) | All weekend | 72 km and 152 km | As each race | Ultra Slam: 100k finished by Sun 05:20 to make the 42k shuttle | 180 Grand Slam, 100 Ultra Slam |

Slam runners are on top of each race's own target, so the field on each course is bigger than its own row: about 930 in the 10k, 1,030 in the 20k, 980 in the 42k, and 700 solo runners plus 400 relay runners in the 100k, with up to 200 pacers on the 100k from The Chalet. The app is built and load-tested for those numbers. The 42k cut-off is 18:00 (the course details sheet's 17:50 is to be corrected), and Bakers Gully serves the 20k on Saturday.

The 100k details that matter to the app:

- **Drop bags** at Eurobin Creek (outbound and inbound) and Cresta Valley (both visits).
- **Relay changeovers** at Eurobin Creek outbound, Cresta Valley first visit and Eurobin Creek inbound.
- **Pacers** from the second pass of The Chalet (65.4 km) to the finish.
- **Crewing** at every 100k station. Not at Mystic for anyone, not at the 42k's first Chalet visit, and not in the 10k at all.

### What makes Buffalo different from the GPT100

- **Volume.** About four times the GPT100's runners, seven races and two multi-race series over three days. Many more people need the app at once, and many are first-timers.
- **Night.** The 10k finishes in the dark on Friday, and the 100k runs through Saturday night. Eurobin, Buckland and Clearspot work an overnight session and hand over.
- **Out and back.** The 100k passes Clearspot, Buckland Valley, Eurobin Creek and The Chalet twice and Cresta Valley twice in a row. Every station needs to know which pass a runner is on.
- **Stations run several sessions.** Clearspot and Buckland Valley each run three sessions across two days, for different races.
- **Crew access is tightly set.** Clearspot is 30 minutes up Demon Ridge Track (4WD recommended, don't use Google Maps), Dingo Ridge is 4WD only, Buckland Valley is a residential street.
- **Shared roads.** Traffic control at Buckland Valley Road, Harris Lane and Egglestons Lane, cyclists on Mount Buffalo Road, and Chalet shuttles from Dingo Dell.

## 3. Design rules

1. **Built around roles, not tabs.** One app. Each person opens it to a home screen for their job on the day (decided, section 11). A volunteer who is also crewing their partner switches without installing anything twice.
2. **One record, many views.** An incident, a withdrawal, a runner's position or a request for ice is written once and flows to everyone who needs it. Nobody re-types it into WhatsApp, a clipboard and a spreadsheet.
3. **Pass the Margaret test.** From the volunteer rego scope: if a 70 year old volunteer with one careful finger can use it, everyone can. Big buttons, plain words ("Runner pulling out", not "DNF event"), one question per screen.
4. **Works with no signal.** Everything queues on the phone and sends when it can, and every screen says how old its information is. Messages read the same over the radio.
5. **Never replaces 000.** Call 000 and Call race medical stay one tap away on every runner and field screen.
6. **Private by default.** Runners' medical details, phone numbers and live positions are seen only by the roles that need them. Anything the app writes for a WhatsApp group uses bib and first name only and nothing medical, as the Medical and Rescue Plan sets out.
7. **Build once for every SingleTrack event.** Buffalo is an event pack, not a one-off app (section 8).

## 4. The role lanes

### 4.1 Runners

Everything the GPT100 runner app does, set up for Buffalo, plus:

- **My weekend.** A Grand Slam or Ultra Slam runner sees all three races in order, with the next start, shuttle and cut-off up top. An Ultra Slam runner on the 100k sees how they're tracking against the 05:20 Sunday shuttle.
- **Live cut-off buffer.** At my pace, how much time I have in hand at the next cut-off, in plain words ("about 40 minutes ahead of the Eurobin cut-off").
- **Off-course alert** (from the GPT100 app), tuned for the out and back so a runner coming back isn't told they're lost.
- **Help.** Call 000, Call race medical and Tell Event HQ, with my position, what3words and the nearest way out. The tracker's SOS button lands in the same place on the HQ board.
- **I'm pulling out.** The runner tells the app (or the Aid Station Manager records it), and anyone following them is told straight away with where to collect them.
- **Drop bags, pacers, relay changeovers and mandatory gear** for the 100k.

### 4.2 Crew and supporters

- **Follow my runner** (from the GPT100 Track tab): where they are, pace, place, next crew point and expected time.
- **Crew rules built in.** The Crew tab shows only the points a crew can use for that race. It never offers Mystic, never offers the 42k's Chalet, and gives the event's own directions to Clearspot and Dingo Ridge with the 4WD warning instead of a Google Maps route.
- **Leave by.** Drive time to the next crew point and when to leave, as the GPT100 app does, using our own checked routes and the Chalet shuttle times from Dingo Dell.
- **When plans change.** If the runner withdraws, misses a cut-off or is with the Medical Team, everyone following them gets a notification with what happened, where the runner is and where to collect them. Rego for 2027 is already open, so crew contacts aren't collected at entry: a crew opts in by following their runner in the app and turning on alerts. That consent is theirs to give, and nothing needs adding to rego.
- **Pacer handover** at The Chalet for 100k pacers.

### 4.3 Aid Station Managers

New. The GPT100 app had nothing for aid stations. **Decided:** only the Aid Station Manager has the aid station lane, and only for their own station. Timing mats and trackers record who has passed, so nobody taps bibs in and out.

- **My station.** Opens on the manager's station and its current session (Clearspot, for example, runs three). Times, kit, access and contacts from their page in the Aid Station Operation Plan.
- **Due now.** From the timing mats and trackers: the next runners due, the first expected time and how many are on the way ("12 runners due in the next 30 minutes, first at 14:20"). On a two-pass station it knows which pass.
- **Cut-off clock.** A countdown to the station's cut-off, with the runners still due before it and the ones who won't make it at their pace. When it passes, the list of runners to hold is on screen.
- **Withdrawals.** Record a runner pulling out in three taps: bib, reason, how they're getting back. It goes to HQ, timing and their followers at once, and onto the transport list. A runner who needs medical attention goes to the Medical Team first, as the Medical and Rescue Plan sets out.
- **Report in.** The plan asks each station to report to HQ when it opens, every 2 hours, on any change and when it closes. The app prompts for each one (open, status, close) so the report is a tap, not a phone call.
- **Ask HQ.** Low on water, ice, food or crew? One tap sends a request to HQ with the station's name, and the station sees when it's on its way.
- **Holds.** When HQ calls a hold, the station gets it at once and confirms it's holding.
- **Shift handover.** For the overnight sessions: runners through, still due, withdrawals, open requests and notes.

### 4.4 Safety Officers, sweeps and marshals

Everything the GPT100 field app does (Where am I?, nearest way out, carry-out, Send my location, Urgent: casualty here, Show me on the Control map, runners near you), plus:

- **On post.** Check in when on post. HQ sees every post as staffed or not, and Find knows who is nearest.
- **Welfare check.** Flag a runner who looks unwell but carries on. Their bib goes on the HQ watch list and the next station is told to look out for them.
- **Sweep progress.** The sweep pair confirms each section clear (STE-SOP-103). Runners not yet passed by the sweep stay on the "still out" list. On the 100k the app knows which way the sweep is going. The inReach stays their backup with no signal.
- **Assigned to an incident.** When HQ sends someone, their phone shows the casualty, the route, what's known so far, and steps to tap (on my way, on scene, leaving scene).
- **Traffic marshals** at Buckland Valley Road, Harris Lane and Egglestons Lane get their post, shift and the runners due.

### 4.5 Medical Team

The GPT100 medical plan view (who is where, runner numbers by hour, vehicle movements) carries over, filled from the Race Day Medical roster once it's signed. **Decided:** a full patient record in the app.

- **Patient record.** When a medic reaches a casualty, or a runner presents at the Medical Base, Eurobin or the Chalet, they open a record from the incident (or by bib). It carries the runner's details and whatever emergency contact Race Roster already holds. Time, triage category (the plan's 1 to 3), observations, treatment, outcome and handover are recorded on the phone, offline if needed.
- **Outcome flows on.** "Continue", "Withdrawn" or "Transported" updates the incident, the runner's race status, the station and the runner's followers, with no second call.
- **Handover.** A one-page handover for Ambulance Victoria or Bright, Myrtleford or Wangaratta hospital, ready to read out or show.
- **Medical board.** Open patients, where each medic and vehicle is, and who is waiting for the Medical Team.
- **Holds.** The Medical Director can request a hold from the app. It reaches the Event Manager at once and is recorded whether or not it's adopted, as the plan requires.
- **The treatment log.** The patient records are the treatment log (STE-SOP-203), and the encounters per 1,000 starters by race, location and time for the post-event review (STE-SOP-204) come straight out of them.
- The clinical detail stays in the medical lane. HQ sees status and outcome, not the notes. Race Day Medical needs to agree to this before we build it (section 12).

### 4.6 Event HQ

The GPT100 Find, Weather, Medical, Control and Risk tabs, rebuilt as one board for a busy room and a big screen:

- **The whole picture on one screen.** Every runner, team, post and aid station on the map; open incidents with timers; station status; weather triggers; the watch list; notices.
- **Find** as it is today, but it ranks the people on duty by where they are now (Safety Officers, sweeps, medics, vehicles), not only fixed bases (from the Running Wild scope).
- **Runner watch** (from the GPT100 app): not moving, off course, late, tracker quiet, SOS pressed, welfare flagged. Overdue runners are flagged at the 60 minute and 3 hour thresholds in STE-SOP-104.
- **Who's still out.** Started, not finished, not withdrawn, by race. The list HQ has to close at the end of every race, and above all at the end of the 100k.
- **Restocks on field progress.** The Aid Station Operation Plan moves restocks from "someone noticed" to set triggers, such as 40% of the 100k field through Buckland Valley outbound. The app watches the timing feed and tells HQ when each trigger is reached, with the stations and the driver.
- **Requests and transport.** Station requests, with who's taking them. Withdrawn runners, where they are and how they're getting back. Shuttle loads for the 42k start and the Ultra Slam 05:20 cut.
- **Notices and holds** to everyone, runners, crews, one station or one role, as banners and push alerts.
- **Shift handover** for HQ, with open incidents, the watch list and actions.
- **Risk** (the race-morning dynamic risk assessment from the GPT100 app) with the BSF27 Risk Management Plan's triggers and the Emergency Management Plan's holds and lightning protocol.
- **After the event.** Incident report, withdrawals, timeline and radio log exported for the debrief, and the race archive for next year's splits.

## 5. How the handoffs work

Four walk-throughs show the flow end to end. Each step is one tap or less for the person doing it.

**A runner rolls an ankle on the descent from Clearspot.**
1. The runner taps Tell Event HQ (or the tracker's SOS). It lands on the HQ board with their bib, km and what3words.
2. HQ taps Acknowledge. The runner's phone says help is on the way. Find suggests the nearest Safety Officer on foot and the valley roving medic, with ETAs.
3. HQ assigns them. The Safety Officer's phone shows the casualty and route, and they tap On my way.
4. The medic arrives and opens the patient record from the incident. Category 3, walking wounded: walk out to Clearspot with the Safety Officer, withdrawn.
5. The withdrawal goes to the Clearspot Aid Station Manager, timing and the transport list. The runner's crew is told where to collect them. The incident closes with every step timed.

**A runner pulls out at Eurobin Creek.**
1. The Aid Station Manager taps Runner pulling out, the bib and the reason.
2. HQ, timing and the runner's followers see it at once. The runner goes on the transport list and off the watch list. Nobody makes a phone call.

**A runner is overdue at The Chalet.**
1. The watch list flags them: last read leaving Eurobin, due 40 minutes ago, tracker quiet.
2. The Chalet's Due now shows them as still due. The sweep has them as not yet passed.
3. HQ opens an incident from the watch list. Find ranks who is nearest to the runner's estimated position. At 60 minutes the app reminds HQ of the STE-SOP-104 steps.

**A storm trigger is getting close on Saturday afternoon.**
1. The weather watch sends a phone alert and the trigger goes amber on the HQ board, with which runners will be on the plateau and when.
2. HQ starts a risk assessment from the trigger. If a hold is called, it goes to the affected stations, Safety Officers and runners as a notice, and each station confirms it's holding.

## 6. What carries over and what's new

| Carry over from the GPT100 app | Rework | New for Buffalo |
| --- | --- | --- |
| Find: team, parking, walk-in, ETA, carry-out, night factor, escalation warnings | Three separate apps into one with role lanes | Aid Station Manager lane: due now, cut-off clock, withdrawals, report in, requests, holds, handover |
| what3words, stored words offline | Response bases into people on duty (from Running Wild) | Patient record and medical outcome flow |
| GPS-seuranta tracking, RaceResult timing, runner watch | Out and back and multi-session stations | Followers told of withdrawals and cut-offs |
| Weather: triggers, models, ensembles, BOM, CFA, VicEmergency, EPA, simulator | Weather triggers to the BSF27 Risk Management Plan | Restock triggers from field progress |
| Control board: incidents, units, radio log, notices, help requests | Crew tab rules for Buffalo | Multi-race weekends: Grand Slam, Ultra Slam, relay changeovers |
| Risk tab and dynamic risk assessment | Event setup from GPX and the course details sheet (from Running Wild) | Sweep progress and who's still out (shared with Running Wild) |
| Runner app: map, cut-offs, Help, Schedule, Gear, off-course alert | | Volunteer roster import and post check-in |
| Offline first, build numbers, demo mode, crash tests | | Push alerts by role |

## 7. Data the event needs

- **Courses: the 2026 GPX** (decided). The 2027 courses are the same as 2026. The course details sheet's 20k finish leg (7.3 km and 80 m up, against 6.9 km and 67 m up in 2026) is a remeasure, not a course change.
- **Races, cut-offs, crew points, drop bags, relay changeovers and pacers:** the BSF_2027 course details sheet. It already has the columns the app needs, so the setup tool reads it directly.
- **Aid stations and their sessions:** the Aid Station Operation Plan, Part B.
- **Medical posts and care points:** the Medical and Rescue Plan, then Race Day Medical's Event Medical Service Plan.
- **Access points** with drive times from Bright, Porepunkah and the Chalet (race team times for Clearspot, Dingo Ridge and other gated or 4WD tracks).
- **Track grades, emergency markers and helicopter landing sites: not for 2027** (decided). Carry-outs use the "not yet assessed" times across the course. Ambulance intercept points and helicopter landing zones go in once Ambulance Victoria confirms them (Medical and Rescue Plan, open item 6).
- **what3words** for the whole course, stored for offline.
- **The runner list** from Race Roster, and the volunteer roster (section 9).
- **The 2026 Buffalo tracking archive** (Living It Live event `20260328buffalostamp`) to fit real splits for Due now and cut-off predictions, as we did for the GPT100.

## 8. Future proofing

- **One core, many event packs, optional modules.** Every SingleTrack event runs on one codebase. What's different about each event lives in its event pack (courses, stations, posts, triggers, schedule) and in which modules it switches on (tracking, timing, medical, risk, aid stations, crew, relay, multi-race series). Buffalo and the GPT100 switch most of them on; Kilcunda switches on a few. Section 11, item 1 has the reasoning. Confirmed on 24 November: the core lives in this repository, renamed `singletrack-app`, and Running Wild and the GPT100 move onto it.
- **Fixed IDs.** Every event, race, aid station, post, runner and volunteer has an ID that doesn't change year to year, with Race Roster's IDs stored now and our own rego's later.
- **One gateway.** Every private read and write goes through the Worker, so moving from shared passwords to logins only changes the Worker.
- **Feeds as plug-ins.** Trackers, timing mats, phones and station reports all become position and checkpoint feeds of the same shape. A new provider is a new plug-in, not a rebuild.
- **Web first, then the app stores** (decided). The web app goes out first. When it's ready, the same code is wrapped for Android and iPhone (the Running Wild Android build already does this with Capacitor), which also gives background location.
- **GitHub Pages first, then app.singletrack.com.au** (decided). We move when it's at a level we're happy with, and between events, since moving resets saved maps and home screen icons.

## 9. Rego, volunteers and logins

The same plan as section 10 of the Running Wild scope, with Buffalo as the place it first matters at scale.

- **Runners from rego.** 2027 rego is already open, so we use what Race Roster already collects: one import of bib, name, races (including the slams), wave and phone, and the emergency contact if it's there. Crew contacts come from crews following their runner in the app (4.2). Medical notes are captured by the Medical Team at the encounter. For 2028 rego we ask for crew contacts and consented medical notes.
- **Volunteers from the volunteer platform.** The roster (who is at which station, post or sweep, and when) loads into the app, from iVolunteer now and the new volunteer platform when it's ready. Aid Station Managers open the app on their own station. Check-in on the day writes back.
- **Joining on the day.** For 2027: role codes and QR codes on each brief, a station code for each Aid Station Manager, and the staff password for HQ and medical. Later: one SingleTrack sign-in by link or code (no passwords, as the volunteer scope sets out).
- **Data protection.** Patient records and live positions go through the architecture and data protection review agreed on Day 2 before race week, since this is the first time the app holds clinical notes.

## 10. Build plan

Buffalo is six days after Razorback (13 March), and the shared core is due for Kilcunda (31 January).

| Phase | Ready by | What ships |
| --- | --- | --- |
| 0. Decide and gather | 15 December 2026 | 2026 GPX loaded. Course details sheet and Aid Station Operation Plan into the setup tool. 2026 tracking archive pulled |
| 1. Buffalo pack on the core | 31 January 2027 | Courses, stations and sessions, access, weather triggers, Find, field lane, runner and crew lanes with Buffalo crew rules, HQ board. Demo with a made-up Buffalo field |
| 2. Aid stations and handoffs | 28 February 2027 | Aid Station Manager lane, withdrawals to followers and transport, report in, holds, restock triggers, sweep progress, push alerts by role. Tested at Snow Gum Run (shared core) |
| 3. Medical and volunteers | 7 March 2027 | Patient record and outcome flow (once Race Day Medical agrees), volunteer roster import, runner list import, data protection review |
| 4. Rehearsal | 12 March 2027 | Full demo of the weekend with HQ, Aid Station Managers, the Medical Team and Safety Officers. Crash tests. Induction for managers and medics. Code freeze |
| 5. Race weekend | 19 to 21 March 2027 | Live on the web, with a support person in Event HQ |
| 6. Debrief and app stores | April 2027 on | What worked, archive for 2028 splits. Android and iPhone builds. Move to app.singletrack.com.au |

If time runs short, the patient record is the first thing to hold back. Without it, the Medical Team still has the GPT100 medical tools and records status and outcome.

## 11. Decisions

Made on 24 November 2026.

| # | Question | Decision |
| --- | --- | --- |
| 1 | What is Buffalo built on? | One shared core with event packs and optional modules, in this repository (renamed `singletrack-app`). Running Wild and the GPT100 move onto it |
| 2 | One app or separate apps? | One app with role lanes |
| 3 | Aid station volunteers on phones? | Only the Aid Station Manager, for their own station: withdrawals, requests and reporting in. Timing mats and trackers cover who has passed |
| 4 | Medical records? | Race Day Medical (likely). Full patient record in the app, ideally |
| 5 | Rego questions for crew and medical? | 2027 rego is already open. Use what Race Roster collects; crews opt in by following their runner |
| 6 | Timing and tracking? | Living It Live, using RaceResult. They tracked Buffalo 2026 |
| 7 | Web or app stores? | Web only to start. Android and iPhone once it's ready |
| 8 | Where does it live? | GitHub Pages until we're happy with it, then app.singletrack.com.au |
| 9 | Languages? | English, with the language setup kept |
| 10 | Track grades and helicopter sites? | Go without for 2027. Carry-outs use "not yet assessed" times |
| 11 | Course data? | The 2026 GPX and the BSF_2027 course details sheet |
| 12 | 42k final cut-off? | 18:00. The course details sheet's 17:50 is to be corrected |
| 13 | Bakers Gully on Saturday? | The 20k |
| 14 | Field sizes? | The 2027 targets in Damon's entry report (section 2) |

**Item 1, the reasoning.** Buffalo and the GPT100 are more complex than the Running Wild events, but the complexity is mostly in their data and in extra features, not in a different way of working. Running Wild is already about 90% the GPT100's code. Kept as separate copies, every fix and improvement has to be made three times, and the copies drift apart (the GPT100 code names the GPT100 in about 300 places). One core with event packs and switchable modules means Buffalo's new aid station and medical lanes are there for the GPT100 and Running Wild for free. The guard rails: each event runs its own crash tests and demo before release, and each event locks to a tested build a week out, so a change for Kilcunda can never break Buffalo's race week. If the core isn't ready by the end of January, Buffalo starts from a copy and merges back after the Prom, so the fallback costs time, not the event.

## 12. Still open

| # | Item | Owner |
| --- | --- | --- |
| 1 | Race Day Medical to agree to record patients in the app, and to the data protection review | Operations Manager |
| 2 | Correct the 42k final cut-off to 18:00 in the course details sheet | Course Manager |
| 3 | Living It Live: live access to the 2027 timing and tracking feeds, and the 2026 archive | Operations Manager |
| 4 | Aid Station Managers named for each station, so their station codes can be issued | Volunteer Coordinator |
