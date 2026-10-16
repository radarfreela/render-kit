# blocos — biblioteca de cenas para moldes do render-kit

Blocos genéricos (sem marca, sem nicho) para montar vídeos verticais 1080x1920 a partir de um roteiro
de cenas (`video.json`) e dos tempos das palavras da voz. Tudo é determinístico: `render(t)` depende só
de `t`, então qualquer intervalo de quadros pode ser gravado sozinho (é o que o `gravar-paralelo.yml` faz).

    node compor.mjs video.json --palavras palavras.json --pacote <pasta> --saida molde/
    node compor.mjs video.json --texto            # texto corrido da narração (uma tomada)

O `compor.mjs` gera `molde/` com `video.html`, `blocos.js` (estes arquivos concatenados), `dados.js`
(`window.VIDEO`) e `sons.json`. Um pacote (`--pacote`) é uma pasta com `pacote.json` (`tema`, `presets`,
`pronuncia`, `vars`) e, opcionalmente, `contas.mjs` (números conferidos por código) e arquivos (logo etc.).

## Tempo

Todo campo de tempo aceita: número; nome de marca (`"s2"`); expressão (`"max(s4 + .65, hl0 + .5)"`);
palavra da voz (`"@volta"` = início da palavra "volta" na fala onde está escrito; `"@3:casa#1"` = 2ª
ocorrência de "casa" na fala 3). Em expressões: marcas, `f[i].ini`, `f[i].fim`, `ini`/`fim` (fala da
marca), `max`, `min`, `abs`, `DUR`, `w(i,'palavra',n)`. Marcas são preguiçosas (ordem não importa).
`"$a.b"` (string inteira) vira o valor de `vars.a.b` (contas do pacote + `vars` do vídeo).

## Formato do video.json

```json
{
  "voz": {"arquivo": "voz.wav", "t0": 0.45, "pronuncia": {"XYZ": "xis ípsilon zê"}},
  "duracao": "logo + 2.9",
  "tema": {"az": "#236bff"},
  "contas": {"...": "entrada do contas.mjs do pacote"},
  "arquivos": ["pacote:logo.png"],
  "estados": [{"id": "partida", "bloco": "partida", "apito": "kick", "gols": {"c": ["g1"], "f": []}}],
  "falas": [
    {"texto": "Começa o jogo.^b",
     "marcas": {"kick": "ini"},
     "cenas": [{"id": "campo", "bloco": "campo", "pos": [[0, {"x": 540, "y": 850, "o": 0}], ["kick", {"o": 1}, 0.55]]}],
     "sons": [["apito.wav", "kick", 0.2, 0, 0.9]]},
    {"texto": "O time da casa^b | abre dois a zero.^b",
     "marcas": {"g1": "max(@casa, kick + 1.2)", "g2": "@zero + .2"},
     "tremor": [["g1", 8]], "explosoes": [["g1", 880, 860, "azc", 26, 380, 71]]}
  ],
  "fundo": {"brilhos": [{"x": 540, "y": 860, "r": 820, "cor": "vd", "a": 0.22, "janelas": [["g1", 0.5, "g2", 0.6]]}]},
  "camera": {"zoom": [{"de": 0, "dur": "s2", "amp": 0.03, "ate": "s2"}], "flash": [["g1", 0.12]], "rebobinar": []},
  "efeitos": {"explosoes": [], "ondas": []},
  "sons": [{"som": "tique.ogg", "de": "s11", "ate": "achou", "passo": 0.5, "vol": 0.12}],
  "ordem": ["legenda", "campo"]
}
```

- `texto`: a legenda; `|` separa pedaços (cada pedaço ocupa a tela sozinho); `palavra^b` pinta a palavra
  com a cor `b` da legenda (`b g r a w`, configuráveis).
- `cenas`: atores que entram nessa frase (a cena literal da frase). `preset` puxa parâmetros do pacote;
  o que estiver no ator sobrescreve. Um ator vive o vídeo todo (continuidade): sua `pos` é uma trilha
  de quadros-chave `[tempo, {x,y,s,o,b,r}, duração, easing]` que pode citar marcas de frases futuras.
- `ordem`: ordem de empilhamento (o primeiro fica embaixo). Sem `ordem`, vale a ordem de declaração.
- `sons`: `[arquivo, tempo, volume, inicio?, dur?]`, ou objeto; com `de/ate/passo` repete.

## Blocos (`bloco` → parâmetros)

