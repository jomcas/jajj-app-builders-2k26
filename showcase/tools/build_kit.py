"""Builds the Tahak infomercial kit's images from the Flip 6 captures and the repo's brand assets."""
import math
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = Path('/Users/nariesss/Personal/jajj-app-builders-2k26')
SHOTS = Path(sys.argv[1])
KIT = Path(sys.argv[2])
FONTS = REPO / 'apps/mobile/node_modules/@expo-google-fonts'
HEAD = str(FONTS / 'barlow-condensed/700Bold/BarlowCondensed_700Bold.ttf')
BODY = str(FONTS / 'barlow/500Medium/Barlow_500Medium.ttf')

# Night tokens from docs/plan.md (the captures are in the night theme).
BLACK = (0, 0, 0)
SURFACE = (20, 20, 20)
INK = (237, 235, 227)
MUTED = (169, 175, 165)
OLIVE_TINT = (42, 49, 34)
OLIVE_LIGHT = (201, 212, 176)
TRAIL = (255, 138, 61)
DANGER = (168, 32, 26)

# (raw capture, card file stem, headline, accent words in the headline, subline)
CARDS = [
    ('night-hike-active', '01-offline-map', 'Your mountain, offline.', 'offline.',
     'The Trail, the next Waypoint and how far to go, with zero signal.'),
    ('night-destination', '02-destination-pack', 'A whole mountain in 1.5 MB.', '1.5 MB.',
     'Download the Destination Pack at home. Use it in airplane mode.'),
    ('night-hike-before', '03-start-hike', 'Pick a Trail. Start your Hike.', 'Start your Hike.',
     'New Trail or Old Trail, each with its real length.'),
    ('night-destination-passages', '04-trail-notes', 'Trail notes with sources.', 'with sources.',
     'Water, fees, campsites and hazards, each with where it came from.'),
    ('night-guides', '05-guides', 'First aid with zero signal.', 'zero signal.',
     'Step-by-step Guides for snakebite, bleeding, sprains and more.'),
    ('night-flare', '06-flare', 'Need to be found? Fire the Flare.', 'Fire the Flare.',
     'Flashlight, screen and a loud whistle, all from the phone.'),
]


def font(path, size):
    return ImageFont.truetype(path, size)


def topo(img, center, rings=9, step=70, color=OLIVE_TINT, width=3, seed=0.0):
    """Faint contour lines, the app's topographic texture."""
    d = ImageDraw.Draw(img)
    cx, cy = center
    for r in range(rings):
        base = 120 + r * step
        pts = []
        for k in range(181):
            a = k / 180 * 2 * math.pi
            wob = 1 + 0.10 * math.sin(3 * a + seed + r * 0.4) + 0.06 * math.sin(5 * a - seed * 1.7 + r)
            pts.append((cx + base * 1.25 * wob * math.cos(a), cy + base * wob * math.sin(a)))
        d.line(pts, fill=color, width=width, joint='curve')


def rounded(im, radius):
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius, fill=255)
    out = im.convert('RGBA')
    out.putalpha(mask)
    return out


