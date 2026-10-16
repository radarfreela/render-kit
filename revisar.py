# Revisão com nota de um vídeo pronto (antes de aprovar ou publicar).
#   python3 revisar.py saida/<nome>/<arquivo>.mp4 [--quadros 12] [--criterios criterios.json] [--duracao 15-40]
# Faz duas coisas:
#   1. Checagens medidas (ffmpeg): formato, duração, volume e pico, trechos pretos, tela congelada.
#   2. Folha de quadros (folha.jpg) + revisao.json para a revisão visual. Quem olha dá nota de 0 a 10
#      por critério, anota o problema e o segundo; abaixo de 8 em qualquer critério, refaz e revisa de novo.
# Leve: só lê o MP4 e tira quadros pequenos. Não renderiza nada.
import json, os, re, subprocess, sys

def ff(*a): return subprocess.run(['ffmpeg', '-hide_banner', *a], capture_output=True, text=True).stderr
def probe(arq):
    o = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate',
                                   '-of', 'json', arq], capture_output=True, text=True).stdout)
    v = next(s for s in o['streams'] if s['codec_type'] == 'video'); a = any(s['codec_type'] == 'audio' for s in o['streams'])
    return float(o['format']['duration']), v['width'], v['height'], a

CRITERIOS = [
    ('gancho', 'Os 2 primeiros segundos param o dedo: frase do gancho legível, grande, sem cortar palavra'),
    ('verdade', 'Tudo o que aparece e é dito é verdadeiro (nada inventado, dado fictício marcado)'),
    ('enquadramento', 'Na câmera sobre a página: sem tela vazia, sem conteúdo importante cortado, zoom com propósito'),
    ('legenda', 'Legenda no tempo da voz, legível, sem cobrir o que está sendo mostrado'),
    ('ritmo', 'Nenhuma cena parada demais nem repetida; cada corte tem motivo'),
    ('marca', 'Cores e fontes da identidade visual; sem cara de IA (cápsula com bolinha, logo improvisado)'),
    ('chamada', 'Final claro: nome + ação, tempo suficiente para ler'),
    ('politica', 'Sem promessa enganosa, sem atributo pessoal sensível, sem depoimento falso'),
]

def main(arq, nq=12, criterios=None, faixa=(15, 40)):
    crit = criterios or CRITERIOS
    pasta = os.path.join(os.path.dirname(arq), 'revisao-' + os.path.splitext(os.path.basename(arq))[0]); os.makedirs(pasta, exist_ok=True)
    dur, w, h, tem_audio = probe(arq); med = {'duracao_s': round(dur, 1), 'resolucao': f'{w}x{h}', 'audio': tem_audio}
    alertas = []
    if (w, h) != (1080, 1920): alertas.append(f'resolução {w}x{h}, esperado 1080x1920')
    if not faixa[0] <= dur <= faixa[1]: alertas.append(f'duração {dur:.1f}s fora de {faixa[0]}–{faixa[1]} s')
    if tem_audio:
        o = ff('-i', arq, '-af', 'ebur128=peak=true', '-f', 'null', '-')
        lufs = re.findall(r'I:\s+(-?[\d.]+) LUFS', o); pico = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', o)
        med['volume_lufs'] = float(lufs[-1]) if lufs else None; med['pico_dbfs'] = float(pico[-1]) if pico else None
        if med['volume_lufs'] is not None and not -18 <= med['volume_lufs'] <= -11: alertas.append(f"volume {med['volume_lufs']} LUFS (feed: -16 a -13)")
        if med['pico_dbfs'] is not None and med['pico_dbfs'] > -1: alertas.append(f"pico {med['pico_dbfs']} dBFS: risco de estourar")
    else: alertas.append('sem áudio')
    pretos = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', ff('-i', arq, '-vf', 'blackdetect=d=0.3:pix_th=0.08', '-an', '-f', 'null', '-'))
    med['trechos_pretos'] = [(float(a), float(b)) for a, b in pretos]
    if pretos: alertas.append(f'{len(pretos)} trecho(s) preto(s): {pretos}')
    cong = re.findall(r'freeze_start: ([\d.]+)[\s\S]*?freeze_duration: ([\d.]+)', ff('-i', arq, '-vf', 'freezedetect=n=0.003:d=2.5', '-an', '-f', 'null', '-'))
    med['tela_parada'] = [(float(a), float(d)) for a, d in cong]
    if cong: alertas.append(f'tela parada por 2,5 s ou mais em: {[(round(float(a),1), round(float(d),1)) for a, d in cong]}')
    # folha de quadros: os 2 primeiros segundos com mais densidade (o gancho decide), o resto espalhado
    ts = [0.4, 1.2, 2.0] + [round(2.5 + i * (dur - 3.2) / (nq - 4), 2) for i in range(nq - 3)]
    for i, t in enumerate(ts):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', arq, '-frames:v', '1', '-vf',
                        'scale=270:-1', f'{pasta}/q{i:02d}.jpg'])
    n = len(ts); cols = 6
    entradas = sum([['-i', f'{pasta}/q{i:02d}.jpg'] for i in range(n)], [])
    layout = '|'.join(f'{(i % cols) * 270}_{(i // cols) * 480}' for i in range(n))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *entradas, '-filter_complex', f'xstack=inputs={n}:layout={layout}:fill=black', f'{pasta}/folha.jpg'])
    for i in range(n): os.remove(f'{pasta}/q{i:02d}.jpg')
    json.dump({'video': arq, 'medido': med, 'alertas': alertas, 'quadros_s': ts,
               'criterios': {k: {'pergunta': q, 'nota': None, 'problema': ''} for k, q in crit}},
              open(f'{pasta}/revisao.json', 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({'medido': med, 'alertas': alertas, 'folha': f'{pasta}/folha.jpg'}, ensure_ascii=False))

if __name__ == '__main__':
    a = sys.argv[1:]; nq = int(a[a.index('--quadros') + 1]) if '--quadros' in a else 12
    # --criterios: JSON {"chave": "pergunta", ...} que substitui a lista padrão
    crit = list(json.load(open(a[a.index('--criterios') + 1], encoding='utf-8')).items()) if '--criterios' in a else None
    faixa = tuple(float(x) for x in a[a.index('--duracao') + 1].split('-')) if '--duracao' in a else (15, 40)
    main(a[0], nq, crit, faixa)
