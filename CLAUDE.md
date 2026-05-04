# Reto Calistenia 7 Días — Reglas del Proyecto

## Arquitectura

- **Frontend**: `index.html` en Netlify → https://reto-calistenia.netlify.app
- **Backend**: `server.js` en Railway → https://reto-calistenia-7dias-production.up.railway.app
- **Email**: Brevo API (variable `BREVO_API_KEY` en Railway)
- **Subscribers**: `data/subscribers.json` (se resetea en cada deploy de Railway)

## Variables de entorno (Railway)

- `BREVO_API_KEY` — API key de Brevo para envío de emails
- NO usar Gmail/Nodemailer — solo Brevo

## Flujo de emails

1. Usuario se registra en Netlify → POST a Railway `/subscribe`
2. Railway guarda en `subscribers.json` y envía email de bienvenida con imágenes del Día 1
3. Cron diario a las **9am UTC** (5am Colombia) ejecuta `runFunnel()` en `server.js`
4. Cada suscriptor recibe el email del día correspondiente según `registeredAt`
5. Los emails incluyen imágenes desde `https://reto-calistenia.netlify.app/images/`

## Imágenes

- 28 imágenes en `images/dia_XX_img_N.jpg` (7 días × 4 slides)
- Subidas a Netlify junto con `index.html`
- Referenciadas en emails con URL absoluta de Netlify

## Audios y videos

- 28 audios en `audio/dia_XX_img_N.mp3` (generados con edge-tts, voz `es-ES-AlvaroNeural`)
- 7 videos en `videos/dia_XX_shorts.mp4` (FFmpeg, 1080x1920, audio sincronizado por slide)
- Carpeta `publicaciones/` con estructura lista para publicar en TikTok, Instagram y YouTube Shorts

## Publicaciones

- Estructura: `publicaciones/{tiktok,instagram,youtube_shorts}/dia_XX/`
- Cada carpeta: `descripcion.txt` + `carrusel.mp4` o `video.mp4` + `preview.jpg`/`thumbnail.jpg`
- Regenerar con: `node scripts/build_publicaciones.js`
- URL en descripciones: `https://reto-calistenia-7dias-production.up.railway.app`

## Scripts

| Script | Qué hace |
|---|---|
| `python scripts/generate_slide_audio.py` | Genera 28 MP3 con edge-tts |
| `node scripts/generate_synced_shorts.js` | Genera 7 videos sincronizados con audio |
| `node scripts/build_publicaciones.js` | Genera carpeta publicaciones/ |
| `python scripts/download_real_images.py` | Descarga imágenes de Pexels |
| `node server.js` | Arranca servidor Express |

## Git

- Repo backend: https://github.com/afvg2910-ux/reto-calistenia-7dias
- Repo frontend: https://github.com/afvg2910-ux/reto-netlify
- `.gitignore` excluye: `.env`, `node_modules/`, `images/`, `audio/`, `videos/`, `publicaciones/`

## Reglas importantes

- **NO** cambiar el servidor a Gmail — solo Brevo
- **NO** hardcodear `localhost` en `index.html` — siempre usar la URL de Railway
- **NO** subir `.env` a GitHub
- Para resetear subscribers: hacer un commit vacío para triggear redeploy en Railway
- Los emails diarios usan imágenes de Netlify — si Netlify cae, las imágenes no cargan
