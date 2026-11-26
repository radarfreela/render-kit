# Fábrica do Universo Detalhado (dono 25/11: "joga para a API fazer os vídeos").
# A API escreve a cena 3D de um roteiro JÁ APROVADO (pauta.json), usando como modelo o código do muro e do prédio,
# grava quadros de teste, confere a folha de quadros contra o roteiro e corrige (até 2 voltas).
#   python3 gerar_cena.py <id da pauta> <pasta de saída>
# Saída: <pasta>/molde/{video.html,_meio.js,_logica.js,falas.js,palavras-tempo.js(provisório)} + plano-sons.json + custo.json
import json, re, sys, os, pathlib, base64, subprocess, time, http.server, threading, functools, socket, urllib.request, urllib.error
import anthropic

AQUI = pathlib.Path(__file__).resolve().parent
NAT = AQUI.parent
ID, SAIDA = sys.argv[1], pathlib.Path(sys.argv[2]).resolve()
PAUTA = next(p for p in json.load(open(AQUI / 'pauta.json')) if p['id'] == ID)
MOLDE = SAIDA / 'molde'; MOLDE.mkdir(parents=True, exist_ok=True)
CLI = anthropic.Anthropic()
CUSTO = [0.0]
MODELO = 'claude-opus-5-5'

def ler(p): return pathlib.Path(p).read_text()
EXEMPLOS = {n: {'meio': ler(NAT / n / 'molde/_meio.js'), 'logica': ler(NAT / n / 'molde/_logica.js'), 'falas': json.load(open(NAT / n / 'falas.json'))} for n in ('muro', 'predio')}
CONTRATO = {'_head.js (fixo)': ler(AQUI / '_head.js'), '_chuva.js (fixo)': ler(AQUI / '_chuva.js'), '_cam.js (fixo)': ler(AQUI / '_cam.js'), '_tail.js (fixo)': ler(AQUI / '_tail.js')}
SONS = ['baque.mp3 (batida seca de algo pesado assentando)', 'martelo.mp3 (martelada)', 'encaixe.mp3 (peça encaixando, madeira)', 'pingo.mp3 (gota d\'água)',
        'pop.mp3 (algo aparecendo, seta surgindo)', 'telha.mp3 / telha2.mp3 (estalo curto de cerâmica, tijolo, peça pequena; também serve de rachadura)', 'range1.mp3 / range3.mp3 (madeira/estrutura rangendo, esforço)']

