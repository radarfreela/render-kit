# Narração com Gemini TTS (uma faixa .wav por fala, mesma voz sempre). Roda local: só chamada de API + ffmpeg de áudio.
#
#   python3 vozes_gemini.py --config criativo.json [--textos outro.json] [--raiz .] [--so <id>]
#   python3 vozes_gemini.py --textos molde/narracao.json --voz <Voz> --saida saida/voz_<Voz> [--amostra] [--so <cena>]
#
# Chave: variável de ambiente GEMINI_API_KEY (obrigatória).
#
# Config (JSON, fica junto do conteúdo, fora deste repo):
#   {"audio": "<subpasta de <raiz>/audio>", "textos": "<arquivo de textos, relativo a --raiz>",
#    "modelo": "<modelo TTS>", "voz": "<voz pré-pronta>", "estilo": "<instrução de leitura que vai antes do texto>",
#    "pausa": 22}
# Textos, um de dois formatos:
#   A) {"corpo": {"<id>": "<fala>", ...}, "ganchos": [{"id": "<id>", "fala": "<fala>", ...}, ...]}
#      -> grava <audio>/<id>.wav; pula o que já existe; espera "pausa" segundos depois de cada fala nova (cota da API).
#   B) {"cenas": [{"cena": "<id>", "texto": "<fala>"}], "limites": {"<id>": <segundos>}, "modelo"?, "estilo"?}
#      -> regrava <saida>/<cena>.wav e confere se cabe no limite; com --amostra junta tudo num mp3 só.
import argparse, base64, json, os, subprocess, time, urllib.error, urllib.request

MODELO_PADRAO = 'gemini-3.8-flash-tts'
ESTILO_PADRAO = 'Say in Brazilian Portuguese, as an energetic and confident ad narrator: '

a = argparse.ArgumentParser()
a.add_argument('--config'); a.add_argument('--textos'); a.add_argument('--raiz', default='.')
a.add_argument('--voz'); a.add_argument('--modelo'); a.add_argument('--saida')
a.add_argument('--so'); a.add_argument('--amostra', action='store_true')
o = a.parse_args()

C = json.load(open(o.config, encoding='utf-8')) if o.config else {}
arq_textos = o.textos or (os.path.join(o.raiz, C['textos']) if 'textos' in C else None)
if not arq_textos: raise SystemExit('faltam os textos: --textos ou "textos" no --config')
T = json.load(open(arq_textos, encoding='utf-8'))
MODELO = o.modelo or C.get('modelo') or T.get('modelo') or MODELO_PADRAO
VOZ = o.voz or C.get('voz')
ESTILO = C.get('estilo') or T.get('estilo') or ESTILO_PADRAO
if not VOZ: raise SystemExit('falta a voz: --voz ou "voz" no --config')
if o.saida: SAIDA = o.saida
elif 'audio' in C: SAIDA = os.path.join(o.raiz, 'audio', C['audio'])
else: raise SystemExit('falta a pasta de saída: --saida ou "audio" no --config')
os.makedirs(SAIDA, exist_ok=True)
CHAVE = os.environ.get('GEMINI_API_KEY')
if not CHAVE: raise SystemExit('defina GEMINI_API_KEY')

def falar(texto, arq):
    corpo = {"contents": [{"parts": [{"text": ESTILO + texto}]}],
             "generationConfig": {"responseModalities": ["AUDIO"],
                                  "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOZ}}}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO}:generateContent",
                                 data=json.dumps(corpo).encode(), headers={"content-type": "application/json", "x-goog-api-key": CHAVE})
    for tentativa in (1, 2):   # 2ª tentativa só em falha de rede; erro HTTP para na hora
        try:
            r = json.load(urllib.request.urlopen(req, timeout=240)); break
        except urllib.error.HTTPError as e:
            raise SystemExit(f'ERRO {e.code} em {os.path.basename(arq)}: ' + e.read().decode(errors='replace')[:300])
        except (urllib.error.URLError, TimeoutError) as e:
            print(os.path.basename(arq), 'tentativa', tentativa, 'falha de rede:', e, flush=True)
            if tentativa == 2: raise SystemExit(f'ERRO de rede em {os.path.basename(arq)}')
    pcm = base64.b64decode(r['candidates'][0]['content']['parts'][0]['inlineData']['data'])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', '-', arq], input=pcm, check=True)
    print(os.path.basename(arq), 'ok', flush=True)
    return len(pcm) / 48000

if 'cenas' in T:   # formato B
    rel = []
    if o.amostra:
        d = falar(' '.join(c['texto'] for c in T['cenas']), os.path.join(SAIDA, f'amostra_{VOZ}.mp3'))
        rel.append(f'amostra {d:.1f}s')
    else:
        for c in T['cenas']:
            if o.so and c['cena'] != o.so: continue
            d = falar(c['texto'], os.path.join(SAIDA, f"{c['cena']}.wav"))
            lim = T['limites'][c['cena']]
            rel.append(f"{c['cena']}: {d:.1f}s (cabe {lim}s) {'OK' if d <= lim - 0.4 else 'PASSA DO TEMPO'}")
    print(VOZ, '|', ' · '.join(rel))
else:              # formato A
    pausa = float(C.get('pausa', 22))
    for k, t in list(T['corpo'].items()) + [(g['id'], g['fala']) for g in T['ganchos']]:
        if o.so and k != o.so: continue
        arq = os.path.join(SAIDA, f'{k}.wav')
        if os.path.exists(arq): continue
        falar(t, arq); time.sleep(pausa)