def phone(shot_path, height):
    """The capture inside a plain dark bezel, with a soft shadow. Returns RGBA."""
    shot = Image.open(shot_path).convert('RGB')
    w = round(height * shot.width / shot.height)
    screen = rounded(shot.resize((w, height), Image.LANCZOS), int(height * 0.035))
    bez = int(height * 0.012)
    body = Image.new('RGBA', (w + 2 * bez, height + 2 * bez), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((0, 0, body.width - 1, body.height - 1),
                                           int(height * 0.045), fill=(10, 10, 10, 255),
                                           outline=(58, 62, 54, 255), width=max(2, bez // 4))
    body.alpha_composite(screen, (bez, bez))
    pad = int(height * 0.05)
    canvas = Image.new('RGBA', (body.width + 2 * pad, body.height + 2 * pad), (0, 0, 0, 0))
    shadow = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((pad, pad + pad // 3, pad + body.width, pad + body.height + pad // 3),
                                             int(height * 0.045), fill=(0, 0, 0, 200))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(pad // 2)))
    canvas.alpha_composite(body, (pad, pad))
    return canvas


def wrap(draw, text, f, max_w):
    lines, cur = [], ''
    for word in text.split():
        trial = (cur + ' ' + word).strip()
        if draw.textlength(trial, font=f) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    lines.append(cur)
    return lines


def draw_headline(draw, xy, text, accent, f, max_w, align='left', line_gap=1.02):
    """Headline in ink with the accent phrase in trail orange. Returns the bottom y."""
    x0, y = xy
    acc_start = text.index(accent) if accent in text else len(text)
    lines = wrap(draw, text, f, max_w)
    pos = 0
    for line in lines:
        start = text.index(line, pos)
        pos = start + len(line)
        lw = draw.textlength(line, font=f)
        x = x0 - lw / 2 if align == 'center' else x0
        for i, ch in enumerate(line):
            color = TRAIL if start + i >= acc_start else INK
            draw.text((x, y), ch, font=f, fill=color)
            x += draw.textlength(ch, font=f)
        y += int(f.size * line_gap)
    return y


def logo(kind, width):
    im = Image.open(REPO / f'.lavish/tahak-logo-{kind}.png').convert('RGBA')
    return im.resize((width, round(width * im.height / im.width)), Image.LANCZOS)


def portrait_card(raw, stem, head, accent, sub, out):
    W, H = 1080, 1920
    img = Image.new('RGBA', (W, H), BLACK + (255,))
    topo(img, (W * 0.85, H * 0.18), seed=hash(stem) % 7)
    d = ImageDraw.Draw(img)
    img.alpha_composite(logo('night', 210), (72, 76))
    y = draw_headline(d, (72, 170), head, accent, font(HEAD, 112), W - 144) + 22
    for line in wrap(d, sub, font(BODY, 40), W - 144):
        d.text((72, y + 10), line, font=font(BODY, 40), fill=MUTED)
        y += 54
    ph = phone(SHOTS / f'{raw}.png', int((H - y - 30) / 1.13))
    img.alpha_composite(ph, ((W - ph.width) // 2, y + 4))
    img.convert('RGB').save(out / f'{stem}_1080x1920.png', optimize=True)


def landscape_card(raw, stem, head, accent, sub, out):
    W, H = 1920, 1080
    img = Image.new('RGBA', (W, H), BLACK + (255,))
    topo(img, (W * 0.78, H * 0.55), rings=11, step=80, seed=hash(stem) % 7)
    d = ImageDraw.Draw(img)
    ph = phone(SHOTS / f'{raw}.png', 930)
    img.alpha_composite(ph, (150, (H - ph.height) // 2))
    tx = 150 + ph.width + 60
    img.alpha_composite(logo('night', 230), (tx, 300))
    y = draw_headline(d, (tx, 400), head, accent, font(HEAD, 120), W - tx - 120) + 24
    for line in wrap(d, sub, font(BODY, 42), W - tx - 140):
        d.text((tx, y + 14), line, font=font(BODY, 42), fill=MUTED)
        y += 58
    img.convert('RGB').save(out / f'{stem}_1920x1080.png', optimize=True)


def title_cards(out):
    for (W, H) in [(1920, 1080), (1080, 1920)]:
        for name, line in [('title', 'Your guide when the signal drops.'),
                           ('end', "When the signal drops, your guide doesn't.")]:
            img = Image.new('RGBA', (W, H), BLACK + (255,))
            topo(img, (W / 2, H / 2), rings=12, step=max(W, H) // 22, seed=1.3)
            d = ImageDraw.Draw(img)
            lg = logo('night', int(min(W, H) * 0.62))
            img.alpha_composite(lg, ((W - lg.width) // 2, int(H * 0.40) - lg.height // 2))
            f = font(HEAD, int(min(W, H) * 0.075))
            y = int(H * 0.40) + lg.height // 2 + int(min(W, H) * 0.07)
            for ln in wrap(d, line, f, W - 160):
                d.text(((W - d.textlength(ln, font=f)) / 2, y), ln, font=f, fill=INK)
                y += int(f.size * 1.08)
            if name == 'end':
                f2 = font(BODY, int(min(W, H) * 0.032))
                for ln in ['Offline hiking companion for Filipino mountains',
                           'github.com/jomcas/jajj-app-builders-2k26']:
                    d.text(((W - d.textlength(ln, font=f2)) / 2, y + 30), ln, font=f2, fill=MUTED)
                    y += int(f2.size * 1.5)
            img.convert('RGB').save(out / f'{name}-card_{W}x{H}.png', optimize=True)
    # Day-theme wordmark card too, for a light open.
    img = Image.new('RGB', (1920, 1080), (247, 244, 236))
    lg = logo('day', 1100)
    img.paste(lg, ((1920 - lg.width) // 2, (1080 - lg.height) // 2), lg)
    img.save(out / 'title-card-day_1920x1080.png', optimize=True)


def overlays(out):
    """Transparent badges to lay over screen recordings."""
    specs = [
        ('badge-airplane-mode', 'Airplane mode on · no signal', SURFACE, INK),
        ('badge-real-speed', 'Real speed · not sped up', SURFACE, INK),
        ('badge-simulated-walk', 'Simulated walk for the demo', SURFACE, OLIVE_LIGHT),
        ('badge-on-device-ai', 'AI running on the phone', SURFACE, OLIVE_LIGHT),
    ]
    f = font(HEAD, 64)
    for stem, text, bg, fg in specs:
        tw = int(ImageDraw.Draw(Image.new('RGB', (1, 1))).textlength(text, font=f))
        img = Image.new('RGBA', (tw + 120, 120), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.rounded_rectangle((0, 0, img.width - 1, img.height - 1), 60, fill=bg + (235,),
                            outline=(58, 62, 54, 255), width=3)
        d.ellipse((34, 46, 62, 74), fill=TRAIL if 'speed' not in stem else OLIVE_LIGHT)
        d.text((82, 22), text, font=f, fill=fg)
        img.save(out / f'{stem}.png')
    # Lower third: Deviation callout, red only because it means danger (ADR 0004).
    img = Image.new('RGBA', (1400, 200), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, 1399, 199), 28, fill=DANGER + (240,))
    d.text((48, 26), 'Off the Trail? It tells you.', font=font(HEAD, 80), fill=(255, 255, 255))
    d.text((50, 126), 'More than 40 m away for 30 s: vibration, sound and a notification.',
           font=font(BODY, 34), fill=(255, 235, 232))
    img.save(out / 'lower-third-deviation.png')


def palette(out):
    sw = [('Page', '#F7F4EC'), ('Ink', '#1B1F1A'), ('Primary olive', '#353F2A'), ('Olive tint', '#DCE4C8'),
          ('Night olive', '#C9D4B0'), ('Trail orange', '#D9661F'), ('Trail (night)', '#FF8A3D'),
          ('Peach', '#F9D3B4'), ('Sky', '#CFE3F7'), ('Butter', '#FBE7A1'), ('GPS blue', '#1A6FD6'),
          ('Danger red', '#A8201A')]
    img = Image.new('RGB', (1800, 520), (255, 253, 248))
    d = ImageDraw.Draw(img)
    for i, (name, hx) in enumerate(sw):
        x, y = 40 + (i % 6) * 290, 40 + (i // 6) * 240
        rgb = tuple(int(hx[j:j + 2], 16) for j in (1, 3, 5))
        d.rounded_rectangle((x, y, x + 260, y + 140), 18, fill=rgb, outline=(210, 205, 195), width=2)
        d.text((x, y + 150), name, font=font(HEAD, 34), fill=(27, 31, 26))
        d.text((x, y + 190), hx, font=font(BODY, 26), fill=(67, 74, 65))
    img.save(out / 'palette.png', optimize=True)


def mark(out):
    """The mountain 'A' cut from the wordmark, as a square app-style mark for title cards."""
    for kind, bg in [('day', (247, 244, 236)), ('night', (0, 0, 0))]:
        lg = Image.open(REPO / f'.lavish/tahak-logo-{kind}.png').convert('RGBA')
        a = lg.crop((int(lg.width * 0.565), 0, int(lg.width * 0.775), lg.height))
        a = a.crop(a.getbbox())
        S = 1024
        img = Image.new('RGBA', (S, S), bg + (255,))
        scale = S * 0.62 / max(a.size)
        a = a.resize((round(a.width * scale), round(a.height * scale)), Image.LANCZOS)
        img.alpha_composite(a, ((S - a.width) // 2, (S - a.height) // 2))
        img.save(out / f'tahak-mark-{kind}_1024.png', optimize=True)


def main():
    dirs = {k: KIT / v for k, v in {
        'raw': '02-screenshots/raw-flip6', 'por': '02-screenshots/promo-cards-9x16',
        'lan': '02-screenshots/promo-cards-16x9', 'cards': '03-graphics/title-end-cards',
        'ovl': '03-graphics/overlays', 'brand': '04-brand', 'logo': '04-brand/logo',
        'fonts': '04-brand/fonts', 'audio': '05-audio-sfx'}.items()}
    for p in dirs.values():
        p.mkdir(parents=True, exist_ok=True)
    for f in sorted(SHOTS.glob('*.png')):
        if f.resolve() != (dirs['raw'] / f.name).resolve():
            shutil.copy(f, dirs['raw'] / f.name)
    for raw, stem, head, acc, sub in CARDS:
        portrait_card(raw, stem, head, acc, sub, dirs['por'])
        landscape_card(raw, stem, head, acc, sub, dirs['lan'])
    title_cards(dirs['cards'])
    overlays(dirs['ovl'])
    palette(dirs['brand'])
    mark(dirs['logo'])
    for kind in ('day', 'night'):
        shutil.copy(REPO / f'.lavish/tahak-logo-{kind}.png', dirs['logo'] / f'tahak-wordmark-{kind}.png')
    for rel in ['barlow/400Regular/Barlow_400Regular.ttf', 'barlow/500Medium/Barlow_500Medium.ttf',
                'barlow/600SemiBold/Barlow_600SemiBold.ttf',
                'barlow-condensed/600SemiBold/BarlowCondensed_600SemiBold.ttf',
                'barlow-condensed/700Bold/BarlowCondensed_700Bold.ttf']:
        shutil.copy(FONTS / rel, dirs['fonts'])
    for wav in ['deviation_alert.wav', 'flare_whistle.wav']:
        shutil.copy(REPO / 'apps/mobile/assets/sounds' / wav, dirs['audio'])
    print('built', KIT)


main()
