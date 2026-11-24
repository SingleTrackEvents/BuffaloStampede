"""Buffalo Stampede 2027: each aid station's stock list for the stocktake, and the yard's (events/buffalo-2027/stock.js).

    python3 tools/events/buffalo/stock.py path/to/BSF_2027_Aid_Station_Consumptions.csv

The CSV is the BSF_2027 Aid Station Consumptions sheet (Drive, Course Manager), exported as CSV (first tab). This reads
its "TOTALS / PACK LISTS" tables (Friday, Saturday and Sunday Totals): every item packed for each station, in the unit
it's packed in (cans for Coke and ginger beer, boxes for bananas and oranges). A station's list is every item it's
sent on any day, with the most it's sent on one day as the planned amount.

The restock triggers are from the BSF27 Aid Station Operation Plan v0.3, section 05, and the yard and coolroom
locations from its sections 05 and 06. Edit them below.
"""
import csv, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'events', 'buffalo-2027', 'stock.js')
# The sheet's station names, as the app names them (races.js). Dingo Ridge is unmanned: no stocktake.
NAMES = {'Mystic': 'Mystic', 'Clearspot': 'Clearspot', 'Bakers': 'Bakers Gully', 'Bakers Gully': 'Bakers Gully', 'Buckland': 'Buckland Valley',
         'Eurobin': 'Eurobin Creek', 'Chalet': 'The Chalet', 'Cresta': 'Cresta Valley', 'Finish Line': 'Pioneer Park, Bright'}
TRIGGERS = [
    {'id': 'r100-1', 'name': '100k restock 1', 'when': '40% of the 100k field through Buckland Valley outbound', 'est': '2027-03-20T09:30',
     'to': ['Buckland Valley', 'Eurobin Creek'], 'note': 'From the main village coolroom, before 12:00 Saturday.'},
    {'id': 'r100-night', 'name': '100k overnight restock', 'when': 'First 100k runners inbound at Eurobin Creek', 'est': '2027-03-20T12:57',
     'to': ['Eurobin Creek', 'Buckland Valley', 'Clearspot'], 'note': 'Hot food and night stock for the second passes.'},
    {'id': 'r42', 'name': '42k stock', 'when': 'Saturday after 17:00', 'est': '2027-03-20T17:00',
     'to': ['Eurobin Creek', 'Buckland Valley', 'Clearspot', 'Bakers Gully'], 'note': 'Sunday\'s 42k stock in place before the overnight crews leave.'},
]
YARD = ['Yard', 'Main coolroom (village)', 'Ovens Valley coolroom (village concourse)', 'Dawsons coolroom 1 (Pioneer Park)', 'Dawsons coolroom 2 (Pioneer Park)']

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def main(path):
    rows = list(csv.reader(open(path, newline='')))
    items, stations = {}, {}
    i = 0
    while i < len(rows):
        r = rows[i]
        if r and r[0].strip() in ('Friday Totals', 'Saturday Totals', 'Sunday Totals'):
            day = r[0].split()[0]
            h = next(k for k in range(i + 1, i + 5) if rows[k] and rows[k][0] == 'Item')
            cols = [(c, NAMES.get(rows[h][c].strip())) for c in range(2, len(rows[h])) if rows[h][c].strip()]
            k, last, today = h + 1, None, {}
            while k < len(rows) and not (rows[k] and rows[k][0].strip().endswith('Totals')) and not (rows[k] and rows[k][0].strip() in ('ORDERS',)):
                row = rows[k]
                name, unit = (row[0] or '').strip(), (row[1] or '').strip() if len(row) > 1 else ''
                if not name and unit and last:
                    # The same item in the unit it's packed in (cans, boxes): use that unit instead.
                    name, swap = last, True
                else:
                    swap = False
                if name and unit:
                    name = name.lstrip('- ').strip()
                    iid = slug(name)
                    if swap or iid not in items: items[iid] = {'id': iid, 'name': name, 'unit': unit}
                    for c, st in cols:
                        if not st or c >= len(row): continue
                        try: v = float(row[c])
                        except ValueError: continue
                        if v <= 0: continue
                        # Within a day the packed unit replaces the plain one; across days, the most on any one day.
                        d = today.setdefault(st, {})
                        if swap or iid not in d: d[iid] = round(v, 2)
                    last = name if not swap else last
                k += 1
            for st, d in today.items():
                S = stations.setdefault(st, {})
                for iid, v in d.items(): S[iid] = max(S.get(iid, 0), v)
            i = k
            continue
        i += 1
    order = list(items)
    out = {'items': [items[k] for k in order], 'stations': {st: {k: v[k] for k in order if k in v} for st, v in stations.items()},
           'triggers': TRIGGERS, 'yard': YARD, 'everyMin': 120}
    with open(OUT, 'w') as f:
        f.write('// Buffalo Stampede 2027: the stocktake lists (tools/events/buffalo/stock.py, from the BSF_2027 Aid Station Consumptions\n'
                '// sheet\'s pack lists). items: every item in the unit it\'s packed in. stations: what each station is sent, the most on one\n'
                '// day. triggers: the restock triggers (Aid Station Operation Plan v0.3, section 05); est is the race sheet\'s estimate.\n'
                '// yard: the yard and coolroom locations the yard team stocktakes. everyMin: how often stations stocktake.\n')
        f.write('window.ST_STOCK = ' + json.dumps(out, indent=1) + ';\n')
    for st, v in out['stations'].items(): print('%-22s %d items' % (st, len(v)))
    print(len(out['items']), 'items in all')

if __name__ == '__main__':
    if len(sys.argv) != 2: raise SystemExit(__doc__)
    main(sys.argv[1])
