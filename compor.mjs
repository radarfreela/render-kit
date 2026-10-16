// Compõe um molde a partir de um roteiro de cenas (video.json) + tempos das palavras da voz.
//   node compor.mjs <video.json> --saida <pasta-molde> [--palavras palavras.json | --falas falas.json]
//                   [--pacote <pasta>] [--audio <pasta>]
//   node compor.mjs <video.json> --texto [--pacote <pasta>]     -> imprime o texto da narração (uma tomada)
//
// video.json (resumo; ver blocos/LEIAME.md):
//   { tema, voz:{arquivo,t0,pronuncia}, duracao:"expr", contas:{...}, vars:{...},
//     falas:[{ texto:"pedaço um | pedaço^b dois", marcas:{nome:"expr"}, cenas:[{id,bloco|preset,...}], sons:[...] }],
//     marcas:{}, estados:[], atores:[], ordem:[ids], fundo:{}, camera:{}, efeitos:{explosoes,ondas}, sons:[], arquivos:[] }
// Tempos: número, nome de marca, expressão ("s2 + .3"), "@palavra" (na fala onde está escrito), "@3:palavra#1".
// Strings "$a.b" viram o valor de vars (contas do pacote + vars do vídeo).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const AQUI = path.dirname(new URL(import.meta.url).pathname);
require('./blocos/tempo.js'); const RK = globalThis.RK;   // (package.json é type:module: o bloco se registra em globalThis)
const BLOCOS = ['nucleo', 'tempo', 'texto', 'cartoes', 'jogo', 'aparelho', 'tabela', 'balanca', 'final', 'telas'];

const argv = process.argv.slice(2);
const arg = (n, p) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : p; };
const VJ = path.resolve(argv[0]); const BASE = path.dirname(VJ);
const V = JSON.parse(fs.readFileSync(VJ, 'utf8'));
const PAC = arg('--pacote') ? path.resolve(arg('--pacote')) : null;
const pac = PAC ? JSON.parse(fs.readFileSync(path.join(PAC, 'pacote.json'), 'utf8')) : {};

// ---------- tokens do roteiro ----------
const nz = RK.nz;
const pron = Object.assign({}, pac.pronuncia || {}, V.voz?.pronuncia || {});
const limpo = w => w.replace(/[^\p{L}\p{N}]+/gu, '');
const toks = [];
V.falas.forEach((F, fi) => F.texto.split('|').map(s => s.trim()).filter(Boolean).forEach((ch, ci) => ch.split(/\s+/).forEach(w => {
  let cor = null; if (w.includes('^')) [w, cor] = w.split('^');
  toks.push({ w, c: cor, f: fi, k: ci });
})));
const falada = tk => pron[limpo(tk.w)] != null ? tk.w.replace(limpo(tk.w), pron[limpo(tk.w)]) : tk.w;
const textoVoz = () => V.voz?.texto || V.falas.map((F, fi) => toks.filter(t => t.f === fi).map(falada).join(' ')).join(' ');
if (argv.includes('--texto')) { process.stdout.write(textoVoz() + '\n'); process.exit(0); }

