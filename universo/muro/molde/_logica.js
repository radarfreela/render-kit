const SETAS_VENTO = [-1.6, 0, 1.6].map(x => { const g = seta(); g.x0 = x; return g; });
const SETAS_UMID = [-2, -.7, .7, 2].map(x => { const g = seta(); g.x0 = x; g.children.forEach(m => { m.material = m.material.clone(); m.material.color.set(0x3f9bff); m.material.emissive.set(0x1a5fb0); }); return g; });
const ESC = [...Array(50)].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 4), new THREE.MeshStandardMaterial({ color: 0x3f9bff, emissive: 0x1a5fb0, emissiveIntensity: .4, roughness: .05 })); S.add(m); return m; });

function estado(t) {
  const i = fala(t);
  // fileiras de tijolo: na fala 0 sobem; na fala 2 sobem de novo em cima da fundação
  const fileiras = i === 0 ? seg(t, 0, .08, .8) * NRW : i === 1 ? NRW : i === 2 ? seg(t, 2, .55, .88) * NRW : NRW;
  const tomba = i === 1 ? (seg(t, 1, .3, .62) * .25 + (cl((loc(t, 1) - .62) / .3) ** 2) * 1.3) : i === 2 ? 1.55 : 0;
  const afunda = i === 1 ? seg(t, 1, .1, .5) : i === 2 ? 1 : 0;
  const someVelho = i === 2 ? seg(t, 2, 0, .1) : 0;
  const vala = i < 2 ? 0 : i === 2 ? seg(t, 2, .12, .3) : 1;
  const conc = i < 2 ? 0 : i === 2 ? seg(t, 2, .32, .52) : 1;
  const base = i >= 2 ? .14 : 0;
  const curva = i === 3 ? seg(t, 3, .1, .4) * (1 - seg(t, 3, .9, 1) * .7) : i === 4 ? .3 * (1 - seg(t, 4, 0, .25)) : 0;
  const racha = i === 3 ? seg(t, 3, .55, .9) : i === 4 ? 1 - seg(t, 4, .5, .8) : 0;
  const arm = PX.map((_, k) => i < 4 ? 0 : i === 4 ? seg(t, 4, .12 + k * .1, .24 + k * .1) : 1);
  const pil = PX.map((_, k) => i < 4 ? 0 : i === 4 ? seg(t, 4, .3 + k * .1, .45 + k * .1) : 1);
  const bola = i === 5 ? loc(t, 5) : -1;
  const derruba = i === 5 ? cl((loc(t, 5) - .45) / .4) : i === 6 ? 1 - seg(t, 6, 0, .2) : 0;
  const cinta = i < 6 ? 0 : i === 6 ? seg(t, 6, .25, .7) : 1;
  const mofo = i < 7 ? 0 : i === 7 ? seg(t, 7, .3, .9) : i === 8 ? 1 - seg(t, 8, .4, .95) : 0;
  const pinta = i < 8 ? 0 : i === 8 ? seg(t, 8, .15, .8) : 1;
  const suj = i < 9 ? 0 : i === 9 ? seg(t, 9, .3, .95) : i === 10 ? 1 - seg(t, 10, .55, .9) : 0;
  const chap = k => i < 10 ? 0 : i === 10 ? seg(t, 10, .12 + k * .03, .2 + k * .03) : 1;
  const sol = i === 11 ? seg(t, 11, 0, .3) : i === 12 ? 1 : 0;
  return { i, fileiras, tomba, afunda, someVelho, vala, conc, base, curva, racha, arm, pil, bola, derruba, cinta, mofo, pinta, suj, chap, sol };
}
const BOLA_IN = V(2.6, 1.4, -5), BOLA_HIT = V(.9, HM + .25, -BD / 2 - .15), BOLA_OUT = V(1.8, .17, -3.2);
function aplica(t) {
  const E = estado(t), i = E.i;
  // muro inteiro: tomba pra trás afundando do lado direito; some e é refeito em cima da fundação
  piv.rotation.x = -E.tomba; piv.rotation.z = -E.afunda * .06 * (i < 2 ? 1 : 0); piv.position.y = E.base - E.afunda * .18 * (i < 2 ? 1 : 0);
  if (i === 2 && E.someVelho < 1) { piv.scale.setScalar(1 - E.someVelho); } else if (i === 2) { piv.rotation.set(0, 0, 0); piv.position.y = E.base; piv.scale.setScalar(1); }
  else piv.scale.setScalar(1);
  const fil = (i === 2 && E.someVelho < 1) ? NRW : E.fileiras;
  let topo = 0;
  TIJ.forEach(m => { const f = cl(fil - m.r); m.visible = f > .001; if (!m.visible) return; const fe = eo(f);
    let x = m.x0, y = m.y0 + (1 - fe) * 1.2, z = 0, rx = 0;
    // curva com o vento: o meio do muro empurrado pra trás, mais em cima
    z -= E.curva * .8 * Math.sin(Math.PI * (x + LM / 2) / LM) * (m.y0 / HM) * (.75 + .25 * Math.sin(t * 7));
    // rachadura no meio: os tijolos do lado direito do meio se abrem um pouco
    if (E.racha > 0 && Math.abs(x) < .3) { const lado = x >= 0 ? 1 : -1; x += lado * .03 * E.racha; }
    // fileira de cima: solta, treme e cai quando a bola bate
    if (m.r === NRW - 1 && i >= 5 && i <= 6 && m.x0 > .1 && m.x0 < 2.4) {
      if (i === 5 && E.bola < .45) { y += Math.sin(t * 40 + m.c) * .01 * seg(t, 5, .1, .3); }
      const d = E.derruba; if (d > 0) { const q = hs(m.c * 13); x += d * (q - .5) * .8; z += d * (1.1 + q * .8); y = lerp(y, .12 - E.base, eio(d)) + Math.sin(d * Math.PI) * .6; rx = d * (3 + q * 4); } }
    m.position.set(x, y, z); m.rotation.set(rx, 0, 0); topo = Math.max(topo, f > .999 ? m.y0 + BH / 2 : topo); });
  RACHAS.forEach((m, k) => { const f = cl(E.racha * NRW - k); m.visible = f > .01; m.scale.y = Math.max(.01, f); m.scale.x = 1 + E.racha; });
  // vala, terra e concreto
  VALA.visible = E.vala > .01; VALA.scale.set(E.vala, 1, 1); const mt = E.vala * (i === 2 ? 1 - seg(t, 2, .5, .62) : 0); MONTE.visible = mt > .01; MONTE.scale.set(2.6 * mt + .01, .5 * mt + .01, .5 * mt + .01);
  FUND.visible = E.conc > .01; FUND.scale.y = Math.max(.01, E.conc); FUND.position.y = .07 * E.conc - .005;
  // pilares
  PILARES.forEach((g, k) => { const a = E.arm[k], c = E.pil[k]; g.visible = a > .01; g.position.y = E.base; g.arm.scale.y = Math.max(.01, eo(a)); g.arm.visible = c < .999;
    g.conc.visible = c > .01; g.conc.scale.y = Math.max(.01, c * (HM + .02)); g.conc.position.y = g.conc.scale.y / 2; });
  // bola
  BOLA.visible = E.bola >= .15 && E.bola < .95; if (BOLA.visible) { const b = E.bola; if (b < .45) BOLA.position.lerpVectors(BOLA_IN, BOLA_HIT, eio((b - .15) / .3)); else { const q = (b - .45) / .5; BOLA.position.lerpVectors(BOLA_HIT, BOLA_OUT, q); BOLA.position.y += Math.sin(q * Math.PI) * .9; } BOLA.rotation.set(t * 6, t * 4, 0); }
  // cinta
  CINTA.visible = E.cinta > .01; CINTA.scale.x = Math.max(.01, E.cinta); CINTA.position.set(-(LM + .1) / 2 * (1 - E.cinta), E.base + HM + .1 + (1 - eo(E.cinta)) * .5, 0);
  // chapim
  const yCh = E.base + HM + .2 + .035;
  CHAP.forEach(m => { const f = E.chap(m.k); m.visible = f > .01; if (!m.visible) return; m.position.set(-LM / 2 + BL / 2 + m.k * BL, yCh + (1 - eo(f)) * 1.2, 0); m.rotation.z = (1 - eo(f)) * .5; });
  // mofo, faixa, manchas
  MOFO.visible = E.mofo > .01; MOFO.material.opacity = E.mofo; MOFO.scale.y = .3 + .7 * E.mofo; MOFO.position.y = MOFO.scale.y * 1.1 / 2;
  FAIXA.visible = E.pinta > .001; FAIXA.scale.x = Math.max(.001, E.pinta * (LM - .02)); FAIXA.position.set(-LM / 2 + FAIXA.scale.x / 2, .3, BD / 2 + .015);
  ROLO.visible = E.i === 8 && E.pinta > 0 && E.pinta < 1; ROLO.position.set(-LM / 2 + E.pinta * (LM - .02), E.base + .3 + Math.sin(t * 14) * .03, BD / 2 + .1);
  SUJ.visible = E.suj > .01; SUJ.material.opacity = E.suj; SUJ.position.y = HM / 2;
  SOL.visible = E.sol > .01; SOL.material.opacity = E.sol; SOL.scale.setScalar(.3 + .7 * ebk(E.sol));
  // setas
  SETAS_VENTO.forEach((g, k) => { const f = i === 3 ? seg(t, 3, .05, .2) * (1 - seg(t, 3, .85, .95)) : 0; g.visible = f > .01; g.scale.setScalar(f * 1.3); g.rotation.x = -Math.PI / 2; g.position.set(g.x0, E.base + 1.2, 1.4 + Math.sin(t * 6 + k) * .12); });
  SETAS_UMID.forEach((g, k) => { const f = i === 7 ? seg(t, 7, .1, .3) * (1 - seg(t, 7, .9, 1)) : 0; g.visible = f > .01; g.scale.setScalar(f * .8); g.rotation.x = Math.PI; g.position.set(g.x0, E.base - .2 + ((t * .8 + k * .25) % 1) * .4, BD / 2 + .35); });
  return { E, yCh };
}
// [distância, altura, alvo y, giro]
const CAMK = [[12, 5, 1, .75], [12, 4.5, 1, 1.15], [11, 7, .2, .7], [12, 9, .6, .35], [12.5, 5, 1.2, .75], [9, 3.2, 1.8, .95], [12, 5, 1.3, .75],
  [7.5, 1.5, .5, .55], [8, 1.7, .5, .7], [9, 3, 1.3, .55], [10, 3.8, 1.8, .7], [13, 5, 1.2, .9], [14, 5.5, 1.2, 1.1]];
