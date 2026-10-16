// Telas de aplicativo em tema claro, reproduzidas em HTML/CSS: cartão de jogo (3 colunas com valor,
// imagem e nome), cartão de entrada (N blocos lado a lado com selos) e moldura de janela (barra lateral
// opcional, barras de topo e uma lista de cartões que rola). Genérico: textos, cores e imagens entram por
// parâmetro (o pacote do nicho traz o tema e os dados).
// Medidas escritas em "px do app" e multiplicadas por k: o texto sai nítido no tamanho final, sem
// ampliar camada rasterizada. Ícones de linha: Lucide (ISC, https://lucide.dev) — Copyright (c) Lucide
// Contributors 2026 e Cole Bemis 2013-2026 (Feather, MIT); uso, cópia e modificação permitidos com este aviso.
(function (root) {
  const RK = root.RK; const { cl, P, oc, ob, oe, lerp, ease } = RK.u;

  // tema claro padrão (neutro); o pacote sobrescreve com p.tema
  const CLARO = {
    fundo: '#f5f6f8', texto: '#0a1020', cartao: '#ffffff', secundario: '#eef1f6', apagado: '#e4e8f0', mudo: '#5d687b',
    borda: '#e2e7f0', primaria: '#040640', destaque: '#236bff', positivo: '#1b7a54', negativo: '#ae4b45', negativoTexto: '#9c574f',
    ganho: '#15803D', ganhoFundo: 'rgba(21,128,61,.1)', perda: '#991B1B', perdaFundo: 'rgba(153,27,27,.08)',
    seloA: ['rgba(42,77,255,.1)', '#0B2399'], seloB: ['#e4e8f0', '#5d687b'], resumo: '#1E8A4E', resumoFundo: 'rgba(30,138,78,.08)',
    lateral: '#ffffff', lateralBorda: '#e7ebf2', sombra: 'rgba(24,60,125,A)', toque: '#ffffff',
  };
  const ICONES = {
    'trophy': '<path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/><path d="M18 9h1.5a1 1 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6 9H4.5a1 1 0 0 1 0-5H6"/>',
    'trending-up': '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    'trending-down': '<path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    'zap': '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    'bell': '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    'calendar-days': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
    'calendar-range': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/>',
    'wallet': '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    'file-text': '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    'calculator': '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
    'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    'gift': '<path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/>',
    'settings': '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
    'search': '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
    'sliders-horizontal': '<path d="M10 5H3"/><path d="M12 19H3"/><path d="M14 3v4"/><path d="M16 17v4"/><path d="M21 12h-9"/><path d="M21 19h-5"/><path d="M21 5h-7"/><path d="M8 10v4"/><path d="M8 12H3"/>',
    'chart-column': '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    'calendar': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    'dois-cartoes': '<rect x="2" y="4" width="12" height="16" rx="2.5"/><rect x="10" y="4" width="12" height="16" rx="2.5"/><path d="M11 14h2M12 13v2" stroke-width="1.8"/>',
  };
  // ícone: nome da lista acima ou svg/html cru (começa com '<')
  const icone = (nome, px, cor, extra = '') => nome && String(nome).trim().startsWith('<') ? `<span style="display:inline-flex;width:${px}px;height:${px}px;flex-shrink:0;${extra}">${nome}</span>`
    : `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${cor || 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;display:block;${extra}">${ICONES[nome] || ''}</svg>`;
  const temaDe = p => Object.assign({}, CLARO, p.tema || {});
  const rgbaDe = (c, a) => { if (c.startsWith('rgba')) return c.replace(/[\d.]+\)$/, a + ')'); const h = c.replace('#', ''); const n = h.length === 3 ? h.split('').map(x => x + x).join('') : h; return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`; };
  const esc = s => String(s ?? '').replace(/&(?![a-z#0-9]+;)/gi, '&amp;');
  // posição de um elemento dentro de outro (soma offsetLeft/Top até a raiz), em px de tela já multiplicados por k
  function dentro(el, raiz) { let x = 0, y = 0, e = el; while (e && e !== raiz) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; }
  const semCamada = e => { e.style.willChange = 'auto'; return e; };   // texto re-rasterizado na escala atual (zoom nítido)

  // ---------- peças (strings de HTML) ----------
  const U = k => n => +(n * k).toFixed(2) + 'px';
  function escudo(t, u, tm, tam) {
    if (t && t.escudo) return `<img src="${t.escudo}" style="width:${u(tam)};height:${u(tam)};object-fit:contain;display:block">`;
    return `<div style="display:grid;place-items:center;width:${u(tam)};height:${u(tam)};border-radius:50%;background:${tm.secundario};font-size:${u(15)};font-weight:800;color:${tm.mudo}">${esc((t?.nome || '?').slice(0, 1).toUpperCase())}</div>`;
  }
  function cabecalho(D, u, tm, tamEscudo, vsTam) {
    const lado = t => `<div style="display:flex;flex-direction:column;align-items:center;gap:${u(8)};min-width:0">${escudo(t, u, tm, tamEscudo)}<span style="text-align:center;font-size:${u(15)};line-height:1.25;font-weight:800;color:${tm.texto}">${esc(t.nome)}</span></div>`;
    return `<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:${u(8)}">${lado(D.casa)}<span style="font-size:${u(vsTam || 13)};font-weight:600;color:${tm.mudo}">${esc(D.vs || 'vs')}</span>${lado(D.fora)}</div>`;
  }
  function pilula(texto, u, tm, op = {}) {
    const ic = op.icone ? icone(op.icone, +(op.tamIcone || 11) * op.k, null) : '';
    return `<span style="display:inline-flex;align-items:center;gap:${u(op.gap ?? 6)};border-radius:9999px;${op.semBorda ? '' : `border:${u(1)} solid ${op.borda || tm.borda};`}background:${op.fundo || tm.secundario};padding:${u(op.py ?? 6)} ${u(op.px ?? 12)};font-size:${u(op.tam || 11.5)};line-height:1.5;font-weight:${op.peso || 700};color:${op.cor || tm.mudo};white-space:nowrap;min-width:0">${ic}<span style="overflow:hidden;text-overflow:ellipsis">${esc(texto)}</span></span>`;
  }
  function seloPeq(s, u, tm) {
    if (!s) return '';
    const [f, c] = s.estilo === 'b' ? tm.seloB : tm.seloA;
    return `<span style="border-radius:9999px;padding:${u(2)} ${u(9)};font-size:${u(9.5)};line-height:1.5;font-weight:800;background:${f};color:${c}">${esc(s.texto)}</span>`;
  }

  // ---------- cartão de jogo ----------
  // D = { selo, variacao, variacaoSinal (-1|1), data, casa:{nome,escudo}, fora:{nome,escudo}, vs,
  //       vias:[{rotulo, valor (número), texto, imagem, nome}] (3), rodape, botao }
  function cartaoJogo(D, k, W, tm) {
    const u = U(k); const neg = (D.variacaoSinal ?? -1) < 0;
    const vias = (D.vias || []).map(v => `
<div class="tl-cel" style="display:flex;flex-direction:column;align-items:center;gap:${u(8)};border-radius:${u(10)};background:${tm.cartao};padding:${u(14)} ${u(8)};box-shadow:0 ${u(1)} ${u(2)} ${tm.sombra.replace('A', .05)};min-width:0;position:relative">
<span style="font-size:${u(9.5)};line-height:1.5;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${tm.mudo}">${esc(v.rotulo)}</span>
<span class="tl-v" style="font-size:${u(22)};line-height:1.5;font-weight:800;color:${tm.texto};font-variant-numeric:tabular-nums">${esc(v.texto)}</span>
<div style="position:relative;width:${u(28)};height:${u(28)}"><div class="tl-ph" style="position:absolute;left:0;top:0;width:100%;height:100%;border-radius:${u(8)};background:${tm.apagado};opacity:0"></div>${v.imagem ? `<img class="tl-im" src="${v.imagem}" style="position:absolute;left:0;top:0;width:100%;height:100%;border-radius:${u(8)};object-fit:contain">` : `<div class="tl-im" style="position:absolute;left:0;top:0;width:100%;height:100%;border-radius:${u(8)};background:${tm.apagado};display:grid;place-items:center;font-size:${u(11)};font-weight:800;color:${tm.mudo}">${esc((v.nome || '?').slice(0, 1).toUpperCase())}</div>`}</div>
<span class="tl-nm" style="font-size:${u(10)};line-height:1.5;font-weight:600;color:${tm.mudo};max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(v.nome)}</span>
</div>`).join('');
    const varPil = D.variacao ? pilula(D.variacao, u, tm, { k, icone: neg ? 'trending-down' : 'trending-up', gap: 5, peso: 800, borda: rgbaDe(neg ? tm.negativo : tm.positivo, neg ? .15 : .2), fundo: rgbaDe(neg ? tm.negativo : tm.positivo, neg ? .06 : .08), cor: neg ? tm.negativoTexto : tm.positivo }) : '';
    return `<div style="width:${u(W)};box-sizing:border-box;font-variant-numeric:normal;display:flex;flex-direction:column;border-radius:${u(20)};padding:${u(24)};background:${tm.cartao};border:${u(1)} solid ${tm.borda};box-shadow:0 ${u(1)} ${u(2)} ${tm.sombra.replace('A', .04)},0 ${u(8)} ${u(24)} ${tm.sombra.replace('A', .06)};position:relative;font-family:inherit">
<div style="display:flex;align-items:center;justify-content:space-between;gap:${u(8)};margin-bottom:${u(16)}">${pilula(D.selo, u, tm, { k, icone: 'trophy' })}${varPil}</div>
<div style="font-size:${u(12)};line-height:1.5;color:${tm.mudo};margin-bottom:${u(16)}">${esc(D.data)}</div>
<div style="margin-bottom:${u(24)}">${cabecalho(D, u, tm, 48)}</div>
<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${u(12)};border-radius:${u(14)};background:${tm.secundario};padding:${u(14)}">${vias}</div>
<div style="margin-top:${u(20)};display:flex;align-items:center;justify-content:space-between"><span style="font-size:${u(12)};line-height:1.5;color:${tm.mudo}">${esc(D.rodape || '')}</span>${D.botao ? `<span class="tl-bt" style="display:inline-block;border-radius:9999px;background:${tm.primaria};padding:${u(8)} ${u(20)};font-size:${u(12)};line-height:1.5;font-weight:700;color:#fff">${esc(D.botao)}</span>` : ''}</div>
<div class="tl-aro" style="position:absolute;left:${u(-1)};top:${u(-1)};right:${u(-1)};bottom:${u(-1)};border-radius:${u(20)};pointer-events:none;opacity:0"></div>
</div>`;
  }

  // ---------- cartão de entrada ----------
  // D = { selo, valor ('+R$ 6,67'), valorSinal (1|-1), casa, fora, vs, marca:{selo:{texto,estilo}, texto} (linha abaixo dos times),
  //       blocos:[{rotulo, texto, imagem, nome, selo:{texto, estilo:'a'|'b'}}] (2 ou 3), rodape, botao }
  function cartaoEntrada(D, k, W, tm) {
    const u = U(k); const pos = (D.valorSinal ?? 1) >= 0;
    const n = (D.blocos || []).length || 2;
    const blocos = (D.blocos || []).map(b => `
<div class="tl-cel" style="display:flex;flex-direction:column;align-items:center;gap:${u(6)};border-radius:${u(11)};background:${tm.cartao};padding:${u(14)} ${u(8)};min-width:0;position:relative">
<span style="font-size:${u(9.5)};line-height:1.5;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${tm.mudo}">${esc(b.rotulo)}</span>
<span class="tl-v" style="font-size:${u(22)};line-height:1.5;font-weight:800;color:${tm.texto};font-variant-numeric:tabular-nums">${esc(b.texto)}</span>
<div style="display:grid;place-items:center;width:${u(34)};height:${u(34)};border-radius:${u(9)};background:${tm.apagado}">${b.imagem ? `<img class="tl-im" src="${b.imagem}" style="width:${u(20)};height:${u(20)};object-fit:contain">` : `<span class="tl-im" style="font-size:${u(13)};font-weight:800;color:${tm.mudo}">${esc((b.nome || '?').slice(0, 1))}</span>`}</div>
<span class="tl-nm" style="display:flex;max-width:100%;align-items:center;justify-content:center;gap:${u(2)};font-size:${u(11)};line-height:1.5;font-weight:600;color:${tm.mudo}"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(b.nome)}</span>${icone('external-link', 10 * k, null, 'opacity:.6')}</span>
${seloPeq(b.selo, u, tm)}
</div>`).join('');
    const ic = icone(pos ? 'trending-up' : 'trending-down', 14 * k, pos ? tm.ganho : tm.perda);
    const marca = D.marca ? `<div style="margin-top:${u(8)};display:flex;align-items:center;justify-content:center;gap:${u(6)}">${D.marca.selo ? `<span style="border-radius:9999px;padding:${u(1)} ${u(7)};font-size:${u(10)};line-height:1.5;font-weight:800;background:${(D.marca.selo.estilo === 'b' ? tm.seloB : tm.seloA)[0]};color:${(D.marca.selo.estilo === 'b' ? tm.seloB : tm.seloA)[1]}">${esc(D.marca.selo.texto)}</span>` : ''}<span style="font-size:${u(12)};line-height:1.5;font-weight:600;color:${tm.mudo}">${esc(D.marca.texto)}</span></div>` : '';
    return `<div style="width:${u(W)};box-sizing:border-box;font-variant-numeric:normal;display:flex;flex-direction:column;gap:${u(20)};border-radius:${u(18)};padding:${u(13)} ${u(20)} ${u(20)};background:${tm.cartao};border:${u(1)} solid ${tm.borda};box-shadow:0 ${u(1)} ${u(2)} ${tm.sombra.replace('A', .04)},0 ${u(8)} ${u(20)} ${tm.sombra.replace('A', .05)};position:relative;text-align:left">
<div style="display:flex;align-items:center;justify-content:space-between;gap:${u(12)}">${pilula(D.selo, u, tm, { k, icone: 'trophy', tamIcone: 13, gap: 7, px: 13, py: 5, semBorda: true })}<span class="tl-val" style="display:inline-flex;align-items:center;gap:${u(6)};border-radius:9999px;padding:${u(2)} ${u(12)};background:${pos ? tm.ganhoFundo : tm.perdaFundo}">${ic}<span style="font-size:${u(13)};line-height:1.5;font-weight:800;color:${pos ? tm.ganho : tm.perda};white-space:nowrap">${esc(D.valor)}</span></span></div>
<div style="text-align:center">${cabecalho(D, u, tm, 36)}${marca}</div>
<div style="display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:${u(12)};border-radius:${u(14)};background:${tm.secundario};padding:${u(14)}">${blocos}</div>
<div style="display:flex;flex-direction:column;gap:${u(12)};border-top:${u(1)} solid ${tm.borda};padding-top:${u(14)}"><span style="font-size:${u(12.5)};line-height:1.5;color:${tm.mudo}">${esc(D.rodape || '')}</span>${D.botao ? `<span class="tl-bt" style="display:flex;align-items:center;justify-content:center;gap:${u(5)};border-radius:${u(10)};background:${tm.secundario};padding:${u(10)} 0;font-size:${u(12.5)};line-height:1.5;font-weight:700;color:${tm.texto}">${esc(D.botao)} ${icone('arrow-right', 12 * k, null)}</span>` : ''}</div>
<div class="tl-aro" style="position:absolute;left:${u(-1)};top:${u(-1)};right:${u(-1)};bottom:${u(-1)};border-radius:${u(18)};pointer-events:none;opacity:0"></div>
</div>`;
  }
  RK.tela = { CLARO, ICONES, icone, cartaoJogo, cartaoEntrada };

  // ---------- comportamento comum dos cartões (destacar, revelar, contar, toque, acender) ----------
  // el = raiz do cartão. Devolve render(t) que mexe só dentro do cartão.
  RK.css(`.tl-dedo{position:absolute;left:0;top:0;border-radius:50%;pointer-events:none;visibility:hidden}
.tl-onda{position:absolute;left:0;top:0;border-radius:50%;pointer-events:none;visibility:hidden;box-sizing:border-box}`);
  function vivo(ctx, el, p, k, tm, vias) {
    const cels = [...el.querySelectorAll('.tl-cel')], vals = [...el.querySelectorAll('.tl-v')], ims = [...el.querySelectorAll('.tl-im')], nms = [...el.querySelectorAll('.tl-nm')], phs = [...el.querySelectorAll('.tl-ph')];
    const bt = el.querySelector('.tl-bt'), aro = el.querySelector('.tl-aro');
    const cor = p.corDestaque || tm.destaque, corV = vals.map(v => v.style.color);
    const hl = (p.destaque || []).map(x => x == null ? null : ctx.t(x));
    const rv = (p.revela || []).map(x => x == null ? null : ctx.t(x));
    const conta = p.conta ? { em: ctx.t(p.conta.em), dur: p.conta.dur ?? .8, de: p.conta.de ?? 1, casas: p.conta.casas ?? 2, e: ease(p.conta.ease || 'oe') } : null;
    const ac = p.acende ? { em: ctx.t(p.acende.em), ate: p.acende.ate == null ? Infinity : ctx.t(p.acende.ate), dur: p.acende.dur ?? .45 } : null;
    const toques = (p.toque ? [].concat(p.toque) : []).map(q => ({ em: ctx.t(q.em), alvo: q.alvo ?? 'botao' }));
    const dedo = toques.length ? ctx.el(`<div class="tl-dedo" style="width:${46 * k}px;height:${46 * k}px;background:${rgbaDe(tm.toque, .55)};border:${2 * k}px solid ${rgbaDe(tm.toque, .95)};box-shadow:0 ${4 * k}px ${16 * k}px rgba(0,0,0,.35)"></div>`, el) : null;
    const onda = toques.length ? ctx.el(`<div class="tl-onda" style="width:${46 * k}px;height:${46 * k}px;border:${3 * k}px solid ${rgbaDe(cor, .9)}"></div>`, el) : null;
    if (rv.length) phs.forEach((ph, i) => { if (rv[i] != null) ph.style.opacity = 1; });
    const alvoEl = a => a === 'botao' ? bt : cels[a];
    return function (t) {
      cels.forEach((c, i) => {
        const h = hl[i] == null ? 0 : oc(P(t, hl[i], .3));
        c.style.boxShadow = h > 0 ? `0 0 0 ${2.5 * k * h}px ${rgbaDe(cor, .95 * h)}, 0 0 ${26 * k * h}px ${rgbaDe(cor, .55 * h)}` : '';
        c.style.transform = h > 0 ? `scale(${1 + .07 * ob(P(t, hl[i], .45))})` : 'none'; c.style.zIndex = h > 0 ? 2 : 'auto';
        if (vals[i]) vals[i].style.color = h > .5 ? cor : corV[i];
        const r = rv[i] == null ? 1 : P(t, rv[i], .35);
        if (ims[i]) { ims[i].style.opacity = cl(r * 2); ims[i].style.transform = `scale(${lerp(.3, 1, ob(r))})`; }
        if (nms[i]) nms[i].style.opacity = oc(r);
        if (phs[i] && rv[i] != null) phs[i].style.opacity = 1 - cl(r * 2);
        if (conta && vals[i] && vias && vias[i] && typeof vias[i].valor === 'number') {
          const q = conta.e(P(t, conta.em, conta.dur)); const v = lerp(conta.de, vias[i].valor, q);
          vals[i].textContent = q >= 1 ? vias[i].texto : v.toFixed(conta.casas).replace('.', ',');
        }
      });
      if (aro) {
        const a = ac ? oc(P(t, ac.em, ac.dur)) * (1 - P(t, ac.ate, .3)) : 0;
        aro.style.opacity = a; aro.style.boxShadow = a > 0 ? `0 0 0 ${3 * k}px ${rgbaDe(cor, .95)}, 0 0 ${46 * k}px ${rgbaDe(cor, .6)}` : '';
      }
      if (dedo) {
        const q = toques.filter(x => t >= x.em - .45).pop();
        if (!q) { dedo.style.visibility = onda.style.visibility = 'hidden'; }
        else {
          const ae = alvoEl(q.alvo); const g = ae ? dentro(ae, el) : { x: 0, y: 0, w: 0, h: 0 };
          const cx = g.x + g.w / 2, cy = g.y + g.h / 2, d = 46 * k;
          const chega = oc(P(t, q.em - .45, .4)), sai = P(t, q.em + .35, .3);
          const aperta = Math.sin(Math.PI * P(t, q.em - .05, .25));
          dedo.style.visibility = sai >= 1 ? 'hidden' : 'visible'; dedo.style.opacity = cl(chega * 1.5) * (1 - sai);
          dedo.style.transform = `translate(${cx - d / 2 + (1 - chega) * 60 * k}px,${cy - d / 2 + (1 - chega) * 90 * k}px) scale(${1 - .22 * aperta})`;
          const qo = P(t, q.em, .5); onda.style.visibility = qo > 0 && qo < 1 ? 'visible' : 'hidden'; onda.style.opacity = 1 - qo;
          onda.style.transform = `translate(${cx - d / 2}px,${cy - d / 2}px) scale(${lerp(.6, 2.4, oc(qo))})`;
          if (ae) ae.style.transform = `scale(${1 - .06 * aperta})`;
        }
      }
    };
  }
  // zoom de câmera num ponto do cartão/janela: devolve {s, dx, dy} (escala extra e deslocamento do centro)
  function zoomDe(ctx, z) {
    if (!z) return () => ({ z: 1, f: 0 });
    const L = [].concat(z).map(q => ({ em: ctx.t(q.em), dur: q.dur ?? .8, ate: q.ate == null ? null : ctx.t(q.ate), saida: q.saida ?? .5, escala: q.escala ?? 1.3, foco: q.foco ?? null, centra: q.centra ?? 1, e: ease(q.ease || 'io') }));
    return t => { let zz = 1, foco = null, v = 0, centra = 1; for (const q of L) { const a = q.e(P(t, q.em, q.dur)) * (q.ate == null ? 1 : 1 - q.e(P(t, q.ate, q.saida))); if (a > 0) { zz *= lerp(1, q.escala, a); foco = q.foco; v = a; centra = q.centra; } } return { z: zz, foco, v, centra }; };
  }
  // aplica pos + zoom: a escala cresce em volta do ponto de foco (px do elemento) e, com 'centra', o foco
  // desliza para o centro de repouso do elemento (câmera que se aproxima e enquadra o alvo)
  function poe(el, w, h, st, Z, focoPx) {
    let s = st.s ?? 1, x = st.x, y = st.y;
    if (Z.z !== 1 && focoPx) {
      const fx = (focoPx.x - w / 2) * s, fy = (focoPx.y - h / 2) * s; x -= fx * (Z.z - 1); y -= fy * (Z.z - 1); s *= Z.z;
      const k = (Z.v || 0) * (Z.centra ?? 1); x -= fx * k; y -= fy * k;
    }
    RK.SC(el, w, h, { x, y, s, o: st.o, b: st.b || 0, r: st.r || 0 });
  }
  const focoDe = (foco, el, alvos) => {
    if (foco == null) return null;
    if (typeof foco === 'object' && foco.x != null) return { x: foco.x * el.offsetWidth, y: foco.y * el.offsetHeight };
    const a = alvos(foco); if (!a) return null; const g = dentro(a, el); return { x: g.x + g.w / 2, y: g.y + g.h / 2 };
  };

  // ---------- bloco: cartão de jogo ----------
  // params: pos (trilha), k (2), largura (360, px do app), tema, dados (ver cartaoJogo),
  //   destaque [expr por coluna] (aro + escala + valor na cor de destaque), revela [expr por coluna] (imagem e nome aparecem),
  //   conta {em, dur, de} (valores contando), toque {em, alvo:'botao'|coluna} (dedo + onda), acende {em, ate} (aro no cartão),
  //   zoom [{em, dur, escala, foco:'botao'|coluna|{x,y fração}, centra (1: o foco desliza para o centro), ate, saida}], topo {imagem, largura, y (acima do cartão), pulso (expr)},
  //   centro {x,y,s} (repouso, para celula() quando o voo não passa t)
  // expõe: pos(t), celula(linha, coluna) -> centro da coluna na tela (usado pelo bloco voo)
  RK.blocos['card-jogo'] = function (ctx, p) {
    const k = p.k || 2, W = p.largura || 360, tm = temaDe(p), tr = RK.trilha(p.pos, ctx.t);
    const el = semCamada(ctx.el(`<div class="a">${cartaoJogo(p.dados, k, W, tm)}</div>`));
    const card = el.firstChild, anim = vivo(ctx, card, p, k, tm, p.dados.vias), Z = zoomDe(ctx, p.zoom);
    const cels = [...card.querySelectorAll('.tl-cel')], bt = card.querySelector('.tl-bt');
    const alvos = a => a === 'botao' ? bt : cels[a];
    let topo = null, tp = null;
    if (p.topo) { topo = ctx.el(`<div class="a" style="width:${p.topo.largura || 360}px"><img src="${p.topo.imagem}" style="width:100%;height:auto;display:block"></div>`); tp = p.topo.pulso != null ? ctx.t(p.topo.pulso) : null; }
    const repouso = () => p.centro || (tr.lista.find(x => (x[1].o ?? 1) > .99) || tr.lista[tr.lista.length - 1])[1];
    const celula = (_, c) => {
      const st = repouso(), s = st.s ?? 1, g = dentro(cels[c], card), w = card.offsetWidth, h = card.offsetHeight;
      return { x: st.x + (g.x + g.w / 2 - w / 2) * s, y: st.y + (g.y + g.h / 2 - h / 2) * s };
    };
    return {
      pos: tr, celula,
      render(t) {
        const st = tr(t), w = card.offsetWidth, h = card.offsetHeight, z = Z(t);
        poe(el, w, h, st, z, focoDe(z.foco, card, alvos));
        if (topo) {
          const q = tp == null ? 0 : Math.sin(Math.PI * P(t, tp, .7)), tw = p.topo.largura || 360;
          RK.SC(topo, tw, topo.offsetHeight || 60, { x: st.x, y: st.y - (h / 2) * (st.s ?? 1) - (p.topo.y ?? 60), s: (st.s ?? 1) * (1 + .18 * q), o: st.o });
          topo.style.filter = q > 0 ? `drop-shadow(0 0 ${24 * q}px ${rgbaDe(tm.destaque, .95)})` : 'none';
        }
        if (st.o > .003) anim(t);
      },
    };
  };

  // ---------- bloco: cartão de entrada ----------
  // params: iguais ao card-jogo (pos, k, largura 350, tema, dados (ver cartaoEntrada), destaque, revela, toque, acende, zoom);
  //   conta {em, dur, de, para, prefixo, casas} conta o valor do topo
  RK.blocos['card-entrada'] = function (ctx, p) {
    const k = p.k || 2, W = p.largura || 350, tm = temaDe(p), tr = RK.trilha(p.pos, ctx.t);
    const el = semCamada(ctx.el(`<div class="a">${cartaoEntrada(p.dados, k, W, tm)}</div>`));
    const card = el.firstChild, anim = vivo(ctx, card, Object.assign({}, p, { conta: null }), k, tm), Z = zoomDe(ctx, p.zoom);
    const cels = [...card.querySelectorAll('.tl-cel')], bt = card.querySelector('.tl-bt'), val = card.querySelector('.tl-val span:last-child');
    const alvos = a => a === 'botao' ? bt : a === 'valor' ? val : cels[a];
    const C = p.conta ? { em: ctx.t(p.conta.em), dur: p.conta.dur ?? .8, de: p.conta.de ?? 0, para: p.conta.para, pre: p.conta.prefixo ?? '', casas: p.conta.casas ?? 2 } : null;
    const repouso = () => p.centro || (tr.lista.find(x => (x[1].o ?? 1) > .99) || tr.lista[tr.lista.length - 1])[1];
    return {
      pos: tr,
      celula: (_, c) => { const st = repouso(), s = st.s ?? 1, g = dentro(cels[c], card); return { x: st.x + (g.x + g.w / 2 - card.offsetWidth / 2) * s, y: st.y + (g.y + g.h / 2 - card.offsetHeight / 2) * s }; },
      render(t) {
        const st = tr(t), w = card.offsetWidth, h = card.offsetHeight, z = Z(t);
        poe(el, w, h, st, z, focoDe(z.foco, card, alvos));
        if (st.o <= .003) return;
        anim(t);
        if (C && val) { const q = oe(P(t, C.em, C.dur)); val.textContent = C.pre + lerp(C.de, C.para, q).toFixed(C.casas).replace('.', ','); }
      },
    };
  };

  // ---------- bloco: moldura de janela do app ----------
  // params: pos (trilha), k (1.75), largura (600) e altura (540) em px do app, tema, raio (22),
  //   lateral { largura (256), logo (imagem), logoAltura (24), grupos:[{rotulo, itens:[{texto, icone, ativo}]}] } | null,
  //   topo: [ {tipo:'titulo', html} | {tipo:'abas', rotulo, icone, itens:[...], ativo} | {tipo:'resumo', itens:[{icone, valor, texto, cor, fundo}|{texto, valor, editavel}]} |
  //           {tipo:'busca', texto, contagem} ],
  //   lista: [dados de cartão], tipoLista ('jogo'|'entrada'), larguraCartao (auto = conteúdo - 40), espaco (24 entre cartões),
  //   rolagem: [[tempo, alvo, dur, ease]] alvo = índice do cartão (topo dele encostado em 'margem') | {y: px do app},
  //   margem (16), acende {indice, em, ate}, destaque/revela/toque aplicados ao cartão 'indice' via cartao:{indice, ...params do cartão},
  //   zoom [{em, dur, escala, foco: índice do cartão | {x,y fração}, centra (1), ate, saida}] — por padrão o conteúdo se aproxima
//   dentro da janela parada; zoomJanela: true aproxima a janela inteira
  RK.blocos['app-moldura'] = function (ctx, p) {
    const k = p.k || 1.75, W = p.largura || 600, H = p.altura || 540, tm = temaDe(p), u = U(k), tr = RK.trilha(p.pos, ctx.t);
    const L = p.lateral || null, LW = L ? (L.largura || 256) : 0, CW = W - LW, cw = p.larguraCartao || (CW - 40);
    const lat = L ? `<div style="position:absolute;left:0;top:0;bottom:0;width:${u(LW)};box-sizing:border-box;background:${tm.lateral};border-right:${u(1)} solid ${tm.lateralBorda};overflow:hidden">
<div style="border-bottom:${u(1)} solid ${tm.lateralBorda};padding:${u(20)} ${u(16)}">${L.logo ? `<img src="${L.logo}" style="height:${u(L.logoAltura || 24)};width:auto;display:block">` : ''}</div>
<div style="padding:0 ${u(8)}">${(L.grupos || []).map(g => `<div style="padding:${u(8)}"><div style="height:${u(32)};display:flex;align-items:center;padding:0 ${u(12)};margin-bottom:${u(4)};font-size:${u(10)};font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${rgbaDe(tm.mudo, .5)}">${esc(g.rotulo)}</div><div style="display:flex;flex-direction:column;gap:${u(4)}">${(g.itens || []).map(it => `<div style="height:${u(40)};box-sizing:border-box;display:flex;align-items:center;gap:${u(12)};padding:${u(8)};border-radius:${u(12)};font-size:${u(14)};${it.ativo ? `background:${rgbaDe(tm.destaque, .12)};color:${tm.destaque};font-weight:600;border:${u(1)} solid ${rgbaDe(tm.destaque, .15)}` : `color:${rgbaDe(tm.texto, .6)};font-weight:500;border:${u(1)} solid transparent`}">${icone(it.icone, 18 * k, null)}<span style="white-space:nowrap">${esc(it.texto)}</span></div>`).join('')}</div></div>`).join('')}</div></div>` : '';
    const topo = (p.topo || []).map(b => {
      if (b.tipo === 'titulo') return `<div style="padding:${u(28)} ${u(20)} ${u(16)}"><div style="font-size:${u(b.tamanho || 26)};font-weight:800;line-height:1.15;letter-spacing:-.025em;color:${tm.primaria}">${b.html}</div></div>`;
      if (b.tipo === 'abas') return `<div style="padding:0 ${u(20)} ${u(24)}"><div style="display:inline-flex;align-items:center;gap:${u(10)};border-radius:${u(16)};border:${u(1)} solid ${tm.borda};background:${tm.cartao};padding:${u(10)} ${u(16)};box-shadow:0 ${u(2)} ${u(4)} rgba(0,0,0,.03),0 ${u(12)} ${u(28)} rgba(4,6,64,.06)"><span style="display:flex;align-items:center;gap:${u(6)};font-size:${u(12)};font-weight:600;color:${tm.mudo}">${b.icone ? icone(b.icone, 14 * k, null) : ''}${esc(b.rotulo || '')}</span><div style="display:flex;gap:${u(4)};border-radius:9999px;background:${tm.secundario};padding:${u(2)}">${(b.itens || []).map((x, i) => `<span style="white-space:nowrap;border-radius:9999px;padding:${u(5)} ${u(14)};font-size:${u(12)};line-height:1.5;font-weight:600;${i === (b.ativo ?? 0) ? `background:${tm.primaria};color:#fff` : `color:${tm.mudo}`}">${esc(x)}</span>`).join('')}</div></div></div>`;
      if (b.tipo === 'resumo') return `<div style="padding:0 ${u(20)} ${u(24)}"><div style="display:flex;flex-wrap:wrap;align-items:center;gap:${u(12)};border-radius:${u(16)};border:${u(1)} solid ${tm.borda};background:${tm.cartao};padding:${u(12)} ${u(16)};box-shadow:0 ${u(2)} ${u(4)} rgba(0,0,0,.03),0 ${u(12)} ${u(28)} rgba(4,6,64,.06)">${(b.itens || []).map((x, i) => (i ? `<div style="height:${u(20)};width:${u(1)};background:${tm.borda}"></div>` : '') + (x.icone ? `<div style="display:flex;align-items:center;gap:${u(8)}"><div style="display:grid;place-items:center;width:${u(30)};height:${u(30)};border-radius:${u(8)};background:${x.fundo || tm.resumoFundo}">${icone(x.icone, 14 * k, x.cor || tm.resumo)}</div><span style="font-size:${u(16)};font-weight:800;color:${x.cor || tm.resumo}">${esc(x.valor)}</span><span style="font-size:${u(11.5)};color:${tm.mudo}">${esc(x.texto)}</span></div>` : `<div style="display:flex;align-items:center;gap:${u(6)}"><span style="font-size:${u(11.5)};color:${tm.mudo};white-space:nowrap">${esc(x.texto)}</span><span style="font-size:${u(13)};font-weight:700;color:${tm.texto};${x.editavel === false ? '' : `text-decoration:underline dotted ${rgbaDe(tm.mudo, .5)};text-underline-offset:${u(4)}`}">${esc(x.valor)}</span></div>`)).join('')}</div></div>`;
      if (b.tipo === 'busca') return `<div style="padding:0 ${u(20)} ${u(24)};display:flex;align-items:center;gap:${u(12)}"><div style="flex:1;height:${u(50)};box-sizing:border-box;display:flex;align-items:center;gap:${u(12)};padding:0 ${u(16)};border-radius:${u(14)};border:${u(1)} solid ${tm.borda};background:${tm.cartao};font-size:${u(14)};color:${tm.mudo}">${icone('search', 16 * k, null)}<span style="white-space:nowrap;overflow:hidden">${esc(b.texto || '')}</span></div>${b.contagem != null ? `<div style="border-radius:9999px;border:${u(1)} solid ${tm.borda};background:${tm.cartao};padding:${u(11)} ${u(18)};font-size:${u(13)};font-weight:700;color:${tm.texto}">${esc(b.contagem)}</div>` : ''}</div>`;
      return b.html || '';
    }).join('');
    const fazer = p.tipoLista === 'entrada' ? cartaoEntrada : cartaoJogo;
    const cards = (p.lista || []).map(D => `<div class="tl-it">${fazer(D, k, cw, tm)}</div>`).join(`<div style="height:${u(p.espaco ?? (p.tipoLista === 'entrada' ? 16 : 24))}"></div>`);
    const el = semCamada(ctx.el(`<div class="a" style="font-variant-numeric:normal;width:${u(W)};height:${u(H)};border-radius:${u(p.raio ?? 22)};overflow:hidden;background:${tm.fundo};box-shadow:0 40px 110px rgba(0,0,0,.6),0 0 0 ${u(1)} rgba(255,255,255,.12)">${lat}
<div class="tl-ct" style="position:absolute;left:${u(LW)};top:0;width:${u(CW)};height:100%;overflow:hidden"><div class="tl-zm" style="position:absolute;left:0;top:0;width:100%;height:100%"><div class="tl-rol" style="position:absolute;left:0;top:0;width:100%">${topo}<div style="padding:0 ${u(20)} ${u(40)}">${cards}</div></div></div></div></div>`));
    const rol = el.querySelector('.tl-rol'), zm = el.querySelector('.tl-zm'), its = [...el.querySelectorAll('.tl-it')];
    const R = (p.rolagem || []).map(r => [ctx.t(r[0]), r[1], r[2] == null ? .8 : ctx.t(r[2]), ease(r[3] || 'io')]);
    const yDe = a => a == null ? 0 : (typeof a === 'object' ? a.y * k : (its[a] ? dentro(its[a], rol).y - (p.margem ?? 16) * k : 0));
    const rolY = t => { let y = 0; for (let i = 0; i < R.length; i++) { const [t0, a, d, e] = R[i]; if (t < t0) break; const y0 = i ? yDe(R[i - 1][1]) : 0; y = lerp(y0, yDe(a), e(P(t, t0, d))); } return Math.max(0, y); };
    // cartão em foco (acende, toque, destaque, revela...)
    const cfg = p.cartao || (p.acende ? { indice: p.acende.indice, acende: p.acende } : null);
    const vivoCard = cfg && its[cfg.indice] ? vivo(ctx, its[cfg.indice].firstChild, cfg, k, tm, (p.lista[cfg.indice] || {}).vias) : null;
    const Z = zoomDe(ctx, p.zoom);
    return {
      pos: tr,
      render(t) {
        const st = tr(t); const y = rolY(t);
        rol.style.transform = `translateY(${-y}px)`;
        const z = Z(t); let foco = null;
        if (p.zoomJanela) {   // a janela inteira se aproxima
          if (z.foco != null) { if (typeof z.foco === 'object') foco = { x: z.foco.x * el.offsetWidth, y: z.foco.y * el.offsetHeight }; else if (its[z.foco]) { const g = dentro(its[z.foco], rol); foco = { x: LW * k + g.x + g.w / 2, y: g.y - y + g.h / 2 }; } }
          poe(el, W * k, H * k, st, z, foco);
        } else {              // padrão: a moldura fica parada e o conteúdo se aproxima dentro dela (recortado pela janela)
          poe(el, W * k, H * k, st, { z: 1 }, null);
          let fx = CW * k / 2, fy = H * k / 2;
          if (z.foco != null && typeof z.foco === 'object') { fx = z.foco.x * CW * k; fy = z.foco.y * H * k; }
          else if (z.foco != null && its[z.foco]) { const g = dentro(its[z.foco], rol); fx = g.x + g.w / 2; fy = g.y - y + g.h / 2; }
          const c = (z.v || 0) * (z.centra ?? 1);
          zm.style.transformOrigin = `${fx}px ${fy}px`;
          zm.style.transform = z.z === 1 ? 'none' : `translate(${(CW * k / 2 - fx) * c}px,${(H * k / 2 - fy) * c}px) scale(${z.z})`;
        }
        if (st.o > .003 && vivoCard) vivoCard(t);
      },
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
