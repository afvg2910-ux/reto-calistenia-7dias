"""
Genera 4 imágenes PNG por día del reto (28 total) usando Pillow.
Tamaño: 1080x1920 (vertical móvil)
También genera audio TTS para los slides 2-4 con edge-tts.

Instalar: pip install Pillow edge-tts
Uso: python scripts/generate_carousel_images.py [--day N] [--no-audio]
"""

import json, os, sys, asyncio, textwrap
from PIL import Image, ImageDraw, ImageFont

try:
    import edge_tts
    HAS_TTS = True
except ImportError:
    HAS_TTS = False
    print("  AVISO: edge-tts no disponible, omitiendo audio")

BASE      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE, "data", "carousel_content.json")
OUT_BASE  = os.path.join(BASE, "carousels")
AUDIO_DIR = os.path.join(BASE, "audio")
W, H      = 1080, 1920
WATERMARK = "RETO 7 DÍAS"
VOICE     = "es-ES-AlvaroNeural"

# ── CLI args ──────────────────────────────────────────────────────────────────
only_day  = None
no_audio  = "--no-audio" in sys.argv
if "--day" in sys.argv:
    idx = sys.argv.index("--day")
    only_day = int(sys.argv[idx + 1])

# ── Font loader ───────────────────────────────────────────────────────────────
def load_font(size, bold=False):
    candidates = [
        f"C:/Windows/Fonts/{'arialbd' if bold else 'arial'}.ttf",
        f"C:/Windows/Fonts/{'calibrib' if bold else 'calibri'}.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

# ── Drawing helpers ───────────────────────────────────────────────────────────
def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def make_gradient(w, h, top_rgb, bot_rgb):
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        r = int(top_rgb[0] + t * (bot_rgb[0] - top_rgb[0]))
        g = int(top_rgb[1] + t * (bot_rgb[1] - top_rgb[1]))
        b = int(top_rgb[2] + t * (bot_rgb[2] - top_rgb[2]))
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return img

def centered_text(draw, text, y, font, color, max_width=980, line_spacing=10):
    words = text.split()
    lines, line = [], []
    for word in words:
        test = " ".join(line + [word])
        bbox = font.getbbox(test)
        if bbox[2] - bbox[0] > max_width and line:
            lines.append(" ".join(line))
            line = [word]
        else:
            line.append(word)
    if line:
        lines.append(" ".join(line))

    total_h = sum(font.getbbox(l)[3] - font.getbbox(l)[1] + line_spacing for l in lines)
    cy = y
    for l in lines:
        bbox = font.getbbox(l)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) / 2, cy), l, font=font, fill=color)
        cy += bbox[3] - bbox[1] + line_spacing
    return cy

def watermark(draw):
    font = load_font(30)
    bbox = font.getbbox(WATERMARK)
    x = (W - (bbox[2] - bbox[0])) / 2
    draw.text((x, H - 70), WATERMARK, font=font, fill=(255, 255, 255, 80))

def accent_bar(draw, accent, y=H - 140, bar_h=8):
    draw.rectangle([50, y, W - 50, y + bar_h], fill=tuple(accent))

# ── Slide builders ────────────────────────────────────────────────────────────
def slide_main(day_data, slide):
    accent = day_data["accent"]
    dark   = (10, 10, 15)
    mid    = (int(accent[0]*0.15), int(accent[1]*0.15), int(accent[2]*0.15))

    img  = make_gradient(W, H, dark, mid)
    draw = ImageDraw.Draw(img)

    # Top accent stripe
    draw.rectangle([0, 0, W, 12], fill=tuple(accent))

    # Watermark top
    font_wm = load_font(34)
    bbox = font_wm.getbbox(WATERMARK)
    draw.text(((W - (bbox[2]-bbox[0]))/2, 40), WATERMARK, font=font_wm, fill=(*accent, 200))

    # Day label
    font_label = load_font(52, bold=True)
    centered_text(draw, slide["label"], 140, font_label, tuple(accent))

    # Divider
    draw.rectangle([80, 240, W - 80, 246], fill=tuple(accent))

    # Title (huge)
    font_title = load_font(160, bold=True)
    centered_text(draw, slide["title"], 290, font_title, (255, 255, 255))

    # Body (sets)
    font_body = load_font(72, bold=True)
    centered_text(draw, slide["body"], 620, font_body, tuple(accent))

    # Detail
    font_detail = load_font(46)
    centered_text(draw, slide["detail"], 750, font_detail, (200, 200, 200))

    # Big decorative number
    font_deco = load_font(500, bold=True)
    day_n = str(day_data["day"])
    bbox = font_deco.getbbox(day_n)
    draw.text(((W - (bbox[2]-bbox[0]))/2, 900),
              day_n, font=font_deco, fill=(*accent, 18))

    # Bottom bar + CTA
    draw.rectangle([0, H - 200, W, H], fill=(0, 0, 0, 200))
    font_cta = load_font(44)
    centered_text(draw, "↓ DESLIZA PARA VER LA TÉCNICA", H - 165, font_cta, (160, 160, 160))
    accent_bar(draw, accent, H - 15, 15)

    return img


