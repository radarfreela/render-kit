// Blocos de texto: legenda cinética (palavra a palavra no tempo da voz), palavra que explode,
// contador numérico.
(function (root) {
  const RK = root.RK; const { cl, P, oc, ob, oe, lerp, milhar, rnd, ease } = RK.u;

  // ---------- legenda: frase montando palavra a palavra, sincronizada com os word timestamps ----------
  // params: topo (236), fimUltima (expr: quando a última frase sai), cores {chave:{cor,brilho}}
  // As palavras vêm de ctx.falas[i].palavras [{w, c (chave de cor|null), k (pedaço), t, e}].
  RK.css(`#leg{position:absolute;left:60px;width:960px;height:196px}
.chunk{position:absolute;left:0;top:0;width:960px;height:196px;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;column-gap:20px;row-gap:0;text-align:center}
.pw{display:inline-block;font-size:70px;font-weight:800;letter-spacing:-1.5px;line-height:1.08;color:#f2f5fc;white-space:nowrap}`);
  const CORES_LEG = {
    b: { cor: '#5f92ff', brilho: '0 0 34px rgba(35,107,255,.65)' },
    g: { cor: '#2bd576', brilho: '0 0 34px rgba(43,213,118,.55)' },
    r: { cor: '#ff6b74', brilho: '0 0 30px rgba(239,75,85,.5)' },
    a: { cor: '#ffb020', brilho: '0 0 30px rgba(255,176,32,.55)' },
    w: { cor: '#ffffff', brilho: '0 0 30px rgba(255,255,255,.45)' },
  };
  RK.blocos.legenda = function (ctx, p) {
    const cores = Object.assign({}, CORES_LEG, p.cores || {});
    RK.css(Object.entries(cores).map(([k, v]) => `.k-${k}{color:${ctx.cor(v.cor)};text-shadow:${v.brilho}}`).join('\n'));
    const leg = ctx.el(`<div id="leg" style="top:${p.topo ?? 236}px"></div>`);
    const CH = [];
    ctx.falas.forEach((F, i) => {
      const byK = {}; F.palavras.forEach(w => { (byK[w.k] = byK[w.k] || []).push(w); });
      Object.keys(byK).forEach(k => {
        const ws = byK[k]; const ch = document.createElement('div'); ch.className = 'chunk'; leg.appendChild(ch);
        const words = ws.map(w => { const s = document.createElement('span'); s.className = 'pw' + (w.c ? ' k-' + w.c : ''); s.textContent = w.w; ch.appendChild(s); return { el: s, t: w.t }; });
        CH.push({ fala: i, el: ch, words, t0: ws[0].t, tf: ws[ws.length - 1].e });
      });
    });
    const fimUlt = p.fimUltima != null ? ctx.t(p.fimUltima) : ctx.DUR;
    CH.forEach((c, j) => { const nx = CH[j + 1]; c.t1 = nx ? (nx.fala === c.fala ? nx.t0 - .2 : Math.min(c.tf + .5, nx.t0 - .2)) : fimUlt; });
    return {
      render(t) {
        for (const c of CH) {
          const vis = t >= c.t0 - .12 && t < c.t1 + .17; c.el.style.visibility = vis ? 'visible' : 'hidden'; if (!vis) continue;
          const ps = P(t, c.t1, .16); c.el.style.opacity = 1 - ps; c.el.style.transform = `translateY(${-40 * oc(ps)}px)`; c.el.style.filter = ps > 0 ? `blur(${ps * 10}px)` : 'none';
          for (const w of c.words) { const q = P(t, w.t - .07, .3); const e = RK.ent(q, 40); w.el.style.opacity = e.o; w.el.style.transform = `translateY(${e.dy}px) scale(${e.s})`; w.el.style.filter = e.b > .05 ? `blur(${e.b}px)` : 'none'; }
        }
      },
    };
  };

  // ---------- explode: letras grandes chegando de todos os lados e assentando ----------
  // params: linhas ['ABC','DEF'], y [675,900], em (expr), atrasos [-.04,.12], sai (expr), cor, brilho, tamanho (230)
  RK.css(`.big{font-weight:900;line-height:1;white-space:nowrap;width:1080px;text-align:center}.bigl{display:inline-block}`);
  RK.blocos.explode = function (ctx, p) {
    const em = ctx.t(p.em), sai = ctx.t(p.sai), cor = ctx.cor(p.cor || 'vd'), brilho = ctx.A(p.brilho || p.cor || 'vd');
    const tam = p.tamanho || 230, atr = p.atrasos || [-.04, .12], ys = p.y || [675, 900];
    const linhas = p.linhas.map((txt, bi) => {
      const b = ctx.el(`<div class="a big" style="font-size:${tam}px;letter-spacing:${-8 * tam / 230}px"></div>`);
      const L = [...txt].map(ch => { const s = document.createElement('span'); s.className = 'bigl'; s.textContent = ch; b.appendChild(s); return s; });
      return { b, L, bi };
    });
    return {
      render(t) {
        const out = P(t, sai, .35); const vis = t >= em - .1 && t < sai + .45;
        for (const { b, L, bi } of linhas) {
          b.style.visibility = vis ? 'visible' : 'hidden'; if (!vis) continue; const bt = em + (atr[bi] ?? 0);
          RK.S(b, { y: ys[bi] + Math.sin(t * 2.2 + bi) * 5, o: 1 - out, s: lerp(1, .92, oc(out)), b: out * 20 });
          L.forEach((s, i) => {
            const q = P(t, bt + i * .03, .45); const sd = rnd(i * 9 + bi * 31);
            const tx = (1 - oe(q)) * (sd - .5) * 700, ty = (1 - oe(q)) * ((rnd(i * 5 + bi) - .5) * 500), sc = lerp(3.2, 1, oe(q)), rr = (1 - oe(q)) * (sd - .5) * 80;
            s.style.opacity = cl(q * 3); s.style.transform = `translate(${tx}px,${ty}px) rotate(${rr}deg) scale(${sc})`;
            s.style.filter = `blur(${(1 - cl(q * 1.6)) * 18}px) drop-shadow(0 0 ${30 + 16 * Math.sin(t * 3)}px ${brilho.replace('A', .85)})`;
            s.style.color = cor;
          });
        }
      },
    };
  };

  // ---------- contador: número animado de A até B (com prefixo/sufixo) ----------
  // params: x, y, de (0), para, em, dur (.8), ease ('oe'), prefixo, sufixo, tamanho (96), cor, entra, sai
  RK.blocos.contador = function (ctx, p) {
    const em = ctx.t(p.em), dur = p.dur ?? .8, e = ease(p.ease || 'oe');
    const entra = p.entra != null ? ctx.t(p.entra) : em - .2, sai = p.sai != null ? ctx.t(p.sai) : null;
    const d = ctx.el(`<div class="a" style="width:1000px;text-align:center;font-size:${p.tamanho || 96}px;font-weight:900;letter-spacing:-3px;white-space:nowrap;color:${ctx.cor(p.cor || 'tx')}"></div>`);
    return {
      render(t) {
        const o = P(t, entra, .3) * (sai == null ? 1 : 1 - P(t, sai, .3));
        RK.SC(d, 1000, (p.tamanho || 96) * 1.2, { x: p.x ?? 540, y: p.y ?? 960, s: 1, o }); if (o <= .003) return;
        const v = lerp(p.de || 0, p.para, e(P(t, em, dur)));
        d.textContent = (p.prefixo || '') + (p.casas ? v.toFixed(p.casas).replace('.', ',') : milhar(v)) + (p.sufixo || '');
      },
    };
  };
  RK.contar = (v, casas) => casas ? v.toFixed(casas).replace('.', ',') : milhar(v);
})(typeof window !== 'undefined' ? window : globalThis);
