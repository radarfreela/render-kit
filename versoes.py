# Monta as versões de gancho de um criativo: para cada gancho, copia o molde base para uma pasta nova
# e escreve cfg.js (lido pelo video.html) + sons.json (lido pelo mixar.mjs), a partir das narrações
# (<raiz>/audio/<audio>/*.wav) e do tempo de cada palavra (<raiz>/audio/<audio>/palavras.json, do palavras.py).
# Leve: só ffmpeg de áudio (silencedetect). Não renderiza nada.
#
#   python3 versoes.py --config criativo.json [--base <molde base>] [--textos <arquivo>] [--raiz .]
#
# Config (JSON, fica junto do conteúdo, fora deste repo):
#   audio        subpasta de <raiz>/audio com <id>.wav e palavras.json
#   textos       arquivo {"corpo": {id: fala}, "ganchos": [{"id", "fala", "titulo", "pasta"?, ...}]} (relativo a --raiz)
#   base         molde base (pasta em --raiz); cada gancho vira <base>-<id>, ou a "pasta" do gancho
#   ordem        falas em sequência; "{campo}" é trocado pelo campo do gancho (ex.: ["{id}", "c2", "c3"])
#   inicio, intervalo, cauda   segundos: antes da 1ª fala, entre falas, depois da última (padrão 0.3, 0.45, 0.7)
#   palavras_chave             palavras destacadas na legenda (sem acento, minúsculas)
#   limites      {"padrao": s, "gancho": s, "gancho_com_pasta": s, "chaves": {id: s}} — fala mais longa que isso aborta
#                (sinal de que o modelo leu a instrução em voz alta)
#   valores      [[nome, expressão], ...] calculados em ordem (ver EXPRESSÕES)
#   cfg          {chave: expressão} acrescentadas ao cfg.js depois de titulo/ini/dur/gancho/blocos; valor None é omitido
#   trilha, fundo                copiados para o sons.json
#   eventos      [{"som", "vol", "t": expressão (número ou lista), "n"?: repetições com i = 0..n-1}]
#
# EXPRESSÕES: aritmética em sintaxe Python, sem atributos nem import. Nomes: ini, dur (listas por fala da ordem),
#   g (o gancho), os valores já calculados, i (em eventos com "n"). Funções: achar(n, prefixo) = tempo da 1ª palavra
#   da fala n que começa com o prefixo; fatias(a, b, n, casas); somar(lista, d); arquivo_base(nome) = JSON da pasta base;
#   min, max, round, len, range, abs.
import argparse, ast, json, operator, os, re, shutil, subprocess, unicodedata

a = argparse.ArgumentParser()
a.add_argument('--config', required=True); a.add_argument('--base'); a.add_argument('--textos'); a.add_argument('--raiz', default='.')
o = a.parse_args()
C = json.load(open(o.config, encoding='utf-8'))
F = os.path.abspath(o.raiz)
BASE = o.base or C['base']
AUD = C['audio']; A = os.path.join(F, 'audio', AUD)
T = json.load(open(o.textos or os.path.join(F, C['textos']), encoding='utf-8'))
CORPO, GANCHOS = T['corpo'], T['ganchos']
PW = json.load(open(os.path.join(A, 'palavras.json')))
CHAVE = set(C.get('palavras_chave', []))
INI0, GAP, CAUDA = C.get('inicio', 0.3), C.get('intervalo', 0.45), C.get('cauda', 0.7)
def _n(x): return ''.join(c for c in unicodedata.normalize('NFD', x.lower()) if c.isalnum())

# ---- avaliador de expressões (só o que está na lista; nada de atributo, import ou chamada livre)
_BIN = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv,
        ast.FloorDiv: operator.floordiv, ast.Mod: operator.mod}
