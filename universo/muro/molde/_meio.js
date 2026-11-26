// árvores longe do caminho da câmera (ela fica no quadrante +x,+z) + anel distante + montanhas + nuvens
const arvore = (x, z, k, e = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z);
  const tr = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.14, .2, 1.3, 6), M(0x7a5532))); tr.position.y = .65; g.add(tr);
  if (k % 4 === 0) { [0, 1, 2].forEach(q => { const c = sombra(new THREE.Mesh(new THREE.ConeGeometry(1.1 - q * .25, 1.4, 7), M(0x2f7a3a))); c.position.y = 1.5 + q * .7; g.add(c); }); }
  else { const co = sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(1 + hs(k + 3) * .5, 0), M([0x58a83c, 0x6cbb44, 0x4c9a38][k % 3]))); co.position.y = 2; g.add(co); }
  g.scale.setScalar(e * (.9 + hs(k + 5) * .6)); g.rotation.y = hs(k) * 6; S.add(g); };
for (let k = 0; k < 24; k++) { const a = 2.7 + hs(k) * 3.4, r = 7 + hs(k + 9) * 9; arvore(Math.sin(a) * r, Math.cos(a) * r, k); }
for (let k = 0; k < 30; k++) { const a = k / 30 * 6.283, r = 30 + hs(k + 19) * 8; arvore(Math.sin(a) * r, Math.cos(a) * r, k + 40, 1.4); }
for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283 + hs(k) * .3, r = 62 + hs(k + 2) * 10; const m = new THREE.Mesh(new THREE.ConeGeometry(9 + hs(k) * 7, 10 + hs(k + 1) * 9, 5), M(k % 2 ? 0xc79a7e : 0xb88c74)); m.position.set(Math.sin(a) * r, 4, Math.cos(a) * r); m.rotation.y = hs(k) * 3; S.add(m); }
const NUVENS = [...Array(7)].map((_, k) => { const g = new THREE.Group(); for (let q = 0; q < 4; q++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + hs(k * 7 + q) * .8, 0), M(0xffffff, { roughness: 1 })); b.position.set(q * 1.4 - 2, hs(k + q) * .6, hs(q * 3 + k) * .8); g.add(b); }
  g.position.set(-25 + k * 8, 13 + hs(k) * 4, -18 - hs(k + 4) * 8); S.add(g); return g; });
// terreno de terra onde o muro vai
const terra = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.2), M(0xa77b52, { roughness: 1 })); terra.rotation.x = -Math.PI / 2; terra.position.y = .006; terra.receiveShadow = true; S.add(terra);
// flores/grama alta na frente para dar escala
for (let k = 0; k < 18; k++) { const b = sombra(new THREE.Mesh(new THREE.ConeGeometry(.06, .35 + hs(k) * .2, 4), M(0x4f9a35))); b.position.set(-3.6 + hs(k) * 7.2, .17, 1.3 + hs(k + 3) * .6); S.add(b); }

// ---------- o muro: 12 tijolos por fileira, 9 fileiras, amarração alternada ----------
const BL = .5, BH = .22, BD = .25, NRW = 9, LM = 6, HM = NRW * BH;
const MAT_T = [0xb5532f, 0xa94a2a, 0xbe5d36, 0xa85030].map(c => M(c, { roughness: .95 }));
const piv = new THREE.Group(); piv.position.z = -BD / 2; S.add(piv);
const muro = new THREE.Group(); muro.position.z = BD / 2; piv.add(muro);
const MAT_ARG = M(0xd9d2c2, { roughness: 1 });
const TIJ = [];
for (let r = 0; r < NRW; r++) { const peças = []; if (r % 2 === 0) for (let c = 0; c < 12; c++) peças.push([-LM / 2 + BL / 2 + c * BL, BL]);
  else { peças.push([-LM / 2 + BL / 4, BL / 2]); for (let c = 0; c < 11; c++) peças.push([-LM / 2 + BL / 2 + BL / 2 + c * BL, BL]); peças.push([LM / 2 - BL / 4, BL / 2]); }
  peças.forEach(([x, w], c) => { const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(w - .025, BH - .025, BD), MAT_T[(r * 7 + c * 3) % 4])); const arg = new THREE.Mesh(new THREE.BoxGeometry(w, BH, BD - .05), MAT_ARG); m.add(arg); m.x0 = x; m.y0 = BH / 2 + r * BH; m.r = r; m.c = c; muro.add(m); TIJ.push(m); }); }
