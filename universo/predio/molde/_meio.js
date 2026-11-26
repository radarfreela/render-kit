// ---------- terreno em bloco (corte do chão na frente, para ver as estacas) ----------
chao.visible = false;
const ZC = 1.62;                                       // face do corte
const soloC = document.createElement('canvas'); soloC.width = 256; soloC.height = 512; { const x = soloC.getContext('2d');
  const cam = [[0, 150, '#8a5a36'], [150, 330, '#b0703f'], [330, 400, '#7d5a3c'], [400, 512, '#7f858a']];
  cam.forEach(([a, b, c]) => { x.fillStyle = c; x.fillRect(0, a, 256, b - a); });
  for (let k = 0; k < 500; k++) { const y = hs(k) * 512; x.fillStyle = `rgba(0,0,0,${.06 + hs(k + 1) * .1})`; x.beginPath(); x.arc(hs(k * 3) * 256, y, 1.5 + hs(k + 7) * (y > 400 ? 7 : 3), 0, 6.3); x.fill(); }
  x.fillStyle = '#5aa63c'; x.fillRect(0, 0, 256, 10); }
const soloT = new THREE.CanvasTexture(soloC); soloT.colorSpace = THREE.SRGBColorSpace;
const PROF = 8;
const bloco = new THREE.Mesh(new THREE.BoxGeometry(40, PROF, 40), [M(0x8a5a36), M(0x8a5a36), M(0x6cbf45), M(0x8a5a36), new THREE.MeshStandardMaterial({ map: soloT, roughness: 1 }), M(0x8a5a36)]);
bloco.position.set(0, -PROF / 2, ZC - 20); bloco.receiveShadow = true; S.add(bloco);
const calc = sombra(new THREE.Mesh(new THREE.BoxGeometry(4.2, .06, 3.6), M(0xc9c2b2))); calc.position.set(0, .03, -.15); S.add(calc);
// árvores atrás e dos lados, montanhas, nuvens
const arvore = (x, z, k, e = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z);
  const tr = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.14, .2, 1.3, 6), M(0x7a5532))); tr.position.y = .65; g.add(tr);
  if (k % 4 === 0) { [0, 1, 2].forEach(q => { const c = sombra(new THREE.Mesh(new THREE.ConeGeometry(1.1 - q * .25, 1.4, 7), M(0x2f7a3a))); c.position.y = 1.5 + q * .7; g.add(c); }); }
  else { const co = sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(1 + hs(k + 3) * .5, 0), M([0x58a83c, 0x6cbb44, 0x4c9a38][k % 3]))); co.position.y = 2; g.add(co); }
  g.scale.setScalar(e * (.9 + hs(k + 5) * .6)); g.rotation.y = hs(k) * 6; S.add(g); };
for (let k = 0; k < 22; k++) { const x = (hs(k) - .5) * 26, z = -4 - hs(k + 9) * 14; if (Math.abs(x) < 3 && z > -6) continue; arvore(x, z, k); }
for (let k = 0; k < 8; k++) arvore((k % 2 ? 1 : -1) * (5 + hs(k) * 6), ZC - 1 - hs(k + 3) * 3, k + 20, .9);
for (let k = 0; k < 14; k++) { const a = Math.PI + (k / 13 - .5) * 2.6, r = 62 + hs(k + 2) * 10; const m = new THREE.Mesh(new THREE.ConeGeometry(9 + hs(k) * 7, 10 + hs(k + 1) * 9, 5), M(k % 2 ? 0xc79a7e : 0xb88c74)); m.position.set(Math.sin(a) * r, 4, Math.cos(a) * r); S.add(m); }
const NUVENS = [...Array(7)].map((_, k) => { const g = new THREE.Group(); for (let q = 0; q < 4; q++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + hs(k * 7 + q) * .8, 0), M(0xffffff, { roughness: 1 })); b.position.set(q * 1.4 - 2, hs(k + q) * .6, hs(q * 3 + k) * .8); g.add(b); }
  g.position.set(-25 + k * 8, 16 + hs(k) * 4, -22 - hs(k + 4) * 8); S.add(g); return g; });