SISTEMA = f"""Você escreve cenas 3D em Three.js (r160) para o canal Universo Detalhado: vídeos verticais 1080x1920 que mostram COMO SE CONSTRÓI algo,
numa corrente de problema e conserto narrada assim: "Se você [jeito ingênuo], já tem X. Mas [falha]. Então você [conserto]. Esse é o NOME." O canal cresce com isso
(muro 1.394 views, telhado 1.285, prédio subindo). Você recebe o roteiro aprovado e devolve DOIS arquivos JavaScript: _meio.js (constrói a cena) e _logica.js (anima).

REGRAS DO DONO (todas obrigatórias):
1. UM objeto só, sendo construído na frente da pessoa, do começo ao fim (como o muro e o prédio). Ele cresce peça por peça; nada de cenas soltas.
2. Cada frase = o que a voz diz acontecendo NA TELA no mesmo instante. "Mas ..." = a falha ACONTECE (racha, afunda, alaga, tomba, desmorona), com setas laranja de força quando é peso/empurrão.
   "Então você ..." = o conserto entra por cima, peça por peça, com movimento (cai de cima e assenta, cresce, desliza). O nome é revelado na legenda automaticamente (não escreva texto 3D).
3. Câmera contínua, sem corte e sem zoom arrastado: uma chave por fala em CAMK [distância, altura, alvo y, giro em radianos; 0 = de frente para +z], enquadrando a AÇÃO daquela fala.
   O que importa precisa estar inteiro no quadro vertical (o campo horizontal é estreito: ~20°). Para coisa larga, gire a câmera para ver em diagonal.
4. Estilo low-poly colorido e claro (céu azul, grama, árvores ao fundo FORA do caminho da câmera), tamanhos reais e proporcionais, cores naturais. Nada de texto, letreiro, emoji, rosto de pessoa.
   Boneco só como figura simples (cápsula + esfera), sem rosto. Nada de som ou efeito de ruído contínuo.
5. Sempre algo se mexendo; nada parado por mais de 1 segundo.
6. Final "E pronto! ..." = o objeto completo, câmera abrindo, sol (como no prédio). A chamada final (siga a página) mostra o mesmo objeto girando devagar.

CONTRATO TÉCNICO (os arquivos fixos abaixo já existem; o seu código é colado entre eles nesta ordem: _head.js, _meio.js, _chuva.js, _logica.js, _cam.js, _tail.js):
- Do _head.js você pode usar: THREE, S (cena), C (câmera), R, M(cor, opções) (material flat), sombra(mesh), V(x,y,z), hs(i) (aleatório fixo 0..1), cl, eo, eio, ebk, lerp,
  fala(t), loc(t, i) (0..1 dentro da fala i), seg(t, i, a, b) (trecho a..b da fala i, suavizado), tAbs(i, 'palavra') (instante em que a palavra é dita na fala i), T0[i], FIM[i],
  CEU, CEU_CHUVA, sol (luz), hemi, chao (grama circular raio 40; esconda com chao.visible=false se fizer um bloco de terreno com corte, como no prédio).
- _chuva.js dá: chuva(t, forca) (chuva visual) e seta() (seta laranja de força, aponta para baixo; gire para outras direções).
- _logica.js DEVE definir: function estado(t), function aplica(t) (aplica o estado nos objetos e retorna um objeto), const CAMK (uma chave por fala, inclusive a da chamada final),
  function fx(t, A) (céu, chuva, partículas). O _tail.js chama, a cada quadro: camera(t); const A = aplica(t); fx(t, A); e usa NUVENS (defina NUVENS no _meio.js, array de grupos de nuvem).
- Use `await` só se precisar carregar algo (não precisa). Não use bibliotecas além do THREE já importado. Nada de Date.now/Math.random: o vídeo é gravado quadro a quadro (use hs()).
- Não declare nomes que o _head.js já declara (NF, W, H, S, C, R, M, V, T0, FIM, PAL, INI, NOMES, REV, fala, loc, seg, tPal, sol, hemi, chao, CEU, CEU_CHUVA).

SONS (só estes arquivos; sons curtos de ação, nunca chiado): {'; '.join(SONS)}. O som "nome.mp3" da revelação do nome é posto automaticamente.

FORMATO DA RESPOSTA: três blocos, nesta ordem e nada mais fora deles:
```js meio
...conteúdo do _meio.js...
```
```js logica
...conteúdo do _logica.js...
```
```json extra
{{"nomes": {{"<índice da fala>": ["palavras do nome sem acento e minúsculas, como 'fundacao'"]}}, "sons": [{{"som": "baque.mp3", "fala": 0, "momento": 0.8, "vol": 0.6}}]}}
```
Em "sons", momento é a posição dentro da fala (0..1), casando com o instante da ação no seu estado(t)."""

def exemplo_txt():
    out = []
    for n, e in EXEMPLOS.items():
        out.append(f'### EXEMPLO APROVADO: {n}\nRoteiro:\n' + '\n'.join(f'{i}: {f}' for i, f in enumerate(e['falas'])) +
                   f'\n```js meio\n{e["meio"]}\n```\n```js logica\n{e["logica"]}\n```')
    return '\n\n'.join(out)

def chamar(conteudo, max_tokens=64000, esforco='medium'):
    for tent in range(3):
        try:
            with CLI.beta.messages.stream(model=MODELO, max_tokens=max_tokens, thinking={'type': 'adaptive'}, output_config={'effort': esforco},
                                     system=[{'type': 'text', 'text': SISTEMA}, {'type': 'text', 'text': '\n\n'.join(f'### {k}\n```js\n{v}\n```' for k, v in CONTRATO.items()) + '\n\n' + exemplo_txt(), 'cache_control': {'type': 'ephemeral'}}],
                                     messages=[{'role': 'user', 'content': conteudo}]) as st:
                r = st.get_final_message()
            u = r.usage
            CUSTO[0] += (u.input_tokens * 4 + u.output_tokens * 20 + (u.cache_read_input_tokens or 0) * .4 + (u.cache_creation_input_tokens or 0) * 5) / 1e6
            if r.stop_reason in ('refusal',): raise SystemExit('a API recusou')
            return ''.join(b.text for b in r.content if b.type == 'text'), r.stop_reason
        except anthropic.APIStatusError as e:
            if e.status_code in (429, 500, 529) and tent < 2: time.sleep(30 * (tent + 1)); continue
            raise

