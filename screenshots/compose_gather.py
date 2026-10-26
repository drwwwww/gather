"""Gather App Store screenshots, enhanced locally (the aso-appstore-screenshots skill's
stage 2, without the Gemini repaint): the landing-page hero as the backdrop (church
photo under the dawn wash, aurora glows, faint drifting glyphs, hairline grid), the
skill's iPhone frame with a soft shadow, and a "breakout" card cropped from the REAL
screenshot, enlarged and floating over the phone. Nothing in the app UI is redrawn.

Usage (from screenshots/): python compose_gather.py   -> final/*.png at 1290x2796
then: python <skill>/resize.py --width 1320 --height 2868 final/*.png
"""
import math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SKILL = os.path.expanduser("~/.claude/skills/aso-appstore-screenshots")
ROOT = os.path.dirname(os.path.abspath(__file__))
PHOTO = os.path.join(ROOT, "..", "apps", "web", "public", "images", "church-sky-cross.jpg")
FONT = os.path.join(SKILL, "assets", "headline.ttf")
# The app's own Rubik files (the same ones Expo bundles), so the type matches the app.
RUBIK = os.path.join(ROOT, "..", "node_modules", "@expo-google-fonts", "rubik")
RUBIK_BOLD = os.path.join(RUBIK, "700Bold", "Rubik_700Bold.ttf")
FRAME = os.path.join(SKILL, "assets", "device_frame.png")
APPLE_FRAME = os.path.expanduser("~/.claude/skills/app-store-screenshots/template/public/frames/iphone-portrait.png")
PHONE_W, PHONE_Y = 1080, 690

W, H = 1290, 2796
DEVICE_W, BEZEL, DEVICE_Y = 1030, 15, 720
SCREEN_W = DEVICE_W - 2 * BEZEL
DEVICE_X = (W - DEVICE_W) // 2
SX, SY = DEVICE_X + BEZEL, DEVICE_Y + BEZEL
INK = (28, 25, 23)        # app palette.ink #1C1917
ACCENT = (180, 83, 9)     # app palette.amberInk #B45309
MOTIF = (124, 45, 8)

SHOTS = [
    # file, verb, descriptor, breakout card box in the source screenshot (x0, y0, x1, y1) or None
    ("01-home.png", "Stay", "in the loop", (60, 1517, 881, 1911)),
    ("02-serve.png", "Say yes", "with one tap", (49, 461, 1158, 1007)),
    ("03-plan.png", "Know", "your part before you arrive", (49, 578, 1158, 1211)),
    ("04-events.png", "Never miss", "what’s happening", None),
    ("05-news.png", "Catch up", "on church news", (49, 533, 1158, 898)),
]


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def backdrop():
    # Warm vertical wash: dawn cream at the top, deepening to amber behind the phone.
    grad = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(grad)
    stops = [(0, (255, 253, 250)), (0.36, (255, 249, 238)), (0.62, (254, 226, 178)), (0.82, (250, 190, 90)), (1.0, (245, 158, 11))]
    for y in range(H):
        t = y / H
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            if t0 <= t <= t1:
                d.line([(0, y), (W, y)], fill=lerp(c0, c1, (t - t0) / (t1 - t0)))
                break
    # The hero photo, faint, at the top (the sky and the cross read through the wash).
    photo = Image.open(PHOTO).convert("RGB")
    ph = round(photo.height * W / photo.width)
    photo = photo.resize((W, ph), Image.LANCZOS).crop((0, ph - 1300, W, ph)) if ph > 1300 else photo.resize((W, 1300))
    mask = Image.new("L", photo.size, 0)
    md = ImageDraw.Draw(mask)
    for y in range(photo.height):
        md.line([(0, y), (W, y)], fill=round(70 * min(1, y / 500) * max(0, 1 - (y - 700) / 600) if y > 700 else 70 * min(1, y / 500)))
    grad.paste(photo, (0, 0), mask)
    canvas = grad.convert("RGBA")
    # Aurora: the hero's three glows (yellow, orange, soft pink), heavily blurred.
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    for cx, cy, r, col in [(220, 560, 480, (253, 224, 71, 62)), (1110, 420, 420, (251, 146, 60, 52)), (640, 2350, 620, (244, 114, 182, 60))]:
        g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)
    canvas = Image.alpha_composite(canvas, glow.filter(ImageFilter.GaussianBlur(170)))
    # Hairline grid, faded toward the edges.
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, W, 86):
        gd.line([(x, 0), (x, H)], fill=(*MOTIF, 16))
    for y in range(0, H, 86):
        gd.line([(0, y), (W, y)], fill=(*MOTIF, 16))
    fade = Image.new("L", (W, H), 0)
    ImageDraw.Draw(fade).ellipse([-200, -300, W + 200, 1500], fill=255)
    grid.putalpha(Image.composite(grid.getchannel("A"), Image.new("L", (W, H), 0), fade.filter(ImageFilter.GaussianBlur(160))))
    canvas = Image.alpha_composite(canvas, grid)
    return canvas


