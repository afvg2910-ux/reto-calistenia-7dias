/**
 * Genera shorts sincronizados: cada imagen dura exactamente lo que dura su audio.
 * Usa ffprobe para medir cada MP3, luego ffmpeg para ensamblar.
 * Output: videos/dia_XX_shorts.mp4
 */

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const BASE     = path.join(__dirname, '..');
const IMG_DIR  = path.join(BASE, 'images');
const AUD_DIR  = path.join(BASE, 'audio');
const VID_DIR  = path.join(BASE, 'videos');
const TMP_DIR  = path.join(BASE, '.tmp');

fs.mkdirSync(VID_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

function audioDuration(mp3Path) {
  const r = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    mp3Path
  ], { encoding: 'utf8' });
  const d = parseFloat(r.stdout.trim());
  return isNaN(d) ? 3.0 : d;
}

function buildSegment(imgPath, audPath, duration, outPath, fadeIn, fadeOut) {
  const FADE = 0.25;
  const vfParts = [`scale=1080:1920:force_original_aspect_ratio=decrease`,
                   `pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black`];
  if (fadeIn)  vfParts.push(`fade=in:st=0:d=${FADE}`);
  if (fadeOut) vfParts.push(`fade=out:st=${(duration - FADE).toFixed(3)}:d=${FADE}`);

  const args = [
    '-y',
    '-loop', '1', '-i', imgPath,
    '-i', audPath,
    '-t', duration.toFixed(3),
    '-vf', vfParts.join(','),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '22',
    '-c:a', 'aac', '-b:a', '128k',
    '-map', '0:v', '-map', '1:a',
    '-shortest',
    outPath
  ];

  return spawnSync('ffmpeg', args, { encoding: 'utf8', timeout: 120000, cwd: BASE });
}

let ok = 0, fail = 0;

for (let day = 1; day <= 7; day++) {
  const id      = String(day).padStart(2, '0');
  const outFile = path.join(VID_DIR, `dia_${id}_shorts.mp4`);
  const segFiles = [];
  let totalDur = 0;
  let dayOk = true;

  console.log(`\nDía ${day} —`);

  for (let slide = 1; slide <= 4; slide++) {
    const imgPath = path.join(IMG_DIR, `dia_${id}_img_${slide}.jpg`);
    const audPath = path.join(AUD_DIR, `dia_${id}_img_${slide}.mp3`);
    const segOut  = path.join(TMP_DIR, `sync_${id}_s${slide}.mp4`);

    if (!fs.existsSync(imgPath)) { console.error(`  ERR imagen no encontrada: ${imgPath}`); dayOk = false; break; }
    if (!fs.existsSync(audPath)) { console.error(`  ERR audio no encontrado: ${audPath}`);  dayOk = false; break; }

    const dur = audioDuration(audPath);
    totalDur += dur;

    const r = buildSegment(imgPath, audPath, dur,
      segOut,
      slide > 1,
      slide < 4
    );

    if (r.status !== 0) {
      const err = (r.stderr || '').split('\n').filter(l => /error|invalid/i.test(l)).slice(0,3).join(' | ');
      console.error(`  ERR slide ${slide}: ${err}`);
      dayOk = false; break;
    }

    console.log(`  SEG  slide_${slide}  ${dur.toFixed(1)}s`);
    segFiles.push(segOut);
  }

  if (!dayOk) { fail++; continue; }

  // Concat list
  const listFile = path.join(TMP_DIR, `sync_list_${id}.txt`);
  fs.writeFileSync(listFile, segFiles.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));

  const concat = spawnSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    outFile
  ], { encoding: 'utf8', timeout: 120000, cwd: BASE });

  fs.unlinkSync(listFile);
  segFiles.forEach(f => { try { fs.unlinkSync(f); } catch(_) {} });

  if (concat.status === 0) {
    const mb = (fs.statSync(outFile).size / (1024*1024)).toFixed(1);
    console.log(`  OK   dia_${id}_shorts.mp4  ${totalDur.toFixed(1)}s total  (${mb} MB)`);
    ok++;
  } else {
    console.error(`  ERR concat falló`);
    fail++;
  }
}

console.log(`\n${ok}/7 videos | ${fail} errores`);
