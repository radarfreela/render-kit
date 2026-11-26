// ---------- legenda ----------
const O = document.getElementById('h').getContext('2d');
function legenda(t) { let k = -1; for (let j = 0; j < PAL.length; j++) if (PAL[j][1] <= t + .02) k = j; if (k < 0) return; const [w0, s, e] = PAL[k], prox = PAL[k + 1]; if (t > e + .3 && (!prox || t < prox[1])) return;
  let w = w0.replace(/[.,!?;:]+$/g, ''); if (!w) return; w = w.charAt(0).toUpperCase() + w.slice(1); const rev = REV.has(k), a = eo((t - s) / .08);
  O.save(); O.globalAlpha = a; O.translate(W / 2, 1560); if (rev) { const sc = .6 + .55 * ebk((t - s) / .35); O.scale(sc * 1.45, sc * 1.45); }
  O.font = '800 76px Int'; O.textAlign = 'center'; O.textBaseline = 'middle'; O.lineJoin = 'round'; O.lineWidth = 12; O.strokeStyle = 'rgba(0,0,0,.8)'; O.strokeText(w, 0, 0); O.fillStyle = rev ? '#ffd21f' : '#fff'; O.fillText(w, 0, 0); O.restore(); }
window.render = t => {
  camera(t); const A = aplica(t); fx(t, A);
  NUVENS.forEach((g, k) => g.position.x = -25 + k * 8 + t * .15);
  R.render(S, C); O.clearRect(0, 0, W, H);
  const rv = [...REV].some(j => t >= PAL[j][1] - .05 && t <= PAL[j][2] + .5); if (rv) { O.save(); const g = O.createRadialGradient(W / 2, 800, 50, W / 2, 800, 760); g.addColorStop(0, 'rgba(255,225,110,.22)'); g.addColorStop(1, 'rgba(255,225,110,0)'); O.fillStyle = g; O.fillRect(0, 0, W, H); O.restore(); }
  legenda(t);
};
await document.fonts.load('800 40px Int'); window.render(0); window.__pronto = true; window.PRONTO = true;
</script></body></html>
