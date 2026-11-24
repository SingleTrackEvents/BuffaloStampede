"""Buffalo Stampede 2027: build the event pack (events/buffalo-2027/) from Joe's 2026 GPX files and the 2027 course
details sheet.

    python3 tools/events/buffalo/build.py

Reads events/buffalo-2027/gpx/ (100k.gpx, 42k.gpx, 20k.gpx, 10k.gpx, 5k.gpx: Drive "BSF_2026_<race>.gpx", Joe Dorph,
March 2026; the 5k is "Buffalo+Stampede+5k+2026.gpx"). The 2027 courses are the same as 2026 (scope v0.3, decision 11).

Race figures (distance, climb and descent at each point, first runner time, cut-off, crew, drop bags, relay changes,
pacers) are typed in below from the BSF_2027 course details sheet (Course Manager, Drive), so the app shows the
official figures. The GPX gives where each point is on the map (gk, the km on the line). The 42k final cut-off is
18:00 (scope decision 12; the sheet's 17:50 is to be corrected). Start times for the 5k and 2k are from the BSF27
Medical and Rescue Plan v0.1 (from the EMP v3).

Not in the pack yet, and why (scope v0.3, section 12): drive times (no checked routes yet, so Find gives the walk from
each access point but no drive), track grades and helicopter landing sites (decision 10: not for 2027), Safety Officer
posts (not set), the medical plan and risk register (Race Day Medical not yet signed), stored what3words, fitted
splits (the 2026 Living It Live archive isn't pulled yet), the 2km Kids Trail map (only a .tcx file in Drive), the race
medical phone number and the mandatory gear lists (not confirmed, so not shown).
"""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from gpx_lib import read_gpx, smooth_ascent, passes

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'events', 'buffalo-2027')
GPX = os.path.join(OUT, 'gpx')
VILLAGE = 'Pioneer Park, Bright'
FRI, SAT, SUN = '2027-03-19', '2027-03-20', '2027-03-21'

def js(name, var, value, header):
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(header.rstrip() + '\n')
        f.write('window.%s = %s;\n' % (var, json.dumps(value, separators=(',', ':'))))

def wpt_index(route, wpts, name, after_km=-1):
    """Route index of the first pass of a named waypoint after after_km."""
    w = [x for x in wpts if x[0] == name]
    if not w: raise SystemExit('No waypoint named %r (have: %s)' % (name, ', '.join(x[0] for x in wpts)))
    for i, _ in passes(route, w[0][1], w[0][2], 120):
        if route[i][2] > after_km: return i
    raise SystemExit('No pass of %r after km %.1f' % (name, after_km))

