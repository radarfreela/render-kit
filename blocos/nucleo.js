// Núcleo da biblioteca de blocos: utilidades de tempo/easing, posição, tema (cores), palco,
// fundo (brilho + partículas + explosões + ondas), câmera (respiração, zoom, tremor, flash, rebobinar)
// e o montador que lê window.VIDEO e cria window.render(t) + window.DUR para o gravar.mjs.
// Regra de ouro: render(t) depende só de t (nenhum estado entre quadros), então qualquer
// pedaço do vídeo pode ser gravado sozinho e os pedaços casam sem pulo.
(function (root) {
  const RK = root.RK = root.RK || {};
  RK.blocos = RK.blocos || {};

  // ---------- utilidades ----------
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const P = (t, a, d) => cl((t - a) / d);
  const oc = x => 1 - Math.pow(1 - x, 3);
  const ob = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const io = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const oe = x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
  const lin = x => x;
  const lerp = (a, b, p) => a + (b - a) * p;
  const milhar = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const rnd = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const EASE = { oc, ob, io, oe, lin };
  const ease = e => typeof e === 'function' ? e : (EASE[e] || io);
  RK.u = { cl, P, oc, ob, io, oe, lin, lerp, milhar, rnd, ease, EASE };

  // entrada padrão: aparece com escala "back", desfoque saindo e subida
  RK.ent = (p, dy = 60) => ({ o: cl(p * 1.6), s: lerp(.82, 1, ob(p)), b: (1 - cl(p * 1.4)) * 14, dy: (1 - oc(p)) * dy });

  // estado visual {x,y,s,r,o,b} -> estilo. S posiciona pelo canto; SC pelo centro (w,h do elemento).
  function S(e, { x = 0, y = 0, s = 1, r = 0, o = 1, b = 0 }) {
    e.style.transform = `translate(${x}px,${y}px) rotate(${r}deg) scale(${s})`; e.style.opacity = o;
    e.style.filter = b > 0.05 ? `blur(${b}px)` : 'none'; e.style.visibility = o <= 0.003 ? 'hidden' : 'visible';
  }
  const SC = (e, w, h, st) => S(e, { x: st.x - w / 2, y: st.y - h / 2, s: st.s, r: st.r || 0, o: st.o, b: st.b || 0 });
  RK.S = S; RK.SC = SC;

  // trilha de quadros-chave: [[t, {x,y,s,o,b,r}, dur, ease]] -> estado em t (interpola do anterior ao atual).
  // t pode ser número ou expressão de tempo (resolvida uma vez pelo T do vídeo).
  RK.trilha = function (lista, T) {
    const L = lista.map(k => [T ? T(k[0]) : k[0], k[1], k[2] == null ? .5 : (T ? T(k[2]) : k[2]), ease(k[3] || 'io')]);
    const f = t => {
      let i = -1; for (let k = 0; k < L.length; k++) if (t >= L[k][0]) i = k;
      if (i < 0) return Object.assign({}, L[0][1]);
      const [t0, st, d, e] = L[i]; if (i === 0) return Object.assign({}, st);
      const prev = L[i - 1][1]; const p = e(P(t, t0, d)); const o = {};
      for (const k of new Set([...Object.keys(prev), ...Object.keys(st)])) {
        const a = prev[k] ?? (k === 's' || k === 'o' ? 1 : 0), b = st[k] ?? (k === 's' || k === 'o' ? 1 : 0); o[k] = lerp(a, b, p);
      }
      return o;
    };
    f.lista = L; return f;
  };

  // ---------- tema (tokens de cor) ----------
  RK.TEMA_PADRAO = { bg: '#060a14', navy: '#0c1429', az: '#236bff', azc: '#6f9bff', vd: '#2bd576', am: '#ffb020', vm: '#ef4b55', em: '#e9eefa', tx: '#eef2fb', mu: '#8a94ab', fonte: 'Inter' };
  const hexRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  RK.criarTema = function (tokens) {
    const tm = Object.assign({}, RK.TEMA_PADRAO, tokens || {});
    const cor = c => (c && tm[c] && String(tm[c]).startsWith('#')) ? tm[c] : c;           // token ou cor crua
    const A = c => { const v = cor(c); if (typeof v === 'string' && v.includes('A')) return v; if (typeof v === 'string' && v.startsWith('#')) { const [r, g, b] = hexRgb(v); return `rgba(${r},${g},${b},A)`; } return v; };
    const rgba = (c, a) => A(c).replace('A', a);
    return { tokens: tm, cor, A, rgba };
  };

  // ---------- css ----------
  RK._css = RK._css || [];
  RK.css = s => { RK._css.push(s); if (typeof document !== 'undefined' && document.head) { const st = document.createElement('style'); st.textContent = s; document.head.appendChild(st); } };
  RK.css(`.a{position:absolute;left:0;top:0;will-change:transform,opacity,filter;transform-origin:50% 50%}
#bg{position:absolute;left:0;top:0;width:1080px;height:1920px}
#cam{position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:540px 860px}
#flash{position:absolute;left:0;top:0;width:1080px;height:1920px;background:#fff;pointer-events:none}
#vin{position:absolute;left:0;top:0;width:1080px;height:1920px;background:radial-gradient(ellipse 80% 65% at 50% 42%,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%);pointer-events:none}
#rewfx{position:absolute;left:0;top:0;width:1080px;height:1920px;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(111,155,255,.0) 0px,rgba(111,155,255,.0) 7px,rgba(111,155,255,.10) 8px,rgba(111,155,255,.0) 10px)}`);

  // ---------- ícones ----------
  RK.icone = {
    check: (w, c = '#062012') => `<svg width="${w}" height="${w}" viewBox="0 0 54 54"><path d="M10 28 L22 40 L44 14" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    xis: (w, c = '#c3cad9') => `<svg width="${w}" height="${w}" viewBox="0 0 44 44"><path d="M11 11 L33 33 M33 11 L11 33" stroke="${c}" stroke-width="7" stroke-linecap="round"/></svg>`,
  };

  // ---------- fundo: brilhos + partículas + explosões + ondas (canvas #bg) ----------
  const ONDA = { sin: Math.sin, cos: Math.cos };
  const BRILHOS_PADRAO = [
    { x: [540, 160, 'sin', .35], y: [760, 120, 'cos', .27], r: 900, cor: 'rgba(35,107,255,A)', a: .26 },
    { x: [180, 90, 'cos', .22], y: [1300, 120, 'sin', .31], r: 700, cor: 'rgba(12,40,120,A)', a: .5 },
    { x: [900, 80, 'sin', .19], y: [320, 90, 'cos', .4], r: 620, cor: 'rgba(70,120,255,A)', a: .16 },
  ];
  RK.fundo = function (ctx, p = {}) {
    const cv = document.getElementById('bg'), g = cv.getContext && cv.getContext('2d');
    const base = ctx.cor(p.cor || 'bg');
    const brilhos = (p.brilhos || BRILHOS_PADRAO).map(b => ({ ...b, cor: ctx.A(b.cor), janelas: (b.janelas || []).map(j => j.map(x => ctx.t(x))) }));
    const np = p.particulas ?? 100, pc = p.corParticula || 'rgba(140,175,255,';
    const PART = [...Array(np)].map((_, i) => ({ x: rnd(i + 1) * 1080, y: rnd(i + 77) * 1920, v: 10 + rnd(i + 5) * 32, r: 1 + rnd(i + 9) * 2.4, a: .1 + rnd(i + 13) * .35, ph: rnd(i + 21) * 6.28 }));
    const pos = (v, t) => Array.isArray(v) ? v[0] + ONDA[v[2] || 'sin'](t * v[3]) * v[1] : v;
    function glow(x, y, r, cor, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, cor.replace('A', a)); gr.addColorStop(1, cor.replace('A', 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    return {
      render(t) {
        if (!g) return;
        g.globalCompositeOperation = 'source-over'; g.fillStyle = base; g.fillRect(0, 0, 1080, 1920);
        g.globalCompositeOperation = 'lighter';
        for (const b of brilhos) {
          let k = 1;
          if (b.janelas.length) { k = 0; for (const [de, di, ate, ds] of b.janelas) k = Math.max(k, P(t, de, di) * (ate == null ? 1 : 1 - P(t, ate, ds))); }
          if (k > 0) glow(pos(b.x, t), pos(b.y, t), b.r, b.cor, b.a * k);
        }
        for (const q of PART) { let y = (q.y - q.v * t) % 1920; if (y < 0) y += 1920; const x = q.x + Math.sin(t * .6 + q.ph) * 18; const a = q.a * (.6 + .4 * Math.sin(t * 2 + q.ph)); g.fillStyle = `${pc}${a})`; g.beginPath(); g.arc(x, y, q.r, 0, 6.283); g.fill(); }
        for (const r of ctx.fx.ondas) { const d = t - r.t; if (d < 0 || d > .9) continue; const q = oc(d / .9); g.strokeStyle = r.cor.replace('A', (1 - d / .9) * .8); g.lineWidth = 14 * (1 - q) + 1; g.beginPath(); g.arc(r.x, r.y, 20 + r.R * q, 0, 6.283); g.stroke(); }
        for (const b of ctx.fx.explosoes) {
          const d = t - b.t; if (d < 0 || d > 1.3) continue; const q = d / 1.3;
          for (let i = 0; i < b.n; i++) {
            const an = i / b.n * 6.283 + rnd(b.seed + i) * .5; const sp = b.v * (.5 + rnd(b.seed + i * 3) * .7); const dist = sp * oc(cl(d / 1.0));
            const x = b.x + Math.cos(an) * dist, y = b.y + Math.sin(an) * dist + d * d * 120; const a = (1 - q) * (.6 + .4 * rnd(b.seed + i * 7));
            g.strokeStyle = b.cor.replace('A', a); g.lineWidth = 2 + 3 * (1 - q); g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(an) * 28 * (1 - q), y - Math.sin(an) * 28 * (1 - q)); g.stroke();
          }
        }
        g.globalCompositeOperation = 'source-over';
      },
    };
  };

  // ---------- câmera: respiração + zooms + tremor + flash + efeito rebobinar ----------
  RK.camera = function (ctx, p = {}) {
    const cam = document.getElementById('cam'), flashEl = document.getElementById('flash'), rewfx = document.getElementById('rewfx');
    const [ra, rf] = p.respira || [.012, .7];
    const zooms = (p.zoom || []).map(z => ({ de: ctx.t(z.de), dur: ctx.t(z.dur), amp: z.amp, ate: z.ate == null ? null : ctx.t(z.ate), saida: z.saida ?? .4 }));
    const tremor = (p.tremor || []).map(([t, a]) => [ctx.t(t), a]);
    const flash = (p.flash || []).map(([t, a]) => [ctx.t(t), a]);
    const rew = (p.rebobinar || []).map(r => ({ de: ctx.t(r.de), dur: ctx.t(r.dur) }));
    return {
      render(t) {
        let sx = 0, sy = 0; for (const [t0, a] of tremor) { const d = t - t0; if (d >= 0 && d < .4) { const k = a * Math.pow(1 - d / .4, 2); sx += Math.sin(d * 90 + t0) * k; sy += Math.cos(d * 77 + t0 * 3) * k; } }
        let z = 1 + ra * Math.sin(t * rf); for (const q of zooms) z += q.amp * P(t, q.de, q.dur) * (q.ate == null ? 1 : 1 - P(t, q.ate, q.saida));
        cam.style.transform = `translate(${sx}px,${sy}px) scale(${z})`;
        let fl = 0; for (const [t0, a] of flash) { const d = t - t0; if (d >= 0 && d < .3) fl = Math.max(fl, a * Math.pow(1 - d / .3, 2)); } flashEl.style.opacity = fl;
        let rw = 0; for (const r of rew) rw = Math.max(rw, Math.sin(Math.PI * P(t, r.de, r.dur)));
        rewfx.style.opacity = rw * .9; rewfx.style.transform = `translateY(${(t * 900) % 10}px)`;
        cam.style.filter = rw > 0.02 ? `saturate(${1 - .5 * rw}) hue-rotate(${-12 * rw}deg)` : 'none';
      },
    };
  };

  // ---------- montador ----------
  // V = { tema, falas:[{ini,fim,palavras}], marcas:{nome:{expr,fala}}, duracao, fundo, camera, efeitos,
  //       estados:[{id,bloco,...}], atores:[{id,bloco,...params}] }   (gerado pelo compor.mjs)
  RK.montar = function (V) {
    const T = RK.tempos(V.falas, Object.assign({}, V.marcas, { DUR: { expr: V.duracao, fala: 0 } }));
    const tema = RK.criarTema(V.tema);
    const cam = document.getElementById('cam');
    function el(html, parent = cam) { const d = document.createElement('div'); d.innerHTML = html.trim(); const e = d.firstChild; parent.appendChild(e); return e; }
    const ctx = { T, t: x => T(x), cor: tema.cor, A: tema.A, rgba: tema.rgba, tema: tema.tokens, el, cam, falas: V.falas, V,
      fx: { explosoes: [], ondas: [] }, atores: {}, estados: {} };
    ctx.explosao = (t, x, y, cor, n, v, seed) => ctx.fx.explosoes.push({ t: ctx.t(t), x, y, cor: ctx.A(cor), n, v, seed });
    ctx.onda = (t, x, y, cor, R) => ctx.fx.ondas.push({ t: ctx.t(t), x, y, cor: ctx.A(cor), R });
    for (const e of (V.efeitos?.explosoes || [])) ctx.explosao(...e);
    for (const e of (V.efeitos?.ondas || [])) ctx.onda(...e);
    ctx.DUR = T.marca('DUR');
    for (const s of (V.estados || [])) { const f = RK.blocos[s.bloco]; if (!f) throw new Error('bloco desconhecido: ' + s.bloco); ctx.estados[s.id] = f(ctx, s, s.id); }
    const fundo = RK.fundo(ctx, V.fundo || {}), camera = RK.camera(ctx, V.camera || {});
    const lista = [];
    for (const a of (V.atores || [])) {
      const f = RK.blocos[a.bloco]; if (!f) throw new Error('bloco desconhecido: ' + a.bloco);
      const obj = f(ctx, a, a.id); ctx.atores[a.id] = obj; lista.push(obj);
    }
    window.DUR = ctx.DUR; window.TEMPOS = T.todas();
    window.render = function (t) { fundo.render(t); camera.render(t); for (const o of lista) if (o.render) o.render(t); };
    window.render(0);
    return ctx;
  };
})(typeof window !== 'undefined' ? window : globalThis);
