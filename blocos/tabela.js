// Tabela/comparador genérico: linhas x colunas de números. Dois modos:
//   'destaque' — acende, coluna a coluna, a célula de MAIOR valor (calculada e conferida por código);
//   'busca'    — os números ficam trocando (procurando) até que uma linha "trava" e acende.
// E o relógio (tempo correndo) que acompanha a busca.
(function (root) {
  const RK = root.RK; const { cl, P, oc, ob, lerp, rnd } = RK.u;
  RK.css(`.comp{width:960px;border-radius:36px;background:linear-gradient(180deg,rgba(16,26,52,.97),rgba(8,13,28,.98));border:2px solid rgba(111,155,255,.28);box-shadow:0 30px 90px rgba(0,0,0,.6);overflow:hidden}
.comp .top{position:absolute;left:0;top:0;width:960px;height:78px;border-bottom:1px solid rgba(111,155,255,.18);background:rgba(10,18,40,.8)}
.comp .jogo{position:absolute;right:30px;top:20px;font-size:28px;font-weight:800;color:#dbe3f5;white-space:nowrap}
.comp .hd{position:absolute;top:84px;height:44px;font-size:24px;font-weight:900;letter-spacing:2px;display:flex;align-items:center;justify-content:center}
.comp .rw{position:absolute;left:14px;width:932px;height:60px;border-radius:16px}
.comp .nm{position:absolute;left:26px;top:0;height:60px;display:flex;align-items:center;font-size:30px;font-weight:800;color:#c9d3ea;white-space:nowrap}
.comp .ce{position:absolute;top:6px;width:190px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;color:#e9eefa}`);
  const etq = (txt, cor) => `<span style="margin-left:8px;padding:1px 8px;border-radius:7px;background:${cor};color:#1b1200;font-size:18px;font-weight:900">${txt}</span>`;
  const CX = [340, 545, 750];

  // params comuns: pos (trilha), altura, logo (src|null), titulo (html à direita no topo),
  //   colunas [{nome, corTitulo, cor (destaque), alfa}], etiquetas [[linha, coluna, texto]], corEtiqueta
  // 'destaque': linhas [[nome,[v1,v2,v3]]], destaque [expr por coluna], centro {x,y} (repouso, p/ celula()),
  //   pulsoLogo (expr), melhor [linha por coluna] (opcional: conferido contra o máximo calculado)
  // 'busca': linhas [[nome,[v1,v2,v3]]], acha (índice), em (expr)
  RK.blocos.tabela = function (ctx, p) {
    const tr = RK.trilha(p.pos, ctx.t), modo = p.modo || 'destaque', busca = modo === 'busca';
    const H = p.altura || (busca ? 520 : 410), rowH = busca ? 74 : 66;
    const cols = p.colunas, corE = ctx.cor(p.corEtiqueta || 'am');
    const comp = ctx.el(`<div class="a comp" style="height:${H}px"></div>`);
    ctx.el(`<div class="top">${p.logo ? `<img src="${p.logo}" style="position:absolute;left:28px;top:22px;height:34px;width:auto">` : ''}${p.titulo ? `<div class="jogo">${p.titulo}</div>` : ''}</div>`, comp);
    const clogo = comp.querySelector('img');
    cols.forEach((c, k) => ctx.el(`<div class="hd" style="left:${CX[k]}px;width:190px;color:${ctx.cor(c.corTitulo)}">${c.nome}</div>`, comp));
    const A = cols.map(c => ctx.A(c.cor)), alfa = cols.map(c => c.alfa ?? .85);
    const ET = {}; for (const [l, c, txt] of (p.etiquetas || [])) ET[l + ',' + c] = txt;
    const L = p.linhas;
    // maior valor por coluna, conferido
    const melhor = cols.map((_, k) => L.reduce((b, r, j) => r[1][k] > L[b][1][k] ? j : b, 0));
    if (p.melhor && p.melhor.some((m, k) => L[m][1][k] < L[melhor[k]][1][k])) throw new Error('tabela: a linha indicada não tem o maior valor da coluna');
    const best = p.melhor || melhor;
    const rows = L.map((r, j) => {
      const rw = ctx.el(`<div class="rw" style="top:${136 + j * rowH}px;${busca ? 'height:66px;' : ''}background:${j % 2 ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.04)'}"></div>`, comp);
      ctx.el(`<div class="nm"${busca ? ' style="font-size:28px;height:66px"' : ''}>${r[0]}</div>`, rw);
      const ce = r[1].map((v, k) => ctx.el(`<div class="ce" style="left:${CX[k] - 14}px${busca ? ';top:9px' : ''}">${busca ? '' : v.toFixed(2) + (ET[j + ',' + k] ? etq(ET[j + ',' + k], corE) : '')}</div>`, rw));
      return { rw, ce };
    });
    const hl = (p.destaque || []).map(ctx.t), lp = p.pulsoLogo != null ? ctx.t(p.pulsoLogo) : null;
    const acha = p.acha ?? 0, tAcha = p.em != null ? ctx.t(p.em) : Infinity;
    const C = p.centro || { x: 540, y: 685 };
    const Az = ctx.A('az'), Avd = ctx.A('vd');
    return {
      celula: (j, k) => ({ x: C.x - 480 + CX[k] - 14 + 95, y: C.y - H / 2 + 136 + j * rowH + 30 }),
      render(t) {
        const st = tr(t); RK.SC(comp, 960, H, st); if (st.o <= 0.003) return;
        if (!busca) {
          rows.forEach((r, j) => r.ce.forEach((c, k) => {
            const h = oc(P(t, hl[k], .3)); const b = best[k] === j;
            c.style.background = b ? A[k].replace('A', alfa[k] * h) : 'transparent';
            c.style.boxShadow = b && h > 0 ? `0 0 ${34 * h}px ${A[k].replace('A', .7 * h)}` : 'none';
            c.style.color = b && h > .5 && alfa[k] > .5 ? '#fff' : (b || h < .01 ? '#e9eefa' : `rgba(233,238,250,${lerp(1, .4, P(t, hl[k], .3))})`);
            c.style.transform = b ? `scale(${1 + .1 * h})` : 'none';
          }));
          if (clogo && lp != null) {
            const q = Math.sin(Math.PI * P(t, lp, .7)); clogo.style.transform = `scale(${1 + .28 * q})`; clogo.style.transformOrigin = '0 50%';
            clogo.style.filter = q > 0 ? `drop-shadow(0 0 ${24 * q}px ${Az.replace('A', .95)})` : 'none';
            comp.style.boxShadow = `0 30px 90px rgba(0,0,0,.6), 0 0 ${70 * q}px ${Az.replace('A', .55 * q)}`;
          }
          return;
        }
        const ach = P(t, tAcha, .35);
        rows.forEach((r, j) => {
          const sel = j === acha;
          r.ce.forEach((c, k) => {
            const fr = Math.floor(t * 7 + j * 3 + k * 5); const parado = sel && t >= tAcha;
            const v = parado ? L[j][1][k] : Math.max(1.05, L[j][1][k] + (rnd(fr * 1.7 + j * 11 + k) - .5) * .5);
            c.innerHTML = v.toFixed(2) + (parado && ET[j + ',' + k] ? etq(ET[j + ',' + k], corE) : '');
            const fl = !parado && (fr % 4 === 0); c.style.color = parado ? '#fff' : (fl ? '#ffd27a' : '#e9eefa');
            c.style.background = parado ? A[k].replace('A', alfa[k]) : 'transparent';
          });
          r.rw.style.boxShadow = sel && ach > 0 ? `0 0 0 3px ${Avd.replace('A', .9 * ach)}, 0 0 ${50 * ach}px ${Avd.replace('A', .5 * ach)}` : 'none';
          r.rw.style.opacity = ach > 0 && !sel ? lerp(1, .35, ach) : 1; r.rw.style.transform = sel ? `scale(${1 + .04 * ach})` : 'none';
        });
      },
    };
  };

  // ---------- relógio (tempo correndo) ----------
  // params: x, y, de (expr), ate (expr), cor ('am')
  RK.blocos.relogio = function (ctx, p) {
    const cor = ctx.cor(p.cor || 'am'), A = ctx.A(p.cor || 'am');
    const r = ctx.el(`<div class="a" style="width:130px;height:130px"><svg width="130" height="130" style="filter:drop-shadow(0 0 18px ${A.replace('A', .6)})" viewBox="0 0 130 130"><circle cx="65" cy="72" r="50" fill="rgba(10,20,46,.9)" stroke="${cor}" stroke-width="6"/><rect x="55" y="6" width="20" height="12" rx="4" fill="${cor}"/><line x1="65" y1="72" x2="65" y2="34" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/><circle cx="65" cy="72" r="6" fill="${cor}"/></svg></div>`);
    const pont = r.querySelector('line'), de = ctx.t(p.de), ate = ctx.t(p.ate);
    return { render(t) { const rs = P(t, de, .4) * (1 - P(t, ate, .4)); RK.SC(r, 130, 130, { x: p.x ?? 540, y: p.y ?? 528, s: lerp(.6, 1.05, ob(rs)) * (1 + .05 * Math.sin(t * 12)), o: rs }); pont.setAttribute('transform', `rotate(${(t * 240) % 360} 65 72)`); } };
  };
})(typeof window !== 'undefined' ? window : globalThis);