def motifs(canvas):
    # The hero's drifting glyphs, as faint outlines in the margins around the headline.
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    col, wdt = (*MOTIF, 46), 6

    def cross(cx, cy, s, rot=0):
        for (x0, y0, x1, y1) in [(0, -1, 0, 1), (-0.55, -0.42, 0.55, -0.42)]:
            pts = []
            for x, y in [(x0, y0), (x1, y1)]:
                a = math.radians(rot)
                pts.append((cx + s * (x * math.cos(a) - y * math.sin(a)), cy + s * (x * math.sin(a) + y * math.cos(a))))
            d.line(pts, fill=col, width=wdt)

    def heart(cx, cy, s):
        pts = [(cx + s * 16 * math.sin(t) ** 3 / 17, cy - s * (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) / 17) for t in [i * math.pi / 60 for i in range(121)]]
        d.line(pts, fill=col, width=wdt, joint="curve")

    def note(cx, cy, s):
        d.ellipse([cx - s * 0.5, cy + s * 0.35, cx + s * 0.1, cy + s * 0.8], outline=col, width=wdt)
        d.line([(cx + s * 0.1, cy + s * 0.55), (cx + s * 0.1, cy - s * 0.8)], fill=col, width=wdt)
        d.line([(cx + s * 0.1, cy - s * 0.8), (cx + s * 0.55, cy - s * 0.6)], fill=col, width=wdt)

    def sun(cx, cy, s):
        d.ellipse([cx - s * 0.3, cy - s * 0.3, cx + s * 0.3, cy + s * 0.3], outline=col, width=wdt)
        for i in range(8):
            a = i * math.pi / 4
            d.line([(cx + s * 0.5 * math.cos(a), cy + s * 0.5 * math.sin(a)), (cx + s * 0.72 * math.cos(a), cy + s * 0.72 * math.sin(a))], fill=col, width=wdt)

    cross(92, 140, 58, -8)
    note(1190, 120, 70)
    heart(1196, 600, 56)
    sun(96, 610, 92)
    cross(1205, 1240, 40, 12)
    heart(80, 1500, 40)
    return Image.alpha_composite(canvas, layer)


def text_block(canvas, verb, desc):
    """The app's title style: Rubik Bold, sentence case, letter spacing about -2%
    (ds.ts display: 34/40, -0.7), ink, with the action word in the app's amber ink."""
    d = ImageDraw.Draw(canvas)
    size = 132
    font = ImageFont.truetype(RUBIK_BOLD, size)
    track = -0.02 * size

    def width(words):
        t = " ".join(words)
        return d.textlength(t, font=font) + track * (len(t) - 1)

    words = [(w, True) for w in verb.split()] + [(w, False) for w in desc.split()]
    texts = [w for w, _ in words]
    if width(texts) <= W * 0.86:
        lines = [words]
    elif width(desc.split()) <= W * 0.86:
        # Break right after the action words ("Catch up / on church news"), never
        # after a small word like "on".
        n = len(verb.split())
        lines = [words[:n], words[n:]]
    else:
        i = min(range(1, len(words)), key=lambda i: max(width(texts[:i]), width(texts[i:])))
        lines = [words[:i], words[i:]]
    y = 190
    for line in lines:
        x = (W - width([w for w, _ in line])) / 2
        for j, (w, is_verb) in enumerate(line):
            for ch in w + (" " if j < len(line) - 1 else ""):
                d.text((x, y), ch, font=font, fill=ACCENT if is_verb else INK)
                x += d.textlength(ch, font=font) + track
        y += round(size * 1.16)
    return canvas


def soft_shadow(size, box, radius, blur, alpha, offset=(0, 0)):
    sh = Image.new("RGBA", size, (0, 0, 0, 0))
    x0, y0, x1, y1 = box
    ImageDraw.Draw(sh).rounded_rectangle([x0 + offset[0], y0 + offset[1], x1 + offset[0], y1 + offset[1]], radius=radius, fill=(60, 30, 5, alpha))
    return sh.filter(ImageFilter.GaussianBlur(blur))


