const SETAS_PESO = [-1, 0, 1].map(x => { const g = seta(); g.x0 = x; return g; });
const TOPO = NA * HA;
function estado(t) {
  const i = fala(t);
  const tij = i === 0 ? seg(t, 0, .05, .85) * 6 : i <= 2 ? 6 : i === 3 ? 6 + seg(t, 3, 0, .3) * 4 : NA;
  const afunda = i === 1 ? seg(t, 1, .1, .8) : i === 2 ? 1 - seg(t, 2, 0, .2) : 0;
  const ergue = i === 2 ? seg(t, 2, 0, .2) * (1 - seg(t, 2, .75, .9)) : 0;
  const est = ESTACAS.map((_, k) => i < 2 ? 0 : i === 2 ? seg(t, 2, .22 + k * .13, .38 + k * .13) : 1);
  const racha = i === 3 ? seg(t, 3, .4, .95) : i === 4 ? 1 - seg(t, 4, 0, .15) : 0;
  const someTij = i < 4 ? 0 : i === 4 ? seg(t, 4, 0, .15) : 1;
  const esq = a => i < 4 ? 0 : i === 4 ? seg(t, 4, .12 + a * .04, .22 + a * .04) : 1;
  const ved = i < 4 ? 0 : i === 4 ? seg(t, 4, .6, .85) : i >= 5 && i <= 12 ? (i === 5 ? 1 - seg(t, 5, 0, .2) * .7 : i <= 6 ? .3 : i === 12 ? .18 + seg(t, 12, .9, 1) * .82 : i === 7 ? .3 - seg(t, 7, 0, .15) * .12 : .18) : 1;
  const esmaga = i === 5 ? seg(t, 5, .3, .8) : i === 6 ? 1 - seg(t, 6, 0, .3) : 0;
  const grosso = i < 6 ? 0 : i === 6 ? seg(t, 6, .2, .7) : 1;
  const sobe = i === 7 ? seg(t, 7, .08, .7) * 3 : i === 8 ? 3 : 0;
  const elev = i < 8 ? 0 : i === 8 ? seg(t, 8, 0, .2) : 1;
  const cab = i < 8 ? 0 : i === 8 ? seg(t, 8, .5, .95) : 1;
  const entra = i === 8 ? seg(t, 8, .3, .45) : 0;
  const agua = i < 9 ? 0 : 1;
  const nivel = i < 9 ? 0 : i === 9 ? seg(t, 9, .1, .5) * 2.4 + Math.sin(t * 5) * .08 * seg(t, 9, .4, .5) : i === 10 ? lerp(2.4, TOPO + .6, seg(t, 10, .15, .45)) : TOPO + .6;
  const bomba = i < 10 ? 0 : i === 10 ? seg(t, 10, 0, .15) : 1;
  const caixa = i < 10 ? 0 : i === 10 ? seg(t, 10, .08, .2) : 1;
  const enche = i < 10 ? 0 : i === 10 ? seg(t, 10, .45, .6) : 1;
  const desce = i < 10 ? 0 : i === 10 ? seg(t, 10, .55, .7) : 1;
  const torn = a => i < 9 ? -1 : i === 9 ? (a < 3 ? 1 : 0) : i === 10 ? (a < 3 ? 1 : seg(t, 10, .65 + (NA - 1 - a) * .025, .7 + (NA - 1 - a) * .025)) : 1;
  const tempo = i === 11 ? seg(t, 11, 0, .25) : i === 12 ? 1 - seg(t, 12, .9, 1) : 0;
  const raio = i === 11 ? (loc(t, 11) > .55 && loc(t, 11) < .75 ? 1 : 0) : i === 12 ? (loc(t, 12) > .52 && loc(t, 12) < .7 ? 1 : 0) : 0;
  const haste = i < 12 ? 0 : i === 12 ? seg(t, 12, .05, .2) : 1;
  const cabo = i < 12 ? 0 : i === 12 ? seg(t, 12, .2, .45) : 1;
  const corrente = i === 12 ? cl((loc(t, 12) - .56) / .3) : -1;
  const sol = i === 13 ? seg(t, 13, 0, .3) : i === 14 ? 1 : 0;
  return { i, tij, afunda, ergue, est, racha, someTij, esq, ved, esmaga, grosso, sobe, elev, cab, entra, agua, nivel, bomba, caixa, enche, desce, torn, tempo, raio, haste, cabo, corrente, sol };
}
const ptRaio = (a, b, t, k) => { const p = RAIO_G.attributes.position; for (let q = 0; q < 12; q++) { const f = q / 11, j = q % 11 ? 1 : 0; p.setXYZ(q, lerp(a.x, b.x, f) + j * (hs(q + k + Math.floor(t * 18)) - .5) * 1.4, lerp(a.y, b.y, f), lerp(a.z, b.z, f) + j * (hs(q * 3 + k + Math.floor(t * 18)) - .5) * .6); } p.needsUpdate = true; };
function aplica(t) {
  const E = estado(t), i = E.i;
  predio.position.y = -E.afunda * .7 - E.esmaga * .12 + E.ergue * 2.2; predio.rotation.z = E.afunda * .14 * (i === 1 ? 1 : 1);
  // andares de tijolo
  ANDAR_T.forEach((g, a) => { const f = cl(E.tij - a); g.visible = f > .001 && E.someTij < 1; if (!g.visible) return; const fe = eo(f); g.position.y = a * HA + (1 - fe) * 2.5; g.rotation.y = (1 - fe) * .4;
    g.cx.material.transparent = E.someTij > 0; g.cx.material.opacity = 1 - E.someTij;
    g.rach.visible = a < 4 && E.racha > .01; g.rach.children.forEach((m, q) => { m.visible = E.racha * 6 > q; }); });
  JAN.transparent = E.someTij > 0; JAN.opacity = 1 - E.someTij;
  const nT = Math.min(Math.ceil(E.tij - .001), NA); TETO.visible = i <= 2 && E.tij > .5; TETO.position.y = Math.max(0, nT) * HA + .5 + (1 - eo(cl(E.tij - nT + 1))) * 0;
  // estrutura
  ESQ.forEach((g, a) => { const f = E.esq(a); g.visible = f > .001; if (!g.visible) return; const fe = eo(f);
    g.pil.forEach(p => { p.scale.y = Math.max(.01, fe * (a === 0 ? 1 - E.esmaga * .22 : 1)); p.position.y = p.scale.y * (HA - .12) / 2; const k = 1 + (NA - 1 - a) / (NA - 1) * 1.4 * E.grosso; p.scale.x = p.scale.z = k; });
    g.laje.visible = fe > .6; g.laje.scale.set(fe, 1, fe); g.position.y = a * HA - (a > 0 ? E.esmaga * .2 : 0);
    const corte = i >= 7 && i <= 12 ? (i === 12 ? 1 - seg(t, 12, .9, 1) : i === 7 ? seg(t, 7, 0, .15) : 1) : 0;
    g.ved.forEach(v => { const o = v.frente ? E.ved * (1 - corte) : E.ved; v.visible = o > .01; v.material.opacity = o; });
    if (corte > .5) g.pil.forEach((p, q) => { if (q === 6) p.visible = false; }); else g.pil.forEach(p => p.visible = true); });
  // estacas: descem pelo corte do chão
  ESTACAS.forEach((m, k) => { const f = E.est[k]; m.visible = f > .001; m.position.y = -3.3 + (1 - eo(f)) * 6.8; });
  BLOCO_EST.visible = E.est[2] > .99;
  // setas de peso (fala 5)
  SETAS_PESO.forEach((g, k) => { const f = i === 5 ? seg(t, 5, .1, .3) * (1 - seg(t, 5, .9, 1)) : 0; g.visible = f > .01; g.scale.setScalar(f * 1.6); g.position.set(g.x0 * 1.1, HA * 1.6 + Math.sin(t * 6 + k) * .1, LA + .45); });
  // escada, boneco, elevador
  ESCADA.visible = i >= 7 && i <= 12;
  BONECO.visible = i === 7 || i === 8; SUOR.forEach(m => m.visible = false);
  if (BONECO.visible) { const p = E.sobe, a = Math.min(Math.floor(p), 2), f = p - a, ida = a % 2 === 0; let x = -.85, y = a * HA + f * HA * .9 + .1, z = ida ? -.6 + f * 1.3 : .6 - f * 1.3;
    if (i === 8) { x = lerp(-.85, .6, E.entra); z = lerp(.6, -.3, E.entra); y = 2 * HA + .9 + .1 + (E.cab > 0 ? E.cab * (NA - 1 - 3) * HA : 0); if (E.entra >= 1) { x = .6; z = -.3; } }
    BONECO.position.set(x, y + predio.position.y, z); BONECO.rotation.y = i === 7 ? (ida ? 0 : Math.PI) : -Math.PI / 2; BONECO.position.y += Math.abs(Math.sin(t * 9)) * .05 * (i === 7 && p < 3 ? 1 : 0);
    if (i === 7 && p >= 2.98) SUOR.forEach((m, k) => { m.visible = true; const q = (t * 1.5 + k / 5) % 1; m.position.set(x + (k - 2) * .05, y + .6 - q * .3 + predio.position.y, z + .1); }); }
  POCO.visible = E.elev > .01; POCO.material.opacity = .25 * E.elev; MOTOR.visible = E.elev > .01; MOTOR.position.set(.6, TOPO + .23 + (1 - eo(E.elev)) * 1.5, -.3);
  CABINE.visible = E.elev > .01; const yCab = 3 * HA + .37 + E.cab * (NA - 1 - 3) * HA; CABINE.position.set(.6, yCab, -.3); CABINE.scale.setScalar(.2 + .8 * ebk(E.elev));
  CABO.visible = E.elev > .5; const cp = CABO.geometry.attributes.position; cp.setXYZ(0, .6, TOPO, -.3); cp.setXYZ(1, .6, yCab + .36, -.3); cp.needsUpdate = true;
  // água
  [CANO_RUA, CANO_SOBE].forEach(m => m.visible = E.agua > 0); AGUA_SOBE.visible = E.nivel > .05; AGUA_SOBE.scale.y = Math.max(.01, E.nivel); AGUA_SOBE.position.set(-LA - .1, E.nivel / 2, 1.3);
  BOMBA.visible = E.bomba > .01; BOMBA.scale.setScalar(ebk(E.bomba)); BOMBA.rotation.y = t * 8;
  CAIXA.visible = E.caixa > .01; CAIXA.scale.setScalar(.2 + .8 * ebk(E.caixa)); CAIXA.position.set(-.6, TOPO + .35, .4);
  CAIXA_AGUA.visible = E.enche > .01; CAIXA_AGUA.scale.set(1, Math.max(.01, E.enche * .62), 1); CAIXA_AGUA.position.set(-.6, TOPO + .02 + E.enche * .31, .4);
  CANO_DESCE.visible = E.caixa > .5;
  GOTAS_DESCE.forEach((m, k) => { m.visible = E.desce > .01 && i <= 12; if (!m.visible) return; const f = (t * .5 + hs(k)) % 1, y = TOPO - f * TOPO * E.desce; m.position.set(-LA + .25, y + predio.position.y, LA - .25); });
  TORNEIRAS.forEach((g, a) => { const f = E.torn(a); g.visible = f >= 0 && i <= 12; if (!g.visible) return; g.pingo.visible = f > .5; const q = (t * 1.6 + hs(a)) % 1; g.pingo.position.set(0, -q * .4, .1); });
  // raio e para-raios
  HASTE.visible = E.haste > .01; HASTE.scale.y = Math.max(.01, eo(E.haste)); HASTE.position.set(1.1, TOPO + .7 * HASTE.scale.y, 1.1);
  const cTop = TOPO + .1, cLen = (cTop + .8) * E.cabo; CABO_T.visible = E.cabo > .01; CABO_T.scale.y = Math.max(.01, cLen); CABO_T.position.set(LA + .06, cTop - cLen / 2, LA + .06);
  RAIO.visible = RAIO2.visible = E.raio > 0; FLASH.intensity = E.raio * 30;
  if (E.raio) { const alvo = i === 12 ? V(1.1, TOPO + 1.4, 1.1) : V(.2, TOPO + .1, .3); ptRaio(V(-1.5, 24, -3), alvo, t, i); FLASH.position.copy(alvo).add(V(0, 2, 2)); }
  CORRENTE.visible = E.corrente >= 0 && E.corrente < 1; if (CORRENTE.visible) { const y = cTop + .6 - E.corrente * (cTop + 1.4); CORRENTE.position.set(LA + .06, y, LA + .06); CORRENTE.scale.setScalar(1 + Math.sin(t * 40) * .3); }
  FAISCAS.forEach((m, k) => { const on = i === 11 && loc(t, 11) > .55 && loc(t, 11) < .9 || i === 12 && E.corrente > .9 && E.corrente < 1.4; m.visible = !!on; if (!on) return; const c = i === 11 ? V(.2, TOPO + .1, .3) : V(LA + .06, -.6, LA + .06);
    const q = (t * 2 + hs(k)) % 1, a = hs(k * 7) * 6.283; m.position.set(c.x + Math.cos(a) * q * 1.2, c.y + Math.sin(q * 3) * .6, c.z + Math.sin(a) * q * 1.2); });
  SOL.visible = E.sol > .01; SOL.material.opacity = E.sol; SOL.scale.setScalar(.3 + .7 * ebk(E.sol));
  return { E };
}
// [distância, altura, alvo y, giro]
const CAMK = [[14, 4, 2.6, .6], [14, 3, 1.2, .45], [13, .5, -2.2, .3], [20, 6.5, 5, .55], [20, 7, 5, .7], [10.5, 2.5, 1.2, .5], [20, 6.5, 5, .6],
  [8.5, 2.6, 1.6, .12], [17, 6, 4.8, .25], [13, 4, 3, -.45], [18, 6.5, 5, -.3], [16, 11, 8, .55], [19, 6, 4, .6], [22, 7, 4.5, .9], [24, 8, 4.5, 1.1]];
function fx(t, A) {
  const { E } = A, i = E.i;
  const forca = E.tempo; chuva(t, forca * .7); S.background.copy(CEU).lerp(new THREE.Color(0x3a4658), forca * .85); S.fog.color.copy(S.background); sol.intensity = 2.6 - forca * 1.8; hemi.intensity = 1.1 - forca * .5;
  if (E.raio) { S.background.lerp(new THREE.Color(0xdfe8ff), .6); }
}
