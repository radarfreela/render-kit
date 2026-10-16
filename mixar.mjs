// Mixa a trilha, o fundo e os efeitos de um molde (sons.json) e junta ao vídeo, sem regravar a imagem.
//   node mixar.mjs --molde molde --audio audio --video saida/x.mp4 --saida saida/x-som.mp4
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const arg = (n, p) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : p; };
const MOLDE = path.resolve(arg('--molde', 'molde'));
const AUDIO = path.resolve(arg('--audio', 'audio'));
const VIDEO = arg('--video'), SAIDA = arg('--saida');
const S = JSON.parse(fs.readFileSync(path.join(MOLDE, 'sons.json'), 'utf8'));
const D = S.duracao;

const entradas = [], filtros = [], rotulos = [];
const add = (arquivo, cadeia) => {
  const i = entradas.length / 2 + 1;              // 0 = vídeo
  entradas.push('-i', path.join(AUDIO, arquivo));
  filtros.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,${cadeia}[a${i}]`);
  rotulos.push(`[a${i}]`);
};
const tr = S.trilha;
if (tr && tr.volume > 0) add(tr.arquivo, `atrim=start=${tr.inicio}:duration=${D},asetpts=PTS-STARTPTS,volume=${tr.volume},afade=t=in:d=${tr.entrada},afade=t=out:st=${D - tr.saida}:d=${tr.saida}`);
for (const n of S.narracao || []) add(n.arquivo, `volume=${n.vol ?? 1},adelay=${Math.round(n.t * 1000)}:all=1`);
for (const f of S.fundo) {
  const dur = f.ate - f.de;
  add(f.arquivo, `atrim=start=${f.inicio || 0}:duration=${dur},asetpts=PTS-STARTPTS,volume=${f.volume},afade=t=in:d=1,afade=t=out:st=${dur - 1.2}:d=1.2,adelay=${Math.round(f.de * 1000)}:all=1`);
}
for (const e of S.eventos) {
  const corte = e.inicio != null ? `atrim=start=${e.inicio}:duration=${e.dur},asetpts=PTS-STARTPTS,afade=t=out:st=${e.dur - 0.8}:d=0.8,` : '';
  add(e.som, `${corte}volume=${e.vol},adelay=${Math.round(e.t * 1000)}:all=1`);
}
filtros.push(`${rotulos.join('')}amix=inputs=${rotulos.length}:normalize=0:duration=longest,atrim=duration=${D},loudnorm=I=-14:TP=-1.5:LRA=11[mix]`);
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', VIDEO, ...entradas, '-filter_complex', filtros.join(';'),
  '-map', '0:v', '-map', '[mix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', SAIDA], { stdio: 'inherit' });
console.log('pronto:', SAIDA, `(${S.eventos.length} efeitos)`);