# --- escritor alternativo (dono 26/11: "outra IA escreve, a Claude só confere") ---
ESCRITOR = os.environ.get('ESCRITOR', 'claude')
GEM_URL = 'https://generativelanguage.googleapis.com/v1beta/'
def _gem(caminho, corpo=None):
    req = urllib.request.Request(GEM_URL + caminho, data=json.dumps(corpo).encode() if corpo is not None else None,
                                 headers={'Content-Type': 'application/json', 'x-goog-api-key': os.environ['GEMINI_API_KEY']})
    with urllib.request.urlopen(req, timeout=900) as r: return json.load(r)
def gem_modelos():
    ms = [m['name'].split('/')[-1] for m in _gem('models?pageSize=200').get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
    ms = [m for m in ms if m.startswith('gemini') and not any(x in m for x in ('image', 'tts', 'live', 'audio', 'embed', 'lite', 'nano', 'robot', 'computer'))]
    def chave(m):
        v = re.search(r'gemini-(\d+(?:\.\d+)?)', m); v = float(v.group(1)) if v else 0
        return (('pro' in m), v, 'preview' not in m and 'exp' not in m)
    ms.sort(key=chave, reverse=True); return ms
GEM_LISTA = []
def gemini(texto):
    if not GEM_LISTA: GEM_LISTA.extend(gem_modelos()); print('modelos Gemini:', ', '.join(GEM_LISTA[:6]), flush=True)
    sistema = SISTEMA + '\n\n' + '\n\n'.join(f'### {k}\n```js\n{v}\n```' for k, v in CONTRATO.items()) + '\n\n' + exemplo_txt()
    for m in list(GEM_LISTA):
        for tent in range(2):
            try:
                r = _gem(f'models/{m}:generateContent', {'systemInstruction': {'parts': [{'text': sistema}]}, 'contents': [{'role': 'user', 'parts': [{'text': texto}]}],
                                                       'generationConfig': {'maxOutputTokens': 65536, 'temperature': 0.7}})
                u = r.get('usageMetadata', {}); c = (r.get('candidates') or [{}])[0]
                txt = ''.join(pt.get('text', '') for pt in c.get('content', {}).get('parts', []) if not pt.get('thought'))
                print(f'gemini {m}: entrada {u.get("promptTokenCount")} saída {u.get("candidatesTokenCount")} pensamento {u.get("thoughtsTokenCount")} fim {c.get("finishReason")}', flush=True)
                return txt, c.get('finishReason')
            except urllib.error.HTTPError as e:
                corpo = e.read().decode()[:300]; print(f'gemini {m}: HTTP {e.code} {corpo}', flush=True)
                if e.code in (500, 503) and tent == 0: time.sleep(30); continue
                break
            except Exception as e: print(f'gemini {m}: {e}', flush=True); break
        GEM_LISTA.remove(m)
    raise SystemExit('nenhum modelo Gemini respondeu')
def escrever(texto, esforco='medium'):
    return gemini(texto) if ESCRITOR == 'gemini' else chamar(esforco=esforco, conteudo=texto)
def conferir_claude(img_b64):   # só o veredito, sem código: barato
    r = CLI.messages.create(model=MODELO, max_tokens=4000, thinking={'type': 'adaptive'}, output_config={'effort': 'low'},
        messages=[{'role': 'user', 'content': [{'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': img_b64}},
            {'type': 'text', 'text': f'Folha de quadros de um vídeo 3D (2 quadros por fala: começo e fim; a legenda mostra a palavra falada). ROTEIRO:\n{roteiro_txt()}\n\n'
             'Confira fala por fala: o que a voz diz está acontecendo na tela? O objeto está inteiro no quadro, sem corte e sem coisa na frente? A falha do "Mas" aparece? '
             'O conserto do "Então" entra com movimento? Algo parado, preto, gigante, minúsculo, flutuando ou atravessando outra peça? '
             'Se estiver tudo certo, responda só APROVADO. Se não, liste os problemas, um por linha, citando a fala e o que mudar. Sem código.'}]}])
    u = r.usage; CUSTO[0] += (u.input_tokens * 4 + u.output_tokens * 20) / 1e6
    return ''.join(b.text for b in r.content if b.type == 'text')

