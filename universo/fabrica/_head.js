<!doctype html><html><head><meta charset="utf-8">
<!-- Universo Detalhado · molde gerado pela fábrica (API) a partir do roteiro aprovado. -->
<style>@font-face{font-family:Int;src:url(fontes/Inter.ttf)}html,body{margin:0;background:#000}#w{position:relative;width:1080px;height:1920px}canvas{position:absolute;left:0;top:0;width:1080px;height:1920px}</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>
<script src="falas.js"></script><script src="palavras-tempo.js"></script>
</head><body><div id="w"><canvas id="g" width="1080" height="1920"></canvas><canvas id="h" width="1080" height="1920"></canvas></div>
<script type="module">
import * as THREE from 'three';
window.__pronto = false;
const W = 1080, H = 1920;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), eo = x => 1 - (1 - cl(x)) ** 3, eio = x => (x = cl(x), x < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2), lerp = (a, b, f) => a + (b - a) * f;
const ebk = x => { x = cl(x); const c = 1.7; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const hs = i => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const FALAS = window.FALAS_TXT;
const NOMES = window.NOMES_FALA || {};
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const PAL = window.PAL;
const INI = []; { let k = 0; FALAS.forEach((f, i) => { const alvo = norm(f.split(/\s+/)[0]); let j = k;
  if (i > 0) for (let d = 0; d < 8; d++) { if (PAL[k + d] && norm(PAL[k + d][0]) === alvo) { j = k + d; break; } if (PAL[k - d] && k - d > INI[INI.length - 1][0] && norm(PAL[k - d][0]) === alvo) { j = k - d; break; } }
  INI.push([j, PAL[Math.min(j, PAL.length - 1)][1]]); k = j + f.split(/\s+/).length; }); }
const T0 = INI.map(x => x[1]); const FIM = T0.slice(1).concat([PAL[PAL.length - 1][2] + 1.2]);
window.T0 = T0; window.FIM = FIM; window.tAbs = (i, p) => T0[i] + tPal(i, p);
const NF = window.TESTE_FALAS || FALAS.length; window.DUR = NF < FALAS.length ? T0[NF] - .05 : FIM[FIM.length - 1];
const tPal = (i, p) => { const a = INI[i][0], b = i + 1 < INI.length ? INI[i + 1][0] : PAL.length; for (let j = a; j < b; j++) if (norm(PAL[j][0]).startsWith(norm(p))) return PAL[j][1] - T0[i]; return 0; };
const tAbs = (i, p) => T0[i] + tPal(i, p);
const REV = new Set(); for (const [i, ns] of Object.entries(NOMES)) { if (+i >= INI.length) continue; const a = INI[i][0], b = INI[+i + 1] ? INI[+i + 1][0] : PAL.length; for (let j = a; j < b; j++) if (ns.includes(norm(PAL[j][0]))) REV.add(j); }
// fala atual e progresso local
const fala = t => { let i = 0; T0.forEach((s, k) => { if (t >= s - .05) i = k; }); return i; };
const loc = (t, i) => cl((t - T0[i]) / (FIM[i] - T0[i]));          // 0..1 dentro da fala i (0 antes, 1 depois)
const seg = (t, i, a, b) => eio(((t - T0[i]) / (FIM[i] - T0[i]) - a) / (b - a)); // trecho a..b da fala i, suavizado

// ---------- cena: dia claro, grama, casa ----------
const R = new THREE.WebGLRenderer({ canvas: document.getElementById('g'), antialias: true, preserveDrawingBuffer: true });
R.setSize(W, H, false); R.outputColorSpace = THREE.SRGBColorSpace; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
const S = new THREE.Scene();
const CEU = new THREE.Color(0x74c4f5), CEU_CHUVA = new THREE.Color(0x6f8298);
S.background = CEU.clone(); S.fog = new THREE.Fog(CEU.clone(), 40, 110);
const C = new THREE.PerspectiveCamera(34, W / H, .05, 300);
const hemi = new THREE.HemisphereLight(0xdff1ff, 0x5c7a3a, 1.1); S.add(hemi);
const sol = new THREE.DirectionalLight(0xfff1d6, 2.6); sol.position.set(7, 12, 6); sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sol.shadow.bias = -.0004; S.add(sol);
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: .8, ...o });
const sombra = m => { m.castShadow = true; m.receiveShadow = true; return m; };
// chão
const chao = new THREE.Mesh(new THREE.CircleGeometry(40, 48), M(0x6cbf45)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; S.add(chao);