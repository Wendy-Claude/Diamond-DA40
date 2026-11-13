"""Holt die Platzhoehen aller AD-2-Plaetze (Flughaefen, Flugfelder, Militaerflugplaetze) aus der eAIP Austria
und schreibt www/js/airports-at.js. Braucht Netzzugang zu eaip.austrocontrol.at.
Aufruf: python3 scripts/fetch_aip_airports.py [AUSGABE]   (AUSGABE = Ordnername der Ausgabe, z. B. 261030; Standard: aktuelle)"""
import re, sys, os, json, html, urllib.request, io
import pdfplumber
BASE = "https://eaip.austrocontrol.at/"
def get(u): return urllib.request.urlopen(u, timeout=60).read()
idx = get(BASE).decode("latin1")
ed = sys.argv[1] if len(sys.argv) > 1 else re.findall(r'href="\./lo/(\d{6})/index\.htm"', idx)[0]
ad2 = get(f"{BASE}lo/{ed}/ad_2.htm").decode("latin1")
eff = re.search(r"Effective from:.*?>([^<]+UTC)<", ad2, re.S).group(1)
rows = re.findall(r'href="(PART_3/AD_2/(\w+)/AD_2_(LO[A-Z]{2})/[^"]+_en\.pdf)".*?<TD>([^<]+)<BR>', ad2, re.S)
out = {}
for path, cat, icao, name in rows:
    pdf = pdfplumber.open(io.BytesIO(get(f"{BASE}lo/{ed}/{path}")))
    t = "\n".join((pg.extract_text() or "") for pg in pdf.pages[:2])
    m = re.search(r"MEERESSPIEGEL.{0,80}?(\d{2,4})\s*M\s*\((\d{3,5})\s*FT\)", t, re.S)
    if m: ft = int(m.group(2))
    else:
        pg = pdf.pages[0]; W = pg.width; w = pg.extract_words()
        lim = min([x["top"] for x in w if x["text"].startswith("ANMERKUNGEN")] or [1e9])
        c = [int(x["text"]) for i, x in enumerate(w[:-1]) if re.fullmatch(r"\d{3,4}", x["text"]) and w[i+1]["text"] == "FT" and x["x0"] < 0.2*W and x["top"] < lim]
        if len(c) != 1: print("NICHT EINDEUTIG:", icao, c); continue
        ft = c[0]
    out[icao] = [html.unescape(name).strip(), ft, {"PRI": "Flughafen", "SRY": "Flugfeld", "MIL": "Militärflugplatz"}.get(cat, cat)]
    print(icao, out[icao])
os.makedirs("data", exist_ok=True)
json.dump({"effective": eff, "edition": ed, "airports": out}, open("data/aip-austria-ad2-elevations.json", "w"), ensure_ascii=False, indent=1)
js = ("/* Platzhoehen (ft AMSL) aller AD-2-Plaetze der AIP Austria, Ausgabe gueltig ab %s.\n"
      "   Automatisch erzeugt von scripts/fetch_aip_airports.py - nicht von Hand aendern. */\n"
      "const AIP_EFFECTIVE = %s;\nconst AIRPORTS_AT = %s;\n") % (eff, json.dumps(eff), json.dumps(out, ensure_ascii=False, indent=0))
tail = open("www/js/airports-at.js", encoding="utf8").read().split("/* --- Funktionen --- */", 1)[1]
open("www/js/airports-at.js", "w", encoding="utf8").write(js + "/* --- Funktionen --- */" + tail)
print(len(out), "Plaetze")
