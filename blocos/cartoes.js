// Cartões: comprovante genérico (com carimbo/selo e ✓/✕), contorno tracejado, voo de ficha entre
// dois pontos, cartão de resultado (mini colunas + valor contando) e carteira (rótulo + valor).
(function (root) {
  const RK = root.RK; const { cl, P, oc, ob, io, oe, lerp, milhar, ease } = RK.u;
  const POS = (ctx, p, padrao) => RK.trilha(p.pos || [[0, padrao || { x: 540, y: 960, s: 1, o: 1 }]], ctx.t);

  // ---------- cartão / comprovante ----------
  // params: pos (trilha), cab, corCab, corCabTexto, nome, imagem (logo antes do nome), etiqueta, rotulo, valor, fim ('ok'|'x'), selo (texto|null),
  //   estado: { inicial:{ate,cheio,pago,selo}, preenche, paga, perde, carimba }, pulsos:[{em,dur,amp,ate}]
  // expõe: pos(t) (centro do cartão em t)
  RK.css(`.slip{width:360px;height:470px;border-radius:34px;background:linear-gradient(180deg,rgba(24,36,70,.97),rgba(10,17,36,.98));border:3px solid rgba(111,155,255,.22);box-sizing:border-box;box-shadow:0 30px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08)}
.slip .cab{position:absolute;left:0;top:0;width:354px;height:88px;border-radius:31px 31px 0 0;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:900;letter-spacing:3px}
.slip .bn{position:absolute;left:0;top:112px;width:354px;text-align:center;font-size:44px;font-weight:800;color:#dfe6f6;white-space:nowrap}
.slip .ol{position:absolute;left:0;top:178px;width:354px;text-align:center;font-size:24px;font-weight:700;letter-spacing:4px;color:#7f8aa6}
.slip .od{position:absolute;left:0;top:206px;width:354px;text-align:center;font-size:96px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:1.05}
.slip .ph{position:absolute;left:62px;width:230px;height:26px;border-radius:13px;background:rgba(140,160,200,.16)}
.slip .etq{display:inline-block;margin-left:12px;padding:3px 12px;border-radius:10px;color:#1b1200;font-size:26px;font-weight:900;letter-spacing:1px;vertical-align:4px}
.slip .ok{position:absolute;left:278px;top:-40px;width:104px;height:104px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.slip .vz{position:absolute;left:127px;top:338px;width:100px;height:100px;border-radius:50%;border:4px dashed rgba(140,160,200,.35);box-sizing:border-box}
.selo{position:absolute;left:30px;top:330px;width:294px;height:104px;border:8px solid;border-radius:22px;font-size:54px;font-weight:900;letter-spacing:1px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;white-space:nowrap}`);
  RK.blocos.cartao = function (ctx, p) {
    const tr = POS(ctx, p);
    const corEtq = ctx.cor(p.corEtiqueta || 'am'), corSelo = ctx.cor(p.corSelo || 'am'), Aselo = ctx.A(p.corSelo || 'am'), Aok = ctx.A('vd');
    const c = ctx.el(`<div class="a slip"></div>`);
    ctx.el(`<div class="cab" style="background:${ctx.cor(p.corCab || 'az')};color:${ctx.cor(p.corCabTexto || '#fff')}">${p.cab || ''}</div>`, c);
    const ph = [ctx.el(`<div class="ph" style="top:128px"></div>`, c), ctx.el(`<div class="ph" style="top:230px;height:60px;left:92px;width:170px;border-radius:18px"></div>`, c)];
    const bn = ctx.el(`<div class="bn">${p.imagem ? `<img src="${p.imagem}" style="width:1.05em;height:1.05em;border-radius:.27em;object-fit:contain;background:#fff;vertical-align:-.2em;margin-right:.25em">` : ''}${p.nome || ''}${p.etiqueta ? `<span class="etq" style="background:${corEtq}">${p.etiqueta}</span>` : ''}</div>`, c);
    const ol = ctx.el(`<div class="ol">${p.rotulo || ''}</div>`, c);
    const od = ctx.el(`<div class="od">${p.valor ?? ''}</div>`, c);
    const vz = ctx.el(`<div class="vz"></div>`, c);
    const x = p.fim === 'x';
    const ok = ctx.el(`<div class="ok" style="background:${x ? '#3a4256' : ctx.cor('vd')};box-shadow:0 0 40px ${x ? 'rgba(0,0,0,.4)' : Aok.replace('A', .8)}">${x ? RK.icone.xis(48) : RK.icone.check(58)}</div>`, c);
    const selo = p.selo ? ctx.el(`<div class="selo" style="border-color:${corSelo};color:${corSelo};background:rgba(40,26,0,.88);box-shadow:0 0 50px ${Aselo.replace('A', .55)},inset 0 0 30px ${Aselo.replace('A', .25)}">${p.selo}</div>`, c) : null;
    const E = p.estado || {};
    const ini = E.inicial ? { ate: ctx.t(E.inicial.ate), cheio: E.inicial.cheio ?? 1, pago: E.inicial.pago ?? 0, selo: E.inicial.selo ?? 0 } : null;
    const tf = E.preenche != null ? ctx.t(E.preenche) : null, tp = E.paga != null ? ctx.t(E.paga) : null, tx = E.perde != null ? ctx.t(E.perde) : null, ts = E.carimba != null ? ctx.t(E.carimba) : null;
    const pulsos = (p.pulsos || []).map(q => ({ em: ctx.t(q.em), dur: q.dur ?? .45, amp: q.amp ?? .25, ate: q.ate == null ? null : ctx.t(q.ate) }));
    function estado(t) {
      if (ini && t < ini.ate) return { fill: ini.cheio, pago: ini.pago, perd: 0, selo: ini.selo };
      return { fill: tf == null ? 1 : oc(P(t, tf, .35)), pago: tp == null ? 0 : P(t, tp, .4), perd: tx == null ? 0 : P(t, tx, .4), selo: ts == null ? 0 : P(t, ts, .26) };
    }
    return {
      pos: tr,
      render(t) {
        const st = tr(t); const S = estado(t);
        if (S.perd > 0) st.o *= lerp(1, .4, S.perd);
        RK.SC(c, 360, 470, st); if (st.o <= 0.003) return;
        ph.forEach(e => e.style.opacity = 1 - S.fill);
        if (!bn._ok && (typeof document === 'undefined' || !document.fonts || document.fonts.status === 'loaded')) { bn._ok = 1; const w = bn.scrollWidth; if (w > 330) bn.style.fontSize = (44 * 330 / w).toFixed(1) + 'px'; }   // nome comprido encolhe para caber
        [bn, ol, od].forEach(e => { e.style.opacity = S.fill; e.style.transform = `scale(${lerp(.6, 1, ob(S.fill))})`; });
        vz.style.opacity = (S.pago > 0 || S.perd > 0 || S.selo > 0) ? 0 : 1;
        const pk = x ? S.perd : S.pago; ok.style.visibility = pk > 0 ? 'visible' : 'hidden'; ok.style.opacity = cl(pk * 3);
        let puls = 1; for (const q of pulsos) puls += q.amp * Math.sin(Math.PI * P(t, q.em, q.dur)) * (q.ate == null || t < q.ate ? 1 : 0);
        ok.style.transform = `scale(${ob(pk) * puls}) rotate(${(1 - oc(pk)) * -90}deg)`;
        let bord = 'rgba(111,155,255,.22)', sh = '0 30px 80px rgba(0,0,0,.55)';
        if (selo && S.selo > 0 && S.pago < 1) { const gl = S.selo; bord = Aselo.replace('A', .9 * gl); sh = `0 0 ${70 * gl}px ${Aselo.replace('A', .45 * gl)},0 30px 80px rgba(0,0,0,.55)`; }
        if (S.pago > 0) { const gl = S.pago; bord = Aok.replace('A', .9 * gl); sh = `0 0 ${80 * gl}px ${Aok.replace('A', .5 * gl)},0 30px 80px rgba(0,0,0,.55)`; }
        c.style.borderColor = bord; c.style.boxShadow = sh;
        if (selo) { selo.style.visibility = S.selo > 0 ? 'visible' : 'hidden'; selo.style.opacity = cl(S.selo * 2.5); selo.style.transform = `rotate(-11deg) scale(${lerp(2.6, 1, oc(S.selo))})`; }
      },
    };
  };

  // ---------- selo / carimbo avulso ----------
  // params: texto, x, y, em, cor ('am'), largura (294), angulo (-11)
  RK.blocos.selo = function (ctx, p) {
    const em = ctx.t(p.em), cor = ctx.cor(p.cor || 'am'), A = ctx.A(p.cor || 'am'), w = p.largura || 294;
    const s = ctx.el(`<div class="a selo" style="position:absolute;left:0;top:0;width:${w}px;border-color:${cor};color:${cor};background:rgba(40,26,0,.88);box-shadow:0 0 50px ${A.replace('A', .55)},inset 0 0 30px ${A.replace('A', .25)}">${p.texto}</div>`);
    const sai = p.sai != null ? ctx.t(p.sai) : null;
    return { render(t) { const q = P(t, em, .26); const o = cl(q * 2.5) * (sai == null ? 1 : 1 - P(t, sai, .3)); RK.SC(s, w, 104, { x: p.x ?? 540, y: p.y ?? 960, s: lerp(2.6, 1, oc(q)), r: p.angulo ?? -11, o }); } };
  };

  // ---------- contorno tracejado (um "lugar vazio" que vai ser preenchido) ----------
  // params: x, y, s, cor, aparece, some, ate, largura (360), altura (470)
  RK.blocos.contorno = function (ctx, p) {
    const w = p.largura || 360, h = p.altura || 470, A = ctx.A(p.cor || 'az');
    const gh = ctx.el(`<div class="a" style="width:${w}px;height:${h}px;border-radius:34px;border:4px dashed ${ctx.cor(p.cor || 'az')};box-sizing:border-box;box-shadow:0 0 40px ${A.replace('A', .25)} inset"></div>`);
    const ap = ctx.t(p.aparece), so = ctx.t(p.some), ate = p.ate == null ? Infinity : ctx.t(p.ate);
    return { render(t) { const q = P(t, ap, .4), r = P(t, so, .25); const e = RK.ent(q, 60); RK.SC(gh, w, h, { x: p.x, y: p.y + e.dy, s: p.s * e.s * lerp(1, 1.12, r), o: e.o * (1 - r) * (t < ate ? 1 : 0), b: e.b }); } };
  };

  // ---------- voo: ficha que sai de um ponto (ou célula de tabela) e cai num ator ----------
  // params: de {ator, celula:[linha,coluna]} | {x,y}; para {ator, em} | {x,y}; inicio, dur (.45), texto, cor, alfa (.9), arco (120)
  RK.css(`.chipv{width:150px;height:60px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;color:#fff}`);
  RK.blocos.voo = function (ctx, p) {
    const A = ctx.A(p.cor || 'az');
    const ch = ctx.el(`<div class="a chipv" style="background:${A.replace('A', p.alfa ?? .9)};box-shadow:0 0 30px ${A.replace('A', .7)}">${p.texto}</div>`);
    const ini = ctx.t(p.inicio), dur = p.dur ?? .45, arco = p.arco ?? 120;
    const tPara = p.para.em != null ? ctx.t(p.para.em) : null;
    const pa = () => p.de.ator ? ctx.atores[p.de.ator].celula(...p.de.celula) : p.de;
    const pb = () => p.para.ator ? ctx.atores[p.para.ator].pos(tPara) : p.para;
    return {
      render(t) {
        const q0 = P(t, ini, dur); if (q0 <= 0 || q0 >= 1) { ch.style.visibility = 'hidden'; return; }
        const A_ = pa(), B = pb(); const q = io(q0);
        RK.SC(ch, 150, 60, { x: lerp(A_.x, B.x, q), y: lerp(A_.y, B.y, q) - Math.sin(Math.PI * q) * arco, s: lerp(1, .9, q), o: 1 });
      },
    };
  };

  // ---------- cartão de resultado: título, mini colunas com ✓/✕, valor contando, subtítulo ----------
  // params: x, y, titulo, forte (bool), colunas [{cab,cor,corTexto,st:'ok'|'x'}], valor {prefixo,para,em,dur,ease},
  //   st ['ok'|'x' por coluna] (alternativa a colunas[i].st), sub, entra, sai, recua {em, s, o}, pulso (expr), borda (bool)
  RK.css(`.fim{width:440px;height:600px;border-radius:40px;background:linear-gradient(180deg,rgba(20,30,60,.96),rgba(9,14,30,.97));border:3px solid rgba(111,155,255,.2);box-sizing:border-box;box-shadow:0 30px 80px rgba(0,0,0,.55)}
.fim .tt{position:absolute;left:0;top:40px;width:434px;text-align:center;font-size:44px;font-weight:900;letter-spacing:-.5px;white-space:nowrap}
.ms3{position:absolute;top:130px;width:110px;height:144px;border-radius:18px;background:rgba(24,36,70,.97);border:2px solid rgba(111,155,255,.2);box-sizing:border-box;overflow:hidden}
.ms3 .h{height:36px;font-size:15px;font-weight:900;letter-spacing:1px;display:flex;align-items:center;justify-content:center}
.ms3 .m{position:absolute;left:27px;top:64px;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.fim .vv{position:absolute;left:0;width:434px;text-align:center;font-weight:900;letter-spacing:-3px;white-space:nowrap}`);
  RK.blocos.resultado = function (ctx, p) {
    const F = !!p.forte, vd = ctx.cor('vd'), Avd = ctx.A('vd');
    const c = ctx.el(`<div class="a fim"></div>`);
    ctx.el(`<div class="tt" style="color:${F ? vd : '#9aa4b8'}">${p.titulo || ''}</div>`, c);
    (p.colunas || []).forEach((k, i) => {
      const ok = (k.st ?? (p.st || [])[i]) === 'ok';
      ctx.el(`<div class="ms3" style="left:${42 + i * 120}px;${ok ? `border-color:${Avd.replace('A', .8)};box-shadow:0 0 24px ${Avd.replace('A', .35)}` : 'opacity:.5'}"><div class="h" style="background:${ctx.cor(k.cor)};color:${ctx.cor(k.corTexto || '#fff')}">${k.cab}</div><div class="m" style="background:${ok ? vd : '#3a4256'}">${ok ? RK.icone.check(30) : RK.icone.xis(26)}</div></div>`, c);
    });
    const vv = ctx.el(`<div class="vv" style="${F ? `top:340px;font-size:96px;color:#3dff95;text-shadow:0 0 50px ${Avd.replace('A', .6)}` : 'top:360px;font-size:72px;color:#a7b0c4'}"></div>`, c);
    const sub = ctx.el(`<div style="position:absolute;left:0;top:${F ? 480 : 470}px;width:434px;text-align:center;font-size:30px;font-weight:700;color:${F ? '#8fe9b8' : '#7f89a3'}">${p.sub || ''}</div>`, c);
    const ent = ctx.t(p.entra), sai = p.sai != null ? ctx.t(p.sai) : Infinity;
    const V = p.valor || {}, vem = ctx.t(V.em), vdur = V.dur ?? .8, ve = ease(V.ease || 'oe');
    const rec = p.recua ? { em: ctx.t(p.recua.em), s: p.recua.s ?? .94, o: p.recua.o ?? .75 } : null;
    const pul = p.pulso != null ? ctx.t(p.pulso) : null;
    return {
      render(t) {
        const out = P(t, sai, .4), pe = P(t, ent, .5), e = RK.ent(pe, 80), pr = rec ? P(t, rec.em, .5) : 0;
        let s = e.s * lerp(1, .9, out) * lerp(1, rec ? rec.s : 1, pr); if (pul != null) s *= 1 + .06 * Math.sin(Math.PI * P(t, pul, .5));
        RK.SC(c, 440, 600, { x: p.x, y: p.y + e.dy - out * 40, s, o: e.o * (1 - out) * lerp(1, rec ? rec.o : 1, pr), b: e.b + out * 12 });
        const vp = P(t, vem, vdur); vv.textContent = (V.prefixo || '') + RK.contar((V.para || 0) * ve(vp), V.casas); vv.style.opacity = cl(vp * 3);
        sub.style.opacity = oc(P(t, ent + .3, .4));
        if (p.borda) c.style.borderColor = Avd.replace('A', .8 * oc(vp));
      },
    };
  };

  // ---------- carteira: ícone + rótulo + valor que muda por fases ----------
  // params: pos (trilha), prefixo ('R$ '), brilho (expr), fases [{ate?, em, dur, de, para, rotulos:[antes,depois], cores:[antes,depois]}]
  //   cores: [r,g,b] nas duas pontas = transição suave; texto = troca seca quando começa
  RK.css(`.cart{width:560px;height:150px;border-radius:75px;background:linear-gradient(180deg,rgba(20,32,62,.96),rgba(10,16,34,.96));border:3px solid rgba(111,155,255,.3);box-shadow:0 20px 60px rgba(0,0,0,.5);box-sizing:border-box}
.cart .cl{position:absolute;left:150px;top:22px;font-size:26px;font-weight:800;letter-spacing:3px;color:#8a94ab;white-space:nowrap}
.cart .cv{position:absolute;left:150px;top:52px;font-size:70px;font-weight:900;letter-spacing:-2px;white-space:nowrap}`);
  const CARTEIRA = '<svg style="position:absolute;left:44px;top:42px" width="76" height="64" viewBox="0 0 58 50"><rect x="2" y="8" width="54" height="40" rx="9" fill="none" stroke="#6f9bff" stroke-width="4"/><path d="M8 8 L40 1 L44 8" fill="none" stroke="#6f9bff" stroke-width="4" stroke-linejoin="round"/><rect x="36" y="22" width="20" height="13" rx="5" fill="#6f9bff"/></svg>';
  RK.blocos.carteira = function (ctx, p) {
    const tr = POS(ctx, p);
    const c = ctx.el(`<div class="a cart">${p.icone || CARTEIRA}<div class="cl"></div><div class="cv"></div></div>`);
    const cl_ = c.querySelector('.cl'), cv = c.querySelector('.cv');
    const fases = p.fases.map(f => ({ ...f, ate: f.ate == null ? Infinity : ctx.t(f.ate), em: ctx.t(f.em), dur: f.dur ?? .6, cores: (f.cores || ['#fff', '#fff']).map(x => Array.isArray(x) ? x : ctx.cor(x)) }));
    const br = p.brilho != null ? ctx.t(p.brilho) : null, Avd = ctx.A('vd');
    return {
      render(t) {
        const st = tr(t); RK.SC(c, 560, 150, st); if (st.o <= 0.003) return;
        const f = fases.find(x => t < x.ate) || fases[fases.length - 1];
        const q = oc(P(t, f.em, f.dur)); const v = lerp(f.de, f.para, q);
        const [ca, cb] = f.cores; let cor;
        if (Array.isArray(ca) && Array.isArray(cb)) cor = q > 0 ? `rgb(${lerp(ca[0], cb[0], q) | 0},${lerp(ca[1], cb[1], q) | 0},${lerp(ca[2], cb[2], q) | 0})` : `rgb(${ca.join(',')})`;
        else cor = q > 0 ? (Array.isArray(cb) ? `rgb(${cb.join(',')})` : cb) : (Array.isArray(ca) ? `rgb(${ca.join(',')})` : ca);
        cv.textContent = (p.prefixo ?? 'R$ ') + milhar(v); cv.style.color = cor; cl_.textContent = q > 0 ? f.rotulos[1] : f.rotulos[0];
        const gv = br != null && t >= br ? P(t, br, .5) : 0;
        cv.style.textShadow = gv > 0 ? `0 0 ${30 * gv}px ${Avd.replace('A', .7)}` : 'none'; c.style.borderColor = gv > 0 ? Avd.replace('A', .8 * gv) : 'rgba(111,155,255,.3)';
      },
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