_CMP = {ast.Eq: operator.eq, ast.NotEq: operator.ne, ast.Lt: operator.lt, ast.LtE: operator.le, ast.Gt: operator.gt,
        ast.GtE: operator.ge, ast.In: lambda x, y: x in y, ast.NotIn: lambda x, y: x not in y}
def avaliar(expr, nomes):
    def ev(n):
        if isinstance(n, ast.Expression): return ev(n.body)
        if isinstance(n, ast.Constant): return n.value
        if isinstance(n, ast.Name):
            if n.id not in nomes: raise ValueError(f'nome desconhecido: {n.id}')
            return nomes[n.id]
        if isinstance(n, ast.BinOp) and type(n.op) in _BIN: return _BIN[type(n.op)](ev(n.left), ev(n.right))
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.USub): return -ev(n.operand)
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.UAdd): return +ev(n.operand)
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.Not): return not ev(n.operand)
        if isinstance(n, (ast.List, ast.Tuple)): return [ev(x) for x in n.elts]
        if isinstance(n, ast.Subscript): return ev(n.value)[ev(n.slice)]
        if isinstance(n, ast.IfExp): return ev(n.body) if ev(n.test) else ev(n.orelse)
        if isinstance(n, ast.BoolOp):
            if isinstance(n.op, ast.And):
                v = True
                for x in n.values:
                    v = ev(x)
                    if not v: return v
                return v
            for x in n.values:
                v = ev(x)
                if v: return v
            return v
        if isinstance(n, ast.Compare):
            esq = ev(n.left)
            for op, d in zip(n.ops, n.comparators):
                dir_ = ev(d)
                if type(op) not in _CMP or not _CMP[type(op)](esq, dir_): return False
                esq = dir_
            return True
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in FUNCOES and not n.keywords:
            return FUNCOES[n.func.id](*[ev(x) for x in n.args])
        raise ValueError(f'expressão não permitida: {ast.dump(n)[:80]}')
    return ev(ast.parse(str(expr), mode='eval'))

def tempos(chave, texto, ini):
    # tempo absoluto de cada palavra do NOSSO texto, pela posição proporcional nas letras do whisper
    ws = PW[chave]; nos = texto.split()
    lw = [len(_n(w['w'])) for w in ws]; tw = sum(lw) or 1
    ln = [len(_n(w)) for w in nos]; tn = sum(ln) or 1
    acc, marc = 0, []
    for w in ws: marc.append((acc, w['s'], w['e'])); acc += len(_n(w['w']))
    out, pos = [], 0
    for w, l in zip(nos, ln):
        alvo = pos * tw / tn; m = max((x for x in marc if x[0] <= alvo + 1e-6), key=lambda x: x[0])
        out.append({'w': w, 't': round(ini + m[1], 3), 'k': _n(w) in CHAVE}); pos += l
    return out

def fala(arq):  # (duração, início e fim da fala sem o silêncio das pontas)
    o = subprocess.run(['ffmpeg', '-i', arq, '-af', 'silencedetect=n=-40dB:d=0.15', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', o); dur = float(m.group(3)) + 60 * int(m.group(2))
    ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', o)]; se = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', o)]
    ini = se[0] if ss and ss[0] < 0.05 else 0.0
    fim = ss[-1] if ss and ss[-1] > dur - 0.6 and (len(ss) > len(se) or se[-1] >= dur - 0.05) else dur
    return dur, ini, fim

D = {k: fala(f'{A}/{k}.wav') for k in list(CORPO) + [g['id'] for g in GANCHOS]}
for k, (dur, i, f) in D.items(): print(f'{k}: arquivo {dur:.2f}s, fala {f - i:.2f}s')
L = C.get('limites', {}); IDS_G = {g['id']: g for g in GANCHOS}
def limite(k):
    if k in L.get('chaves', {}): return L['chaves'][k]
    if k in IDS_G: return L.get('gancho_com_pasta' if 'pasta' in IDS_G[k] else 'gancho', L.get('padrao'))
    return L.get('padrao')
