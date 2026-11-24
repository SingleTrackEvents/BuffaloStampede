# Medical and Risk, rethought

Draft v0.2, 24 November 2026. v0.2 records the decisions (section 6) and what's built (section 7). Prepared for Chad Freak, Operations Manager.

At the GPT100 the app's Medical tab and Risk tab weren't very functional. This sets out why, from what happened on the weekend, and what we build in their place for Buffalo 2027 and every event after it.

Built from: the GPT100 2026 Medical and Safety Post-Event Review v1.1, the GPT Post-Event Debrief (17 November), the GPT100 Post-Event Operations Review v1.0, the BSF27 Medical and Rescue Plan v0.1, and the GPT100 app's Medical and Risk tabs as they were.

## 1. What went wrong at the GPT100

### Medical

The Medical tab showed the **medical plan**: who was rostered where, runner numbers by hour and vehicle movements, with a time slider. It never held what actually happened. That all went into three WhatsApp groups instead, and the review shows the cost:

- **Most care was never recorded.** Race Day Medical reported 244 presentations. The medical group holds 98. The Dunkeld finish, the busiest post, is almost invisible (69 reported on Sunday, 5 logged).
- **Withdrawals got lost between groups.** Medical withdrawals had to be forwarded to the DNF group, and three never arrived. Two runners were only confirmed DNF next morning, from their trackers.
- **Clinical detail went on group chats.** Surnames and conditions were posted in the medical group, against our own rule of bib and first name only.
- **Transport was the slowest link.** An overnight extraction took 53 minutes from asking for a medical vehicle to it reaching the trailhead. An ambulance was nearby but needed the doctor's permission. A gate on the route was locked, and nobody knew for 38 minutes.
- **The plan and the day drifted apart.** Dunkeld opened after the first finisher. Borough Huts lost its medic at 23:00 with runners still due to 02:15. The SRU lead was asleep on call, then stood down before Sunday's two biggest calls. Medics waited hours for lifts. None of this showed anywhere until someone noticed.
- **What worked was people passing runners along.** Safety Officers flagging a runner of concern to the next post (the overnight "baton relay") caught several before they became incidents. That has no home in the app.
- **No report came out of it.** The breakdown by post, race, hour and outcome that we need to plan 2027 had to be rebuilt by hand from chat exports, and it's still incomplete.

### Risk

The Risk tab was the Risk Management Plan's Appendix A as a form: filled in at the race-morning meeting, signed off, then flagged for review when a trigger moved. It was thorough, but:

- It was a **meeting tool, not a race tool**. Decisions on the weekend were made on the phone and over the radio, and the form didn't follow them.
- It watched the **weather** well but couldn't see the **operational** risks that actually bit: posts without cover, comms down (Yarram Gap off air for 23 minutes), a transport gap, a cluster of presentations at one post.
- Filling it took time the people who'd use it didn't have mid-event.

Confirmed on 24 November: too long to fill in, not used during the race, and it missed the operational risks.

## 2. The idea

Stop treating Medical and Risk as documents to look at. Make them the **live record of the weekend** that everyone already contributes to without extra work, with the plan and the paperwork falling out of that record.

## 3. Medical, rebuilt

### 3.1 One log for everything medical

Every presentation, anywhere on course, is logged once in the app. That one entry replaces the medical, safety and DNF group posts.

- **Three taps.** Bib (name, race and post fill themselves), what it is (a short list: skin, musculoskeletal, gut, exhaustion or dehydration, cold, heat, head, snake bite, cardiac or breathing, other), and outcome (continued, withdrawn, transported).
- **Minor care counts too.** A **+1 minor** button for a band-aid or ice pack, so the totals are complete without logging every blister.
- **A withdrawal is a withdrawal everywhere.** Outcome "withdrawn" goes straight to HQ, timing, the transport list and anyone following the runner. No forwarding, nothing lost.
- **Clinical notes stay clinical.** Observations and treatment sit in the medical lane only. Anything the app shares to a group uses bib and first name, as STE-SOP-302 says.
- **Who can log.** Medics on any post. Safety Officers and Aid Station Managers can log a runner as seen and the outcome, so a withdrawal at a post with no medic is still captured.

### 3.2 Runners of concern

The "baton relay", built in. Anyone can flag a runner of concern with a reason ("shaky and cold at Clearspot"). The next post on their course sees them as **watch for**, with the reason, and taps **seen** when they come through. A flagged runner who doesn't arrive goes on HQ's watch list.

### 3.3 Getting a patient out

- **Need transport** on any incident shows the medical and event vehicles nearest the access point, with what each is doing now. The request goes to that crew's phone with a timer until they acknowledge.
- **The nearest vehicle goes by default**, as the review recommends, with the Medical Director told, not asked.
- **Extraction points** (trailheads, 4WD limits, gates) are pinned on the map with gate codes or key holders, visible to Safety Officers, medics and HQ only.

### 3.4 Cover, as it is, not as planned

- **On post.** Medics and Safety Officers tap on and off post. HQ sees real cover against the plan.
- **Cover warnings, worked out from the field.** The app compares each post's open and close times with where the runners actually are:
  - "The Chalet opens 08:39. The leader is due 08:20."
  - "Eurobin's medic goes off at 02:30 with 31 runners still due before the 01:40 cut-off."
