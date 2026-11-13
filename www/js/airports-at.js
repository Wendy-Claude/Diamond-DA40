/* Flugplatzhoehen Oesterreich (ft AMSL). ACHTUNG: aus dem Gedaechtnis zusammengestellt, NICHT amtlich geprueft.
   Bitte gegen AIP Austria (AD 2) pruefen. Weitere Plaetze (zivil und militaerisch) im Menue "Flugplatzdaten" importieren. */
const AIRPORTS_AT = {
  LOWW: ["Wien-Schwechat", 600],
  LOWG: ["Graz", 1115],
  LOWI: ["Innsbruck", 1906],
  LOWK: ["Klagenfurt", 1472],
  LOWL: ["Linz", 978],
  LOWS: ["Salzburg", 1411],
  LOWZ: ["Zell am See", 2470],
  LOXT: ["Langenlebarn (Brumowski)", 577],
  LOAN: ["Wiener Neustadt West", 899]
};
const AP_KEY = "d40airports.v1";
function apUser(){ try { return JSON.parse(localStorage.getItem(AP_KEY) || "{}"); } catch (e) { return {}; } }
function apLookup(icao){ icao = (icao || "").toUpperCase(); const u = apUser(); if (u[icao]) return {name: u[icao][0], elev: u[icao][1], src: "eigene Daten"}; if (AIRPORTS_AT[icao]) return {name: AIRPORTS_AT[icao][0], elev: AIRPORTS_AT[icao][1], src: "Datenbank (ungeprüft)"}; return null; }
/** Zeilen "ICAO;Name;Hoehe ft" (auch , oder Tab) */
function apParse(txt){ const out = {}, bad = []; txt.split(/\r?\n/).forEach(l => { l = l.trim(); if (!l) return; const p = l.split(/[;\t,]/).map(s => s.trim()); const ic = (p[0] || "").toUpperCase(), el = parseFloat((p[p.length - 1] || "").replace(",", ".")); if (/^[A-Z]{4}$/.test(ic) && isFinite(el) && el > -1000 && el < 15000) out[ic] = [p.length > 2 ? p[1] : ic, Math.round(el)]; else bad.push(l); }); return {out, bad}; }
if (typeof module !== "undefined") module.exports = {AIRPORTS_AT, apParse};
