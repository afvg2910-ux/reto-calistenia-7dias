"""
Descarga imágenes reales de Pexels y genera carruseles de video.

Pipeline completo:
  1. Busca y descarga 4 fotos por día desde Pexels
  2. Recorta a 1080x1920 (9:16 vertical)
  3. Añade overlay de texto profesional sobre la foto
  4. Llama a FFmpeg para generar dia_XX_real.mp4 (4×3s = 12s + audio)

Instalar: pip install Pillow requests python-dotenv
Uso:
  python scripts/download_real_images.py            # todos los días
  python scripts/download_real_images.py --day 1    # solo día 1
  python scripts/download_real_images.py --no-video # solo imágenes
"""

import sys, os, json, time, subprocess, textwrap
from pathlib import Path
from io import BytesIO

# ── Deps ──────────────────────────────────────────────────────────────────────
try:
    import requests
except ImportError:
    print("Falta requests. Ejecuta: pip install requests"); sys.exit(1)
try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    print("Falta Pillow. Ejecuta: pip install Pillow"); sys.exit(1)
try:
    from dotenv import load_dotenv
except ImportError:
    print("Falta python-dotenv. Ejecuta: pip install python-dotenv"); sys.exit(1)

BASE = Path(__file__).parent.parent
load_dotenv(BASE / ".env")

PEXELS_KEY = os.getenv("PEXELS_API_KEY")
if not PEXELS_KEY:
    print("ERROR: Falta PEXELS_API_KEY en .env"); sys.exit(1)

W, H       = 1080, 1920
SLIDE_DUR  = 3          # segundos por slide
WATERMARK  = "RETO 7 DÍAS"
VOICE_RATE = "+5%"

# ── CLI ───────────────────────────────────────────────────────────────────────
only_day  = None
no_video  = "--no-video" in sys.argv
if "--day" in sys.argv:
    idx = sys.argv.index("--day")
    only_day = int(sys.argv[idx + 1])

