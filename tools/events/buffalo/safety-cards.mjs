// Buffalo Stampede 2027: the runner app's Help tab (events/buffalo-2027/safety-cards.js), from the GPT100's English
// emergency card with the GPT100-only details taken out. English only (scope decision 9); the other languages can be
// added back from events/buller-2026/safety-cards.js (the GPT100's checked translations) if Buffalo needs them.
//   node tools/events/buffalo/safety-cards.mjs
// Race medical: the Medical Team's number is on the back of every bib (buffalostampede.au), so the card points there
// until the 2027 number is confirmed (then set medicalPhone in runner-info.js and these lines can name it).
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync(new URL('../../../events/buller-2026/safety-cards.js', import.meta.url), 'utf8');
const window = {}; new Function('window', src)(window);
const en = JSON.parse(JSON.stringify(window.GPT_SAFETY_CARDS.cards.en));
const swaps = [
  [/the Medical Team on 1300 375 352/g, 'the Medical Team (the number on the back of your bib)'],
  [/Race medical 1300 375 352 and your Race Manager's number \(on your bib\) saved in your phone\./g, 'The Race Director and Medical Team numbers (on the back of your bib) saved in your phone.'],
  [/ and the yellow Grampians Peaks Trail triangles/g, ''],
  [/Based on the GPT100 Emergency Card v0\.5 \(October 2026\), which is also printed and handed out at registration\./g, 'Based on the SingleTrack emergency card (v0.5, October 2026), set up for the Buffalo Stampede.'],
];
let n = 0;
const fix = o => { if (typeof o === 'string') { let s = o; for (const [a, b] of swaps) s = s.replace(a, () => (n++, b)); return s; } if (Array.isArray(o)) return o.map(fix); if (o && typeof o === 'object') { for (const k in o) o[k] = fix(o[k]); } return o; };
fix(en);
const left = JSON.stringify(en).match(/GPT100|Grampians|1300 375 352|Halls Gap/g);
if (left) { console.error('Still GPT100-specific:', [...new Set(left)].join(', ')); process.exit(1); }
const out = { version: window.GPT_SAFETY_CARDS.version + '-bsf27', langs: [{ code: 'en', label: 'English' }], cards: { en } };
writeFileSync(new URL('../../../events/buffalo-2027/safety-cards.js', import.meta.url),
  '// Buffalo Stampede 2027: the runner app\'s Help tab, English only (tools/events/buffalo/safety-cards.mjs, from the GPT100 card).\n' +
  'window.GPT_SAFETY_CARDS = ' + JSON.stringify(out) + ';\n');
console.log('safety-cards.js written,', n, 'lines changed');
