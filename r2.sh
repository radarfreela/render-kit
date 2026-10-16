#!/bin/sh
# Cliente mínimo de R2 (API S3) só com curl --aws-sigv4. Sem aws cli, sem dependência.
#   ./r2.sh put <arquivo-local> <chave>
#   ./r2.sh get <chave> <arquivo-local>
#   ./r2.sh cp  <chave-origem> <chave-destino>     (cópia dentro do balde, sem passar pela máquina)
# Credenciais: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT no ambiente, ou R2_CRED_FILE apontando
# para um arquivo de 3 linhas (access key id, secret, endpoint). Balde: R2_BUCKET (obrigatório).
# O segredo vai para o curl pela entrada padrão (-K -), nunca pela linha de comando; nada é impresso.
set -eu
if [ -n "${R2_CRED_FILE:-}" ]; then
  R2_ACCESS_KEY_ID=$(sed -n 1p "$R2_CRED_FILE"); R2_SECRET_ACCESS_KEY=$(sed -n 2p "$R2_CRED_FILE"); R2_ENDPOINT=$(sed -n 3p "$R2_CRED_FILE")
fi
: "${R2_ACCESS_KEY_ID:?defina R2_ACCESS_KEY_ID ou R2_CRED_FILE}" "${R2_SECRET_ACCESS_KEY:?}" "${R2_ENDPOINT:?}" "${R2_BUCKET:?defina R2_BUCKET}"
op=${1:?put|get}
case "$op" in put) local_=${2:?arquivo}; chave=${3:?chave} ;; get) chave=${2:?chave}; local_=${3:?arquivo} ;; cp) origem=${2:?origem}; chave=${3:?destino} ;; *) echo "uso: r2.sh put|get|cp ..." >&2; exit 2 ;; esac
for c in "$chave" ${origem:+"$origem"}; do
  printf '%s' "$c" | grep -Eq '^[A-Za-z0-9._/-]+$' && ! printf '%s' "$c" | grep -q '\.\.' || { echo "chave inválida" >&2; exit 2; }
done
url="${R2_ENDPOINT%/}/$R2_BUCKET/$chave"
cfg() { printf 'user = "%s:%s"\n' "$R2_ACCESS_KEY_ID" "$R2_SECRET_ACCESS_KEY"; }
if [ "$op" = cp ]; then
  cod=$(cfg | curl -sS -K - --aws-sigv4 "aws:amz:auto:s3" -o /dev/null -w '%{http_code}' -X PUT -H "x-amz-copy-source: /$R2_BUCKET/$origem" -H 'content-length: 0' "$url")
elif [ "$op" = put ]; then
  cod=$(cfg | curl -sS -K - --aws-sigv4 "aws:amz:auto:s3" -o /dev/null -w '%{http_code}' -T "$local_" "$url")
else
  mkdir -p "$(dirname "$local_")"
  cod=$(cfg | curl -sS -K - --aws-sigv4 "aws:amz:auto:s3" -o "$local_.parcial" -w '%{http_code}' "$url")
  if [ "$cod" = 200 ]; then mv "$local_.parcial" "$local_"; else rm -f "$local_.parcial"; fi
fi
[ "$cod" = 200 ] || { echo "R2 $op falhou (http $cod)" >&2; exit 1; }