// ---------- o prédio ----------
const NA = 10, HA = .9, LA = 1.5;                      // andares, altura do andar, meia largura
const predio = new THREE.Group(); S.add(predio);
// andares de tijolo (falas 0–3): caixa com janelas
const janelaG = new THREE.BoxGeometry(.5, .42, .04), JAN = M(0x3d6f9a, { roughness: .2, metalness: .3 });
const ANDAR_T = [...Array(NA)].map((_, a) => { const g = new THREE.Group(); g.position.y = a * HA; predio.add(g);
  const cx = sombra(new THREE.Mesh(new THREE.BoxGeometry(LA * 2, HA - .02, LA * 2), M(a % 2 ? 0xd8b48c : 0xdcbc96))); cx.position.y = HA / 2; g.add(cx); g.cx = cx;
  [[0, 1], [1, 0]].forEach(([fx, fz]) => [-.75, .75].forEach(o => { const j = new THREE.Mesh(janelaG, JAN); j.position.set(fx ? LA + .01 : o, HA / 2 + .03, fz ? LA + .01 : o); if (fx) j.rotation.y = Math.PI / 2; g.add(j); }));
  const rach = new THREE.Group(); g.add(rach); g.rach = rach;
  for (let q = 0; q < 6; q++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.05, .22, .02), new THREE.MeshBasicMaterial({ color: 0x2a1d14 })); m.position.set(-.05 + (q % 2 ? .1 : -.05) + hs(a * 9 + q) * .05, .1 + q * .13, LA + .02); m.rotation.z = q % 2 ? .5 : -.5; rach.add(m); }
  return g; });
// telhado da casinha de cima (fala 0–2)
const TETO = sombra(new THREE.Mesh(new THREE.ConeGeometry(2.4, 1, 4), M(0xc4562f))); TETO.rotation.y = Math.PI / 4; predio.add(TETO);
// estrutura de concreto (fala 4+): lajes e pilares
const CONC = M(0xb2b6b9, { roughness: .9 });
const PIL_XZ = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([a, b]) => [a * (LA - .12), b * (LA - .12)]);
const ESQ = [...Array(NA)].map((_, a) => { const g = new THREE.Group(); g.position.y = a * HA; predio.add(g);
  const laje = sombra(new THREE.Mesh(new THREE.BoxGeometry(LA * 2 + .12, .12, LA * 2 + .12), CONC)); laje.position.y = HA - .06; g.add(laje); g.laje = laje;
  g.pil = PIL_XZ.map(([x, z]) => { const p = sombra(new THREE.Mesh(new THREE.BoxGeometry(.2, HA - .12, .2), CONC)); p.position.set(x, (HA - .12) / 2, z); g.add(p); return p; });
  // vedação: painéis claros com janela, inset, só fecham os vãos
  g.ved = []; [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([fx, fz]) => { const frente = fz === 1; const v = new THREE.Mesh(new THREE.BoxGeometry(fx ? .06 : LA * 2 - .3, HA - .14, fz ? .06 : LA * 2 - .3), new THREE.MeshStandardMaterial({ color: 0xece6da, flatShading: true, roughness: .8, transparent: true }));
    v.position.set(fx * (LA - .12), (HA - .14) / 2, fz * (LA - .12)); v.frente = frente; g.add(v); g.ved.push(v);
    [-.75, .75].forEach(o => { const j = new THREE.Mesh(janelaG, new THREE.MeshStandardMaterial({ color: 0x3d6f9a, roughness: .2, metalness: .3, transparent: true })); j.position.set(fx ? fx * (LA - .08) : o, HA / 2, fz ? fz * (LA - .08) : o); if (fx) j.rotation.y = Math.PI / 2; j.frente = frente; g.add(j); g.ved.push(j); }); });
  return g; });
// estacas (fala 2): 3 na frente, metade aparecendo no corte
const ESTACAS = [-1.1, 0, 1.1].map(x => { const m = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 6.6, 12), CONC)); m.position.set(x, -3.3, ZC); S.add(m); return m; });
const BLOCO_EST = sombra(new THREE.Mesh(new THREE.BoxGeometry(3.4, .35, .5), CONC)); BLOCO_EST.position.set(0, -.2, ZC); S.add(BLOCO_EST);
// escada interna (lado esquerdo), boneco, poço do elevador, cabine, motor
const ESCADA = new THREE.Group(); predio.add(ESCADA);
for (let a = 0; a < NA; a++) for (let d = 0; d < 6; d++) { const s = sombra(new THREE.Mesh(new THREE.BoxGeometry(.5, .07, .16), M(0x9a9184))); const ida = a % 2 === 0; s.position.set(-.85, a * HA + .08 + d * .14, (ida ? -.6 : .6) + (ida ? 1 : -1) * d * .22); ESCADA.add(s); }
const boneco = (cor) => { const g = new THREE.Group(); const c = sombra(new THREE.Mesh(new THREE.CapsuleGeometry(.1, .2, 4, 8), M(cor))); c.position.y = .22; g.add(c);
  const h = sombra(new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), M(0xe0ac80))); h.position.y = .48; g.add(h); S.add(g); return g; };