# ── Content ───────────────────────────────────────────────────────────────────
DAYS = [
    {
        "day": 1, "accent": (255, 107, 0),
        "slides": [
            { "query": "man doing push ups exercise",
              "top": "DÍA 1", "mid": "FLEXIONES", "bot": "3 × 10 REPS" },
            { "query": "push up correct form athlete",
              "top": "TÉCNICA", "mid": "CODOS A 45°", "bot": "PECHO AL SUELO" },
            { "query": "incline push up variation workout",
              "top": "VARIACIÓN", "mid": "INCLINADA", "bot": "MÁS FÁCIL • MÁS DIFÍCIL" },
            { "query": "fitness motivation workout success",
              "top": "DÍA 1 ✓", "mid": "¡LO LOGRASTE!", "bot": "COMENTA PLAN" },
        ]
    },
    {
        "day": 2, "accent": (0, 200, 255),
        "slides": [
            { "query": "woman doing squats exercise legs",
              "top": "DÍA 2", "mid": "SENTADILLAS", "bot": "3 × 15 REPS" },
            { "query": "squat correct form knees fitness",
              "top": "TÉCNICA", "mid": "RODILLAS ALINEADAS", "bot": "BAJA PARALELO AL SUELO" },
            { "query": "jump squat explosive legs workout",
              "top": "VARIACIÓN", "mid": "CON SALTO", "bot": "EXPLOSIVIDAD EXTRA" },
            { "query": "leg day workout motivation gym",
              "top": "DÍA 2 ✓", "mid": "¡PIERNAS DE ACERO!", "bot": "COMENTA PLAN" },
        ]
    },
    {
        "day": 3, "accent": (0, 255, 136),
        "slides": [
            { "query": "tricep dips chair exercise arms",
              "top": "DÍA 3", "mid": "FONDOS EN SILLA", "bot": "3 × 12 REPS" },
            { "query": "tricep dips form arms workout",
              "top": "TÉCNICA", "mid": "CODO A 90°", "bot": "ESPALDA CERCA DE LA SILLA" },
            { "query": "bench dips elevated feet workout",
              "top": "VARIACIÓN", "mid": "PIES ELEVADOS", "bot": "NIVEL AVANZADO" },
            { "query": "arms workout motivation fitness success",
              "top": "DÍA 3 ✓", "mid": "¡BRAZOS AL LÍMITE!", "bot": "COMENTA PLAN" },
        ]
    },
    {
        "day": 4, "accent": (255, 34, 85),
        "slides": [
            { "query": "plank exercise core fitness",
              "top": "DÍA 4", "mid": "PLANCHA", "bot": "3 × 45 SEGUNDOS" },
            { "query": "plank correct form body straight",
              "top": "TÉCNICA", "mid": "CUERPO RECTO", "bot": "APRIETA EL ABDOMEN" },
            { "query": "side plank variation core workout",
              "top": "VARIACIÓN", "mid": "PLANCHA LATERAL", "bot": "ESTABILIDAD TOTAL" },
            { "query": "core workout abs motivation strong",
              "top": "DÍA 4 ✓", "mid": "¡CORE DE HIERRO!", "bot": "COMENTA PLAN" },
        ]
    },
    {
        "day": 5, "accent": (255, 221, 0),
        "slides": [
            { "query": "lunges exercise legs workout",
              "top": "DÍA 5", "mid": "ZANCADAS", "bot": "3 × 12 POR PIERNA" },
            { "query": "lunge correct form knee fitness",
              "top": "TÉCNICA", "mid": "RODILLA AL SUELO", "bot": "TORSO ERGUIDO" },
            { "query": "walking lunges workout legs outdoor",
              "top": "VARIACIÓN", "mid": "CAMINANDO", "bot": "EQUILIBRIO FUNCIONAL" },
            { "query": "legs workout success motivation fitness",
              "top": "DÍA 5 ✓", "mid": "¡EQUILIBRIO GANADO!", "bot": "COMENTA PLAN" },
        ]
    },
    {
        "day": 6, "accent": (187, 68, 255),
        "slides": [
            { "query": "burpees exercise cardio intense",
              "top": "DÍA 6", "mid": "BURPEES", "bot": "3 × 8 REPS" },
            { "query": "burpee movement floor jump workout",
              "top": "TÉCNICA", "mid": "4 MOVIMIENTOS", "bot": "SUELO → FLEXIÓN → SALTA" },
            { "query": "hiit workout cardio intense training",
              "top": "VARIACIÓN", "mid": "SIN FLEXIÓN", "bot": "VERSIÓN PRINCIPIANTE" },
            { "query": "intense workout exhausted strong victory",
              "top": "DÍA 6 ✓", "mid": "¡EL MÁS DURO CAÍDO!", "bot": "COMENTA PLAN" },
        ]
    },
    {
        "day": 7, "accent": (255, 221, 0),
        "slides": [
            { "query": "full body circuit workout fitness",
              "top": "DÍA 7", "mid": "RETO FINAL", "bot": "CIRCUITO COMPLETO" },
            { "query": "calisthenics workout complete exercises",
              "top": "EL CIRCUITO", "mid": "6 EJERCICIOS", "bot": "SIN DESCANSO" },
            { "query": "workout challenge push hard finish",
              "top": "ESTRATEGIA", "mid": "UN REP A LA VEZ", "bot": "RESPIRA Y AGUANTA" },
            { "query": "fitness achievement success celebration victory",
              "top": "7 DÍAS ✓", "mid": "¡LO LOGRASTE!", "bot": "COMPARTE TU RESULTADO" },
        ]
    },
]

# ── Font ──────────────────────────────────────────────────────────────────────
def load_font(size, bold=False):
    for path in [
        f"C:/Windows/Fonts/{'arialbd' if bold else 'arial'}.ttf",
        f"C:/Windows/Fonts/{'calibrib' if bold else 'calibri'}.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVu" + ("Sans-Bold" if bold else "Sans") + ".ttf",
    ]:
        if os.path.exists(path):
            try: return ImageFont.truetype(path, size)
            except: pass
    return ImageFont.load_default()

# ── Pexels downloader ─────────────────────────────────────────────────────────
SESSION = requests.Session()
SESSION.headers["Authorization"] = PEXELS_KEY

_used_ids = set()

def pexels_search(query, page=1):
    try:
        r = SESSION.get("https://api.pexels.com/v1/search", params={
            "query": query, "per_page": 15, "page": page,
            "orientation": "portrait", "size": "large"
        }, timeout=15)
        r.raise_for_status()
        return r.json().get("photos", [])
    except Exception as e:
        print(f"  WARN Pexels error: {e}")
        return []

def download_photo(query):
    for page in [1, 2]:
        photos = pexels_search(query, page)
        for p in photos:
            if p["id"] in _used_ids:
                continue
            url = p["src"].get("large2x") or p["src"].get("large") or p["src"]["original"]
            try:
                resp = SESSION.get(url, timeout=30)
                resp.raise_for_status()
                img = Image.open(BytesIO(resp.content)).convert("RGB")
                _used_ids.add(p["id"])
                return img
            except Exception as e:
                print(f"  WARN download error: {e}")
                continue
    return None

