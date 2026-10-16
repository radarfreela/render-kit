// Aparelho genérico (moldura sem marca) em três formatos — celular, tablet e computador — com a mesma
// API: barra de status, mini placar opcional (lê o estado 'partida'), notificações e conteúdo livre na tela.
// O bloco 'celular' é o aparelho no formato celular (compatível com os moldes antigos).
(function (root) {
  const RK = root.RK; const { cl, P, ob, lerp } = RK.u;
  // params: formato ('celular'|'tablet'|'computador'), pos (trilha), hora ('21:47'),
  //   placar {estado:'partida', casa:{nome,cor}, fora:{nome,cor}, textos} | null,
  //   notificacoes [{topo, titulo, sub, icone ('check'|'xis'), fases:[{ate?, entra, sai?}], brilho (expr)}],
  //   tela (html livre desenhado na tela, abaixo das notificações)
  // Tamanhos (largura x altura total, o centro de 'pos' é o centro disso):
  //   celular 400x820 (tela 372x792) · tablet 600x800 (tela 556x756, 3:4) · computador 960x606 (tela 840x525, 16:10, com base)
  RK.css(`.fone{width:400px;height:820px;border-radius:70px;background:linear-gradient(160deg,#2b3347,#0d1120 40%,#1c2335);box-shadow:0 40px 110px rgba(0,0,0,.7),0 0 0 2px rgba(160,180,220,.25) inset}
.fone .tela{position:absolute;left:14px;top:14px;width:372px;height:792px;border-radius:58px;background:linear-gradient(180deg,#0a1124,#05080f);overflow:hidden}
.fone .ilha{position:absolute;left:136px;top:14px;width:100px;height:30px;border-radius:15px;background:#000}
.fone .hora,.apar .hora{position:absolute;left:34px;top:14px;font-size:22px;font-weight:700;color:#e6ebf7}
.fone .bat,.apar .bat{position:absolute;right:30px;top:20px;width:34px;height:16px;border-radius:5px;border:2px solid #cfd6e6;box-sizing:border-box}
.fone .bat:after,.apar .bat:after{content:"";position:absolute;left:2px;top:2px;width:22px;height:8px;border-radius:2px;background:#cfd6e6}
.apar .moldura{position:absolute;left:0;top:0;background:linear-gradient(160deg,#2b3347,#0d1120 40%,#1c2335);box-shadow:0 40px 110px rgba(0,0,0,.7),0 0 0 2px rgba(160,180,220,.25) inset}
.apar .tela{position:absolute;background:linear-gradient(180deg,#0a1124,#05080f);overflow:hidden}
.apar .cam{position:absolute;width:10px;height:10px;border-radius:50%;background:#05070d;box-shadow:0 0 0 2px rgba(160,180,220,.12)}
.apar .base{position:absolute;background:linear-gradient(180deg,#3a4358,#1a2030);box-shadow:0 20px 50px rgba(0,0,0,.6)}
.apar .entalhe{position:absolute;background:#0d1120}
.mini{position:absolute;left:18px;top:70px;width:336px;height:104px;border-radius:26px;background:rgba(22,32,60,.9);border:1px solid rgba(111,155,255,.25)}
.mini .tm{position:absolute;top:22px;width:80px;height:40px;border-radius:12px;font-size:17px;font-weight:900;letter-spacing:1px;display:flex;align-items:center;justify-content:center;color:#fff}
.mini .sc{position:absolute;left:96px;top:14px;width:144px;text-align:center;white-space:nowrap;font-size:44px;font-weight:900;color:#fff;letter-spacing:-1px}
.mini .ms{position:absolute;left:0;top:72px;width:336px;text-align:center;font-size:15px;font-weight:800;letter-spacing:2px;color:#aab3c8}
.notif{position:absolute;left:14px;width:344px;height:112px;border-radius:28px;background:rgba(34,44,72,.94);border:1px solid rgba(255,255,255,.08);box-shadow:0 14px 40px rgba(0,0,0,.45);transform-origin:50% 0}
.notif .ic{position:absolute;left:16px;top:22px;width:66px;height:66px;border-radius:18px;display:flex;align-items:center;justify-content:center}
.notif .t1{position:absolute;left:98px;top:22px;font-size:26px;font-weight:800;color:#fff;white-space:nowrap}
.notif .t2{position:absolute;left:98px;top:60px;font-size:21px;font-weight:600;color:#aeb8cf;white-space:nowrap}`);

  // geometria de cada formato: tamanho total (W,H), tela (x,y,w,h,raio), onde vão o mini placar e as notificações
  const GEO = {
    tablet: { W: 600, H: 800, raio: 46, tela: [22, 22, 556, 756, 26], cam: [295, 7], mini: [110, 64], notif: { x: 96, w: 364 } },
    computador: { W: 960, H: 606, raio: 22, monitor: [40, 0, 880, 580], tela: [60, 20, 840, 525, 6], cam: [475, 6], base: [0, 580, 960, 26], mini: [24, 40], notif: { x: 840 - 380 - 20, w: 380 } },
  };

  RK.blocos.aparelho = function (ctx, p) {
    const formato = p.formato || 'celular', tr = RK.trilha(p.pos, ctx.t);
    let caixa, tela, W, H, nx = 14, nw = 344, mini0 = null;
    if (formato === 'celular') {   // idêntico ao bloco celular original
      W = 400; H = 820;
      caixa = ctx.el(`<div class="a fone"><div class="tela"></div></div>`); tela = caixa.firstChild;
      ctx.el(`<div class="ilha"></div>`, tela);
    } else {
      const G = GEO[formato]; if (!G) throw new Error('formato de aparelho desconhecido: ' + formato);
      W = G.W; H = G.H; nx = G.notif.x; nw = G.notif.w; mini0 = G.mini;
      caixa = ctx.el(`<div class="a apar" style="width:${W}px;height:${H}px"></div>`);
      const [mx, my, mw, mh] = G.monitor || [0, 0, W, H];
      ctx.el(`<div class="moldura" style="left:${mx}px;top:${my}px;width:${mw}px;height:${mh}px;border-radius:${G.raio}px"></div>`, caixa);
      const [tx, ty, tw, th, tr_] = G.tela;
      tela = ctx.el(`<div class="tela" style="left:${tx}px;top:${ty}px;width:${tw}px;height:${th}px;border-radius:${tr_}px"></div>`, caixa);
      ctx.el(`<div class="cam" style="left:${G.cam[0]}px;top:${G.cam[1]}px"></div>`, caixa);
      if (G.base) {
        const [bx, by, bw, bh] = G.base;
        ctx.el(`<div class="base" style="left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px;border-radius:0 0 22px 22px"></div>`, caixa);
        ctx.el(`<div class="entalhe" style="left:${bx + bw / 2 - 70}px;top:${by}px;width:140px;height:9px;border-radius:0 0 9px 9px"></div>`, caixa);
      }
    }
    if (p.tela) ctx.el(`<div style="position:absolute;left:0;top:0;width:100%;height:100%">${p.tela}</div>`, tela);
    ctx.el(`<div class="hora">${p.hora || '21:47'}</div>`, tela); ctx.el(`<div class="bat"></div>`, tela);
    let mini = null, J = null, TX = null;
    if (p.placar) {
      J = ctx.estados[p.placar.estado || 'partida']; TX = Object.assign({ enc: 'JOGO ENCERRADO', vivo: 'AO VIVO' }, p.placar.textos || {});
      const pos = mini0 ? ` style="left:${mini0[0]}px;top:${mini0[1]}px"` : '';
      const m = ctx.el(`<div class="mini"${pos}><div class="tm" style="left:16px;background:${ctx.cor(p.placar.casa?.cor || 'az')}">${p.placar.casa?.nome || ''}</div><div class="tm" style="left:240px;background:${ctx.cor(p.placar.fora?.cor || 'vm')}">${p.placar.fora?.nome || ''}</div><div class="sc"></div><div class="ms"></div></div>`, tela);
      mini = { sc: m.querySelector('.sc'), ms: m.querySelector('.ms') };
    }
    const Avd = ctx.A('vd'), vd = ctx.cor('vd');
    const geo = formato === 'celular' ? '' : `left:${nx}px;width:${nw}px;`;
    const notifs = (p.notificacoes || []).map(n => ({
      el: ctx.el(`<div class="notif" style="${geo}top:${n.topo}px"><div class="ic" style="background:${n.icone === 'xis' ? '#3a4256' : `linear-gradient(160deg,${vd},#139050)`}">${RK.icone[n.icone || 'check'](40, '#ffffff')}</div><div class="t1">${n.titulo}</div><div class="t2">${n.sub || ''}</div></div>`, tela),
      fases: n.fases.map(f => ({ ate: f.ate == null ? Infinity : ctx.t(f.ate), entra: ctx.t(f.entra), sai: f.sai == null ? null : ctx.t(f.sai) })),
      brilho: n.brilho == null ? null : ctx.t(n.brilho),
    }));
    return {
      render(t) {
        const st = tr(t); RK.SC(caixa, W, H, st); if (st.o <= 0.003) return;
        if (mini) {
          const E = J.em(t);
          mini.sc.textContent = `${E.c} × ${E.f}`; mini.ms.textContent = E.st === 'enc' ? TX.enc : E.st === 'vivo' ? `● ${TX.vivo} · ${RK.fmtMin(E.m)}` : '';
          mini.ms.style.color = E.st === 'vivo' ? '#ff8a90' : '#aab3c8';
        }
        for (const n of notifs) {
          const f = n.fases.find(x => t < x.ate) || n.fases[n.fases.length - 1];
          let q = P(t, f.entra, .45); if (f.sai != null) q *= 1 - P(t, f.sai, .25);
          n.el.style.visibility = q > 0 ? 'visible' : 'hidden'; n.el.style.opacity = cl(q * 2.5);
          n.el.style.transform = `translateY(${-70 * (1 - ob(q))}px) scale(${lerp(.9, 1, ob(q))})`;
          const g = n.brilho == null ? 0 : Math.sin(Math.PI * P(t, n.brilho, .8));
          n.el.style.boxShadow = `0 14px 40px rgba(0,0,0,.45),0 0 ${40 * g}px ${Avd.replace('A', .6 * g)}`;
        }
      },
    };
  };
  RK.blocos.celular = (ctx, p, id) => RK.blocos.aparelho(ctx, Object.assign({}, p, { formato: 'celular' }), id);
})(typeof window !== 'undefined' ? window : globalThis);
