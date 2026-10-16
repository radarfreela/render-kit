#!/bin/sh
# Faz um vídeo de ponta a ponta: sobe os insumos para o R2 -> render na nuvem -> mp4 em saida/<nome>/
#   ./fazer.sh <pasta-do-molde> [nome]
# Rodar na pasta do conteúdo (onde ficam a pasta do molde e audio/). No Mac só roda o leve (upload/download).
# Precisa: gh autenticado, jq, curl; R2_BUCKET + credenciais do r2.sh (R2_CRED_FILE ou as 3 variáveis R2_*).
# Variáveis opcionais: RENDER_REPO (padrão radarfreela/render-kit), AUDIO_DIR (padrão ./audio), ARQUIVO (padrão video.html).
#
# Os insumos vão para jobs/<id aleatório>/{molde,audio}/ no balde: o id é o único dado que aparece no
# workflow (repo público). Só sobem os áudios que o sons.json do molde usa.
set -eu
AQUI=$(cd "$(dirname "$0")" && pwd); R2="$AQUI/r2.sh"
MOLDE=${1:?pasta do molde}; NOME=${2:-video}
REPO=${RENDER_REPO:-radarfreela/render-kit}; AUD=${AUDIO_DIR:-audio}; ARQ=${ARQUIVO:-video.html}
printf '%s' "$NOME" | grep -Eq '^[A-Za-z0-9._-]+$' || { echo "nome inválido (use letras, números, . _ -)"; exit 1; }
[ -f "$MOLDE/$ARQ" ] && [ -f "$MOLDE/sons.json" ] || { echo "molde sem $ARQ ou sons.json"; exit 1; }

ID=$(openssl rand -hex 8); P="jobs/$ID"
n=0
for f in $(cd "$MOLDE" && find . -type f ! -name '.DS_Store' | sed 's#^\./##'); do
  "$R2" put "$MOLDE/$f" "$P/molde/$f"; n=$((n+1))
done
m=0
for f in $(jq -r '[(.trilha | select(. != null and .volume > 0) | .arquivo), (.narracao // [] | .[].arquivo),
                   (.fundo // [] | .[].arquivo), (.eventos // [] | .[].som)] | unique | .[]' "$MOLDE/sons.json"); do
  "$R2" put "$AUD/$f" "$P/audio/$f"; m=$((m+1))
done
echo "subiu $n arquivos do molde e $m áudios para $P"

gh workflow run gravar.yml -R "$REPO" -f projeto="$P" -f arquivo="$ARQ" -f nome="$NOME"
sleep 8
RUN=$(gh run list -R "$REPO" -w gravar.yml -e workflow_dispatch -L 1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN" -R "$REPO" --exit-status > /dev/null
for s in som leve; do "$R2" get "saida/$RUN/$NOME-$s.mp4" "saida/$NOME/$NOME-$s.mp4"; done
ls -lh "saida/$NOME"