def separar(txt):
    def bloco(rot):
        m = re.search(r'```(?:js|javascript|json)?[ \t]*(?://)?[ \t]*' + rot + r'[^\n]*\n(.*?)\n```', txt, re.S | re.I)
        if not m: raise ValueError(f'faltou o bloco {rot}')
        return m.group(1)
    return bloco('meio'), bloco('logica'), json.loads(bloco('extra'))

def montar(meio, logica, extra, pal_falso=True):
    (MOLDE / '_meio.js').write_text(meio); (MOLDE / '_logica.js').write_text(logica)
    F = PAUTA['falas']
    (MOLDE / 'falas.js').write_text('window.FALAS_TXT=' + json.dumps(F, ensure_ascii=False) + ';window.NOMES_FALA=' + json.dumps(extra.get('nomes', {}), ensure_ascii=False) + ';')
    if pal_falso:   # tempo provisório (2,9 palavras/s) só para conferir; o vídeo usa o tempo real da voz
        pal, t = [], .2
        for f in F:
            for w in f.split(): pal.append([w, round(t, 2), round(t + .32, 2)]); t += .34
            t += .3
        (MOLDE / 'palavras-tempo.js').write_text('window.PAL=' + json.dumps(pal, ensure_ascii=False) + ';')
    html = '\n'.join([ler(AQUI / '_head.js'), meio, ler(AQUI / '_chuva.js'), logica, ler(AQUI / '_cam.js')]) + '\n\n' + ler(AQUI / '_tail.js')
    (MOLDE / 'video.html').write_text(html)
    fontes = MOLDE / 'fontes'; fontes.mkdir(exist_ok=True)
    if not (fontes / 'Inter.ttf').exists(): (fontes / 'Inter.ttf').write_bytes((NAT / 'predio/molde/fontes/Inter.ttf').read_bytes())

