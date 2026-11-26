# Fábrica do Universo Detalhado, parte 2: voz do prédio (Gemini Charon travado) → corte do estalo → tempo das palavras →
# sons de ação → gravação na nuvem (render-kit) → fila de aprovação no R2 (universo/fila/<id>/).
#   python3 montar_video.py <id da pauta> <pasta de saída (a mesma do gerar_cena.py)>
import json, re, sys, os, pathlib, subprocess, time, unicodedata, difflib, http.server, threading, functools, socket, datetime
AQUI = pathlib.Path(__file__).resolve().parent; NAT = AQUI.parent; RK = pathlib.Path.home() / 'Development/render-kit'
ID, P = sys.argv[1], pathlib.Path(sys.argv[2]).resolve()
PAUTA = next(p for p in json.load(open(AQUI / 'pauta.json')) if p['id'] == ID)
ENV = dict(os.environ, R2_BUCKET='fabrica-lowticket', R2_CRED_FILE=str(pathlib.Path.home() / '.r2_lowticket'))
def sh(*a, cwd=None, check=True): return subprocess.run(a, cwd=cwd, env=ENV, check=check, capture_output=True, text=True).stdout
def r2(op, a, b): return subprocess.run(['sh', str(RK / 'r2.sh'), op, str(a), str(b)], env=ENV, capture_output=True).returncode == 0
def disparar(wf, **campos):   # dispara um workflow do render-kit e espera (consulta a cada 30 s: poupa a cota da API do GitHub)
    antes = sh('gh', 'run', 'list', '-R', 'radarfreela/render-kit', '-w', wf, '-L', '1', '--json', 'databaseId', '-q', '.[0].databaseId')
    sh('gh', 'workflow', 'run', wf, '-R', 'radarfreela/render-kit', *sum([['-f', f'{k}={v}'] for k, v in campos.items()], []))
    for _ in range(40):
        time.sleep(8); r = sh('gh', 'run', 'list', '-R', 'radarfreela/render-kit', '-w', wf, '-L', '1', '--json', 'databaseId', '-q', '.[0].databaseId')
        if r != antes: break
    rid = r.strip(); subprocess.run(['gh', 'run', 'watch', rid, '-R', 'radarfreela/render-kit', '-i', '30'], env=ENV, capture_output=True)
    ok = sh('gh', 'run', 'view', rid, '-R', 'radarfreela/render-kit', '--json', 'conclusion', '-q', '.conclusion').strip()
    if ok != 'success': raise SystemExit(f'{wf} falhou ({rid})')
    return rid

J = 'jobs/u' + datetime.datetime.utcnow().strftime('%y%m%d%H%M') + ID; (P / 'job.txt').write_text(J)
F = PAUTA['falas']; json.dump(F, open(P / 'falas.json', 'w'), ensure_ascii=False)
json.dump({'estilo': ' ', 'cenas': [{'cena': f'f{i:02d}', 'texto': t} for i, t in enumerate(F)]}, open(P / 'molde/narracao-gemini.json', 'w'), ensure_ascii=False)
(P / 'cenas').mkdir(exist_ok=True)
if os.environ.get('VOZ', 'remy') == 'remy':   # Remy (sem cota): voz + tempo das palavras numa passada
    subprocess.run(['python3', str(NAT / 'voz_remy.py'), str(P)], env=ENV, check=True)
else:
    # 1) voz (repete até completar) e corte do estalo
    subprocess.run(['sh', str(NAT / 'gerar_voz.sh'), str(P)], env=ENV, check=True)
    if len(list((P / 'cenas').glob('f*.wav'))) < len(F): raise SystemExit('voz incompleta (cota do Gemini)')
    subprocess.run(['python3', str(NAT / 'limpar_voz.py'), str(P)], env=ENV, check=True)
    # 2) tempo das palavras, alinhado ao roteiro
    r2('put', P / 'audio/voz.wav', f'{J}/audio/voz.wav'); rid = disparar('palavras.yml', projeto=J, pasta='audio')
    r2('get', f'saida/{rid}/palavras.json', P / 'palavras.json')
    n = lambda s: re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode())
    PW = json.load(open(P / 'palavras.json'))['voz']; W = ' '.join(F).split()
    a, b = [n(p['w']) for p in PW], [n(w) for w in W]; sm = difflib.SequenceMatcher(None, a, b, autojunk=False); m = {}
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal' or (i2 - i1) == (j2 - j1):
            for k in range(j2 - j1): m[j1 + k] = (PW[i1 + k]['s'], PW[i1 + k]['e'])
        elif j2 > j1:
            s, e = (PW[i1]['s'], PW[i2 - 1]['e']) if i2 > i1 else (PW[i1 - 1]['e'], PW[i1 - 1]['e'] + .3); d = (e - s) / (j2 - j1)
            for k in range(j2 - j1): m[j1 + k] = (s + k * d, s + (k + 1) * d)
    print('voz x roteiro:', round(sm.ratio(), 3), flush=True)
    if sm.ratio() < .9: raise SystemExit('a voz pulou ou trocou palavras demais')
    (P / 'molde/palavras-tempo.js').write_text('window.PAL=' + json.dumps([[w, round(m[j][0], 2), round(m[j][1], 2)] for j, w in enumerate(W)], ensure_ascii=False) + ';')