- **Shift changes** list who moves where, in which vehicle, with which driver, so nobody waits for a lift.
- The plan view stays as a reference, but it's the second thing you see, not the first.

### 3.5 The report writes itself

After the weekend: presentations by post, race, hour, type and outcome; withdrawals by reason; transports and agencies; response times for every incident. That's the 2027 planning breakdown, without the chat exports.

## 4. Risk, rebuilt

### 4.1 Conditions board

One screen that's always current, for the Event Manager and HQ. Each line is green, amber or red, with the Risk Management Plan's pre-agreed response ready to act on.

- **Weather and fire.** The GPT100 triggers as they are: wind, heat, cold, storms, rain, smoke, fire, BOM warnings and CFA ratings.
- **Medical load, from the log.** For example, the plan's own rule: three heat presentations anywhere in an hour goes to the Event Manager and Medical Director. Presentations per post per hour against normal.
- **Cover.** Any post without the cover the plan says it should have. SRU or the Medical Director unavailable.
- **Comms.** A station that hasn't reported in for its 2-hour check, or has gone quiet.
- **Field.** Runners still out after dark, overdue runners, open incidents, and runners near a cut-off at a remote post.

### 4.2 Decisions, logged as they're made

When a line goes amber or red, the app offers the plan's response: hold, modify, delay, suspend, or no change. The Event Manager taps one and adds a few words. The app then:

- **Records it.** Who, when, why and the conditions at the time.
- **Assigns the actions.** Who does what, by when.
- **Drafts the messages.** The notice to the affected stations and runners.
- **Hands off a hold.** If it's a hold, it goes to the Aid Station Managers to confirm.

A Medical Director's request for a hold is logged whether or not it's adopted, as the Medical and Rescue Plan requires.

### 4.3 Scheduled checks, short

The race-morning meeting, each HQ shift change, and the every-6-hours review become short checklists, filled in from the Conditions board with five to eight items to confirm. Signing off takes one tap. The full Appendix A record is still produced for the file.

### 4.4 After the event

The decisions log, the conditions at each decision, and the risk register scores reviewed. That's the incident report and the RMP review, ready to edit.

## 5. Who sees what

| | Medical log | Clinical notes | Runners of concern | Conditions board | Decisions |
| --- | --- | --- | --- | --- | --- |
| Event Manager and HQ | Yes | No | Yes | Yes | Yes |
| Medical Team | Yes | Yes | Yes | Yes | See and request |
| Safety Officers | Their own entries | No | Yes | No | Notices only |
| Aid Station Managers | Their station | No | Their station | No | Holds and notices |

## 6. Decisions

Made on 24 November 2026.

| # | Question | Decision |
| --- | --- | --- |
| 1 | What made the GPT100 Risk tab not functional? | Too long to fill in, not used during the race, and it missed the operational risks |
| 2 | Who logs medical? | The medics themselves, on their phones. Safety Officers and Aid Station Managers can log a withdrawal where there's no medic |
| 3 | Nearest vehicle goes? | Yes: the nearest medical or event vehicle goes by default, and the Medical Director is told, not asked |
| 4 | What first? | The medical log and withdrawals |

Still open: asking Race Day Medical, in the 2027 agreement, to log in the app and agree the short post format.

## 7. Built (24 November 2026)

**The medical log and withdrawals** (section 3.1), live for Buffalo:

- **Field app, Log tab.**
  - Medics sign in with the **medical code**. They log the bib, what it is, the outcome and optional clinical notes in a few taps, plus **+1 minor care**.
  - Safety Officers and Aid Station Managers sign in with the **team code** and log a withdrawal with its reason.
  - The post comes from a list, or **Nearest to me**.
  - Entries wait on the phone with no signal and send when there is. Sending twice changes nothing.
- **Staff app, Medical tab.** Event HQ sees the totals (seen, minor care, withdrawn, to hospital), every post with its counts, and the latest entries, refreshed every 30 seconds.
  - **Download report** gives the spreadsheet by time, day, hour, post, bib, type, outcome and reason, for the post-event review.
  - HQ sets the medical code here.
  - Clinical notes never reach HQ.
- **A withdrawal, once.** It goes into HQ's log ("Bib 123 withdrawn at Eurobin Creek at 17:07 (seen by medical)"), and everyone following that runner gets an alert with where to collect them.
- **Checked.** A browser test runs HQ, a medic and an Aid Station Manager end to end against the Worker, and 13 Worker checks cover the codes, the notes and retries.

**Runners of concern** (section 3.2), live for Buffalo:

- **Watch for.** On the Log tab, anyone signed in flags a bib with what the next post should look for. Every post sees the runner under **Watch for**, taps **Seen here** as they come through, and the Medical Team (or whoever flagged them) taps **All clear**.
- **Closing.** A runner who withdraws afterwards comes off the list on their own.
- **HQ.** The Medical tab lists the open runners of concern, longest unseen first, with where and when each was last seen. A runner unseen for over an hour is marked (STE-SOP-104's 60 minute threshold). The flag and each sighting go into HQ's log.
- **Team code limits.** It can flag, see and withdraw, but can't log medical care (the Worker refuses it).

Next, in order: transport requests with the nearest vehicle going (3.3), cover warnings (3.4), then the Conditions board and decisions (section 4).
