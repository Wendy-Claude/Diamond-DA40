/* Platzhoehen (ft AMSL) aller AD-2-Plaetze der AIP Austria, Ausgabe gueltig ab 30 OCT 2026 00:00 UTC.
   Automatisch erzeugt von scripts/fetch_aip_airports.py - nicht von Hand aendern. */
const AIP_EFFECTIVE = "30 OCT 2026 00:00 UTC";
const AIRPORTS_AT = {
"LOWG": [
"Graz",
1120,
"Flughafen"
],
"LOWI": [
"Innsbruck",
1907,
"Flughafen"
],
"LOWK": [
"Klagenfurt",
1472,
"Flughafen"
],
"LOWL": [
"Linz",
980,
"Flughafen"
],
"LOWS": [
"Salzburg",
1411,
"Flughafen"
],
"LOWW": [
"Wien-Schwechat",
600,
"Flughafen"
],
"LOAA": [
"Ottenschlag",
2870,
"Flugfeld"
],
"LOAB": [
"Dobersberg",
1713,
"Flugfeld"
],
"LOAD": [
"Völtendorf",
1066,
"Flugfeld"
],
"LOAG": [
"Krems-Langenlois",
1035,
"Flugfeld"
],
"LOAN": [
"Wr. Neustadt/Ost",
896,
"Flugfeld"
],
"LOAR": [
"Altlichtenwarth",
604,
"Flugfeld"
],
"LOAS": [
"Spitzerberg",
623,
"Flugfeld"
],
"LOAU": [
"Stockerau",
685,
"Flugfeld"
],
"LOAV": [
"Vöslau",
767,
"Flugfeld"
],
"LOGF": [
"Fürstenfeld",
830,
"Flugfeld"
],
"LOGG": [
"Punitz-Güssing",
949,
"Flugfeld"
],
"LOGI": [
"Trieben",
2283,
"Flugfeld"
],
"LOGK": [
"Kapfenberg",
1683,
"Flugfeld"
],
"LOGL": [
"Lanzen-Turnau",
2575,
"Flugfeld"
],
"LOGM": [
"Mariazell",
2822,
"Flugfeld"
],
"LOGO": [
"Niederöblarn",
2142,
"Flugfeld"
],
"LOGP": [
"Pinkafeld",
1332,
"Flugfeld"
],
"LOGT": [
"Leoben/Timmersdorf",
2050,
"Flugfeld"
],
"LOGW": [
"Weiz/Unterfladnitz",
1296,
"Flugfeld"
],
"LOIH": [
"Hohenems-Dornbirn",
1352,
"Flugfeld"
],
"LOIJ": [
"St. Johann/Tirol",
2206,
"Flugfeld"
],
"LOIK": [
"Kufstein-Langkampfen",
1588,
"Flugfeld"
],
"LOIR": [
"Reutte-Höfen",
2807,
"Flugfeld"
],
"LOKF": [
"Feldkirchen/Ossiacher See",
1706,
"Flugfeld"
],
"LOKG": [
"Ferlach-Glainach",
1498,
"Flugfeld"
],
"LOKH": [
"Friesach/Hirt",
2019,
"Flugfeld"
],
"LOKL": [
"Lienz-Nikolsdorf",
2093,
"Flugfeld"
],
"LOKM": [
"Mayerhofen bei Friesach",
2119,
"Flugfeld"
],
"LOKN": [
"Nötsch im Gailtal",
1801,
"Flugfeld"
],
"LOKR": [
"St. Donat-Mairist",
1753,
"Flugfeld"
],
"LOKW": [
"Wolfsberg",
1467,
"Flugfeld"
],
"LOLC": [
"Scharnstein",
1756,
"Flugfeld"
],
"LOLE": [
"Eferding",
887,
"Flugfeld"
],
"LOLF": [
"Freistadt",
2237,
"Flugfeld"
],
"LOLG": [
"St. Georgen am Ybbsfeld",
827,
"Flugfeld"
],
"LOLH": [
"Hofkirchen",
1175,
"Flugfeld"
],
"LOLK": [
"Ried-Kirchheim",
1378,
"Flugfeld"
],
"LOLM": [
"Micheldorf",
1509,
"Flugfeld"
],
"LOLO": [
"Linz-Ost",
827,
"Flugfeld"
],
"LOLS": [
"Schärding-Suben",
1070,
"Flugfeld"
],
"LOLT": [
"Seitenstetten",
1050,
"Flugfeld"
],
"LOLU": [
"Gmunden-Laakirchen",
1670,
"Flugfeld"
],
"LOLW": [
"Wels",
1043,
"Flugfeld"
],
"LOSM": [
"Mauterndorf",
3642,
"Flugfeld"
],
"LOWZ": [
"Zell am See",
2471,
"Flugfeld"
],
"LOXA": [
"Aigen im Ennstal",
2093,
"Militärflugplatz"
],
"LOXN": [
"Wr. Neustadt/West",
935,
"Militärflugplatz"
],
"LOXT": [
"Tulln",
576,
"Militärflugplatz"
],
"LOXZ": [
"Zeltweg",
2264,
"Militärflugplatz"
]
};
/* --- Funktionen --- */
const AP_KEY = "d40airports.v1";
function apUser(){ try { return JSON.parse(localStorage.getItem(AP_KEY) || "{}"); } catch (e) { return {}; } }
function apLookup(icao){ icao = (icao || "").toUpperCase(); const u = apUser(); if (u[icao]) return {name: u[icao][0], elev: u[icao][1], src: "eigene Daten"}; if (AIRPORTS_AT[icao]) return {name: AIRPORTS_AT[icao][0] + " (" + AIRPORTS_AT[icao][2] + ")", elev: AIRPORTS_AT[icao][1], src: "AIP Austria AD 2, gültig ab " + AIP_EFFECTIVE}; return null; }
/** Zeilen "ICAO;Name;Hoehe ft" (auch , oder Tab) */
function apParse(txt){ const out = {}, bad = []; txt.split(/\r?\n/).forEach(l => { l = l.trim(); if (!l) return; const p = l.split(/[;\t,]/).map(s => s.trim()); const ic = (p[0] || "").toUpperCase(), el = parseFloat((p[p.length - 1] || "").replace(",", ".")); if (/^[A-Z]{4}$/.test(ic) && isFinite(el) && el > -1000 && el < 15000) out[ic] = [p.length > 2 ? p[1] : ic, Math.round(el)]; else bad.push(l); }); return {out, bad}; }
if (typeof module !== "undefined") module.exports = {AIRPORTS_AT, AIP_EFFECTIVE, apParse};