# The course details sheet, typed in: (name, kind, sheet km, up, down, first runner, cut-off, crew, drop, team, pacer).
# Times are 'D HH:MM' with D the day (FRI, SAT or SUN). None for no cut-off.
SHEET = {
    '100k': [
        ('Start, ' + VILLAGE, 'start', 0, 0, 0, (SAT, '06:00'), (SAT, '06:00'), 'yes', False, False, False),
        ('Clearspot', 'aid', 9, 890, 215, (SAT, '06:58'), (SAT, '08:30'), 'yes', False, False, False),
        ('Buckland Valley', 'aid', 18.3, 1125, 1150, (SAT, '07:42'), (SAT, '10:30'), 'yes', False, False, False),
        ('Eurobin Creek', 'aid', 26.5, 1475, 1475, (SAT, '08:24'), (SAT, '12:10'), 'yes', True, True, False),
        ('The Chalet', 'aid', 36.9, 2575, 1555, (SAT, '09:39'), (SAT, '15:10'), 'yes', False, False, False),
        ('Cresta Valley', 'aid', 46.2, 2937, 1775, (SAT, '10:29'), (SAT, '17:30'), 'yes', True, True, False),
        ('Cresta Valley (second visit)', 'aid', 53.4, 3197, 2035, (SAT, '11:07'), (SAT, '19:30'), 'yes', True, False, False),
        ('The Chalet (second pass)', 'aid', 65.4, 3453, 2435, (SAT, '12:07'), (SAT, '22:50'), 'yes', False, False, True),
        ('Eurobin Creek (second pass)', 'aid', 75.8, 3533, 3535, (SAT, '12:57'), (SUN, '01:40'), 'yes', True, True, True),
        ('Buckland Valley (second pass)', 'aid', 84, 3858, 3885, (SAT, '13:41'), (SUN, '04:40'), 'yes', False, False, True),
        ('Clearspot (second pass)', 'aid', 91.6, 4658, 3980, (SAT, '14:41'), (SUN, '07:30'), 'yes', False, False, True),
        ('Finish, ' + VILLAGE, 'finish', 100.1, 4810, 4810, (SAT, '15:28'), (SUN, '10:00'), 'yes', False, False, True),
    ],
    '42k': [
        ('Start, Mt Buffalo', 'start', 0, 0, 0, (SUN, '07:20'), (SUN, '07:20'), 'no', False, False, False),
        ('The Chalet', 'aid', 7.7, 253, 245, (SUN, '07:53'), (SUN, '09:10'), 'no', False, False, False),
        ('Eurobin Creek', 'aid', 18.1, 333, 1345, (SUN, '08:33'), (SUN, '11:15'), 'yes', False, False, False),
        ('Buckland Valley', 'aid', 26.3, 658, 1695, (SUN, '09:08'), (SUN, '12:50'), 'yes', False, False, False),
        ('Dingo Ridge water point', 'water', 28.9, 935, 1695, (SUN, '09:24'), None, 'yes', False, False, False),
        ('Clearspot', 'aid', 33.9, 1458, 1790, (SUN, '09:59'), (SUN, '15:20'), 'yes', False, False, False),
        ('Bakers Gully', 'aid', 38.8, 1578, 2460, (SUN, '10:21'), None, 'yes', False, False, False),
        ('Finish, ' + VILLAGE, 'finish', 42.4, 1610, 2620, (SUN, '10:36'), (SUN, '18:00'), 'yes', False, False, False),
    ],
    '20k': [
        ('Start, ' + VILLAGE, 'start', 0, 0, 0, (SAT, '07:30'), (SAT, '07:30'), 'yes', False, False, False),
        ('Mystic', 'aid', 3.6, 473, 10, (SAT, '07:52'), (SAT, '08:50'), 'no', False, False, False),
        ('Bakers Gully', 'aid', 8.3, 724, 601, (SAT, '08:16'), (SAT, '10:30'), 'yes', False, False, False),
        ('Clearspot', 'aid', 12.9, 1331, 653, (SAT, '08:49'), (SAT, '12:30'), 'yes', False, False, False),
        ('Finish, ' + VILLAGE, 'finish', 20.2, 1411, 1411, (SAT, '09:15'), (SAT, '14:30'), 'yes', False, False, False),
    ],
    '10k': [
        ('Start, ' + VILLAGE, 'start', 0, 0, 0, (FRI, '18:00'), (FRI, '18:00'), 'no', False, False, False),
        ('Mystic', 'aid', 3.7, 473, 10, (FRI, '18:22'), (FRI, '19:30'), 'no', False, False, False),
        ('Finish, ' + VILLAGE, 'finish', 10.5, 518, 518, (FRI, '18:46'), (FRI, '21:00'), 'no', False, False, False),
    ],
}
# Each sheet point's waypoint in the GPX (the 2026 names), in course order.
WPT = {
    '100k': ['#1 Clearspot', '#2 Buckland Valley', '#3 Eurobin Creek', '#4 - The Chalet', '#5 Cresta Valley', '#6 Cresta Valley',
             '#7 - The Chalet', '#8 Eurobin Creek', '#9 Buckland Valley', '#10 Clearspot'],
    '42k': ['#1 - The Chalet', '#2 Eurobin Creek', '#3 - Buckland Valley', 'Water Point', '#4 Clearspot', '#5 Bakers Gully'],
    '20k': ['#1 Mystic', '#2 Bakers Gully', '#3 Clearspot'],
    '10k': ['Aid Station - Mystic Launch'],
}

