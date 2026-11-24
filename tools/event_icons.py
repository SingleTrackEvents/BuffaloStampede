"""Each event's home screen icons and install files (events/<id>/icon-*.png, manifest-staff|field|runner.webmanifest).

    python3 tools/event_icons.py [event id ...]     (all events in events/events.js when none are named)

The icon is the event's header logo (logo.png, light on dark) centred on the event's colour (color in events.js).
An event can supply its own icon-512.png instead: put it in the event's folder and it is used for every size.
The install files open the app on that event (start_url ...?event=<id>), with the event's own name.
"""
import json, os, re, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
src = open(os.path.join(ROOT, 'events', 'events.js')).read()
ids = re.findall(r"\{\s*id: '([a-z0-9-]+)'", src)
def field(eid, k, d=None):
    m = re.search(r"id: '%s'[^}]*?\b%s: '([^']*)'" % (re.escape(eid), k), src, re.S)
    return m.group(1) if m else d
APPS = {'staff': ('Safety', 'index.html', 'Race-day safety: where a spot is on the course, the Control board and the field phones.'),
        'field': ('Field', 'field.html', 'For Safety Officers, sweeps, aid stations and medics: where am I, the nearest way out, local weather and send my location.'),
        'runner': ('Runner', 'runner.html', 'For runners and crews: your race on the map, where you are, the next aid station and cut-off, and help.')}
for eid in sys.argv[1:] or ids:
    d = os.path.join(ROOT, 'events', eid); name = field(eid, 'name', eid); col = field(eid, 'color', '#1d1d1b')
    own = os.path.join(d, 'icon-512.png')
    if os.path.exists(own) and not os.path.exists(os.path.join(d, '.icon-made')):
        base = Image.open(own).convert('RGBA')
    else:
        logo = Image.open(os.path.join(d, 'logo.png')).convert('RGBA')
        base = Image.new('RGBA', (512, 512), col)
        w = int(512 * 0.78); logo = logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS)
        base.alpha_composite(logo, ((512 - logo.width) // 2, (512 - logo.height) // 2))
        open(os.path.join(d, '.icon-made'), 'w').write('icon-512.png was made by tools/event_icons.py from logo.png\n')
    for sz in (48, 180, 192, 512):
        base.convert('RGB').resize((sz, sz), Image.LANCZOS).save(os.path.join(d, 'icon-%d.png' % sz), optimize=True)
    for kind, (word, page, desc) in APPS.items():
        m = {'name': name + ' ' + word, 'short_name': (field(eid, 'short', name) + ' ' + word)[:12] if kind != 'staff' else field(eid, 'short', name)[:12],
             'description': name + '. ' + desc, 'id': '../../%s?event=%s' % (page, eid), 'start_url': '../../%s?event=%s' % (page, eid), 'scope': '../../',
             'display': 'standalone', 'background_color': col, 'theme_color': col,
             'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
                       {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}
        json.dump(m, open(os.path.join(d, 'manifest-%s.webmanifest' % kind), 'w'), indent=2)
    print(eid, name, col)