def porta_livre():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def conferir():   # grava 1 quadro no meio de cada fala + erros do console; devolve (erros, folha.png)
    from playwright.sync_api import sync_playwright
    from PIL import Image
    porta = porta_livre()
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', porta), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(MOLDE)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    erros, quadros = [], []
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = b.new_page(viewport={'width': 1080, 'height': 1920})
        pg.on('console', lambda m: erros.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.goto(f'http://127.0.0.1:{porta}/video.html')
        try: pg.wait_for_function('window.__pronto === true', timeout=90000)
        except Exception: erros.append('a página não ficou pronta em 90 s')
        if not erros:
            n = len(PAUTA['falas'])
            for i in range(n):
                for f in (.35, .85):
                    d = pg.evaluate(f'''() => {{ const t = T0[{i}] + (FIM[{i}] - T0[{i}]) * {f}; window.render(t); const c = document.createElement('canvas'); c.width = 270; c.height = 480;
                        const x = c.getContext('2d'); x.drawImage(document.getElementById('g'), 0, 0, 270, 480); x.drawImage(document.getElementById('h'), 0, 0, 270, 480); return c.toDataURL('image/jpeg', .8); }}''')
                    quadros.append(Image.open(__import__('io').BytesIO(base64.b64decode(d.split(',')[1]))))
        b.close()
    srv.shutdown()
    if erros: return erros[:8], None
    from PIL import ImageDraw
    col = 6; lin = (len(quadros) + col - 1) // col
    folha = Image.new('RGB', (270 * col, 480 * lin), 'black'); dr = ImageDraw.Draw(folha)
    for k, q in enumerate(quadros):
        x, y = (k % col) * 270, (k // col) * 480; folha.paste(q, (x, y)); dr.rectangle([x, y, x + 120, y + 26], fill='black'); dr.text((x + 6, y + 6), f'fala {k // 2} {"início" if k % 2 == 0 else "fim"}', fill='yellow')
    arq = SAIDA / 'conferencia.jpg'; folha.save(arq, quality=82)
    return [], arq

def roteiro_txt(): return '\n'.join(f'{i}: {f}' for i, f in enumerate(PAUTA['falas']))

# 1) primeira versão
for tent in range(2):
    txt, stop = escrever(esforco=('low', 'low')[tent], texto=f'ROTEIRO APROVADO ("{PAUTA["titulo"]}"):\n{roteiro_txt()}\n\nEscreva a cena completa seguindo as regras e o padrão dos exemplos. '
                       'Responda SÓ com os três blocos (```js meio, ```js logica, ```json extra), sem explicação, e seja econômico no texto para caber.')
    try: meio, logica, extra = separar(txt); break
    except ValueError as e: print(f'tentativa {tent}: {e} (fim: {stop}, {len(txt)} letras) início:', txt[:200].replace(chr(10), ' '), flush=True)
else: raise SystemExit('a API não devolveu os blocos')
montar(meio, logica, extra)
# 2) conferir e corrigir (Claude escrevendo: até 2 voltas; Gemini grátis: até 5)
for volta in range(5 if ESCRITOR == 'gemini' else 2):
    erros, folha = conferir()
    img = None
    if erros:
        pedido = f'O código deu erro no navegador:\n' + '\n'.join(erros) + '\n\nCorrija e devolva os três blocos completos.'
        conteudo = pedido + f'\n\nROTEIRO:\n{roteiro_txt()}\n\nCÓDIGO ATUAL:\n```js meio\n{meio}\n```\n```js logica\n{logica}\n```\n```json extra\n{json.dumps(extra, ensure_ascii=False)}\n```'
    else:
        img = base64.b64encode(folha.read_bytes()).decode()
        conteudo = [] if ESCRITOR == 'gemini' else [{'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': img}},
                    {'type': 'text', 'text': f'Esta é a folha de quadros da sua cena (2 quadros por fala: começo e fim; a legenda mostra a palavra falada). ROTEIRO:\n{roteiro_txt()}\n\n'
                     'Confira fala por fala, como o dono confere: o que a voz diz está acontecendo na tela? O objeto está inteiro no quadro, sem corte e sem coisa na frente? '
                     'A falha do "Mas" aparece? O conserto do "Então" entra com movimento? Algo parado, preto, gigante, minúsculo, flutuando ou atravessando outra peça? '
                     'Se estiver tudo certo, responda só com a palavra APROVADO. Se não, diga em uma linha o que corrige e devolva os três blocos completos corrigidos.\n\n'
                     f'CÓDIGO ATUAL:\n```js meio\n{meio}\n```\n```js logica\n{logica}\n```\n```json extra\n{json.dumps(extra, ensure_ascii=False)}\n```'}]
    if ESCRITOR == 'gemini':
        if erros: txt, stop = gemini(conteudo)
        else:
            parecer = conferir_claude(img).strip()
            if parecer.upper().startswith('APROVADO'): print(f'volta {volta}: aprovado pela conferência', flush=True); break
            print(f'volta {volta}: conferência pediu —', parecer.replace(chr(10), ' | ')[:400], flush=True)
            txt, stop = gemini(f'A conferência dos quadros apontou estes problemas:\n{parecer}\n\nROTEIRO:\n{roteiro_txt()}\n\nCorrija e devolva os três blocos completos (```js meio, ```js logica, ```json extra), nada mais.\n\n'
                               f'CÓDIGO ATUAL:\n```js meio\n{meio}\n```\n```js logica\n{logica}\n```\n```json extra\n{json.dumps(extra, ensure_ascii=False)}\n```')
    else: txt, stop = chamar(conteudo)
    if not erros and txt.strip().upper().startswith('APROVADO'): print(f'volta {volta}: aprovado pela conferência', flush=True); break
    try: meio, logica, extra = separar(txt); montar(meio, logica, extra); print(f'volta {volta}: corrigido —', txt.strip().split('\n')[0][:200], flush=True)
    except ValueError as e: print('resposta sem blocos:', e, flush=True); break
erros, folha = conferir()
if erros: raise SystemExit('cena com erro: ' + ' | '.join(erros))
json.dump(extra.get('sons', []), open(SAIDA / 'plano-sons.json', 'w'), ensure_ascii=False, indent=1)
json.dump({'custo_usd': round(CUSTO[0], 2)}, open(SAIDA / 'custo.json', 'w'))
print(f'cena pronta · custo da API ~US$ {CUSTO[0]:.2f}', flush=True)