# ── Image processing ──────────────────────────────────────────────────────────
def smart_crop(img, target_w=W, target_h=H):
    """Resize to fill then crop center to target dimensions."""
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w = int(src_w * scale)
    new_h = int(src_h * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target_w) // 2
    top  = (new_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))

def make_overlay(w, h, alpha_top=200, alpha_bot=220):
    """Vertical gradient overlay: dark top + dark bottom, transparent middle."""
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    band_top = int(h * 0.42)
    band_bot = int(h * 0.38)

    for y in range(band_top):
        t = 1 - y / band_top
        a = int(alpha_top * t)
        draw.line([(0, y), (w, y)], fill=(0, 0, 0, a))

    for i, y in enumerate(range(h - band_bot, h)):
        t = i / band_bot
        a = int(alpha_bot * t)
        draw.line([(0, y), (w, y)], fill=(0, 0, 0, a))

    return overlay

def draw_shadowed(draw, text, x, y, font, color, shadow_offset=4, shadow_alpha=160):
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font,
              fill=(0, 0, 0, shadow_alpha))
    draw.text((x, y), text, font=font, fill=color)

def centered_x(draw, text, font, margin=60):
    bbox = font.getbbox(text)
    return (W - (bbox[2] - bbox[0])) // 2

def add_text_overlay(img, slide, accent):
    """Adds top label, center title, bottom info + watermark onto a real photo."""
    img = img.convert("RGBA")
    overlay = make_overlay(W, H)
    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)

    # ── Top section ──────────────────────────────────────────────────────────
    # Accent top bar
    for y in range(14):
        alpha = int(255 * (1 - y / 14))
        draw.line([(0, y), (W, y)], fill=(*accent, alpha))

    # Watermark
    f_wm = load_font(34)
    bbox = f_wm.getbbox(WATERMARK)
    wm_x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((wm_x, 38), WATERMARK, font=f_wm, fill=(255, 255, 255, 130))

    # Top label (DÍA X / TÉCNICA / VARIACIÓN)
    f_top = load_font(70, bold=True)
    top_text = slide["top"]
    tx = centered_x(draw, top_text, f_top)
    draw_shadowed(draw, top_text, tx, 110, f_top, (*accent, 255))

    # Thin accent divider
    draw.rectangle([60, 215, W - 60, 220], fill=(*accent, 220))

    # ── Middle section (big title) ────────────────────────────────────────────
    f_mid = load_font(128, bold=True)
    mid_text = slide["mid"]
    # Wrap if too long
    lines = []
    words = mid_text.split()
    line = []
    for w_ in words:
        test = " ".join(line + [w_])
        if f_mid.getbbox(test)[2] > W - 80 and line:
            lines.append(" ".join(line)); line = [w_]
        else:
            line.append(w_)
    if line: lines.append(" ".join(line))

    total_h = sum(f_mid.getbbox(l)[3] + 10 for l in lines)
    start_y = (H - total_h) // 2 - 60
    for l in lines:
        lx = centered_x(draw, l, f_mid)
        draw_shadowed(draw, l, lx, start_y, f_mid, (255, 255, 255, 255), shadow_offset=5)
        start_y += f_mid.getbbox(l)[3] + 14

    # ── Bottom section ────────────────────────────────────────────────────────
    # Bottom info text
    f_bot = load_font(62, bold=True)
    bot_text = slide["bot"]
    bx = centered_x(draw, bot_text, f_bot)
    draw_shadowed(draw, bot_text, bx, H - 280, f_bot, (*accent, 255))

    # Accent bottom bar
    draw.rectangle([60, H - 200, W - 60, H - 196], fill=(*accent, 200))

    # "Desliza" hint (only on slides 1-3)
    f_hint = load_font(38)
    hint = "↓  DESLIZA  →"
    hx = centered_x(draw, hint, f_hint)
    draw.text((hx, H - 165), hint, font=f_hint, fill=(200, 200, 200, 180))

    return img.convert("RGB")