def place(cid, route, wpts):
    """Route index of every sheet point: start, the waypoints in order, finish."""
    idx, km = [0], 0.5  # never the start line itself (the 42k starts beside The Chalet and passes it at 7.7 km)
    for name in WPT[cid]:
        i = wpt_index(route, wpts, name, km); idx.append(i); km = route[i][2] + 0.3
    idx.append(len(route) - 1)
    assert len(idx) == len(SHEET[cid]), cid
    return idx

def points(cid, route, idx):
    out = []
    for row, i in zip(SHEET[cid], idx):
        name, kind, km, up, down, first, cut, crew, drop, team, pacer = row
        p = {'name': name, 'kind': kind, 'km': km, 'gk': round(route[i][2], 3), 'up': up, 'down': down,
             'first': '%sT%s' % first, 'cutoff': '%sT%s' % cut if cut else None, 'drop': drop, 'crew': crew}
        if team: p['team'] = True
        if pacer: p['pacer'] = True
        out.append(p)
    return out

def main():
    G = {c: read_gpx(os.path.join(GPX, c + '.gpx')) for c in ['100k', '42k', '20k', '10k', '5k']}
    r100, w100 = G['100k']
    idx = {c: place(c, G[c][0], G[c][1]) for c in SHEET}
    up, _ = smooth_ascent(r100)

    # ---------- the 100k, the main course ----------
    # Vehicle access: the village and the aid stations crews and event vehicles drive to. No drive times yet.
    def access(name, route, i, note=''):
        p = route[i]
        a = {'name': name, 'lat': p[0], 'lon': p[1], 'trail_km': p[2], 'off_m': 0, 'aid': True, 'conn_m': 0, 'conn_geom': None, 'reliable': False}
        if note: a['note'] = note
        return a
    i = idx['100k']
    acc = [
        access(VILLAGE + ' (Start)', r100, i[0], 'Event Village, Event HQ and the Medical Base'),
        access('Clearspot', r100, i[1], 'Bakers Gully Rd, Clearspot Rd, then Demon Ridge Track: about 30 minutes, 4WD recommended. Do not use Google Maps.'),
        access('Buckland Valley', r100, i[2], 'Harris Lane, Buckland Valley (sealed). Residential street: keep driveways clear.'),
        access('Eurobin Creek', r100, i[3], 'Eurobin Creek Picnic Area, 575 Mount Buffalo Rd. Weak mobile coverage: Starlink at the station.'),
        access('The Chalet', r100, i[4], 'Mt Buffalo Chalet car park. Closed to the public Saturday 09:00 to 18:00; shuttles from Dingo Dell.'),
        access('Cresta Valley', r100, i[5], 'Cresta Valley car park, Mount Buffalo Rd. Saturday only.'),
        access(VILLAGE + ' (Finish)', r100, i[-1]),
    ]
    course = {'name': 'Buffalo Stampede 100k', 'label': '100k', 'total_km': round(r100[-1][2], 1), 'total_ascent_m': up,
              'bases': {'br': [r100[0][1], r100[0][0]]}, 'route': r100, 'access': acc, 'crossings': [], 'bases_w3w': {}}
    js('course.js', 'GPT100_DATA', course, """// Buffalo Stampede 2027, the 100k (the main course): route [lat, lon, km, height m], the response base (Pioneer Park,
// Bright), vehicle access and aid stations. Made by tools/events/buffalo/build.py from Joe's 2026 GPX (the 2027 course
// is the same). No drive times yet, so Find gives the walk from each access point but no drive.""")

    # ---------- 42k, 20k and 10k: courses of their own ----------
    def stops(cid, route):
        return [{'name': row[0], 'lat': route[j][0], 'lon': route[j][1], 'km': route[j][2], 'kind': row[1]} for row, j in zip(SHEET[cid], idx[cid])]
    courses = []
    for cid, name in [('42k', 'Buffalo Stampede SkyMarathon 42k'), ('20k', 'Buffalo Stampede SkyRun 20k'), ('10k', 'Buffalo Stampede Twilight 10k')]:
        r = G[cid][0]
        courses.append({'id': cid, 'name': name, 'label': cid, 'note': '', 'total_km': round(r[-1][2], 1), 'total_ascent_m': smooth_ascent(r)[0],
                        'stops': stops(cid, r), 'joins': {}, 'route': r})
    js('courses.js', 'GPT100_COURSES', courses, """// Buffalo Stampede 2027: the 42k, 20k and 10k, alongside the 100k in course.js (tools/events/buffalo/build.py).
// Stop names match the race points in races.js, so the apps place each race on its own line by name.""")

    # ---------- the 5k: the runner and field apps' maps ----------
    r5 = G['5k'][0]
    rc = {'5k': {'id': '5k', 'name': 'Buffalo Stampede 5km Family Trail', 'total_km': round(r5[-1][2], 3),
                 'stops': [{'name': 'Start, ' + VILLAGE, 'kind': 'start', 'km': 0, 'lat': r5[0][0], 'lon': r5[0][1]},
                           {'name': 'Finish, ' + VILLAGE, 'kind': 'finish', 'km': r5[-1][2], 'lat': r5[-1][0], 'lon': r5[-1][1]}], 'route': r5}}
    js('runner-courses.js', 'GPT_RUNNER_COURSES', rc, """// Buffalo Stampede 2027: the 5km Family Trail for the runner and field apps' maps (tools/events/buffalo/build.py).
// The 2km Kids Trail has no map yet: Drive only has it as a .tcx file.""")

    # ---------- races and cut-offs ----------
    stages = {c: {'id': c, 'label': c, 'course': '100' if c == '100k' else c, 'points': points(c, G[c][0], idx[c])} for c in SHEET}
    stages['5k'] = {'id': '5k', 'label': '5k', 'course': '5k', 'points': [
        {'name': 'Start, ' + VILLAGE, 'kind': 'start', 'km': 0, 'gk': 0, 'up': 0, 'down': 0, 'first': SAT + 'T08:00', 'cutoff': SAT + 'T08:00', 'drop': False, 'crew': 'no'},
        {'name': 'Finish, ' + VILLAGE, 'kind': 'finish', 'km': 5, 'gk': round(r5[-1][2], 3), 'up': 0, 'down': 0, 'first': SAT + 'T08:20', 'cutoff': SAT + 'T09:30', 'drop': False, 'crew': 'no'}]}
    stages['2k'] = {'id': '2k', 'label': '2k', 'points': [
        {'name': 'Start, ' + VILLAGE, 'kind': 'start', 'km': 0, 'up': 0, 'down': 0, 'first': SAT + 'T08:45', 'cutoff': SAT + 'T08:45', 'drop': False, 'crew': 'no'},
        {'name': 'Finish, ' + VILLAGE, 'kind': 'finish', 'km': 2, 'up': 0, 'down': 0, 'first': SAT + 'T08:53', 'cutoff': SAT + 'T09:30', 'drop': False, 'crew': 'no'}]}
    races = {'stages': stages, 'races': [
        {'id': '100k', 'label': 'Buffalo Stampede 100k', 'short': '100k', 'course': '100', 'stages': ['100k']},
        {'id': 'relay', 'label': '100k Team Relay', 'short': 'Relay', 'course': '100', 'stages': ['100k']},
        {'id': '42k', 'label': 'SkyMarathon 42k', 'short': '42k', 'course': '42k', 'stages': ['42k']},
        {'id': '20k', 'label': 'SkyRun 20k', 'short': '20k', 'course': '20k', 'stages': ['20k']},
        {'id': '10k', 'label': 'Twilight 10k', 'short': '10k', 'course': '10k', 'stages': ['10k']},
        {'id': 'grand', 'label': 'Grand Slam (10k, 20k, 42k)', 'short': 'Grand Slam', 'course': '10k', 'stages': ['10k', '20k', '42k']},
        {'id': 'ultra', 'label': 'Ultra Slam (10k, 100k, 42k)', 'short': 'Ultra Slam', 'course': '10k', 'stages': ['10k', '100k', '42k'],
         'note': 'Finish the 100k by 05:20 Sunday to catch the shuttle to the 42k start.'},
        {'id': '5k', 'label': '5km Family Trail', 'short': '5k', 'course': '5k', 'stages': ['5k']},
        {'id': '2k', 'label': '2km Kids Trail', 'short': '2k', 'course': '2k', 'stages': ['2k']}]}
    js('races.js', 'GPT_RACES', races, """// Buffalo Stampede 2027 races, Melbourne local time (tools/events/buffalo/build.py). Distances, climb, first runner
// times, cut-offs, crew points, drop bags (drop), relay changeovers (team) and pacers (pacer, from the second pass of
// The Chalet) from the BSF_2027 course details sheet. gk is each point's km on the GPX line. The slams are stage races:
// each stage keeps its own course. 42k final cut-off 18:00 (scope decision 12).""")

    # ---------- pacing for the weather (the 100k, the longest day out) ----------
    pts = stages['100k']['points']
    pacing = {'miler': {'label': 'Buffalo Stampede 100k', 'points': [{'km': p['km'], 'name': p['name'], 'fast': p['first'], 'slow': p['cutoff']} for p in pts]}}
    js('pacing.js', 'GPT100_PACING', pacing, """// Runner pacing for the weather (watch, timeline and simulator): the 100k's first runner and the cut-offs, from the
// course details sheet (tools/events/buffalo/build.py). Key 'miler' is the app's name for the main race.""")

    # ---------- the Mt Buffalo plateau, for the cloud advisory ----------
    high = [p[2] for p in r100 if p[3] is not None and p[3] >= 1300]
    plateau = {'name': 'Mt Buffalo plateau', 'fromKm': round(min(high), 1), 'toKm': round(max(high), 1)} if high else None

    # ---------- posts, and the parts not in the pack yet ----------
    js('safety-officers.js', 'GPT100_SO', {'t0': SAT + 'T05:00:00', 'n': 0, 'stations': [], 'posts': []},
       '// Buffalo Stampede 2027 Safety Officer and marshal posts: not set yet (tools/events/buffalo/build.py).')
    for name, var, note in [('track-grades.js', 'GPT100_TRACK', 'No track grades for Buffalo (scope decision 10): carry-outs use the "not yet assessed" times.'),
                            ('helipads.js', 'GPT100_HELIPADS', 'No helicopter landing sites for Buffalo yet (scope decision 10; Ambulance Victoria to confirm landing zones).'),
                            ('splits.js', 'GPT_SPLITS', 'No fitted splits yet: the 2026 Living It Live archive is still to be pulled.'),
                            ('contingency.js', 'GPT100_CONTINGENCY', 'No contingency course.'),
                            ('demo-runners.js', 'GPT100_DEMO', 'No demo runners for Buffalo yet.')]:
        js(name, var, None, '// ' + note + ' (tools/events/buffalo/build.py)')
    js('course-w3w.js', 'GPT100_COURSE_W3W', {}, '// No stored what3words along the Buffalo courses yet: with no signal the apps give the position as numbers.')
    js('access-edits.js', 'GPT100_EDITS', {'custom': [], 'hidden': []}, '// Published access point edits (none yet for Buffalo).')
    js('medplan.enc.js', 'GPT100_MEDPLAN_ENC', None, '// No medical plan yet: Race Day Medical is being engaged (BSF27 Medical and Rescue Plan v0.1). The Medical tab stays locked.')
    js('register.enc.js', 'GPT100_REGISTER_ENC', None, '// No risk register in the app yet (BSF27 Risk Register v1.4 to import with tools/import_register.mjs).')
    js('crew-drives.js', 'GPT_CREW_DRIVES', {'made': None, 'published': None, 'pts': [], 'min': [], 'km': [], 'roadMin': []},
       '// No drive times between the Buffalo crew points yet (tools/crew_drives.mjs): the Crew tab gives no leave-by time until they are in.')

    print('100k %.2f km on the GPX (sheet 100.1), +%d m; stations at %s' % (r100[-1][2], up, ', '.join('%.1f' % r100[j][2] for j in idx['100k'])))
    for c in ['42k', '20k', '10k', '5k']:
        r = G[c][0]; print('%s %.2f km on the GPX%s' % (c, r[-1][2], '; stops at ' + ', '.join('%.1f' % r[j][2] for j in idx[c]) if c in idx else ''))
    print('plateau', plateau)
    return plateau

if __name__ == '__main__':
    main()
