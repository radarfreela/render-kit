#!/bin/sh
# Gera no Gemini (Charon) todas as frases que faltam em <projeto>/cenas, repetindo até completar (máx. 6 rodadas).
#   sh gerar_voz.sh <pasta_do_projeto>
P=$1; cd "$P" || exit 1
export R2_BUCKET=fabrica-lowticket R2_CRED_FILE=$HOME/.r2_lowticket
J=$(cat job.txt)
for rodada in 1 2 3 4 5 6; do
  FALTA=$(python3 -c "
import json,os;d=json.load(open('molde/narracao-gemini.json'));f=[c for c in d['cenas'] if not os.path.exists('cenas/'+c['cena']+'.wav')]
d['cenas']=f;json.dump(d,open('molde/narracao-falta.json','w'),ensure_ascii=False);print(len(f))")
  [ "$FALTA" = 0 ] && { echo "voz completa"; exit 0; }
  echo "rodada $rodada: faltam $FALTA"
  sh ~/Development/render-kit/r2.sh put molde/narracao-falta.json $J/molde/narracao-falta.json >/dev/null
  (cd ~/Development/render-kit && gh workflow run vozes-gemini.yml -f projeto=$J -f textos=molde/narracao-falta.json -f vozes=Charon -f modo=cenas >/dev/null)
  sleep 8; R=$(cd ~/Development/render-kit && gh run list -w vozes-gemini.yml -L1 --json databaseId -q '.[0].databaseId')
  (cd ~/Development/render-kit && gh run watch $R -i 20 >/dev/null 2>&1)
  for c in $(python3 -c "import json;print(' '.join(c['cena'] for c in json.load(open('molde/narracao-falta.json'))['cenas']))"); do
    sh ~/Development/render-kit/r2.sh get saida/$R/voz_Charon/$c.wav cenas/$c.wav >/dev/null 2>&1 || rm -f cenas/$c.wav; done
  sleep 90
done
echo "parou com frases faltando"
