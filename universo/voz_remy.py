# Voz Remy (aprovada pelo dono na piscina, 26/11): frase a frase, mesma voz, pausa natural entre frases; tempo das palavras vem do TTS.
#   python3 voz_remy.py <pasta do projeto>  (lê falas.json; escreve audio/voz.wav e molde/palavras-tempo.js)
import asyncio, json, re, subprocess, unicodedata, difflib, edge_tts
import sys, os; os.chdir(sys.argv[1]); os.makedirs('remy', exist_ok=True); os.makedirs('audio', exist_ok=True); os.makedirs('molde', exist_ok=True); F = json.load(open('falas.json'))
RATE, PAUSA, INICIO = '+15%', .42, .25
async def uma(i, txt):
    c = edge_tts.Communicate(txt, 'fr-FR-RemyMultilingualNeural', rate=RATE, pitch='-4Hz', boundary='WordBoundary'); ws = []
    with open(f'remy/f{i:02d}.mp3', 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
            elif ch['type'] == 'WordBoundary': ws.append([ch['text'], ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7])
    return ws
async def main(): return [await uma(i, t) for i, t in enumerate(F)]
W = asyncio.run(main())
dur = lambda f: float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
t, PW, partes = INICIO, [], []
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', f'anullsrc=r=24000:cl=mono', '-t', str(PAUSA), 'remy/pausa.wav'], check=True)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', f'anullsrc=r=24000:cl=mono', '-t', str(INICIO), 'remy/ini.wav'], check=True)
lista = ['remy/ini.wav']
for i, ws in enumerate(W):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'remy/f{i:02d}.mp3', '-ar', '24000', '-ac', '1', f'remy/f{i:02d}.wav'], check=True)
    for w, s, e in ws: PW.append({'w': w, 's': round(t + s, 3), 'e': round(t + e, 3)})
    t += dur(f'remy/f{i:02d}.wav') + PAUSA; lista += [f'remy/f{i:02d}.wav', 'remy/pausa.wav']
open('remy/lista.txt', 'w').write(''.join(f"file '{x.split('/')[1]}'\n" for x in lista))
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'remy/lista.txt', '-af', 'loudnorm=I=-16:TP=-1.5', '-ar', '44100', 'audio/voz.wav'], check=True)
n = lambda s: re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode())
Ws = ' '.join(F).split(); a, b = [n(p['w']) for p in PW], [n(w) for w in Ws]; sm = difflib.SequenceMatcher(None, a, b, autojunk=False); m = {}
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == 'equal' or (i2 - i1) == (j2 - j1):
        for k in range(j2 - j1): m[j1 + k] = (PW[i1 + k]['s'], PW[i1 + k]['e'])
    elif j2 > j1:
        s, e = (PW[i1]['s'], PW[i2 - 1]['e']) if i2 > i1 else (PW[i1 - 1]['e'], PW[i1 - 1]['e'] + .3); d = (e - s) / (j2 - j1)
        for k in range(j2 - j1): m[j1 + k] = (s + k * d, s + (k + 1) * d)
print('voz x roteiro:', round(sm.ratio(), 3), '| duração', round(t, 1), 's', flush=True)
if sm.ratio() < .9: raise SystemExit('a voz pulou palavras')
open('molde/palavras-tempo.js', 'w').write('window.PAL=' + json.dumps([[w, round(m[j][0], 2), round(m[j][1], 2)] for j, w in enumerate(Ws)], ensure_ascii=False) + ';')