// ---------- números por extenso (alinhamento com o que o whisper escreve) ----------
const UN = ['zero', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const ext = n => n < 20 ? UN[n] : n < 100 ? DZ[Math.floor(n / 10)] + (n % 10 ? 'e' + UN[n % 10] : '') : n === 100 ? 'cem' : String(n);
const normW = s => nz(String(s).replace(/(\d)\s*x\s*(\d)/gi, '$1 a $2').replace(/\d+/g, m => ext(+m)));

// ---------- tempos das palavras ----------
let falas;
if (arg('--falas')) {
  // falas já alinhadas (absolutas): [{ini,fim,palavras:[{w,c,k,t,e}]}] ou dados.js com window.LT/VIDEO
  const txt = fs.readFileSync(arg('--falas'), 'utf8'); const m = txt.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/);
  const o = JSON.parse(m ? m[1] : txt); falas = o.falas || o;
  if (falas.length !== V.falas.length) throw new Error(`falas: ${falas.length} no arquivo, ${V.falas.length} no roteiro`);
} else {
  const P = JSON.parse(fs.readFileSync(arg('--palavras'), 'utf8'));
  const W = Array.isArray(P) ? P : (P.palavras || Object.values(P)[0].palavras);
  const T0 = V.voz?.t0 ?? .45;
  // alinhamento por caractere (programação dinâmica), como no montar.py original
  let a = '', amap = [], b = '', bmap = [];
  toks.forEach((tk, j) => { const n = normW(falada(tk)); a += n; for (const _ of n) amap.push(j); });
  W.forEach((x, j) => { const n = normW(x.w); b += n; for (const _ of n) bmap.push(j); });
  const n = a.length, m = b.length, D = new Uint16Array((n + 1) * (m + 1)); const ix = (i, j) => i * (m + 1) + j;
  for (let i = 0; i <= n; i++) D[ix(i, 0)] = i; for (let j = 0; j <= m; j++) D[ix(0, j)] = j;
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[ix(i, j)] = Math.min(D[ix(i - 1, j)] + 1, D[ix(i, j - 1)] + 1, D[ix(i - 1, j - 1)] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const pares = []; let i = n, j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1] && D[ix(i, j)] === D[ix(i - 1, j - 1)]) { pares.push([i - 1, j - 1]); i--; j--; }
    else if (D[ix(i, j)] === D[ix(i - 1, j - 1)] + 1) { i--; j--; }
    else if (D[ix(i, j)] === D[ix(i - 1, j)] + 1) i--; else j--;
  }
  pares.reverse();
  const ini = Array(toks.length).fill(null), fim = Array(toks.length).fill(null);
  for (const [ca, cb] of pares) { const tj = amap[ca], wj = bmap[cb]; if (ini[tj] == null) ini[tj] = W[wj].s; fim[tj] = W[wj].e; }
  const casados = ini.filter(x => x != null).length;
  for (let j = 0; j < toks.length; j++) {
    if (ini[j] == null) {
      let ant = j - 1; while (ant >= 0 && ini[ant] == null) ant--; let prox = j + 1; while (prox < toks.length && ini[prox] == null) prox++;
      const ta = ant >= 0 ? fim[ant] : W[0].s, tb = prox < toks.length ? ini[prox] : W[W.length - 1].e;
      ini[j] = ta + (tb - ta) * (j - ant) / (prox - ant) * .9;
    }
    if (fim[j] == null) fim[j] = ini[j] + .25;
  }
  for (let j = 1; j < ini.length; j++) ini[j] = Math.max(ini[j], ini[j - 1] + .02);
  const r3 = x => Math.round(x * 1000) / 1000;
  toks.forEach((tk, j) => { tk.t = r3(ini[j] + T0); tk.e = r3(fim[j] + T0); });
  falas = V.falas.map((_, fi) => { const pw = toks.filter(t => t.f === fi); return { ini: pw[0].t, fim: pw[pw.length - 1].e, palavras: pw.map(({ w, c, k, t, e }) => ({ w, c, k, t, e })) }; });
  console.error(`alinhamento: ${casados}/${toks.length} palavras casadas por caractere`);
}

