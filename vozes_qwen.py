# Narração com Qwen3-TTS (Apache 2.0) na CPU. Modo "desenho de voz": a voz é descrita em texto (é nossa, não copia ninguém).
#   python3 vozes_qwen.py --textos textos.json --voz <nome> --saida saida/voz_<nome>
import argparse, json, os, time
import torch, soundfile as sf
ap = argparse.ArgumentParser(); ap.add_argument('--textos'); ap.add_argument('--voz'); ap.add_argument('--saida'); a = ap.parse_args()
os.makedirs(a.saida, exist_ok=True)
DESENHO = {
 'narrador': 'Brazilian Portuguese male narrator, about 30 years old, warm and confident, energetic storytelling tone, clear diction, natural pauses, like a popular science explainer on YouTube.',
 'jovem': 'Young Brazilian male voice from São Paulo, upbeat and friendly, slightly fast, enthusiastic and curious, like a TikTok creator explaining how things work.',
 'grave': 'Deep Brazilian male voice, calm and authoritative, documentary narrator, rich low timbre, steady pace.',
 'feminina': 'Brazilian female narrator in her late 20s, bright, engaging and expressive, clear diction, storytelling tone.',
}
from qwen_tts import Qwen3TTSModel
t0 = time.time()
m = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', device_map='cpu', dtype=torch.float32)
print('modelo carregado em', round(time.time() - t0), 's', flush=True)
try: print('línguas:', m.get_supported_languages(), flush=True)
except Exception as e: print('sem lista de línguas', e)
T = json.load(open(a.textos)); total = 0
for c in T['cenas']:
    t1 = time.time()
    wavs, sr = m.generate_voice_design(text=c['texto'], language='Portuguese', instruct=DESENHO[a.voz])
    arq = os.path.join(a.saida, c['cena'] + '.wav'); sf.write(arq, wavs[0], sr)
    dur = len(wavs[0]) / sr; total += dur
    print(c['cena'], f'{dur:.1f}s de áudio em {time.time() - t1:.0f}s', flush=True)
print('total', round(total, 1), 's de áudio em', round(time.time() - t0), 's', flush=True)
