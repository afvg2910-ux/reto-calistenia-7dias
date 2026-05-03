/**
 * Genera 7 videos del reto de calistenia usando FFmpeg.
 * Cada video: 1080x1920, 20 segundos, con audio TTS y overlay de texto.
 *
 * Prerequisitos:
 *   - ffmpeg en PATH
 *   - audio/dia_01.mp3 … dia_07.mp3 (generados por generate_audio.py)
 *   - backgrounds/bg_day.png (o se usa color sólido si no existe)
 */

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const BASE    = path.join(__dirname, '..');
const W = 1080, H = 1920, FPS = 30, DUR = 20;
const FONT    = 'Arial';
const OUT_DIR = path.join(BASE, 'videos');
const TMP_DIR = path.join(BASE, '.tmp');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

const items = JSON.parse(fs.readFileSync(path.join(BASE, 'data/content.json'), 'utf8'));

// Colores por día (rotación)
const PALETTE = [
  { bg: '0x0a0a0a', accent: '0xFF6B00', hook: 'white' },   // 1 naranja
  { bg: '0x050510', accent: '0x00C8FF', hook: 'white' },   // 2 azul
  { bg: '0x0a0a0a', accent: '0x00FF88', hook: 'white' },   // 3 verde
  { bg: '0x10050a', accent: '0xFF2255', hook: 'white' },   // 4 rojo
  { bg: '0x05100a', accent: '0xFFDD00', hook: 'white' },   // 5 amarillo
  { bg: '0x050505', accent: '0xBB44FF', hook: 'white' },   // 6 morado
  { bg: '0x0a0500', accent: '0xFF6B00', hook: '0xFFDD00' },// 7 dorado
];