function fx(t, A) {
  const { E } = A, i = E.i;
  const forca = i === 9 ? seg(t, 9, 0, .12) : i === 10 ? 1 - seg(t, 10, .85, 1) : 0;
  chuva(t, forca); S.background.copy(CEU).lerp(CEU_CHUVA, forca); S.fog.color.copy(S.background); sol.intensity = 2.6 - forca * 1.4;
  // vento
  const v = i === 3 ? seg(t, 3, .02, .15) * (1 - seg(t, 3, .9, 1)) : 0; VENTO.visible = v > .01; VENTO.material.opacity = .7 * v;
  if (VENTO.visible) for (let k = 0; k < NV; k++) { const x = (hs(k) - .5) * 8, y = .3 + hs(k + 5) * 2.4, f = (t * 1.3 + hs(k + 9)) % 1, z = 5 - f * 10; vP.set([x, y, z, x, y, z + .9], k * 6); } vG.attributes.position.needsUpdate = true;
  // água escorrendo pela frente do muro (fala 9) e caindo longe pelo chapim (fala 10)
  const esc = i === 9 ? seg(t, 9, .15, .3) : i === 10 ? 1 - seg(t, 10, .85, 1) : 0, longe = i === 10 ? seg(t, 10, .55, .7) : 0;
  ESC.forEach((m, k) => { m.visible = esc > .02; if (!m.visible) return; const f = (t * .7 + hs(k)) % 1, x = (hs(k + 3) - .5) * (LM - .3);
    if (longe < .5) m.position.set(x, A.yCh - f * (A.yCh - .05), BD / 2 + .03); else m.position.set(x, A.yCh - f * f * (A.yCh), .3 + f * .05); });
}