const BONECO = boneco(0xff5a1f); BONECO.scale.setScalar(1.7);
const SUOR = [...Array(5)].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0x8fd0ff })); S.add(m); return m; });
const POCO = new THREE.Mesh(new THREE.BoxGeometry(.75, NA * HA, .75), new THREE.MeshStandardMaterial({ color: 0x6f8fa8, transparent: true, opacity: .25, roughness: .1, depthWrite: false })); POCO.position.set(.6, NA * HA / 2, -.3); predio.add(POCO);
const CABINE = sombra(new THREE.Mesh(new THREE.BoxGeometry(.66, .8, .66), M(0xffc21a, { metalness: .2, roughness: .4, emissive: 0x553300 }))); predio.add(CABINE);
const MOTOR = sombra(new THREE.Mesh(new THREE.BoxGeometry(.9, .45, .9), M(0x4d5560))); predio.add(MOTOR);
const caboG = new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 1, 0)]); const CABO = new THREE.Line(caboG, new THREE.LineBasicMaterial({ color: 0x222222 })); predio.add(CABO);
// água: cano da rua, bomba, cano de subida, caixa d'água, cano de descida, torneiras
const CANO_M = M(0x9aa3ad, { metalness: .4, roughness: .4 });
const CANO_RUA = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 3, 10), CANO_M)); CANO_RUA.rotation.z = Math.PI / 2; CANO_RUA.position.set(-3, .15, 1.3); S.add(CANO_RUA);
const CANO_SOBE = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, NA * HA + .6, 10), CANO_M)); CANO_SOBE.position.set(-LA - .1, (NA * HA + .6) / 2, 1.3); S.add(CANO_SOBE);
const AGUA_SOBE = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1, 10), new THREE.MeshStandardMaterial({ color: 0x2f9bff, emissive: 0x1a6ad0, emissiveIntensity: .7 })); S.add(AGUA_SOBE);
const BOMBA = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .4, 14), M(0x2f6fd6, { metalness: .3 }))); BOMBA.position.set(-LA - .1, .2, 1.3); S.add(BOMBA);
const CAIXA = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.5, .55, .7, 16), M(0x2a6fb5, { roughness: .5 }))); predio.add(CAIXA);
const CAIXA_AGUA = new THREE.Mesh(new THREE.CylinderGeometry(.47, .5, 1, 16), new THREE.MeshStandardMaterial({ color: 0x5fb0ff, transparent: true, opacity: .85 })); predio.add(CAIXA_AGUA);
const CANO_DESCE = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, NA * HA, 8), CANO_M)); CANO_DESCE.position.set(-LA + .25, NA * HA / 2, LA - .25); predio.add(CANO_DESCE);
const GOTAS_DESCE = [...Array(40)].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshStandardMaterial({ color: 0x2f8fff, emissive: 0x1450a0, emissiveIntensity: .5 })); S.add(m); return m; });
const TORNEIRAS = [...Array(NA)].map((_, a) => { const g = new THREE.Group(); g.position.set(-LA + .25, a * HA + .55, LA - .45); g.scale.setScalar(2); predio.add(g); const t = sombra(new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .22), M(0xd8dade, { metalness: .7, roughness: .25 }))); g.add(t);
  const pingo = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 4), new THREE.MeshStandardMaterial({ color: 0x2f8fff, emissive: 0x1450a0, emissiveIntensity: .5 })); g.add(pingo); g.pingo = pingo; return g; });
// raio e para-raios
const RAIO_G = new THREE.BufferGeometry(); RAIO_G.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12 * 3), 3));
const RAIO = new THREE.Line(RAIO_G, new THREE.LineBasicMaterial({ color: 0xfff6b0, transparent: true, fog: false })); S.add(RAIO);
const RAIO2 = new THREE.Line(RAIO_G, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, fog: false })); RAIO2.scale.set(1.002, 1, 1.002); S.add(RAIO2);
const FLASH = new THREE.PointLight(0xdfe8ff, 0, 30, 1.2); S.add(FLASH);
const HASTE = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.4, 6), M(0xc9cdd2, { metalness: .8, roughness: .2 }))); predio.add(HASTE);
const CABO_T = sombra(new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1, 6), M(0x9a6a32, { metalness: .7, roughness: .3 }))); S.add(CABO_T);
const CORRENTE = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff3a0, fog: false })); S.add(CORRENTE);
const FAISCAS = [...Array(24)].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffe27a })); S.add(m); return m; });
const SOL = new THREE.Mesh(new THREE.IcosahedronGeometry(.8, 1), new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, fog: false })); SOL.position.set(-2.5, 13, -3); S.add(SOL);
