"""Baut aus www/ eine einzelne, offline lauffaehige HTML-Datei.
Aufruf: python3 scripts/bundle_html.py <ausgabedatei>"""
import re, sys, base64, os
W = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www")
MT = {".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2"}
def data(path):
    p = os.path.normpath(os.path.join(W, path)); ext = os.path.splitext(p)[1]
    return "data:%s;base64,%s" % (MT[ext], base64.b64encode(open(p, "rb").read()).decode())
h = open(os.path.join(W, "index.html"), encoding="utf8").read()
css = open(os.path.join(W, "css/style.css"), encoding="utf8").read()
css = re.sub(r"url\((\.\./[^)]+)\)", lambda m: "url(%s)" % data(m.group(1)[3:]), css)
h = h.replace('<link rel="stylesheet" href="css/style.css">', "<style>%s</style>" % css)
h = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?', "", h)
h = re.sub(r'src="(img/[^"]+)"', lambda m: 'src="%s"' % data(m.group(1)), h)
def inline(m):
    js = open(os.path.join(W, m.group(1)), encoding="utf8").read().replace("</script", "<\\/script")
    return "<script>%s</script>" % js
h = re.sub(r'<script src="([^"]+)"></script>', inline, h)
open(sys.argv[1], "w", encoding="utf8").write(h)
print(sys.argv[1], round(len(h) / 1024), "KB")
