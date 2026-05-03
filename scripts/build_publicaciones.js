/**
 * Genera publicaciones/ con descripcion especifica por red social y dia,
 * imagen preview/thumbnail, y video listo para publicar.
 */

const fs   = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const PUB  = path.join(BASE, 'publicaciones');

function bom(s) { return '﻿' + s; }

function cp(src, dst) {
  if (!fs.existsSync(src)) { console.error(`  FALTA: ${path.basename(src)}`); return false; }
  fs.copyFileSync(src, dst); return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESCRIPCIONES POR PLATAFORMA Y DÍA
// ─────────────────────────────────────────────────────────────────────────────

const TIKTOK = [
`Día 1: Pecho y Tríceps 💪

Reto GRATIS de 7 días sin equipamiento.
15 minutos por día.

Vamos?

Únete → https://reto-calistenia.netlify.app

#calistenia #fitness #reto #retofitness #ejercicio #sinequipamiento #flexiones #musculo #motivacion #fitnesschallenge`,

`Día 2: Espalda y Bíceps 💪

Continúa tu reto calistenia.
Sin equipamiento, 15 minutos.

Únete → https://reto-calistenia.netlify.app

#calistenia #fitness #reto #espalda #biceps #ejercicio #challenge`,

`Día 3: Piernas y Glúteos 🔥

Entra en calor con este día.
15 minutos de entrenamiento puro.

Únete → https://reto-calistenia.netlify.app

#calistenia #piernas #gluteos #fitness #reto #ejercicio`,

`Día 4: Hombros y Core 💪

Mitad del reto completado!
Continúa sin parar.

Únete → https://reto-calistenia.netlify.app

#calistenia #hombros #core #fitness #reto #abdominales`,

`Día 5: Full Body Cardio 🔥

Quema calorías hoy.
Cardio intenso, 15 minutos.

Únete → https://reto-calistenia.netlify.app

#calistenia #cardio #quemacalorias #fitness #reto #intenso`,

`Día 6: Consolidación 💪

Casi llegamos al final!
Repasa todo lo aprendido.

Únete → https://reto-calistenia.netlify.app

#calistenia #fitness #reto #ejercicio #ultimodia`,

`Día 7: Descanso Activo 🌟

¡LO LOGRASTE! 🎉

Completaste el reto de 7 días.
Ahora accede a contenido avanzado.

Únete → https://reto-calistenia.netlify.app

#calistenia #fitness #reto #logro #felicidades`,
];

const INSTAGRAM = [
`Día 1: Pecho y Tríceps 💪

¿Listo para el reto?

7 días sin equipamiento.
15 minutos por día.
Resultados reales.

Swipea para ver los ejercicios 👉

Únete al reto completo → link en bio

#calistenia #fitness #retofitness #ejercicio #pecho #triceps #sinequipamiento #motivacion #fitnesschallenge #retocalistenia`,

`Día 2: Espalda y Bíceps 💪

Continúa tu transformación.

Sin equipamiento, solo tu peso.
15 minutos de puro trabajo.

Swipea para ver la técnica 👉

Únete → link en bio

#calistenia #fitness #espalda #biceps #ejercicio #challenge #retofitness #motivation`,

`Día 3: Piernas y Glúteos 🔥

Siéntelo en las piernas.

Trabajo intenso de glúteos y cuádriceps.
15 minutos sin parar.

Swipea para ver la rutina 👉

Únete → link en bio

#calistenia #piernas #gluteos #fitness #exercise #challenge #motivation`,

`Día 4: Hombros y Core 💪

¡Mitad del reto!

Hombros fuertes y core definido.
Cada repetición te acerca a tu objetivo.

Swipea para la técnica 👉

Únete → link en bio

#calistenia #hombros #core #abdominales #fitness #exercise #challenge`,

`Día 5: Full Body Cardio 🔥

¡Quema calorías hoy!

Cardio intenso con calistenia.
15 minutos de máxima intensidad.

Swipea para ver los ejercicios 👉

Únete → link en bio

#cardio #fitness #quemacalorias #exercise #challenge #motivation #calistenia`,

`Día 6: Consolidación 💪

¡Ya casi! Último esfuerzo.

Repasa lo mejor de estos 6 días.
Consolida tus ganancias.

Swipea para el entrenamiento 👉

Únete → link en bio

#calistenia #fitness #exercise #motivation #challenge #ultimodia`,

`Día 7: Descanso Activo 🌟

¡LO LOGRASTE! 🎉

7 días de dedicación completados.
Tu cuerpo cambió. Tu mente cambió.

Descanso activo y reflexión.

Únete a nuestro programa PRO → link en bio

#calistenia #fitness #logro #transformacion #reto #celebration #motivation`,
];

const YOUTUBE = [
`Día 1: Pecho y Tríceps | Reto Calistenia 7 Días GRATIS ✅

15 minutos sin equipamiento.
Aprende la técnica correcta.

En este video aprenderás:
✅ Flexiones básicas
✅ Técnica correcta
✅ Variaciones para principiantes
✅ Cómo progresar

Únete al reto completo y recibe:
✅ PDF con 7 días de rutina completa
✅ Plan nutricional personalizado
✅ Videos día a día
✅ Motivación y soporte diario

👉 Regístrate GRATIS aquí: https://reto-calistenia.netlify.app

📱 Sigue para más contenido de calistenia
🔔 Activa notificaciones para no perderte nada

#calistenia #fitness #shorts #ejercicio #retofitness #sinequipamiento #flexiones #tutorial #entrenamiento`,

`Día 2: Espalda y Bíceps | Reto Calistenia 7 Días GRATIS ✅

Técnica correcta para dominadas y remo.

En este video aprenderás:
✅ Remo invertido
✅ Superman holds
✅ Variaciones de espalda
✅ Cómo aumentar fuerza

Únete al reto completo → https://reto-calistenia.netlify.app

#calistenia #fitness #shorts #espalda #biceps #ejercicio #retofitness`,

`Día 3: Piernas y Glúteos | Reto Calistenia 7 Días GRATIS ✅

Entrena piernas sin equipamiento.

En este video aprenderás:
✅ Sentadillas correctas
✅ Estocadas efectivas
✅ Puentes de glúteos
✅ Cómo aumentar resistencia

Únete al reto completo → https://reto-calistenia.netlify.app

#calistenia #fitness #shorts #piernas #gluteos #ejercicio #retofitness`,

`Día 4: Hombros y Core | Reto Calistenia 7 Días GRATIS ✅

Hombros fuertes y core definido.

En este video aprenderás:
✅ Flexiones Pike
✅ Planchas con rotación
✅ Core exercises
✅ Técnica de movimiento

Únete al reto completo → https://reto-calistenia.netlify.app

#calistenia #fitness #shorts #hombros #core #abdominales #retofitness`,

`Día 5: Full Body Cardio | Reto Calistenia 7 Días GRATIS 🔥

Quema calorías en 15 minutos.

En este video aprenderás:
✅ Burpees efectivos
✅ Mountain climbers
✅ Jumping jacks
✅ Cómo mantener ritmo cardíaco alto

Únete al reto completo → https://reto-calistenia.netlify.app

#cardio #fitness #shorts #quemacalorias #ejercicio #retofitness #intenso`,

`Día 6: Consolidación | Reto Calistenia 7 Días GRATIS ✅

Repasa y consolida tus ganancias.

En este video:
✅ Mezcla de todo lo aprendido
✅ Aumenta intensidad
✅ Siente tus avances
✅ Prepárate para el final

Únete al reto completo → https://reto-calistenia.netlify.app

#calistenia #fitness #shorts #exercise #retofitness`,

`Día 7: Descanso Activo | ¡LO LOGRASTE! 🎉 Reto Calistenia 7 Días GRATIS

¡Felicidades! Completaste el reto.

Tu cuerpo cambió en 7 días:
✅ Más fuerza
✅ Más resistencia
✅ Mejor técnica
✅ Más confianza

Ahora accede a:
✅ KALIS Pro (app de entrenamiento avanzado)
✅ Programas de 12 semanas
✅ Planes de nutrición
✅ Comunidad privada

👉 Continúa tu transformación → https://reto-calistenia.netlify.app

🎊 ¡Gracias por completar el reto!
📱 Sigue para más contenido
🔔 Activa notificaciones

#calistenia #fitness #logro #transformacion #retofitness #congratulations`,
];

// ─────────────────────────────────────────────────────────────────────────────
// GENERACIÓN
// ─────────────────────────────────────────────────────────────────────────────

if (fs.existsSync(PUB)) fs.rmSync(PUB, { recursive: true });

let ok = 0;

for (let i = 0; i < 7; i++) {
  const n   = i + 1;
  const id  = String(n).padStart(2, '0');
  const src = path.join(BASE, 'videos', `dia_${id}_shorts.mp4`);
  const img = path.join(BASE, 'images', `dia_${id}_img_1.jpg`);

  if (!fs.existsSync(src)) { console.error(`FALTA video dia_${id}`); continue; }

  const mb = (fs.statSync(src).size / (1024 * 1024)).toFixed(1);
  console.log(`\nDia ${n}  (${mb} MB)`);

  // TikTok
  const ttDir = path.join(PUB, 'tiktok', `dia_${id}`);
  fs.mkdirSync(ttDir, { recursive: true });
  fs.writeFileSync(path.join(ttDir, 'descripcion.txt'), bom(TIKTOK[i]), 'utf8');
  cp(img, path.join(ttDir, 'preview.jpg'));
  cp(src, path.join(ttDir, 'carrusel.mp4'));
  console.log('  tiktok/     descripcion.txt + preview.jpg + carrusel.mp4');

  // Instagram
  const igDir = path.join(PUB, 'instagram', `dia_${id}`);
  fs.mkdirSync(igDir, { recursive: true });
  fs.writeFileSync(path.join(igDir, 'descripcion.txt'), bom(INSTAGRAM[i]), 'utf8');
  cp(img, path.join(igDir, 'preview.jpg'));
  cp(src, path.join(igDir, 'carrusel.mp4'));
  console.log('  instagram/  descripcion.txt + preview.jpg + carrusel.mp4');

  // YouTube Shorts
  const ytDir = path.join(PUB, 'youtube_shorts', `dia_${id}`);
  fs.mkdirSync(ytDir, { recursive: true });
  fs.writeFileSync(path.join(ytDir, 'descripcion.txt'), bom(YOUTUBE[i]), 'utf8');
  cp(img, path.join(ytDir, 'thumbnail.jpg'));
  cp(src, path.join(ytDir, 'video.mp4'));
  console.log('  yt_shorts/  descripcion.txt + thumbnail.jpg + video.mp4');

  ok++;
}

console.log(`\n✅ ${ok}/7 dias procesados → publicaciones/`);
