// Fechamento: cartão final (logo + endereço sendo digitado + rodapé legal) e rodapé fixo.
(function (root) {
  const RK = root.RK; const { cl, P, oc, ob, lerp } = RK.u;
  // params: logo (src), logoLargura (800), logoAltura (129), em (expr: quando o logo entra), url (texto),
  //   sufixo (parte do url em destaque, ex. '.com'), urlEm (expr), legal (texto do rodapé), corUrl ('az'), corSufixo ('azc')
  RK.css(`.urlbox{height:112px;padding:0 48px;border-radius:56px;border:3px solid;background:rgba(10,20,46,.9);display:flex;align-items:center;font-size:62px;font-weight:800;letter-spacing:-1px;white-space:nowrap;box-sizing:border-box;transform-origin:50% 50%}
.legal{width:1080px;text-align:center;font-size:28px;font-weight:700;color:#b4bdd2;letter-spacing:.3px}
.rodp{width:1080px;text-align:center;font-size:24px;font-weight:600;color:#7f89a3;letter-spacing:.5px}`);
  RK.blocos.final = function (ctx, p) {
    const lw = p.logoLargura || 800, lh = p.logoAltura || 129, Au = ctx.A(p.corUrl || 'az'), cs = ctx.cor(p.corSufixo || 'azc');
    const logo = ctx.el(`<div class="a" style="width:${lw}px;height:${lh}px"><img src="${p.logo}" style="width:${lw}px;height:auto;display:block"></div>`);
    const url = ctx.el(`<div class="a urlbox" style="border-color:${Au.replace('A', .9)}"><span></span></div>`); const urlt = url.firstChild;
    const rod = ctx.el(`<div class="a legal">${p.legal || ''}</div>`);
    const em = ctx.t(p.em), uem = p.urlEm != null ? ctx.t(p.urlEm) : em + .55, U = p.url || '', suf = p.sufixo || '';
    const pinta = s => suf && s.endsWith(suf) ? s.slice(0, -suf.length) + `<span style="color:${cs}">${suf}</span>` : s;
    return {
      render(t) {
        const vis = t > em - .1; [logo, url, rod].forEach(e => e.style.visibility = vis ? 'visible' : 'hidden'); if (!vis) return;
        const q = P(t, em, .7); const fl = Math.sin(t * 1.6) * 4;
        RK.S(logo, { x: 540 - lw / 2, y: 700 + fl + (1 - oc(q)) * 60, s: lerp(.7, 1, ob(q)), o: cl(q * 2), b: (1 - cl(q * 1.4)) * 20 });
        const pu = P(t, uem - .15, .45); const n = Math.round(U.length * oc(P(t, uem - .15, .7)));
        urlt.innerHTML = pinta(U.slice(0, n)) + (n < U.length ? `<span style="color:${cs}">|</span>` : '');
        const uw = url.offsetWidth || 640; RK.S(url, { x: 540 - uw / 2, y: 900 + fl * .6 + (1 - oc(pu)) * 40, o: cl(pu * 2), s: lerp(.85, 1, ob(pu)) });
        url.style.boxShadow = `0 0 ${50 + 20 * Math.sin(t * 3)}px ${Au.replace('A', .5)}`;
        RK.S(rod, { x: 0, y: 1090, o: P(t, em + .4, .6) });
      },
    };
  };
  // rodapé fixo (ex.: aviso de valores ilustrativos) visível de 'de' até 'ate'
  // params: texto, y (1292), de, ate, opacidade (.85)
  RK.blocos.rodape = function (ctx, p) {
    const r = ctx.el(`<div class="a rodp">${p.texto}</div>`), de = ctx.t(p.de), ate = ctx.t(p.ate);
    return { render(t) { const o = P(t, de, .4) * (1 - P(t, ate, .3)); RK.S(r, { x: 0, y: p.y ?? 1292, o: o * (p.opacidade ?? .85) }); } };
  };
})(typeof window !== 'undefined' ? window : globalThis);
