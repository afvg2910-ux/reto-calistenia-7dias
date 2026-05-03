"""
Genera audio TTS para cada día del reto usando edge-tts (gratis, voz natural).
Instalar: pip install edge-tts asyncio
Uso: python scripts/generate_audio.py
"""

import asyncio
import json
import os
import sys

try:
    import edge_tts
except ImportError:
    print("Falta edge-tts. Ejecuta: pip install edge-tts")
    sys.exit(1)

VOICE    = "es-ES-AlvaroNeural"   # Voz española masculina natural
CONTENT  = os.path.join(os.path.dirname(__file__), "../data/content.json")
OUT_DIR  = os.path.join(os.path.dirname(__file__), "../audio")

os.makedirs(OUT_DIR, exist_ok=True)

with open(CONTENT, encoding="utf-8") as f:
    days = json.load(f)


async def gen(day: dict):
    day_num  = day["day"]
    text     = day["voiceover"]
    out_file = os.path.join(OUT_DIR, f"dia_{day_num:02d}.mp3")

    if os.path.exists(out_file):
        print(f"  SKIP  dia {day_num} (ya existe)")
        return

    communicate = edge_tts.Communicate(text, VOICE, rate="+5%", volume="+10%")
    await communicate.save(out_file)
    size = os.path.getsize(out_file) // 1024
    print(f"  OK    dia {day_num} -> {os.path.basename(out_file)} ({size} KB)")


async def main():
    print(f"Generando audio con voz: {VOICE}\n")
    tasks = [gen(d) for d in days]
    await asyncio.gather(*tasks)
    print(f"\n{len(days)} archivos listos en /audio")




asyncio.run(main())