// ---------- vars: contas do pacote + vars do vídeo ----------
let vars = Object.assign({}, pac.vars || {}, V.vars || {});
// arquivos JSON do pacote viram vars ("varsArquivos": {"nome": "arquivo.json"} -> "$nome.a.b")
for (const [k, f] of Object.entries(pac.varsArquivos || {})) vars[k] = JSON.parse(fs.readFileSync(path.join(PAC, f), 'utf8'));
const pega = (o, k) => k.split('.').reduce((x, y) => x?.[y], o);
const sub = x => {
  if (typeof x === 'string' && /^\$[A-Za-z_][\w.-]*$/.test(x)) { const v = pega(vars, x.slice(1)); if (v === undefined) throw new Error('var inexistente ' + x); return v; }
  if (Array.isArray(x)) return x.map(sub);
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, sub(v)]));
  return x;
};
if (V.contas) {
  if (!PAC || !fs.existsSync(path.join(PAC, 'contas.mjs'))) throw new Error('video.contas pede contas.mjs no pacote');
  const mod = await import(pathToFileURL(path.join(PAC, 'contas.mjs')).href);
  vars = Object.assign(vars, mod.contas(sub(V.contas)));   // contas podem citar vars (ex.: valores tirados de um arquivo de dados)
}
// "@palavra" escrito dentro de uma fala aponta para aquela fala
const naFala = (x, fi) => {
  if (typeof x === 'string') return x.replace(/@(?![0-9]+:)(?=[0-9A-Za-zÀ-ɏ])/g, `@${fi}:`);
  if (Array.isArray(x)) return x.map(y => naFala(y, fi));
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, naFala(v, fi)]));
  return x;
};
const merge = (a, b) => { if (b === undefined) return a; if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) { const o = { ...a }; for (const k of Object.keys(b)) o[k] = merge(a[k], b[k]); return o; } return b; };
const preset = a => {
  if (!a.preset) return a; const pr = (pac.presets || {})[a.preset]; if (!pr) throw new Error('preset inexistente: ' + a.preset);
  const { preset: _, ...resto } = a; return merge(preset(pr), resto);
};

// ---------- marcas, atores, sons ----------
const marcas = {};
for (const [k, v] of Object.entries(V.marcas || {})) marcas[k] = { expr: sub(v), fala: 0 };
const atores = [], sons = [], ondas = [...(V.efeitos?.ondas || [])], explosoes = [...(V.efeitos?.explosoes || [])];
const camera = JSON.parse(JSON.stringify(V.camera || {})); camera.flash = camera.flash || []; camera.tremor = camera.tremor || [];
V.falas.forEach((F, fi) => {
  for (const [k, v] of Object.entries(F.marcas || {})) { if (k in marcas) throw new Error('marca repetida: ' + k); marcas[k] = { expr: sub(v), fala: fi }; }
  for (const c of (F.cenas || [])) atores.push(naFala(sub(preset(c)), fi));
  for (const s of (F.sons || [])) sons.push(naFala(sub(s), fi));
  for (const e of (F.flash || [])) camera.flash.push(naFala(e, fi));
  for (const e of (F.tremor || [])) camera.tremor.push(naFala(e, fi));
  for (const e of (F.explosoes || [])) explosoes.push(naFala(sub(e), fi));
  for (const e of (F.ondas || [])) ondas.push(naFala(sub(e), fi));
});
for (const a of (V.atores || [])) atores.push(sub(preset(a)));
for (const s of (V.sons || [])) sons.push(sub(s));
let lista = atores;
if (V.ordem) {
  const porId = Object.fromEntries(atores.map(a => [a.id, a]));
  const falta = atores.filter(a => !V.ordem.includes(a.id)).map(a => a.id); if (falta.length) throw new Error('ordem sem: ' + falta.join(','));
  lista = V.ordem.map(id => { if (!porId[id]) throw new Error('ordem cita ator inexistente: ' + id); return porId[id]; });
}
const ids = new Set(); for (const a of lista) { if (!a.id) throw new Error('ator sem id'); if (ids.has(a.id)) throw new Error('id repetido: ' + a.id); ids.add(a.id); }

