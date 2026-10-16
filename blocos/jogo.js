// Futebol genérico: estado da partida (placar + minuto + rebobinar), placar com dígitos que viram,
// campo visto de cima com jogadores, bola e gols.
(function (root) {
  const RK = root.RK; const { cl, P, oc, io, lerp } = RK.u;

  // ---------- estado: partida ----------
  // params: inicial {c,f,st} (antes do rebobinar), rebobinar {de, ate, seq:[[c,f],...], minuto},
  //   apito (expr), gols {c:[expr], f:[expr]}, minutos [[expr, min]], fim (expr)
  // expõe: em(t) -> {c, f, st:'antes'|'vivo'|'enc'|'rew', m}; linhas() -> listas de troca de dígito; golsT
  RK.blocos.partida = function (ctx, p) {
    const ini = p.inicial || { c: 0, f: 0, st: 'antes' };
    const rb = p.rebobinar ? { de: ctx.t(p.rebobinar.de), ate: ctx.t(p.rebobinar.ate), seq: p.rebobinar.seq, m: p.rebobinar.minuto ?? 90 } : null;
    const kick = ctx.t(p.apito), fim = p.fim != null ? ctx.t(p.fim) : Infinity;
    const gc = (p.gols?.c || []).map(ctx.t), gf = (p.gols?.f || []).map(ctx.t);
    const MIN = (p.minutos || [[p.apito, 0]]).map(([t, m]) => [ctx.t(t), m]);
    const RW = rb ? [...Array(rb.seq.length - 1)].map((_, k, a) => lerp(rb.de + .15, rb.ate - .2, a.length > 1 ? k / (a.length - 1) : 0)) : [];
    const minuto = t => {
      if (t <= MIN[0][0]) return MIN[0][1];
      for (let i = 1; i < MIN.length; i++) if (t < MIN[i][0]) return lerp(MIN[i - 1][1], MIN[i][1], (t - MIN[i - 1][0]) / (MIN[i][0] - MIN[i - 1][0]));
      const u = MIN[MIN.length - 1]; return u[1] + Math.min(1, (t - u[0]) * .5);
    };
    function em(t) {
      if (rb && t < rb.de) return { ...ini };
      if (rb && t < rb.ate + .05) { const k = RW.filter(x => t >= x).length; const s = rb.seq[k]; return { c: s[0], f: s[1], st: 'rew', m: lerp(rb.m, 0, P(t, rb.de, rb.ate - rb.de)) }; }
      if (t < kick) return { c: 0, f: 0, st: 'antes' };
      const c = gc.filter(x => t >= x).length, f = gf.filter(x => t >= x).length;
      return { c, f, st: t >= fim ? 'enc' : 'vivo', m: minuto(t) };
    }
    // listas [[t, valor]] das trocas de cada dígito (para o placar animar a virada)
    function linhas() {
      const L = { c: [[-1, rb ? ini.c : 0]], f: [[-1, rb ? ini.f : 0]] };
      const add = (k, t, v) => { if (L[k][L[k].length - 1][1] !== v) L[k].push([t, v]); };
      if (rb) RW.forEach((x, k) => { add('c', x, rb.seq[k + 1][0]); add('f', x, rb.seq[k + 1][1]); });
      gc.forEach((x, i) => add('c', x, i + 1)); gf.forEach((x, i) => add('f', x, i + 1));
      return L;
    }
    return { em, linhas, gols: [...gc, ...gf], rebobina: RW };
  };
  const fmtMin = m => { m = Math.floor(m); return m > 90 ? `90+${m - 90}'` : `${m}'`; };
  RK.fmtMin = fmtMin;

  // ---------- placar ----------
  // params: pos (trilha), estado ('partida'), casa {nome,cor}, fora {nome,cor},
  //   textos {enc,antes,vivo,rew} (padrão pt-BR)
  RK.css(`.placar{width:820px;height:160px;border-radius:44px;background:linear-gradient(180deg,rgba(18,28,56,.97),rgba(9,14,30,.97));border:2px solid rgba(111,155,255,.25);box-shadow:0 24px 70px rgba(0,0,0,.55)}
.placar .time{position:absolute;top:30px;width:180px;height:76px;border-radius:22px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;letter-spacing:2px;color:#fff}
.placar .dig{position:absolute;top:4px;width:110px;height:120px;overflow:hidden}
.placar .dig span{position:absolute;left:0;top:0;width:110px;text-align:center;font-size:104px;font-weight:900;line-height:120px;color:#fff}
.placar .stat{position:absolute;left:0;top:118px;width:820px;text-align:center;font-size:24px;font-weight:800;letter-spacing:3px;white-space:nowrap}`);
  RK.blocos.placar = function (ctx, p) {
    const tr = RK.trilha(p.pos, ctx.t), J = ctx.estados[p.estado || 'partida'];
    const TX = Object.assign({ enc: 'JOGO ENCERRADO', antes: 'ANTES DO JOGO', vivo: 'AO VIVO' }, p.textos || {});
    const pl = ctx.el(`<div class="a placar"></div>`);
    ctx.el(`<div class="time" style="left:24px;background:${ctx.cor(p.casa?.cor || 'az')}">${p.casa?.nome || ''}</div>`, pl);
    ctx.el(`<div class="time" style="left:616px;background:${ctx.cor(p.fora?.cor || 'vm')}">${p.fora?.nome || ''}</div>`, pl);
    ctx.el(`<div style="position:absolute;left:380px;top:12px;width:60px;text-align:center;font-size:70px;font-weight:800;color:#6f7a96">×</div>`, pl);
    const dig = left => { const d = ctx.el(`<div class="dig" style="left:${left}px"><span></span><span></span></div>`, pl); return { a: d.children[0], b: d.children[1] }; };
    const dC = dig(240), dF = dig(470); const stat = ctx.el(`<div class="stat"></div>`, pl);
    const L = J.linhas(), fl = J.gols;
    function digDet(d, lista, t) {
      let i = 0; for (let k = 0; k < lista.length; k++) if (t >= lista[k][0]) i = k;
      const v = lista[i][1], pv = i > 0 ? lista[i - 1][1] : v, t0 = lista[i][0]; const q = i > 0 ? P(t, t0, .32) : 1; const dir = v >= pv ? 1 : -1;
      if (q >= 1) { d.a.textContent = v; d.a.style.transform = 'none'; d.a.style.opacity = 1; d.b.style.opacity = 0; return; }
      d.a.textContent = pv; d.b.textContent = v;
      d.a.style.transform = `translateY(${-120 * dir * oc(q)}px)`; d.a.style.opacity = 1 - q;
      d.b.style.transform = `translateY(${120 * dir * (1 - oc(q))}px) scale(${1 + .22 * Math.sin(Math.PI * q)})`; d.b.style.opacity = 1;
    }
    return {
      render(t) {
        const st = tr(t); RK.SC(pl, 820, 160, st); if (st.o <= 0.003) return;
        digDet(dC, L.c, t); digDet(dF, L.f, t);
        const E = J.em(t); const blink = .5 + .5 * Math.sin(t * 7);
        stat.innerHTML = E.st === 'enc' ? `<span style="color:#c9d3ea">${TX.enc}</span>`
          : E.st === 'rew' ? `<span style="color:#6f9bff">◀◀ ${fmtMin(E.m)}</span>`
          : E.st === 'antes' ? `<span style="color:#ffd27a">${TX.antes}</span>`
          : `<span style="color:#ef4b55;opacity:${.4 + .6 * blink}">●</span> <span style="color:#ff8a90">${TX.vivo} · ${fmtMin(E.m)}</span>`;
        let k = 0; for (const x of fl) { const d = t - x; if (d >= 0 && d < .6) k = Math.max(k, 1 - d / .6); }
        pl.style.boxShadow = `0 24px 70px rgba(0,0,0,.55), 0 0 ${90 * k}px rgba(111,155,255,${.8 * k})`;
      },
    };
  };

  // ---------- campo visto de cima ----------
  // params: pos (trilha), lances [{t, de:[x,y], gol:1|0}] (gol 1 = gol da direita), cores [casa, fora]
  RK.blocos.campo = function (ctx, p) {
    const tr = RK.trilha(p.pos, ctx.t);
    const campo = ctx.el(`<div class="a" style="width:900px;height:500px"><canvas width="900" height="500" style="width:900px;height:500px;border-radius:30px;box-shadow:0 30px 90px rgba(0,0,0,.6)"></canvas></div>`);
    const cg = campo.firstChild.getContext && campo.firstChild.getContext('2d');
    const rnd = RK.u.rnd;
    const [cc, cf] = (p.cores || ['az', 'vm']).map(ctx.cor);
    const JOG = [...Array(12)].map((_, i) => ({ lado: i < 6 ? 0 : 1, bx: (i < 6 ? [90, 230, 230, 360, 360, 420] : [810, 670, 670, 540, 540, 480])[i % 6], by: [250, 145, 355, 105, 395, 250][i % 6], ph: rnd(i + 3) * 6.28 }));
    const LANCES = (p.lances || []).map(L => ({ ...L, t: ctx.t(L.t) }));
    function bolaEm(t) {
      for (const L of LANCES) {
        const d = t - (L.t - .7); if (d >= 0 && d < 1.2) {
          const gx = L.gol ? 878 : 22, gy = 250 + (L.gol ? -30 : 30);
          if (d < .7) { const q = io(d / .7); return { x: lerp(L.de[0], gx, q), y: lerp(L.de[1], gy, q) - Math.sin(Math.PI * q) * 40, tr: true }; }
          return { x: gx + (L.gol ? 8 : -8), y: gy, tr: false };
        }
      }
      return { x: 450 + Math.sin(t * 1.3) * 200 + Math.sin(t * 2.9) * 60, y: 250 + Math.cos(t * 1.1) * 115, tr: false };
    }
    function desenha(t) {
      if (!cg) return; const W = 900, H = 500;
      const gr = cg.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#0f3a26'); gr.addColorStop(1, '#0c3221'); cg.fillStyle = gr; cg.fillRect(0, 0, W, H);
      for (let i = 0; i < 10; i++) { if (i % 2) { cg.fillStyle = 'rgba(255,255,255,.025)'; cg.fillRect(i * 90, 0, 90, H); } }
      cg.strokeStyle = 'rgba(220,255,235,.55)'; cg.lineWidth = 4;
      cg.strokeRect(22, 22, W - 44, H - 44); cg.beginPath(); cg.moveTo(W / 2, 22); cg.lineTo(W / 2, H - 22); cg.stroke();
      cg.beginPath(); cg.arc(W / 2, H / 2, 70, 0, 6.283); cg.stroke();
      cg.strokeRect(22, H / 2 - 130, 120, 260); cg.strokeRect(W - 142, H / 2 - 130, 120, 260); cg.strokeRect(22, H / 2 - 60, 44, 120); cg.strokeRect(W - 66, H / 2 - 60, 44, 120);
      for (const L of LANCES) { const d = t - L.t; const a = d >= 0 && d < .6 ? 1 - d / .6 : 0; const x = L.gol ? W - 22 : 0; cg.fillStyle = `rgba(255,255,255,${.18 + .6 * a})`; cg.fillRect(x, H / 2 - 50, 22, 100); }
      for (const j of JOG) { const x = j.bx + Math.sin(t * 1.4 + j.ph) * 26, y = j.by + Math.cos(t * 1.1 + j.ph) * 22; cg.fillStyle = j.lado ? cf : cc; cg.beginPath(); cg.arc(x, y, 17, 0, 6.283); cg.fill(); cg.strokeStyle = 'rgba(255,255,255,.85)'; cg.lineWidth = 3; cg.stroke(); }
      const b = bolaEm(t); if (b.tr) { for (let k = 1; k < 6; k++) { const bb = bolaEm(t - k * .03); cg.fillStyle = `rgba(255,255,255,${.25 - k * .04})`; cg.beginPath(); cg.arc(bb.x, bb.y, 11, 0, 6.283); cg.fill(); } }
      cg.fillStyle = '#fff'; cg.beginPath(); cg.arc(b.x, b.y, 11, 0, 6.283); cg.fill(); cg.strokeStyle = '#0b1a12'; cg.lineWidth = 2; cg.stroke();
    }
    return { render(t) { const st = tr(t); RK.SC(campo, 900, 500, st); if (st.o > 0.003) desenha(t); } };
  };
})(typeof window !== 'undefined' ? window : globalThis);
