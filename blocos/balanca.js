// Balança: dois pratos com moedas; inclina para um lado e depois equilibra/inverte.
(function (root) {
  const RK = root.RK; const { cl, P, oc, ob, lerp } = RK.u;
  // params: pos (trilha; centro de um quadro 1080x560), esquerda {rotulo, cor, moeda, em}, direita {...},
  //   inclina [graus quando a esquerda cai, graus quando a direita cai] (padrão [-12, 11.5])
  RK.css(`.prato{width:300px;height:36px;border-radius:0 0 150px 150px/0 0 36px 36px;background:linear-gradient(180deg,#2a3a63,#162241);box-shadow:0 10px 40px rgba(0,0,0,.5),inset 0 2px 0 rgba(255,255,255,.12)}
.fio{width:3px;background:linear-gradient(#6f9bff88,#6f9bff22)}
.moeda{width:140px;height:32px;border-radius:50%}
.rot{font-size:40px;font-weight:800;letter-spacing:-.5px;white-space:nowrap;text-align:center}`);
  RK.blocos.balanca = function (ctx, p) {
    const tr = RK.trilha(p.pos, ctx.t), S = RK.S;
    const bal = ctx.el(`<div class="a" style="width:1080px;height:560px"></div>`);
    ctx.el(`<div class="a" style="width:16px;height:300px;border-radius:8px;background:linear-gradient(#6f9bff,#1b2c55);transform:translate(532px,190px)"></div>`, bal);
    ctx.el(`<div class="a" style="width:320px;height:40px;border-radius:50%;background:radial-gradient(#2a3d70,#0c1429 70%);box-shadow:0 0 40px rgba(35,107,255,.35);transform:translate(380px,474px)"></div>`, bal);
    const viga = ctx.el(`<div class="a" style="width:700px;height:18px;border-radius:9px;background:linear-gradient(90deg,#3f6fe0,#9fbcff,#3f6fe0);box-shadow:0 0 30px rgba(35,107,255,.5);transform-origin:350px 9px"></div>`, bal);
    ctx.el(`<div class="a" style="width:44px;height:44px;border-radius:50%;background:#236bff;box-shadow:0 0 30px #236bff;transform:translate(518px,178px)"></div>`, bal);
    function lado(q) {
      const w = ctx.el(`<div class="a" style="width:300px;height:330px"></div>`, bal);
      const f1 = ctx.el(`<div class="a fio" style="height:150px;transform-origin:0 0"></div>`, w), f2 = ctx.el(`<div class="a fio" style="height:150px;transform-origin:0 0"></div>`, w);
      S(f1, { x: 150, y: 0, r: -41 }); S(f2, { x: 150, y: 0, r: 41 }); const pr = ctx.el(`<div class="a prato"></div>`, w); S(pr, { x: 0, y: 112 });
      const ms = [...Array(5)].map(() => ctx.el(`<div class="a moeda" style="background:${q.moeda};box-shadow:0 3px 0 rgba(0,0,0,.35)"></div>`, w));
      const r = ctx.el(`<div class="a rot" style="width:300px;color:${ctx.cor(q.cor)}">${q.rotulo}</div>`, w); S(r, { x: 0, y: 170 });
      return { w, ms, r, em: ctx.t(q.em) };
    }
    const LE = lado(p.esquerda), LD = lado(p.direita); const [ie, id] = p.inclina || [-12, 11.5];
    return {
      render(t) {
        const st = tr(t); RK.SC(bal, 1080, 560, st); if (st.o <= 0.003) return;
        const pe = P(t, LE.em, .5), pd = P(t, LD.em, .6);
        const tilt = lerp(0, ie, oc(pe)) + lerp(0, id, ob(pd)) + Math.sin(t * 2.2) * .6;
        const rad = tilt * Math.PI / 180; S(viga, { x: 190, y: 191, r: tilt });
        const cx = 540, cy = 200, L = 330; const pE = { x: cx - L * Math.cos(rad), y: cy - L * Math.sin(rad) }, pD = { x: cx + L * Math.cos(rad), y: cy + L * Math.sin(rad) };
        S(LE.w, { x: pE.x - 150, y: pE.y }); S(LD.w, { x: pD.x - 150, y: pD.y });
        LE.ms.forEach((m, i) => { const q = P(t, LE.em + i * .07, .3); S(m, { x: 80, y: 84 - i * 22 - (1 - oc(q)) * 200, o: cl(q * 3) }); });
        LD.ms.forEach((m, i) => { const q = P(t, LD.em + i * .07, .3); S(m, { x: 80, y: 84 - i * 22 - (1 - oc(q)) * 200, o: cl(q * 3) }); });
        LE.r.style.opacity = oc(pe); LD.r.style.opacity = oc(pd);
      },
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