function sanitize(text) {
  return text
    .replace(/[ÁÀÂÄ]/g, 'A').replace(/[áàâä]/g, 'a')
    .replace(/[ÉÈÊË]/g, 'E').replace(/[éèêë]/g, 'e')
    .replace(/[ÍÌÎÏ]/g, 'I').replace(/[íìîï]/g, 'i')
    .replace(/[ÓÒÔÖ]/g, 'O').replace(/[óòôö]/g, 'o')
    .replace(/[ÚÙÛÜ]/g, 'U').replace(/[úùûü]/g, 'u')
    .replace(/[Ññ]/g, 'N').replace(/[ñ]/g, 'n')
    .replace(/[¿¡""''·]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

function writeTmp(name, text) {
  const rel = `.tmp/${name}`;
  fs.writeFileSync(path.join(BASE, rel), sanitize(text), 'utf8');
  return rel;
}

function fade(start, dur = 0.5) {
  return `alpha='if(lt(t,${start}),0,if(lt(t,${start + dur}),(t-${start})/${dur},1))'`;
}

function buildFilterComplex(item, col, files) {
  const { hookF, dayF, titleF, subF, setsF, tipF, ctaF } = files;
  const accentHex = col.accent.replace('0x', '#');

  // Posiciones Y
  const HOOK_Y   = 160;
  const DAY_Y    = 320;
  const TITLE_Y  = 500;
  const LINE_Y   = 700;
  const SETS_Y   = 870;
  const TIP_Y    = 1020;
  const CTA_BOX  = 1750;
  const CTA_TXT  = 1780;
  const CTA_W    = 960;
  const CTA_X1   = (W - CTA_W) / 2;

  return [
    // Grain
    `noise=alls=60:allf=t+u`,
    // Vignette
    `vignette=PI/4:eval=frame`,

    // HOOK
    `drawtext=textfile=${hookF}:font=${FONT}:fontsize=70:fontcolor=${col.hook}:x=(w-text_w)/2:y=${HOOK_Y}:expansion=none:borderw=2:bordercolor=black@0.6:${fade(0, 0.4)}`,

    // Número de día
    `drawtext=textfile=${dayF}:font=${FONT}:fontsize=48:fontcolor=${col.accent}:x=(w-text_w)/2:y=${DAY_Y}:expansion=none:${fade(0.3, 0.4)}`,

    // Separador
    `drawbox=x=80:y=${DAY_Y + 70}:w=${W - 160}:h=3:color=${col.accent}@0.9:t=fill:enable='gte(t,0.5)'`,

    // Ejercicio
    `drawtext=textfile=${titleF}:font=${FONT}:fontsize=110:fontcolor=white:x=(w-text_w)/2:y=${TITLE_Y}:expansion=none:borderw=3:bordercolor=black@0.5:${fade(0.7, 0.5)}`,

    // Subtítulo
    `drawtext=textfile=${subF}:font=${FONT}:fontsize=52:fontcolor=${col.accent}:x=(w-text_w)/2:y=${LINE_Y}:expansion=none:${fade(1.0, 0.4)}`,

    // Series/reps (grande)
    `drawtext=textfile=${setsF}:font=${FONT}:fontsize=76:fontcolor=white:x=(w-text_w)/2:y=${SETS_Y}:expansion=none:shadowcolor=black@0.7:shadowx=3:shadowy=3:${fade(1.5, 0.4)}`,

    // Tip
    `drawtext=textfile=${tipF}:font=${FONT}:fontsize=50:fontcolor=gray@0.9:x=(w-text_w)/2:y=${TIP_Y}:expansion=none:${fade(2.0, 0.4)}`,

    // CTA box
    `drawbox=x=${CTA_X1}:y=${CTA_BOX}:w=${CTA_W}:h=110:color=${col.accent}@0.95:t=fill:enable='gte(t,6)'`,
    `drawtext=textfile=${ctaF}:font=${FONT}:fontsize=52:fontcolor=black:x=(w-text_w)/2:y=${CTA_TXT + 5}:expansion=none:${fade(6, 0.4)}`,
  ].join(',');
}

let ok = 0, fail = 0;

for (const item of items) {
  const id  = String(item.day).padStart(2, '0');
  const col = PALETTE[(item.day - 1) % PALETTE.length];

  const hookF  = writeTmp(`hook_${id}.txt`,  item.hook);
  const dayF   = writeTmp(`day_${id}.txt`,   `DIA ${item.day} DE 7`);
  const titleF = writeTmp(`title_${id}.txt`, item.title);
  const subF   = writeTmp(`sub_${id}.txt`,   item.subtitle);
  const setsF  = writeTmp(`sets_${id}.txt`,  item.sets);
  const tipF   = writeTmp(`tip_${id}.txt`,   item.tip);
  const ctaF   = writeTmp(`cta_${id}.txt`,   item.cta);

  const audioFile = path.join(BASE, `audio/dia_${id}.mp3`);
  const outFile   = path.join(OUT_DIR, `dia_${id}.mp4`);
  const bgFile    = path.join(BASE, `backgrounds/bg_day${item.day}.png`);
  const hasBg     = fs.existsSync(bgFile);
  const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).status === 0;

  if (!hasFfmpeg) {
    console.error('ERROR: ffmpeg no encontrado en PATH');
    process.exit(1);
  }

  const vf = buildFilterComplex(item, col, { hookF, dayF, titleF, subF, setsF, tipF, ctaF });

  // Build ffmpeg args
  const args = ['-y'];

  if (hasBg) {
    args.push('-loop', '1', '-i', bgFile);
  } else {
    // Fondo sólido generado con lavfi
    args.push(
      '-f', 'lavfi',
      '-i', `color=c=${col.bg.replace('0x', '')}:size=${W}x${H}:rate=${FPS}`
    );
  }

  const hasAudio = fs.existsSync(audioFile);
  if (hasAudio) {
    args.push('-i', audioFile);
  }

  args.push('-t', String(DUR));
  args.push('-vf', vf);
  args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '26');
  args.push('-maxrate', '8M', '-bufsize', '16M');

  if (hasAudio) {
    args.push('-c:a', 'aac', '-b:a', '128k', '-shortest');
  }

  args.push(outFile);

  const result = spawnSync('ffmpeg', args, { encoding: 'utf8', timeout: 300000, cwd: BASE });

  if (result.status === 0) {
    const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
    const audioLabel = hasAudio ? '+audio' : 'sin audio';
    console.log(`OK  Día ${item.day} → dia_${id}.mp4  (${kb} KB) [${audioLabel}]`);
    ok++;
  } else {
    const errLines = (result.stderr || '').split('\n')
      .filter(l => /Error|Invalid|No such|Cannot|failed/i.test(l))
      .slice(0, 4).join('\n');
    console.error(`ERR Día ${item.day}:\n${errLines}`);
    fail++;
  }

  [hookF, dayF, titleF, subF, setsF, tipF, ctaF].forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });
}

console.log(`\n${ok}/7 generados | ${fail} errores`);
