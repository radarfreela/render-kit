# render-kit

Motor para gravar moldes HTML animados em MP4 na nuvem (GitHub Actions). O conteúdo (moldes, áudios,
textos, configs) não fica neste repositório: fica num balde R2 privado, e cada workflow baixa só o que
precisa, renderiza e devolve o resultado ao mesmo balde em `saida/<run_id>/`. Nenhum workflow publica
artefato nem imprime conteúdo no log.

## Peças

- `gravar.mjs` — abre o molde num Chrome headless, avança quadro a quadro pelo seek síncrono e monta o MP4.
- `mixar.mjs` — junta narração, trilha, fundo e efeitos (`sons.json` do molde) ao vídeo.
- `versoes.py` — gera as versões de gancho de um criativo (`cfg.js` + `sons.json` por versão) a partir de um config JSON.
- `vozes_gemini.py` — narração por Gemini TTS a partir de um config/textos JSON. `voz_kokoro.py` — amostras com Kokoro.
- `palavras.py` — tempo de cada palavra das narrações (faster-whisper).
- `revisar.py` — checagens medidas de um MP4 pronto + folha de quadros. `conferir-camera.cjs` — confere enquadramento.
- `r2.sh` — put/get no R2 só com curl. `fazer.sh` — sobe os insumos de um molde e dispara o `gravar`.

## Molde

Pasta com `video.html` (o HTML de cada molde é conteúdo e fica no R2; este repo só tem o motor) (expõe `[data-om-sync-seek]` ou `window.render(t)` + `window.DUR`, palco 1080x1920),
`sons.json` e os arquivos que o HTML usa. Os áudios citados no `sons.json` ficam numa pasta `audio/` à parte.

## Layout no R2

    <projeto>/molde/...     molde (subpasta configurável pelo input `molde`)
    <projeto>/audio/...     áudios citados no sons.json (input `audio`)
    saida/<run_id>/...      tudo o que os workflows produzem

Use um `projeto` neutro (o `fazer.sh` usa `jobs/<id aleatório>`): os inputs ficam visíveis no repo público.

## Disparar

    gh workflow run gravar.yml    -R radarfreela/render-kit -f projeto=jobs/<id> -f nome=video
    gh workflow run formato45.yml -R radarfreela/render-kit -f runs="<run_id> <run_id>"
    gh workflow run palavras.yml  -R radarfreela/render-kit -f projeto=jobs/<id> -f pasta=audio
    gh workflow run vozes.yml     -R radarfreela/render-kit -f projeto=jobs/<id> -f molde=molde

Ou, da pasta do conteúdo: `R2_BUCKET=... R2_CRED_FILE=... ./fazer.sh <pasta-do-molde> <nome>`.

Secrets do repositório: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`.
