"""Erzeugt alle Icons aus assets/icon-source.png.

Aufruf: python3 scripts/make_icons.py [android_res_dir]
- www/icons/*            : PWA / Favicon (HTML-Version)
- <res>/mipmap-*         : Android Launcher-Icons (legacy, rund, adaptiv)
Die schwarzen Ecken des Quellbildes werden transparent gemacht.
"""
import sys, os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "android/app/src/main/res")
BG = "#1f3d1f"

src = Image.open(os.path.join(ROOT, "assets/icon-source.png")).convert("RGBA")
# Schwarze Ecken per Flood-Fill als Maske erkennen
mask = Image.new("L", src.size, 255)
rgb = src.convert("RGB")
flood = rgb.copy()
for c in [(0, 0), (src.width - 1, 0), (0, src.height - 1), (src.width - 1, src.height - 1)]:
    ImageDraw.floodfill(flood, c, (255, 0, 255), thresh=40)
px_f, px_m = flood.load(), mask.load()
for y in range(src.height):
    for x in range(src.width):
        if px_f[x, y] == (255, 0, 255):
            px_m[x, y] = 0
src.putalpha(mask)

def save(img, size, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path)

# HTML / PWA
www = os.path.join(ROOT, "www/icons")
for s in (32, 180, 192, 512):
    save(src, s, os.path.join(www, f"icon-{s}.png"))

# Android
dens = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
for d, f in dens.items():
    leg = int(48 * f)
    save(src, leg, f"{RES}/mipmap-{d}/ic_launcher.png")
    rnd = Image.new("RGBA", src.size, (0, 0, 0, 0))
    circ = Image.new("L", src.size, 0)
    ImageDraw.Draw(circ).ellipse((0, 0, src.width - 1, src.height - 1), fill=255)
    rnd.paste(src, (0, 0), circ)
    save(rnd, leg, f"{RES}/mipmap-{d}/ic_launcher_round.png")
    # adaptiv: 108dp Canvas, Motiv in der Sicherheitszone
    full = int(108 * f)
    inner = int(full * 0.66)
    canvas = Image.new("RGBA", (full, full), (0, 0, 0, 0))
    mot = src.resize((inner, inner), Image.LANCZOS)
    canvas.paste(mot, ((full - inner) // 2, (full - inner) // 2), mot)
    os.makedirs(f"{RES}/mipmap-{d}", exist_ok=True)
    canvas.save(f"{RES}/mipmap-{d}/ic_launcher_fg.png")

os.makedirs(f"{RES}/mipmap-anydpi-v26", exist_ok=True)
for n in ("ic_launcher", "ic_launcher_round"):
    open(f"{RES}/mipmap-anydpi-v26/{n}.xml", "w").write(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_fg"/>\n'
        '</adaptive-icon>\n')
os.makedirs(f"{RES}/values", exist_ok=True)
open(f"{RES}/values/ic_launcher_background.xml", "w").write(
    f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">{BG}</color>\n</resources>\n')
# Alte Capacitor-Vorlagen entfernen, falls vorhanden
for p in ("drawable-v24/ic_launcher_foreground.xml", "drawable/ic_launcher_background.xml"):
    fp = f"{RES}/{p}"
    if os.path.exists(fp):
        os.remove(fp)
# App-Name (& muss in XML maskiert sein)
open(f"{RES}/values/strings.xml", "w").write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
    '    <string name="app_name">D40 Performance &amp; Fuel</string>\n'
    '    <string name="title_activity_main">D40 Performance &amp; Fuel</string>\n'
    '    <string name="package_name">at.d40.performancefuel</string>\n'
    '    <string name="custom_url_scheme">at.d40.performancefuel</string>\n'
    '</resources>\n')
print("Icons erzeugt in", RES, "und", www)