def slide_technique(day_data, slide):
    accent = day_data["accent"]
    img    = make_gradient(W, H, (8, 8, 20), (20, 20, 35))
    draw   = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, 12], fill=tuple(accent))

    font_wm = load_font(34)
    bbox = font_wm.getbbox(WATERMARK)
    draw.text(((W-(bbox[2]-bbox[0]))/2, 40), WATERMARK, font=font_wm, fill=(*accent, 160))

    font_label = load_font(48, bold=True)
    centered_text(draw, slide["label"], 130, font_label, tuple(accent))

    font_ex = load_font(80, bold=True)
    centered_text(draw, slide["title"], 230, font_ex, (255, 255, 255))

    draw.rectangle([80, 370, W - 80, 376], fill=tuple(accent))

    # Bullet points
    font_pt = load_font(56, bold=True)
    font_num = load_font(68, bold=True)
    start_y = 420
    for i, point in enumerate(slide["points"]):
        # Number circle
        cx, cy = 90, start_y + 40
        draw.ellipse([cx - 38, cy - 38, cx + 38, cy + 38], fill=tuple(accent))
        draw.text((cx - 14, cy - 28), str(i + 1), font=font_num, fill=(0, 0, 0))

        # Text
        words = point.split()
        lines, line = [], []
        for word in words:
            test = " ".join(line + [word])
            if font_pt.getbbox(test)[2] > 850 and line:
                lines.append(" ".join(line))
                line = [word]
            else:
                line.append(word)
        if line:
            lines.append(" ".join(line))

        ty = start_y + 10
        for l in lines:
            draw.text((145, ty), l, font=font_pt, fill=(240, 240, 240))
            ty += font_pt.getbbox(l)[3] + 8
        start_y = max(start_y + 180, ty + 30)

    accent_bar(draw, accent)
    watermark(draw)
    return img


def slide_progression(day_data, slide):
    accent = day_data["accent"]
    img    = make_gradient(W, H, (5, 5, 10), (15, 15, 25))
    draw   = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, 12], fill=tuple(accent))

    font_wm = load_font(34)
    bbox = font_wm.getbbox(WATERMARK)
    draw.text(((W-(bbox[2]-bbox[0]))/2, 40), WATERMARK, font=font_wm, fill=(*accent, 160))

    font_label = load_font(48, bold=True)
    centered_text(draw, slide["label"], 130, font_label, tuple(accent))

    font_ex = load_font(80, bold=True)
    centered_text(draw, slide["title"], 225, font_ex, (255, 255, 255))

    draw.rectangle([80, 365, W - 80, 371], fill=tuple(accent))

    card_colors = [
        ((30, 80, 30), (0, 200, 80)),   # verde — fácil
        ((20, 40, 80), tuple(accent)),  # accent — intermedio
        ((80, 20, 20), (220, 50, 50)),  # rojo — avanzado
    ]
    levels = slide["levels"]
    card_h = 310
    gap    = 30
    start_y = 400

    for i, lvl in enumerate(levels):
        bg1, bg2 = card_colors[i % len(card_colors)]
        cx1, cy1 = 50, start_y
        cx2, cy2 = W - 50, start_y + card_h

        # Card gradient
        card_img = make_gradient(cx2 - cx1, card_h, bg1, bg2)
        img.paste(card_img, (cx1, cy1))

        # Left accent bar
        draw.rectangle([cx1, cy1, cx1 + 10, cy2], fill=tuple(accent))

        # Level label
        font_lvl = load_font(44, bold=True)
        draw.text((cx1 + 30, cy1 + 25), lvl["label"], font=font_lvl, fill=(*accent, 255))

        # Description
        font_desc = load_font(54, bold=True)
        lines = textwrap.wrap(lvl["text"], width=26)
        ty = cy1 + 90
        for line in lines:
            draw.text((cx1 + 30, ty), line, font=font_desc, fill=(255, 255, 255))
            ty += 64

        start_y += card_h + gap

    accent_bar(draw, accent)
    watermark(draw)
    return img


