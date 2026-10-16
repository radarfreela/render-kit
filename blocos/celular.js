// Celular (mockup) com barra de status, mini placar opcional (lê o estado 'partida') e notificações.
(function (root) {
  const RK = root.RK; const { cl, P, ob, lerp } = RK.u;
  // params: pos (trilha), hora ('21:47'), placar {estado:'partida', casa:{nome,cor}, fora:{nome,cor}, textos} | null,
  //   notificacoes [{topo, titulo, sub, icone ('check'), fases:[{ate?, entra, sai?}], brilho (expr)}]
  RK.css(`.fone{width:400px;height:820px;border-radius:70px;background:linear-gradient(160deg,#2b3347,#0d1120 40%,#1c2335);box-shadow:0 40px 110px rgba(0,0,0,.7),0 0 0 2px rgba(160,180,220,.25) inset}
.fone .tela{position:absolute;left:14px;top:14px;width:372px;height:792px;border-radius:58px;background:linear-gradient(180deg,#0a1124,#05080f);overflow:hidden}
.fone .ilha{position:absolute;left:136px;top:14px;width:100px;height:30px;border-radius:15px;background:#000}
.fone .hora{position:absolute;left:34px;top:14px;font-size:22px;font-weight:700;color:#e6ebf7}
.fone .bat{position:absolute;right:30px;top:20px;width:34px;height:16px;border-radius:5px;border:2px solid #cfd6e6;box-sizing:border-box}
.fone .bat:after{content:"";position:absolute;left:2px;top:2px;width:22px;height:8px;border-radius:2px;background:#cfd6e6}
.mini{position:absolute;left:18px;top:70px;width:336px;height:104px;border-radius:26px;background:rgba(22,32,60,.9);border:1px solid rgba(111,155,255,.25)}
.mini .tm{position:absolute;top:22px;width:80px;height:40px;border-radius:12px;font-size:17px;font-weight:900;letter-spacing:1px;display:flex;align-items:center;justify-content:center;color:#fff}
.mini .sc{position:absolute;left:96px;top:14px;width:144px;text-align:center;white-space:nowrap;font-size:44px;font-weight:900;color:#fff;letter-spacing:-1px}
.mini .ms{position:absolute;left:0;top:72px;width:336px;text-align:center;font-size:15px;font-weight:800;letter-spacing:2px;color:#aab3c8}
.notif{position:absolute;left:14px;width:344px;height:112px;border-radius:28px;background:rgba(34,44,72,.94);border:1px solid rgba(255,255,255,.08);box-shadow:0 14px 40px rgba(0,0,0,.45);transform-origin:50% 0}
.notif .ic{position:absolute;left:16px;top:22px;width:66px;height:66px;border-radius:18px;display:flex;align-items:center;justify-content:center}
.notif .t1{position:absolute;left:98px;top:22px;font-size:26px;font-weight:800;color:#fff;white-space:nowrap}
.notif .t2{position:absolute;left:98px;top:60px;font-size:21px;font-weight:600;color:#aeb8cf;white-space:nowrap}`);
  RK.blocos.celular = function (ctx, p) {
    const tr = RK.trilha(p.pos, ctx.t);
    const fone = ctx.el(`<div class="a fone"><div class="tela"></div></div>`); const tela = fone.firstChild;
    ctx.el(`<div class="ilha"></div>`, tela); ctx.el(`<div class="hora">${p.hora || '21:47'}</div>`, tela); ctx.el(`<div class="bat"></div>`, tela);
    let mini = null, J = null, TX = null;
    if (p.placar) {
      J = ctx.estados[p.placar.estado || 'partida']; TX = Object.assign({ enc: 'JOGO ENCERRADO', vivo: 'AO VIVO' }, p.placar.textos || {});
      const m = ctx.el(`<div class="mini"><div class="tm" style="left:16px;background:${ctx.cor(p.placar.casa?.cor || 'az')}">${p.placar.casa?.nome || ''}</div><div class="tm" style="left:240px;background:${ctx.cor(p.placar.fora?.cor || 'vm')}">${p.placar.fora?.nome || ''}</div><div class="sc"></div><div class="ms"></div></div>`, tela);
      mini = { sc: m.querySelector('.sc'), ms: m.querySelector('.ms') };
    }
    const Avd = ctx.A('vd'), vd = ctx.cor('vd');
    const notifs = (p.notificacoes || []).map(n => ({
      el: ctx.el(`<div class="notif" style="top:${n.topo}px"><div class="ic" style="background:linear-gradient(160deg,${vd},#139050)">${RK.icone[n.icone || 'check'](40, '#ffffff')}</div><div class="t1">${n.titulo}</div><div class="t2">${n.sub || ''}</div></div>`, tela),
      fases: n.fases.map(f => ({ ate: f.ate == null ? Infinity : ctx.t(f.ate), entra: ctx.t(f.entra), sai: f.sai == null ? null : ctx.t(f.sai) })),
      brilho: n.brilho == null ? null : ctx.t(n.brilho),
    }));
    return {
      render(t) {
        const st = tr(t); RK.SC(fone, 400, 820, st); if (st.o <= 0.003) return;
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
})(typeof window !== 'undefined' ? window : globalThis);
