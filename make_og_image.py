"""Compose a 1200x630 Open Graph share image for PixPurge."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
CORAL = (234, 88, 12)
TEAL = (15, 118, 110)
INK = (15, 23, 42)
MUTED = (100, 116, 139)
PAPER = (250, 250, 249)

def font(size, weight=700):
    f = ImageFont.truetype("assets/SpaceGrotesk-Bold.ttf", size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f

def cover_crop(img, tw, th):
    """Center-crop + resize img to fill (tw, th)."""
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    img = img.resize((int(sw * scale), int(sh * scale)), Image.LANCZOS)
    x = (img.width - tw) // 2
    y = (img.height - th) // 2
    return img.crop((x, y, x + tw, y + th))

IMG_H = 470          # image band height
HALF_W = W // 2      # each side of the comparison

before = cover_crop(Image.open("images/before.jpg").convert("RGB"), HALF_W, IMG_H)
after = cover_crop(Image.open("images/after.jpg").convert("RGB"), HALF_W, IMG_H)

canvas = Image.new("RGB", (W, H), PAPER)
canvas.paste(before, (0, 0))
canvas.paste(after, (HALF_W, 0))

d = ImageDraw.Draw(canvas)

# --- center divider with handle ---
cx = HALF_W
d.rectangle((cx - 2, 0, cx + 2, IMG_H), fill=(255, 255, 255))
hr = 30
d.ellipse((cx - hr, IMG_H // 2 - hr, cx + hr, IMG_H // 2 + hr), fill=(255, 255, 255))
# chevrons inside handle
d.line((cx - 11, IMG_H // 2, cx - 3, IMG_H // 2), fill=INK, width=4)
d.line((cx + 3, IMG_H // 2, cx + 11, IMG_H // 2), fill=INK, width=4)
d.polygon([(cx - 14, IMG_H // 2), (cx - 7, IMG_H // 2 - 7), (cx - 7, IMG_H // 2 + 7)], fill=INK)
d.polygon([(cx + 14, IMG_H // 2), (cx + 7, IMG_H // 2 - 7), (cx + 7, IMG_H // 2 + 7)], fill=INK)

# --- corner labels ---
def pill(x, y, text, bg, fg=(255, 255, 255)):
    f = font(20, 700)
    bbox = d.textbbox((0, 0), text, font=f)
    pw, ph = bbox[2] - bbox[0] + 32, bbox[3] - bbox[1] + 18
    d.rounded_rectangle((x, y, x + pw, y + ph), radius=ph // 2, fill=bg)
    d.text((x + 16, y + 9), text, font=f, fill=fg)
    return pw

pw = pill(24, 24, "WITH TEXT", CORAL)
f2 = font(20, 700)
tr = "TEXT REMOVED"
tb = d.textbbox((0, 0), tr, font=f2)
tw = tb[2] - tb[0] + 32
pill(W - 24 - tw, 24, tr, TEAL)

# --- bottom band: logo + headline + subtext ---
band_y = IMG_H
# Draw a simple logo mark: ink rounded square with coral eraser slash
lx, ly, ls = 48, band_y + 55, 62
d.rounded_rectangle((lx, ly, lx + ls, ly + ls), radius=14, fill=INK)
d.polygon([(lx + 16, ly + ls - 16), (lx + 30, ly + 18), (lx + 42, ly + 26), (lx + 26, ly + ls - 8)], fill=CORAL)

f_brand = font(34, 700)
d.text((lx + ls + 18, band_y + 50), "PixPurge", font=f_brand, fill=INK)

f_tag = font(26, 500)
d.text((lx + ls + 18, band_y + 100), "Free  ·  Online  ·  No Sign-up", font=f_tag, fill=MUTED)

# headline on the right side of the band
f_big = font(42, 700)
headline = "Text Remover from Image"
hb = d.textbbox((0, 0), headline, font=f_big)
hw = hb[2] - hb[0]
d.text((W - 48 - hw, band_y + 60), headline, font=f_big, fill=INK)

canvas.save("images/og-image.jpg", quality=90)
print("saved images/og-image.jpg", canvas.size)
