/**
 * Ensambla carruseles de video: 4 slides PNG + audio TTS → MP4 vertical
 * Cada slide se muestra N segundos con fade entre ellos.
 * Output: videos/dia_01_carrusel.mp4 ... dia_07_carrusel.mp4
 *
 * Uso: node scripts/generate_carousel_video.js [--day N]
 */

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const BASE      = path.join(__dirname, '..');
const W = 1080, H = 1920, FPS = 30;
const CAROUSEL  = path.join(BASE, 'carousels');
const AUDIO_DIR = path.join(BASE, 'audio');
const OUT_DIR   = path.join(BASE, 'videos');
const TMP_DIR   = path.join(BASE, '.tmp');

[OUT_DIR, TMP_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

const days = JSON.parse(fs.readFileSync(path.join(BASE, 'data/carousel_content.json'), 'utf8'));

// CLI --day N
const dayArg = process.argv.indexOf('--day');
const onlyDay = dayArg !== -1 ? parseInt(process.argv[dayArg + 1]) : null;
const filtered = onlyDay ? days.filter(d => d.day === onlyDay) : days;

function ffmpeg(args, cwd = BASE) {
  return spawnSync('ffmpeg', args, { encoding: 'utf8', timeout: 600000, cwd });
}

function segmentExists(p) {
  return fs.existsSync(p) && fs.statSync(p).size > 10000;
}

function buildSegment(imgPath, audioPath, outPath, duration, fadeIn, fadeOut) {
  if (segmentExists(outPath)) return true;

  const FADE_D = 0.4;
  const vf = [
    `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:black`,
    fadeIn  ? `fade=in:st=0:d=${FADE_D}` : null,
    fadeOut ? `fade=out:st=${duration - FADE_D}:d=${FADE_D}` : null,
  ].filter(Boolean).join(',');

  const args = ['-y', '-loop', '1', '-i', imgPath];
  const hasAudio = audioPath && fs.existsSync(audioPath);
  if (hasAudio) args.push('-i', audioPath);
  args.push('-t', String(duration), '-vf', vf);
  args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '24');
  if (hasAudio) args.push('-c:a', 'aac', '-b:a', '128k', '-shortest');
  else args.push('-an');
  args.push(outPath);

  const r = ffmpeg(args);
  return r.status === 0;
}

function concatSegments(segPaths, outPath) {
  // Write concat list
  const listFile = path.join(TMP_DIR, `concat_${Date.now()}.txt`);
  const content  = segPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(listFile, content, 'utf8');

  const args = [
    '-y',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '24',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    outPath,
  ];

  const r = ffmpeg(args);
  fs.unlinkSync(listFile);
  return r.status === 0;
}

let ok = 0, fail = 0;

for (const day of filtered) {
  const id      = String(day.day).padStart(2, '0');
  const dayDir  = path.join(CAROUSEL, `dia_${id}`);
  const outFile = path.join(OUT_DIR, `dia_${id}_carrusel.mp4`);

  if (!fs.existsSync(dayDir)) {
    console.error(`ERR Día ${day.day}: carpeta ${dayDir} no existe. Corre primero generate_carousel_images.py`);
    fail++;
    continue;
  }

  console.log(`\nDía ${day.day} —`);
  const segPaths = [];
  let dayOk = true;

  for (let i = 0; i < day.slides.length; i++) {
    const slide     = day.slides[i];
    const slideN    = i + 1;
    const imgPath   = path.join(dayDir, `slide_${slideN}.png`);
    const segOut    = path.join(TMP_DIR, `seg_${id}_s${slideN}.mp4`);

    // Audio: slide 1 = dia_XX.mp3, slide 2-4 = dia_XX_sN.mp3
    const audioKey  = slideN === 1 ? `dia_${id}.mp3` : `dia_${id}_s${slideN}.mp3`;
    const audioPath = path.join(AUDIO_DIR, audioKey);

    if (!fs.existsSync(imgPath)) {
      console.error(`  ERR slide_${slideN}.png no existe`);
      dayOk = false;
      break;
    }

    const hasAudio = fs.existsSync(audioPath);
    const ok_seg   = buildSegment(
      imgPath,
      hasAudio ? audioPath : null,
      segOut,
      slide.duration,
      slideN > 1,         // fadeIn para todos excepto el primero
      slideN < day.slides.length  // fadeOut para todos excepto el último
    );

    if (!ok_seg) {
      console.error(`  ERR al generar segmento slide ${slideN}`);
      dayOk = false;
      break;
    }

    const kb = (fs.statSync(segOut).size / 1024).toFixed(0);
    console.log(`  SEG  slide_${slideN} ${slide.duration}s [${hasAudio ? '+audio' : 'mudo'}] (${kb} KB)`);
    segPaths.push(segOut);
  }

  if (!dayOk) { fail++; continue; }

  // Concatenar
  console.log(`  Concatenando ${segPaths.length} segmentos...`);
  if (concatSegments(segPaths, outFile)) {
    const mb = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(1);
    console.log(`  OK   dia_${id}_carrusel.mp4 (${mb} MB)`);
    ok++;
  } else {
    console.error(`  ERR al concatenar día ${day.day}`);
    fail++;
  }

  // Limpiar segmentos temporales
  segPaths.forEach(p => { try { fs.unlinkSync(p); } catch (_) {} });
}

console.log(`\n${ok}/${filtered.length} carruseles generados | ${fail} errores`);
