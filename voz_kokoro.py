# Gera a narração de um molde com o Kokoro (Apache-2.0), uma faixa por cena.
#   python voz_kokoro.py --molde molde --voz pf_dora --saida saida/voz_pf_dora
# Lê <molde>/narracao.json ({cenas: [{cena, texto}], limites: {cena: s}}). Grava <saida>/duracoes.txt (não imprime texto).
import argparse, json, os, numpy as np, soundfile as sf
from kokoro import KPipeline
a = argparse.ArgumentParser(); a.add_argument('--molde'); a.add_argument('--voz'); a.add_argument('--saida'); a.add_argument('--velocidade', type=float, default=1.0)
o = a.parse_args()
N = json.load(open(os.path.join(o.molde, 'narracao.json'), encoding='utf-8'))
os.makedirs(o.saida, exist_ok=True)
pipe = KPipeline(lang_code='p')  # português do Brasil
rel = []
for c in N['cenas']:
    partes = [aud for _, _, aud in pipe(c['texto'], voice=o.voz, speed=o.velocidade)]
    audio = np.concatenate(partes)
    f = os.path.join(o.saida, f"{c['cena']}.wav"); sf.write(f, audio, 24000)
    dur = len(audio) / 24000
    rel.append(f"{c['cena']}: {dur:.1f}s (cabe {N['limites'][c['cena']]}s) {'OK' if dur <= N['limites'][c['cena']] - 0.4 else 'PASSA DO TEMPO'}")
open(os.path.join(o.saida, 'duracoes.txt'), 'w').write('\n'.join(rel))
print(f'{len(rel)} faixas geradas')