# ── FFmpeg carousel builder ───────────────────────────────────────────────────
def build_carousel_video(day_n, img_paths, audio_path, out_path):
    FADE = 0.25
    total_dur = len(img_paths) * SLIDE_DUR
    tmp_segs  = []
    tmp_dir   = BASE / ".tmp"
    tmp_dir.mkdir(exist_ok=True)

    for i, img_p in enumerate(img_paths):
        seg = str(tmp_dir / f"real_seg_{day_n:02d}_s{i+1}.mp4")
        vf_parts = [f"scale={W}:{H}"]
        if i > 0:                      vf_parts.append(f"fade=in:st=0:d={FADE}")
        if i < len(img_paths) - 1:    vf_parts.append(f"fade=out:st={SLIDE_DUR - FADE}:d={FADE}")
        vf = ",".join(vf_parts)

        r = subprocess.run([
            "ffmpeg", "-y",
            "-loop", "1", "-i", img_p,
            "-t", str(SLIDE_DUR), "-vf", vf,
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast", "-crf", "22",
            "-an", seg
        ], capture_output=True, text=True, cwd=str(BASE))

        if r.returncode != 0:
            print(f"  ERR segment {i+1}: {r.stderr[-200:]}")
            return False
        tmp_segs.append(seg)

    # Concat video segments
    list_file = str(tmp_dir / f"real_list_{day_n:02d}.txt")
    with open(list_file, "w") as f:
        f.write("\n".join(f"file '{s.replace(chr(92), '/')}'" for s in tmp_segs))

    concat_vid = str(tmp_dir / f"real_vid_{day_n:02d}.mp4")
    r = subprocess.run([
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", list_file,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22",
        concat_vid
    ], capture_output=True, text=True, cwd=str(BASE))

    if r.returncode != 0:
        print(f"  ERR concat: {r.stderr[-300:]}")
        return False

    # Mux with audio (trim audio to video length)
    has_audio = audio_path and os.path.exists(audio_path)
    ffmpeg_args = ["ffmpeg", "-y", "-i", concat_vid]
    if has_audio:
        ffmpeg_args += ["-i", audio_path, "-t", str(total_dur),
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
                        "-map", "0:v", "-map", "1:a", "-shortest"]
    else:
        ffmpeg_args += ["-c:v", "copy", "-an"]
    ffmpeg_args.append(out_path)

    r = subprocess.run(ffmpeg_args, capture_output=True, text=True, cwd=str(BASE))
    if r.returncode != 0:
        print(f"  ERR mux: {r.stderr[-300:]}")
        return False

    # Cleanup
    os.unlink(list_file)
    os.unlink(concat_vid)
    for s in tmp_segs:
        try: os.unlink(s)
        except: pass

    return True

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    out_base = BASE / "carousels_real"
    vid_dir  = BASE / "videos"
    out_base.mkdir(exist_ok=True)
    vid_dir.mkdir(exist_ok=True)

    target_days = [d for d in DAYS if only_day is None or d["day"] == only_day]

    for day_data in target_days:
        day_n   = day_data["day"]
        accent  = day_data["accent"]
        day_dir = out_base / f"dia_{day_n:02d}"
        day_dir.mkdir(exist_ok=True)

        print(f"\n{'─'*50}")
        print(f"  DÍA {day_n}")
        print(f"{'─'*50}")

        img_paths = []
        for i, slide in enumerate(day_data["slides"], 1):
            out_img = day_dir / f"slide_{i}.jpg"

            if out_img.exists():
                print(f"  SKIP slide_{i}.jpg (ya existe)")
                img_paths.append(str(out_img))
                continue

            print(f"  DL   slide_{i} → {slide['query'][:50]}...")
            raw = download_photo(slide["query"])
            if raw is None:
                # fallback: plain color with text
                print(f"  WARN No image found, usando fallback")
                raw = Image.new("RGB", (W, H), (20, 20, 30))

            cropped  = smart_crop(raw)
            with_txt = add_text_overlay(cropped, slide, accent)
            with_txt.save(str(out_img), "JPEG", quality=92)
            kb = out_img.stat().st_size // 1024
            print(f"  OK   slide_{i}.jpg ({kb} KB)")
            img_paths.append(str(out_img))
            time.sleep(0.3)  # rate limit cortesía

        if no_video:
            continue

        # Audio
        audio_path = str(BASE / "audio" / f"dia_{day_n:02d}.mp3")
        out_vid    = str(vid_dir / f"dia_{day_n:02d}_real.mp4")

        print(f"  VID  generando dia_{day_n:02d}_real.mp4...")
        if build_carousel_video(day_n, img_paths, audio_path, out_vid):
            mb = os.path.getsize(out_vid) / (1024 * 1024)
            print(f"  OK   dia_{day_n:02d}_real.mp4 ({mb:.1f} MB) — {len(img_paths)*SLIDE_DUR}s")
        else:
            print(f"  ERR  día {day_n} falló")

    print(f"\nListo. Imágenes en carousels_real/ | Videos en videos/")

main()