if any(limite(k) is not None and f - i > limite(k) for k, (_, i, f) in D.items()):
    raise SystemExit('ALGUMA FALA LONGA DEMAIS: conferir se o modelo leu a instrução em voz alta')

base = os.path.join(F, BASE)
for G in GANCHOS:
    g, txt, tit = G['id'], G['fala'], G['titulo']
    ordem = [x.format(**G) for x in C['ordem']]; ini, dur, t = [], [], INI0
    for k in ordem:
        d, a_, f = D[k]; ini.append(round(t - a_, 3)); dur.append(round(f, 3)); t = t - a_ + f + GAP
    P = [tempos(k, (txt if k == g else CORPO[k]), ini[i]) for i, k in enumerate(ordem)]
    FUNCOES = {
        'achar': lambda n, w: next(x['t'] for x in P[n] if _n(x['w']).startswith(w)),
        'fatias': lambda a, b, n, casas: [round(a + (b - a) * i / (n - 1), casas) for i in range(n)],
        'somar': lambda lst, d: [x + d for x in lst],
        'arquivo_base': lambda nome: json.load(open(os.path.join(base, os.path.basename(nome)), encoding='utf-8')),
        'min': min, 'max': max, 'round': round, 'len': len, 'range': lambda *x: list(range(*x)), 'abs': abs,
    }
    nomes = {'ini': ini, 'dur': dur, 'g': G}
    for nome, expr in C.get('valores', []): nomes[nome] = avaliar(expr, nomes)
    blocos = []
    for i, lst in enumerate(P):
        fim = ini[i] + dur[i]; atual = []
        for j, x in enumerate(lst):
            atual.append(x)
            if len(atual) >= 4 or x['w'][-1] in ',.:?!' or j == len(lst) - 1:
                prox = lst[j + 1]['t'] if j + 1 < len(lst) else fim + .1
                blocos.append({'a': atual[0]['t'], 'b': round(prox, 3), 'p': atual}); atual = []
    nomes['gancho_palavras'] = [x['w'] for x in P[0]]
    pasta = os.path.join(F, G['pasta'] if 'pasta' in G else f'{BASE}-{g}')
    shutil.rmtree(pasta, ignore_errors=True); shutil.copytree(base, pasta, ignore=shutil.ignore_patterns('sons.json', 'cfg.js'))
    cfg = {'titulo': tit, 'ini': ini, 'dur': dur, 'gancho': [x['t'] for x in P[0]], 'blocos': blocos}
    for k, expr in C.get('cfg', {}).items():
        v = avaliar(expr, nomes)
        if v is not None: cfg[k] = v
    open(f'{pasta}/cfg.js', 'w').write('window.CFG = ' + json.dumps(cfg, ensure_ascii=False) + ';\n')
    total = ini[-1] + dur[-1] + CAUDA
    eventos = []
    for e in C.get('eventos', []):
        reps = range(int(avaliar(e['n'], nomes))) if 'n' in e else [None]
        for i in reps:
            v = avaliar(e['t'], {**nomes, 'i': i}) if i is not None else avaliar(e['t'], nomes)
            for x in (v if isinstance(v, list) else [v]): eventos.append({'som': e['som'], 't': round(x, 2), 'vol': e['vol']})
    json.dump({'duracao': round(total, 2),
               'narracao': [{'arquivo': f'{AUD}/{k}.wav', 't': max(ini[i], 0), 'vol': 1.0} for i, k in enumerate(ordem)],
               'trilha': C.get('trilha', {'arquivo': 'trilha.wav', 'inicio': 0, 'volume': 0, 'entrada': 1.0, 'saida': 1.5}),
               'fundo': C.get('fundo', []),
               'eventos': eventos},
              open(f'{pasta}/sons.json', 'w'), ensure_ascii=False, indent=1)
    print(g, f'{total:.1f}s', {k: nomes[k] for k, _ in C.get('valores', [])})