| bloco | o que faz | parâmetros principais |
|---|---|---|
| `legenda` | frase montando palavra a palavra no tempo da voz | `topo`, `fimUltima`, `cores` |
| `explode` | letras grandes chegando de todos os lados | `linhas`, `y`, `em`, `atrasos`, `sai`, `cor`, `tamanho` |
| `contador` | número animado de A a B | `x`, `y`, `de`, `para`, `em`, `dur`, `ease`, `prefixo`, `sufixo`, `casas` |
| `cartao` | comprovante: cabeçalho, nome, etiqueta, valor, ✓/✕, carimbo | `pos`, `cab`, `corCab`, `nome`, `etiqueta`, `rotulo`, `valor`, `fim`, `selo`, `estado{inicial,preenche,paga,perde,carimba}`, `pulsos` |
| `selo` | carimbo avulso | `texto`, `x`, `y`, `em`, `sai`, `cor`, `angulo` |
| `contorno` | lugar vazio tracejado | `x`, `y`, `s`, `cor`, `aparece`, `some`, `ate` |
| `voo` | ficha voando de uma célula/ponto até um ator | `de{ator,celula}`, `para{ator,em}`, `inicio`, `dur`, `texto`, `cor`, `alfa` |
| `resultado` | cartão de desfecho com mini colunas ✓/✕ e valor | `x`, `y`, `titulo`, `forte`, `colunas`, `st`, `valor{prefixo,para,em,dur,ease}`, `sub`, `entra`, `sai`, `recua`, `pulso`, `borda` |
| `carteira` | rótulo + valor que muda por fases | `pos`, `prefixo`, `fases[{ate,em,dur,de,para,rotulos,cores}]`, `brilho` |
| `balanca` | balança que pende e inverte | `pos`, `esquerda{rotulo,cor,moeda,em}`, `direita{...}`, `inclina` |
| `partida` (estado) | placar/minuto/rebobinar do mesmo jogo | `inicial`, `rebobinar{de,ate,seq,minuto}`, `apito`, `gols{c,f}`, `minutos`, `fim` |
| `placar` | placar com dígitos virando e status | `pos`, `estado`, `casa{nome,cor}`, `fora{...}`, `textos` |
| `campo` | campo visto de cima, jogadores, bola, gols | `pos`, `lances[{t,de,gol}]`, `cores` |
| `aparelho` | moldura genérica (sem marca) de `celular` 400x820, `tablet` 600x800 (3:4) ou `computador` 960x606 (tela 16:10 + base), com barra de status, mini placar, notificações e conteúdo livre | `formato`, `pos`, `hora`, `placar`, `notificacoes[{topo,titulo,sub,icone,fases,brilho}]`, `tela` (html) |
| `celular` | o mesmo que `aparelho` com `formato: 'celular'` (compatível com moldes antigos) | idem |
| `tabela` | linhas x colunas; `destaque` acende o maior valor de cada coluna (conferido); `busca` faz os números procurarem até uma linha travar | `pos`, `modo`, `colunas`, `linhas`, `etiquetas`, `destaque`, `melhor`, `pulsoLogo`, `centro`, `acha`, `em`, `logo`, `titulo` |
| `relogio` | relógio girando (tempo correndo) | `x`, `y`, `de`, `ate`, `cor` |
| `final` | logo + endereço sendo digitado + texto legal | `logo`, `logoLargura`, `em`, `url`, `sufixo`, `urlEm`, `legal` |
| `rodape` | aviso fixo no rodapé | `texto`, `y`, `de`, `ate` |

Núcleo (`nucleo.js`): `RK.u` (easing `oc ob io oe lin`, `P`, `lerp`, `milhar`, `rnd`), `RK.trilha`, `RK.ent`,
`RK.S`/`RK.SC`, `RK.criarTema`, `RK.fundo` (brilhos com janelas + partículas + explosões + ondas),
`RK.camera` (respiração, zoom, tremor, flash, rebobinar) e `RK.montar(VIDEO)`.

Bloco novo: `RK.blocos.nome = (ctx, p, id) => ({ render(t) {...} })`. `ctx.t(expr)` resolve tempo,
`ctx.el(html)` cria elemento na câmera, `ctx.cor/ctx.A/ctx.rgba` resolvem tokens do tema,
`ctx.estados[id]` e `ctx.atores[id]` dão acesso a outros blocos. Nada de estado entre quadros.
