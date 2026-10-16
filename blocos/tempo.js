// Resolvedor de tempo: marcas nomeadas calculadas a partir das palavras da voz (word timestamps).
// Roda no navegador (molde) e no node (compor.mjs), com o MESMO código, para que imagem e som batam.
//
//   const T = RK.tempos(falas, marcas)      // falas: [{ini, fim, palavras:[{w,t,e}]}]
//   T('s2')            -> número (marca nomeada)
//   T('s2 + .3')       -> expressão
//   T('@volta')        -> início da palavra "volta" na fala da marca (ou fala 0 fora de marca)
//   T('@3:casa#1')     -> 2ª ocorrência de "casa" na fala 3
//   T(1.25)            -> 1.25
// Dentro de uma expressão valem: as marcas pelo nome, f[i].ini / f[i].fim, ini / fim (fala atual),
// max, min, abs, DUR, e w(i, 'palavra', n). Marcas são preguiçosas: a ordem de declaração não importa.
(function (root) {
  const RK = root.RK = root.RK || {};
  const nz = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const ARROBA = /@(?:(\d+):)?([0-9A-Za-zÀ-ɏ]+)(?:#(\d+))?/g;

  RK.tempos = function (falas, marcas) {
    const defs = {};                      // nome -> {expr, fala}
    for (const [nome, d] of Object.entries(marcas || {})) defs[nome] = (d && typeof d === 'object' && !Array.isArray(d)) ? d : { expr: d, fala: 0 };
    const cache = {}, calc = new Set();
    const w = (i, palavra, n = 0) => {
      const F = falas[i]; if (!F) throw new Error('fala inexistente ' + i);
      let c = 0;
      for (const p of F.palavras) if (nz(p.w) === nz(palavra)) { if (c === n) return p.t; c++; }
      throw new Error('palavra não encontrada na fala ' + i + ' (ocorrência ' + n + ', ' + nz(palavra).length + ' letras)');
    };
    const escopo = new Proxy({}, {
      has: (_, k) => typeof k === 'string' && (k in defs || k === 'DUR'),
      get: (_, k) => (typeof k === 'string' && (k in defs || k === 'DUR')) ? val(k) : undefined,
    });
    function avaliar(expr, fala) {
      if (typeof expr === 'number') return expr;
      if (expr == null) return NaN;
      if (Array.isArray(expr)) return expr.map(x => avaliar(x, fala));
      const js = String(expr).replace(ARROBA, (m, fi, pal, n) => `w(${fi ?? fala},${JSON.stringify(pal)},${n ?? 0})`);
      const F = falas[fala] || {};
      // eslint-disable-next-line no-new-func
      const fn = new Function('S', 'w', 'f', 'ini', 'fim', 'max', 'min', 'abs', 'with(S){return (' + js + ')}');
      const v = fn(escopo, w, falas, F.ini, F.fim, Math.max, Math.min, Math.abs);
      if (typeof v !== 'number' || !isFinite(v)) throw new Error('expressão de tempo inválida');
      return v;
    }
    function val(nome) {
      if (nome in cache) return cache[nome];
      if (!(nome in defs)) throw new Error('marca desconhecida: ' + nome);
      if (calc.has(nome)) throw new Error('marca circular: ' + nome);
      calc.add(nome);
      const d = defs[nome]; const v = avaliar(d.expr, d.fala ?? 0);
      calc.delete(nome); cache[nome] = v; return v;
    }
    const T = (x, fala = 0) => avaliar(x, fala);
    T.marca = val; T.defs = defs; T.w = w; T.falas = falas;
    T.todas = () => { const o = {}; for (const k of Object.keys(defs)) o[k] = val(k); return o; };
    return T;
  };
  RK.nz = nz;
  if (typeof module !== 'undefined') module.exports = RK;
})(typeof window !== 'undefined' ? window : globalThis);
