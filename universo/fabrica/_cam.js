function camera(t) { const i = fala(t), k0 = CAMK[Math.max(0, i - 1)], k1 = CAMK[i], f = eio((t - T0[i]) / 2.2);
  const [d, h, ty, g] = k0.map((v, q) => lerp(v, k1[q], i === 0 ? 1 : f));
  const a = g + t * .006 + Math.sin(t * .35) * .04;
  C.position.set(Math.sin(a) * d, h + Math.sin(t * .5) * .08, Math.cos(a) * d); C.lookAt(0, ty, 0); }
