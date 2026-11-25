# Narração com Chatterbox Multilingual (código aberto, licença MIT), na CPU do runner. Uma fala por cena.
#   python3 vozes_chatterbox.py --textos textos.json --voz <padrao|alex|santa|dora> --saida saida/voz_<voz>
# textos.json: {"cenas": [{"cena": "<id>", "texto": "<fala>"}]}
# Vozes: 'padrao' = voz que vem com o modelo; as outras usam como referência uma frase gerada pelo Kokoro (Apache 2.0).
import argparse, json, os, time, subprocess
import torch, torchaudio as ta
ap = argparse.ArgumentParser(); ap.add_argument('--textos'); ap.add_argument('--voz'); ap.add_argument('--saida'); a = ap.parse_args()
os.makedirs(a.saida, exist_ok=True)
REF = {'alex': 'pm_alex', 'santa': 'pm_santa', 'dora': 'pf_dora'}
ref = None
if a.voz in REF:
    from kokoro import KPipeline
    import soundfile as sf, numpy as np
    p = KPipeline(lang_code='p')
    frase = 'Olá! Hoje eu vou te mostrar como as coisas funcionam por dentro, passo a passo, de um jeito que qualquer pessoa entende.'
    audio = np.concatenate([x.audio.numpy() for x in p(frase, voice=REF[a.voz])])
    ref = os.path.join(a.saida, '_ref.wav'); sf.write(ref, audio, 24000)
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
t0 = time.time(); m = ChatterboxMultilingualTTS.from_pretrained(device='cpu'); print('modelo carregado em', round(time.time() - t0), 's', flush=True)
T = json.load(open(a.textos))
total = 0
for c in T['cenas']:
    t1 = time.time()
    wav = m.generate(c['texto'], language_id='pt', audio_prompt_path=ref, exaggeration=.55, cfg_weight=.5)
    arq = os.path.join(a.saida, c['cena'] + '.wav'); ta.save(arq, wav, m.sr)
    dur = wav.shape[-1] / m.sr; total += dur
    print(c['cena'], f'{dur:.1f}s de áudio em {time.time() - t1:.0f}s', flush=True)
print('total', round(total, 1), 's de áudio em', round(time.time() - t0), 's', flush=True)
