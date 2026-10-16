// Confere o enquadramento de um molde com câmera sobre uma imagem (#cam img, 800 px de largura base,
// cena #C): em todo quadro com a cena visível e zoom (> 1,3x), a imagem precisa cobrir a tela
// do topo até a faixa da legenda — sem área vazia, sem imagem "subindo". Molde com window.render(t) + window.DUR.
//   node conferir-camera.cjs molde/video.html
// Usa o Chrome indicado em CHROME (puppeteer-core) ou o do pacote puppeteer. Leve: escala 0,25, sem gravar vídeo.
let p; try { p = require('puppeteer-core'); } catch { p = require('puppeteer'); } const path = require('path');
const CHROME = process.env.CHROME;
(async () => {
  const b = await p.launch({ ...(CHROME ? { executablePath: CHROME } : {}), headless: 'new' });
  const pg = await b.newPage(); await pg.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 0.25 });
  await pg.goto('file://' + path.resolve(process.argv[2]), { waitUntil: 'networkidle0' });
  const ruins = await pg.evaluate(() => {
    const out = []; const dur = window.DUR;
    for (let t = 0; t < dur; t += 0.1) {
      window.render(t);
      const cena = document.getElementById('C'); if (+getComputedStyle(cena).opacity < 0.95) continue;
      const r = document.querySelector('#cam img').getBoundingClientRect();
      const s = r.width / 800; if (s < 1.3) continue;           // visão da página inteira: livre
      if (r.top > 2 || r.bottom < 1905) out.push({ t: +t.toFixed(1), topo: Math.round(r.top), fim: Math.round(r.bottom), zoom: +s.toFixed(2) });
    }
    return out;
  });
  await b.close();
  // transição de câmera dura ~0,2 s: só conta problema que fica na tela 0,3 s ou mais
  const blocos = []; for (const r of ruins) { const u = blocos[blocos.length - 1];
    if (u && r.t - u[u.length - 1].t < 0.15) u.push(r); else blocos.push([r]); }
  const graves = blocos.filter(x => x.length >= 3).flat();
  if (graves.length) { console.log('ENQUADRAMENTO RUIM em', graves.length, 'quadros:'); console.log(graves.slice(0, 12)); process.exit(1); }
  if (ruins.length) { console.log('enquadramento OK (só transição rápida em', ruins.length, 'quadro)'); return; }
  console.log('enquadramento OK');
})();
