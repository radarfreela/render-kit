# Corta o estalo de ruído que o Gemini TTS deixa no fim de cada frase e junta a narração.
#   python3 limpar_voz.py <pasta_do_projeto> [atempo]   (lê cenas/fNN.wav, grava cenas/limpo/ e audio/voz.wav)
import subprocess, re, sys, pathlib
P = pathlib.Path(sys.argv[1]); AT = sys.argv[2] if len(sys.argv) > 2 else '1.08'
(P / 'cenas/limpo').mkdir(parents=True, exist_ok=True); (P / 'audio').mkdir(exist_ok=True)
def rms(f):
    o = subprocess.run(['ffmpeg', '-i', str(f), '-af', 'highpass=f=8000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return [float(x) if x not in ('-inf', 'inf') else -200 for x in re.findall(r'RMS_level=([-0-9.inf]+)', o)]
lista = sorted((P / 'cenas').glob('f[0-9][0-9].wav'))
for f in lista:
    v = rms(f); dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)], capture_output=True, text=True).stdout)
    n = len(v); k = n
    while k > 0 and v[k - 1] > -30: k -= 1
    corte = dur * k / n - .02
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(f), '-af', f'atrim=0:{corte:.3f},afade=t=out:st={corte - .04:.3f}:d=0.04,apad=pad_dur=0.25', '-ar', '24000', '-ac', '1', str(P / 'cenas/limpo' / f.name)], check=True)
    fim = rms(P / 'cenas/limpo' / f.name)[-6:-3]
    print(f.name, f'{dur:.2f} -> {corte:.2f}', 'ok' if all(x < -40 for x in fim) else f'CONFERIR {fim}')
(P / 'cenas/limpo/l.txt').write_text(''.join(f'file {f.name}\n' for f in lista))
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(P / 'cenas/limpo/l.txt'), '-af', f'atempo={AT}', str(P / 'audio/voz.wav')], check=True)
print('voz.wav pronta,', len(lista), 'frases')
