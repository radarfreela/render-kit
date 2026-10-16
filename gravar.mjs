// Grava um molde HTML em MP4, quadro a quadro.
//   node gravar.mjs --molde molde --arquivo video.html --saida saida/video.mp4
// O molde expõe um seek síncrono: elemento [data-om-sync-seek] (evento data-om-seek-to-time-frame)
// ou window.render(t) + window.DUR. Cada quadro é determinístico.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';

const arg = (n, p) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : p; };
const MOLDE = path.resolve(arg('--molde', 'molde'));
const ARQUIVO = arg('--arquivo', 'video.html');
const SAIDA = path.resolve(arg('--saida', 'saida/video.mp4'));
const FPS = Number(arg('--fps', 30));
const LARG = 1080, ALT = 1920;

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.jsx': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const servidor = http.createServer((req, res) => {
  const f = path.join(MOLDE, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(MOLDE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const URL_ = `http://127.0.0.1:${servidor.address().port}/${encodeURIComponent(ARQUIVO)}`;

const nav = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'] });
const pg = await nav.newPage();
pg.on('pageerror', e => console.error('erro na página:', e.message));

async function abrir(escala) {
  await pg.setViewport({ width: LARG, height: ALT + 120, deviceScaleFactor: escala });
  await pg.evaluateOnNewDocument?.(() => {});
  await pg.goto(URL_, { waitUntil: 'networkidle0', timeout: 120000 });
  await pg.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2500));
  return pg.evaluate(() => {
    const el = document.querySelector('[data-om-sync-seek]');
    if (!el) {  // molde próprio: window.render(t) + window.DUR, página inteira 1080x1920
      if (typeof window.render !== 'function') return null;
      return { x: 0, y: 0, w: 1080, h: 1920, dur: window.DUR, proprio: true };
    }
    const r = el.getBoundingClientRect();
    const cenas = JSON.parse(window.OM_SCENES || '[]');
    return { x: r.x, y: r.y, w: r.width, h: r.height, dur: cenas.reduce((s, c) => s + c.dur, 0) };
  });
}
let palco = await abrir(1);
if (!palco) throw new Error('molde sem palco com seek síncrono (data-om-sync-seek)');
const escala = LARG / palco.w;
if (Math.abs(escala - 1) > 0.001) palco = await abrir(escala);
console.log(`palco ${palco.w.toFixed(0)}x${palco.h.toFixed(0)} · escala ${escala.toFixed(3)} · duração ${palco.dur}s`);

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
  '-vf', `scale=${LARG}:${ALT}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
  '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', SAIDA], { stdio: ['pipe', 'inherit', 'inherit'] });

const n = Math.round(palco.dur * FPS), t0 = Date.now();
const clip = { x: palco.x, y: palco.y, width: palco.w, height: palco.h };
for (let f = 0; f < n; f++) {
  await pg.evaluate((t) => {
    const el = document.querySelector('[data-om-sync-seek]');
    if (el) el.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', { detail: { time: t, sync: true } }));
    else window.render(t);
  }, f / FPS);
  const buf = await pg.screenshot({ type: 'jpeg', quality: 95, clip });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 150 === 0) console.log(`quadro ${f}/${n} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((ok, erro) => ff.on('close', c => (c === 0 ? ok() : erro(new Error('ffmpeg ' + c)))));
await nav.close(); servidor.close();
console.log(`pronto: ${SAIDA} · ${n} quadros em ${((Date.now() - t0) / 1000).toFixed(0)}s`);
