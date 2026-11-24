// Smoke test: open every page (optionally for one event) in a real browser and list console errors and failed requests.
//   node tools/smoke.mjs [event-id]      (serves the repository on a local port; no installs needed in the cloud sandbox)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port, ev = process.argv[2];
const pages = ['index.html', 'field.html', 'map.html', 'runner.html', 'admin.html'];
const browser = await chromium.launch(); let bad = 0;
for (const page of pages) {
  const ctx = await browser.newContext({ serviceWorkers: 'block' }); const pg = await ctx.newPage(); const errs = [];
  await pg.route(u => !u.href.startsWith(`http://localhost:${port}/`), r => r.abort());   // no outside calls in a smoke test
  pg.on('pageerror', e => errs.push('error: ' + e.message + (process.env.STACK ? '\n' + e.stack : '')));
  pg.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource|net::/.test(m.text())) errs.push('console: ' + m.text()); });
  pg.on('response', r => { if (r.status() >= 400 && r.url().includes(`localhost:${port}`)) errs.push(r.status() + ' ' + r.url().replace(`http://localhost:${port}/`, '')); });
  await pg.goto(`http://localhost:${port}/${page}${ev ? '?event=' + ev : ''}`, { waitUntil: 'load' }).catch(e => errs.push('goto: ' + e.message));
  await pg.waitForTimeout(2500);
  const title = await pg.title().catch(() => '');
  console.log((errs.length ? 'FAIL ' : 'ok   ') + page + '  [' + title + ']'); errs.slice(0, 8).forEach(e => console.log('     ' + e.slice(0, 200)));
  bad += errs.length; await ctx.close();
}
await browser.close(); server.close(); process.exit(bad ? 1 : 0);