def device(canvas, shot):
    """Apple's iPhone bezel (Apple Design Resources, via the app-store-screenshots skill).
    Its screen opening is 1320 x 2868 at (75, 66) in the 1470 x 3000 frame; the exact
    rounded hole is found by flood-filling the transparent interior from the centre."""
    global SX, SY
    frame = Image.open(APPLE_FRAME).convert("RGBA")
    k = PHONE_W / frame.width
    frame = frame.resize((PHONE_W, round(frame.height * k)), Image.LANCZOS)
    fx, fy = (W - PHONE_W) // 2, PHONE_Y
    hole = frame.getchannel("A").point(lambda v: 255 if v < 8 else 0)
    ImageDraw.floodfill(hole, (frame.width // 2, frame.height // 2), 128)
    hole = hole.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(5))
    SX, SY = fx + round(75 * k), fy + round(66 * k)
    screen_w = round(1320 * k)
    scale = screen_w / shot.width
    shot_s = shot.resize((screen_w, round(shot.height * scale)), Image.LANCZOS)
    body = (fx + round(29 * k), fy + round(20 * k), fx + PHONE_W - round(29 * k), fy + frame.height - round(20 * k))
    canvas = Image.alpha_composite(canvas, soft_shadow(canvas.size, body, round(230 * k), 60, 120, (0, 34)))
    screen = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    screen.paste(shot_s, (SX, SY))
    m = Image.new("L", canvas.size, 0)
    m.paste(hole, (fx, fy))
    screen.putalpha(Image.composite(screen.getchannel("A"), Image.new("L", canvas.size, 0), m))
    canvas = Image.alpha_composite(canvas, screen)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.paste(frame, (fx, fy), frame)
    return Image.alpha_composite(canvas, layer), scale


def tight_card(shot, box):
    """Snap an approximate box to the white card's real edges (card #FFF on the app's #F5F5F4)."""
    x0, y0, x1, y1 = box
    px = shot.convert("RGB").load()
    white = lambda x, y: min(px[x, y]) >= 252
    rows = [y for y in range(max(0, y0 - 30), min(shot.height, y1 + 30)) if sum(white(x, y) for x in range(x0 + 60, x1 - 60, 6)) > 0.8 * len(range(x0 + 60, x1 - 60, 6))]
    cols = [x for x in range(max(0, x0 - 30), min(shot.width, x1 + 30)) if sum(white(x, y) for y in range(y0 + 60, y1 - 60, 6)) > 0.8 * len(range(y0 + 60, y1 - 60, 6))]
    return (min(cols), min(rows), max(cols) + 1, max(rows) + 1) if rows and cols else box


def breakout(canvas, shot, box, scale_on_device):
    x0, y0, x1, y1 = tight_card(shot, box)
    card = shot.crop((x0, y0, x1, y1)).convert("RGBA")
    target_w = 1180
    k = target_w / card.width
    card = card.resize((target_w, round(card.height * k)), Image.LANCZOS)
    r = round(44 * k)
    m = Image.new("L", card.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, card.width - 1, card.height - 1], radius=r, fill=255)
    card.putalpha(m)
    cy = SY + (y0 + y1) / 2 * scale_on_device
    top = round(cy - card.height / 2)
    left = (W - card.width) // 2
    canvas = Image.alpha_composite(canvas, soft_shadow(canvas.size, (left, top, left + card.width, top + card.height), r, 34, 95, (0, 26)))
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    layer.paste(card, (left, top), card)
    return Image.alpha_composite(canvas, layer)


if __name__ == "__main__":
    base = motifs(backdrop())
    for variant in ("popout", "clean"):
        out_dir = os.path.join(ROOT, "final", variant)
        os.makedirs(out_dir, exist_ok=True)
        for fname, verb, desc, box in SHOTS:
            shot = Image.open(os.path.join(ROOT, "source", fname)).convert("RGBA")
            c = text_block(base.copy(), verb, desc)
            c, s = device(c, shot)
            if box and variant == "popout":
                c = breakout(c, shot, box, s)
            name = fname.replace("-home", "-stay").replace("-serve", "-say-yes").replace("-plan", "-know").replace("-events", "-never-miss").replace("-news", "-catch-up")
            c.convert("RGB").save(os.path.join(out_dir, name))
        print("saved", out_dir)
