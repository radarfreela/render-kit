# Tempo de cada palavra das narrações (faster-whisper, MIT). Roda na nuvem (workflow palavras.yml).
#   python palavras.py <pasta-com-wav> > palavras.json
import glob, json, os, sys
from faster_whisper import WhisperModel
m = WhisperModel('medium', device='cpu', compute_type='int8')
out = {}
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*.wav'))):
    segs, _ = m.transcribe(f, language='pt', word_timestamps=True, beam_size=5, vad_filter=False)
    out[os.path.basename(f)[:-4]] = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words]
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