// rachadura em zigue-zague no meio da frente (uma lasca escura por fileira)
const RACHAS = [...Array(NRW)].map((_, r) => { const m = new THREE.Mesh(new THREE.BoxGeometry(.05, BH + .02, .02), new THREE.MeshBasicMaterial({ color: 0x1c1612 })); m.r = NRW - 1 - r; m.position.set((r % 2 ? .07 : -.07) + (hs(r) - .5) * .06, BH / 2 + m.r * BH, BD / 2 + .012); m.rotation.z = (r % 2 ? .5 : -.5); muro.add(m); return m; });
// fundação: vala escura, monte de terra, concreto
const VALA = new THREE.Mesh(new THREE.PlaneGeometry(LM + .5, .7), M(0x4a3222, { roughness: 1 })); VALA.rotation.x = -Math.PI / 2; VALA.position.y = .012; S.add(VALA);
const MONTE = sombra(new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0x8a623e, { roughness: 1 }))); MONTE.position.set(0, 0, -1.3); S.add(MONTE);
const FUND = sombra(new THREE.Mesh(new THREE.BoxGeometry(LM + .5, .14, .6), M(0x9fa3a6, { roughness: .9 }))); S.add(FUND);
// pilares: armadura de ferro e depois concreto
const PX = [-LM / 2 + .17, 0, LM / 2 - .17];
const FERRO = M(0x8a4b2a, { metalness: .5, roughness: .5 });
const PILARES = PX.map(x => { const g = new THREE.Group(); g.position.x = x; S.add(g); const arm = new THREE.Group(); g.add(arm);
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => { const v = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, HM + .5, 6), FERRO)); v.position.set(a * .1, (HM + .5) / 2, b * .1); arm.add(v); });
  for (let q = 0; q < 8; q++) { const e = new THREE.Mesh(new THREE.TorusGeometry(.14, .012, 4, 4), FERRO); e.rotation.set(Math.PI / 2, 0, Math.PI / 4); e.position.y = .2 + q * .3; arm.add(e); }
  const conc = sombra(new THREE.Mesh(new THREE.BoxGeometry(.36, 1, .38), M(0xa7abae, { roughness: .9 }))); g.add(conc); g.arm = arm; g.conc = conc; return g; });
// bola que derruba a fileira de cima
const BOLA = sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(.17, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: .5 }))); S.add(BOLA);
{ const g = new THREE.IcosahedronGeometry(.172, 0); const p = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x222222, flatShading: true, wireframe: true })); BOLA.add(p); }
// cinta: viga de concreto em cima
const CINTA = sombra(new THREE.Mesh(new THREE.BoxGeometry(LM + .1, .2, .32), M(0xa7abae, { roughness: .9 }))); S.add(CINTA);
// chapim: peças mais largas que o muro, no alto
const CHAP = [...Array(12)].map((_, k) => { const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(BL - .01, .07, .5), M(0xe8e2d6, { roughness: .7 }))); m.k = k; S.add(m); return m; });
// texturas da parede: mofo de baixo, manchas de chuva de cima, faixa impermeável
const tex = (desenho) => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; desenho(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const mofoT = tex(x => { const g = x.createLinearGradient(0, 256, 0, 0); g.addColorStop(0, 'rgba(45,52,30,.85)'); g.addColorStop(.6, 'rgba(60,62,38,.45)'); g.addColorStop(1, 'rgba(60,62,38,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  for (let k = 0; k < 120; k++) { x.fillStyle = `rgba(${20 + hs(k) * 30},${50 + hs(k + 1) * 40},${20},${.5 + hs(k + 2) * .4})`; x.beginPath(); x.arc(hs(k * 3) * 512, 256 - hs(k * 7) ** 1.6 * 230, 3 + hs(k + 5) * 9, 0, 6.3); x.fill(); } });
const sujT = tex(x => { for (let k = 0; k < 40; k++) { const cx = hs(k * 5) * 512, w = 6 + hs(k + 2) * 16, h = 80 + hs(k) * 170; const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(55,45,35,.7)'); g.addColorStop(1, 'rgba(55,45,35,0)'); x.fillStyle = g; x.fillRect(cx, 0, w, h); }
  const g = x.createLinearGradient(0, 0, 0, 60); g.addColorStop(0, 'rgba(50,40,30,.6)'); g.addColorStop(1, 'rgba(50,40,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 60); });
const plano = (t, h, ord) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(LM - .02, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -ord, polygonOffsetUnits: -ord })); m.renderOrder = ord; m.position.z = BD / 2 + .004 * ord; muro.add(m); return m; };
const MOFO = plano(mofoT, 1.1, 1), SUJ = plano(sujT, HM, 2);
const FAIXA = new THREE.Mesh(new THREE.PlaneGeometry(1, .6), new THREE.MeshStandardMaterial({ color: 0x23262a, roughness: .35, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); FAIXA.position.z = BD / 2 + .015; FAIXA.renderOrder = 3; muro.add(FAIXA);
const ROLO = new THREE.Group(); { const c = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .55, 12), M(0x2b2e33, { roughness: .6 }))); ROLO.add(c);
  const h1 = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .5, 6), M(0xd8dade, { metalness: .6 })); h1.rotation.x = Math.PI / 2; h1.position.set(0, .3, .25); ROLO.add(h1);
  const cabo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1, 8), M(0xf2b632))); cabo.position.set(0, .05, 1); cabo.rotation.x = Math.PI / 2.6; ROLO.add(cabo); } S.add(ROLO);
// vento: riscos brancos atravessando
const NV = 40, vG = new THREE.BufferGeometry(), vP = new Float32Array(NV * 6); vG.setAttribute('position', new THREE.BufferAttribute(vP, 3));
const VENTO = new THREE.LineSegments(vG, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7 })); S.add(VENTO);
// sol
const SOL = new THREE.Mesh(new THREE.IcosahedronGeometry(.6, 1), new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, fog: false })); SOL.position.set(-1, 5.2, -1.5); S.add(SOL);

const _chuva_e_setas_ = 0;