# 3) tempos reais das falas (lidos da própria página) → sons
from playwright.sync_api import sync_playwright
s0 = socket.socket(); s0.bind(('127.0.0.1', 0)); porta = s0.getsockname()[1]; s0.close()
srv = http.server.ThreadingHTTPServer(('127.0.0.1', porta), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(P / 'molde'))); threading.Thread(target=srv.serve_forever, daemon=True).start()
nomes = json.loads(re.search(r'NOMES_FALA=(\{.*?\});', (P / 'molde/falas.js').read_text()).group(1))
with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader']); pg = br.new_page(viewport={'width': 1080, 'height': 1920})
    pg.goto(f'http://127.0.0.1:{porta}/video.html'); pg.wait_for_function('window.__pronto === true', timeout=90000)
    T = pg.evaluate('({T0: window.T0, FIM: window.FIM, DUR: window.DUR})')
    rev = [pg.evaluate(f'tAbs({i}, {json.dumps(ws[0])})') for i, ws in nomes.items() if ws]
    br.close()
srv.shutdown()
SONS_OK = {'baque.mp3', 'martelo.mp3', 'encaixe.mp3', 'pingo.mp3', 'pop.mp3', 'telha.mp3', 'telha2.mp3', 'range1.mp3', 'range3.mp3'}
ev = []
for s in json.load(open(P / 'plano-sons.json')):
    i = int(s.get('fala', 0)); som = s.get('som')
    if som not in SONS_OK or i >= len(T['T0']): continue
    e = {'som': som, 't': round(T['T0'][i] + (T['FIM'][i] - T['T0'][i]) * float(s.get('momento', .5)), 2), 'vol': min(1, float(s.get('vol', .5)))}
    if som == 'martelo.mp3': e.update(inicio=0, dur=1.0)
    ev.append(e)
ev += [{'som': 'nome.mp3', 't': round(t, 2), 'vol': .6} for t in rev]
json.dump({'duracao': round(T['DUR'], 2), 'trilha': None, 'narracao': [{'arquivo': 'voz.wav', 't': 0, 'vol': 1}], 'fundo': [], 'eventos': sorted(ev, key=lambda e: e['t'])}, open(P / 'molde/sons.json', 'w'), indent=1)
for s in SONS_OK | {'nome.mp3'}: (P / 'audio' / s).write_bytes((NAT / 'predio/audio' / s).read_bytes())
# 4) gravar na nuvem
for f in ['video.html', 'falas.js', 'palavras-tempo.js', 'sons.json', 'fontes/Inter.ttf']: r2('put', P / 'molde' / f, f'{J}/molde/{f}')
for f in (P / 'audio').iterdir(): r2('put', f, f'{J}/audio/{f.name}')
rid = disparar('gravar-paralelo.yml', projeto=J, nome=ID)
(P / 'saida').mkdir(exist_ok=True)
if not (r2('get', f'saida/{rid}/{ID}-som.mp4', P / 'saida/video.mp4') or r2('get', f'saida/{rid}/video-som.mp4', P / 'saida/video.mp4')): raise SystemExit('vídeo não encontrado')
# 5) fila de aprovação
custo = json.load(open(P / 'custo.json')).get('custo_usd') if (P / 'custo.json').exists() else None
vid = datetime.datetime.utcnow().strftime('%y%m%d-%H%M') + '-' + ID
ficha = {'id': vid, 'pauta': ID, 'titulo': PAUTA['titulo'], 'legenda': PAUTA['legenda'], 'criado': datetime.datetime.utcnow().isoformat(timespec='seconds') + 'Z', 'custo_api_usd': custo, 'duracao': round(T['DUR'], 1)}
json.dump(ficha, open(P / 'saida/ficha.json', 'w'), ensure_ascii=False)
r2('put', P / 'saida/video.mp4', f'universo/fila/{vid}/video.mp4'); r2('put', P / 'saida/ficha.json', f'universo/fila/{vid}/ficha.json')
if (P / 'conferencia.jpg').exists(): r2('put', P / 'conferencia.jpg', f'universo/fila/{vid}/conferencia.jpg')
print('na fila:', vid, flush=True)
