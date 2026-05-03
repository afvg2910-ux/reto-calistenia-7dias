"""
Genera 28 audios TTS (4 por día × 7 días) con edge-tts.
Uso: python scripts/generate_slide_audio.py
"""
import asyncio, os, sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("pip install edge-tts"); sys.exit(1)

BASE      = Path(__file__).parent.parent
AUDIO_DIR = BASE / "audio"
AUDIO_DIR.mkdir(exist_ok=True)

VOICE = "es-ES-AlvaroNeural"
RATE  = "+25%"   # ligeramente más rápido para caber en la slide

AUDIOS = {
    # DIA 01 — Flexiones: intro, tecnica, principiante con silla, recuperacion
    "dia_01_img_1": "Dia uno. Pecho y triceps. Tres series de doce flexiones.",
    "dia_01_img_2": "Flexion perfecta: baja lento, sube explosivo. Codos a cuarenta y cinco grados.",
    "dia_01_img_3": "Principiante: apoya las manos en una silla. Misma tecnica, menos peso.",
    "dia_01_img_4": "Despues del entreno: come proteina. Tu musculo crece ahora.",

    # DIA 02 — Piernas: sentadilla, tecnica, zancada, gemelos
    "dia_02_img_1": "Dia dos. Piernas. Cuatro series de quince sentadillas.",
    "dia_02_img_2": "Sentadilla perfecta: baja noventa grados, espalda recta, rodillas afuera.",
    "dia_02_img_3": "Zancada alterna. Doce repeticiones por pierna. Rodilla casi al suelo.",
    "dia_02_img_4": "Gemelos de pie. Veinte repeticiones. Sube en punta, baja controlado.",

    # DIA 03 — Fondos en paralelas: intro, tecnica, banco para principiante, curl de biceps
    "dia_03_img_1": "Dia tres. Fondos en paralelas. Tres series de diez repeticiones.",
    "dia_03_img_2": "Fondo correcto: codos atras, baja noventa grados, sube con fuerza.",
    "dia_03_img_3": "Sin paralelas: usa un banco o silla. Misma posicion, misma intensidad.",
    "dia_03_img_4": "Curl de biceps para terminar. Controla la bajada. Diez repeticiones.",

    # DIA 04 — Core: plancha, plancha lateral, mountain climbers, rueda abdominal
    "dia_04_img_1": "Dia cuatro. Core. Plancha treinta segundos. Cuerpo recto como tabla.",
    "dia_04_img_2": "Plancha lateral. Quince segundos por lado. Cadera arriba, no la dejes caer.",
    "dia_04_img_3": "Mountain climbers. Veinte repeticiones. Rodillas al pecho, rapido.",
    "dia_04_img_4": "Rueda abdominal. Diez repeticiones. El ejercicio mas duro del core.",

    # DIA 05 — Zancadas: intro, zancada frontal, zancada reversa, recuperacion
    "dia_05_img_1": "Dia cinco. Zancadas. Piernas al maximo hoy.",
    "dia_05_img_2": "Zancada frontal: paso largo, rodilla trasera casi toca el suelo.",
    "dia_05_img_3": "Zancada reversa. Doce por pierna. Mas control, menos impacto en rodillas.",
    "dia_05_img_4": "Despues del entreno: hidratate y estira. Tu cuerpo lo necesita.",

    # DIA 06 — Cardio y burpees: bicicleta, tecnica burpee, cuerdas de batalla, completado
    "dia_06_img_1": "Dia seis. Cardio intenso. Veinte minutos en bicicleta a ritmo constante.",
    "dia_06_img_2": "El burpee: cuatro movimientos. Suelo, flexion, salta, repite.",
    "dia_06_img_3": "Version principiante: cuerdas de batalla sin flexion. Igual de intenso.",
    "dia_06_img_4": "Dia seis completado. El mas duro ya cayo. Descansa, manana es el final.",

    # DIA 07 — Circuito final: intro, ejercicios sin descanso, estrategia, celebracion
    "dia_07_img_1": "Dia siete. Reto final. Circuito completo. Sin excusas.",
    "dia_07_img_2": "Seis ejercicios seguidos sin descanso. Al maximo desde el primero.",
    "dia_07_img_3": "Estrategia: un rep a la vez. Respira y aguanta. No te rindas.",
    "dia_07_img_4": "Lo lograste. Siete dias completados. Comparte tu resultado.",
}

async def gen(key, text):
    out = AUDIO_DIR / f"{key}.mp3"
    if out.exists():
        print(f"  SKIP {key}.mp3")
        return
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(out))
    kb = out.stat().st_size // 1024
    print(f"  OK   {key}.mp3  ({kb} KB)")

async def main():
    print(f"Generando {len(AUDIOS)} audios con {VOICE}...\n")
    await asyncio.gather(*[gen(k, v) for k, v in AUDIOS.items()])
    print(f"\n{len(AUDIOS)} audios en audio/")

asyncio.run(main())