def slide_cta(day_data, slide):
    accent = day_data["accent"]
    dark   = (5, 5, 5)
    img    = make_gradient(W, H, dark, dark)
    draw   = ImageDraw.Draw(img)

    # Big accent circle
    cx, cy, r = W // 2, 500, 280
    draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                 fill=(*accent, 40), outline=tuple(accent), width=6)

    # Checkmark (big number instead)
    font_check = load_font(200, bold=True)
    check = str(day_data["day"])
    bbox = font_check.getbbox(check)
    draw.text(((W - (bbox[2]-bbox[0]))/2, cy - 110), check, font=font_check, fill=tuple(accent))

    # Completed label
    font_comp = load_font(62, bold=True)
    centered_text(draw, slide["label"], 840, font_comp, tuple(accent))

    draw.rectangle([80, 950, W - 80, 956], fill=tuple(accent))

    # Message
    font_msg = load_font(72, bold=True)
    centered_text(draw, slide["message"], 980, font_msg, (255, 255, 255))

    # CTA box
    box_y = 1250
    draw.rectangle([50, box_y, W - 50, box_y + 150],
                   fill=tuple(accent), outline=tuple(accent))
    font_cta = load_font(52, bold=True)
    bbox = font_cta.getbbox(slide["cta"])
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw)/2, box_y + 48), slide["cta"], font=font_cta, fill=(0, 0, 0))

    # Watermark
    font_wm = load_font(36)
    bbox = font_wm.getbbox(WATERMARK)
    draw.text(((W-(bbox[2]-bbox[0]))/2, H - 80), WATERMARK, font=font_wm, fill=(100, 100, 100))

    return img


BUILDERS = {
    "main":        slide_main,
    "technique":   slide_technique,
    "progression": slide_progression,
    "cta":         slide_cta,
}

# ── TTS generator ─────────────────────────────────────────────────────────────
async def gen_audio(text, out_path):
    if not HAS_TTS:
        return
    if os.path.exists(out_path):
        return
    communicate = edge_tts.Communicate(text, VOICE, rate="+5%", volume="+10%")
    await communicate.save(out_path)


async def process_day(day_data):
    day_n  = day_data["day"]
    out_dir = os.path.join(OUT_BASE, f"dia_{day_n:02d}")
    os.makedirs(out_dir, exist_ok=True)
    print(f"\nDía {day_n} —")

    tasks = []
    for i, slide in enumerate(day_data["slides"], 1):
        # Image
        img_path = os.path.join(out_dir, f"slide_{i}.png")
        if not os.path.exists(img_path):
            builder = BUILDERS.get(slide["type"], slide_main)
            img = builder(day_data, slide)
            img.save(img_path, "PNG")
            kb = os.path.getsize(img_path) // 1024
            print(f"  IMG  slide_{i}.png ({kb} KB)")
        else:
            print(f"  SKIP slide_{i}.png (ya existe)")

        # Audio (slide 1 ya existe como dia_XX.mp3)
        if not no_audio and HAS_TTS:
            if i == 1:
                audio_path = os.path.join(AUDIO_DIR, f"dia_{day_n:02d}.mp3")
            else:
                audio_path = os.path.join(AUDIO_DIR, f"dia_{day_n:02d}_s{i}.mp3")
            tasks.append(gen_audio(slide["voiceover"], audio_path))

    if tasks:
        await asyncio.gather(*tasks)
        print(f"  AUDIO generado para día {day_n}")


async def main():
    os.makedirs(OUT_BASE, exist_ok=True)
    os.makedirs(AUDIO_DIR, exist_ok=True)

    with open(DATA_FILE, encoding="utf-8") as f:
        days = json.load(f)

    if only_day:
        days = [d for d in days if d["day"] == only_day]
        if not days:
            print(f"ERROR: día {only_day} no encontrado")
            sys.exit(1)

    for day in days:
        await process_day(day)

    print(f"\nListo. Imágenes en /carousels/ | Audio en /audio/")


asyncio.run(main())