// tempos no node (mesmo código do navegador) -> duração e efeitos sonoros
const T = RK.tempos(falas, Object.assign({}, marcas, { DUR: { expr: V.duracao, fala: 0 } }));
const DUR = Math.round(T.marca('DUR') * 30) / 30;
const ev = [];
for (const s of sons) {
  const o = Array.isArray(s) ? { som: s[0], t: s[1], vol: s[2], inicio: s[3], dur: s[4] } : s;
  const um = t => ev.push(Object.assign({ som: o.som, t: +Math.max(0, t).toFixed(3), vol: o.vol }, o.inicio != null ? { inicio: o.inicio, dur: o.dur } : {}));
  if (o.de != null) { for (let x = T(o.de); x < T(o.ate); x += o.passo) um(x); } else um(T(o.t));
}
const voz = V.voz || {}; const narracao = voz.arquivo ? [{ arquivo: voz.arquivo, t: voz.t0 ?? .45, vol: voz.vol ?? 1 }] : [];
const tema = Object.assign({}, pac.tema || {}, V.tema || {});
const VIDEO = { tema, falas, marcas, duracao: DUR, fundo: sub(V.fundo || {}), camera: sub(camera), efeitos: { explosoes, ondas }, estados: (V.estados || []).map(e => sub(preset(e))), atores: lista };

// ---------- escreve o molde ----------
const OUT = path.resolve(arg('--saida', path.join(BASE, 'molde')));
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'blocos.js'), BLOCOS.map(b => `// ---- ${b}.js ----\n` + fs.readFileSync(path.join(AQUI, 'blocos', b + '.js'), 'utf8')).join('\n'));
fs.writeFileSync(path.join(OUT, 'dados.js'), 'window.VIDEO = ' + JSON.stringify(VIDEO) + ';\n');
fs.writeFileSync(path.join(OUT, 'sons.json'), JSON.stringify({ duracao: DUR, narracao, trilha: null, fundo: [], eventos: ev }, null, 1));
const tk = Object.assign({}, { bg: '#060a14', tx: '#eef2fb', fonte: 'Inter' }, tema);
fs.writeFileSync(path.join(OUT, 'video.html'), `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(tk.fonte)}:wght@400;500;600;700;800;900&display=block" rel="stylesheet">
<style>
:root{${Object.entries(tk).filter(([k, v]) => String(v).startsWith('#')).map(([k, v]) => `--${k}:${v}`).join(';')}}
html,body{margin:0;padding:0;background:${tk.bg};width:1080px;height:1920px;overflow:hidden}
#palco{position:relative;width:1080px;height:1920px;overflow:hidden;background:${tk.bg};font-family:${tk.fonte},-apple-system,"SF Pro Display",system-ui,sans-serif;color:var(--tx);font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}
</style>
</head>
<body>
<div id="palco">
  <canvas id="bg" width="1080" height="1920"></canvas>
  <div id="cam"></div>
  <div id="rewfx" style="opacity:0"></div>
  <div id="vin"></div>
  <div id="flash" style="opacity:0"></div>
</div>
<script src="blocos.js"></script>
<script src="dados.js"></script>
<script>RK.montar(window.VIDEO);</script>
</body>
</html>
`);
for (const f of (V.arquivos || [])) {
  const src = f.startsWith('pacote:') ? path.join(PAC, f.slice(7)) : path.resolve(BASE, f);
  if (fs.statSync(src).isDirectory()) fs.cpSync(src, path.join(OUT, path.basename(src)), { recursive: true, filter: s => !s.endsWith('.DS_Store') });   // pasta: vai inteira, com o mesmo nome
  else fs.copyFileSync(src, path.join(OUT, path.basename(src)));
}
const AUD = arg('--audio');
if (AUD) { const falta = [...new Set([...narracao.map(n => n.arquivo), ...ev.map(e => e.som)])].filter(f => !fs.existsSync(path.join(AUD, f))); if (falta.length) throw new Error('áudios faltando em ' + AUD + ': ' + falta.join(', ')); }
console.error(`molde: ${OUT} · ${lista.length} atores · ${ev.length} efeitos · ${Object.keys(marcas).length} marcas · DUR ${DUR.toFixed(2)}s`);
