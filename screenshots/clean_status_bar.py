"""Replace the iPhone status bar on real screenshots with a clean one (9:41, full
signal, Wi-Fi, full battery), per docs/launch/app-store-screenshots.md. Only the
top strip is repainted, using each row's own background colour so gradients
(Home's morning glow) carry through. Usage: python clean_status_bar.py in.png out.png
Sized for iPhone 17 captures (1206 x 2622)."""
import sys
from PIL import Image, ImageDraw, ImageFont

SRC, DST = sys.argv[1], sys.argv[2]
FONT = r"C:\Users\Owner\.claude\skills\aso-appstore-screenshots\assets\headline.ttf"

im = Image.open(SRC).convert("RGB")
W, H = im.size
s = W / 1206
BAR = round(150 * s)
px = im.load()
d = ImageDraw.Draw(im)
for y in range(BAR):
    d.line([(0, y), (W, y)], fill=px[round(12 * s), y])

ink = (0, 0, 0)
cy = round(98 * s)
font = ImageFont.truetype(FONT, round(44 * s))
d.text((round(196 * s), cy), "9:41", font=font, fill=ink, anchor="mm")

# Signal: four rising bars
x0 = round(865 * s)
for i in range(4):
    h = round((12 + i * 7) * s)
    x = x0 + i * round(14 * s)
    d.rounded_rectangle([x, cy + round(14 * s) - h, x + round(9 * s), cy + round(14 * s)], radius=round(2 * s), fill=ink)

# Wi-Fi: three arcs and a dot
wx, wy = round(965 * s), cy + round(12 * s)
for r, w in ((26, 5), (17, 5), (8, 5)):
    rr = round(r * s)
    d.arc([wx - rr, wy - rr, wx + rr, wy + rr], start=225, end=315, fill=ink, width=round(w * s))
d.ellipse([wx - round(3 * s), wy - round(3 * s), wx + round(3 * s), wy + round(3 * s)], fill=ink)

# Battery: outline, full fill, nub
bx, by, bw, bh = round(1010 * s), cy - round(14 * s), round(56 * s), round(28 * s)
d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=round(8 * s), outline=ink, width=round(3 * s))
d.rounded_rectangle([bx + round(5 * s), by + round(5 * s), bx + bw - round(5 * s), by + bh - round(5 * s)], radius=round(4 * s), fill=ink)
d.rounded_rectangle([bx + bw + round(3 * s), by + round(9 * s), bx + bw + round(7 * s), by + bh - round(9 * s)], radius=round(2 * s), fill=ink)

im.save(DST)
print("saved", DST)
