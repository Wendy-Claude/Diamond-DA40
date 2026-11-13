/* Flugzeugdaten (Basisleermassen) - bearbeitbar, lokal gespeichert, plus Treibstoffdichte */
const AC_DEFAULTS = {
  "3H-DA": {mass: 941.5, moment: 2303.3, date: "", note: "Weight and Balance Sheet V1"},
  "3H-DB": {mass: 942.8, moment: 2309.2, date: "", note: "Weight and Balance Sheet V1"},
  "3H-DC": {mass: 939.4, moment: 2297.5, date: "", note: "Weight and Balance Sheet V1"},
  "3H-DD": {mass: 942.1, moment: 2303.3, date: "", note: "Weight and Balance Sheet V1"},
  "3H-DE": {mass: null, moment: null, date: "", note: ""},
  "3H-DF": {mass: null, moment: null, date: "", note: ""},
  "3H-DG": {mass: null, moment: null, date: "", note: ""}
};
const AC_KEY = "d40aircraft.v1", DENS_KEY = "d40density.v1";
const DENS_DEFAULT = {rho15: 0.800, kPerC: 0.00074}; // kg/l bei 15 C; kg/l je C (FBH-B 6.1: 39 USG = 118,1 kg)
const L_PER_USG = 3.785411784;
function acLoad(){
  let s = {}; try { s = JSON.parse(localStorage.getItem(AC_KEY) || "{}"); } catch (e) {}
  const out = {}; for (const k of Object.keys(AC_DEFAULTS)) out[k] = Object.assign({}, AC_DEFAULTS[k], s[k] || {});
  return out;
}
function acSave(all){ try { localStorage.setItem(AC_KEY, JSON.stringify(all)); } catch (e) {} }
function acComplete(a){ return a && a.mass > 0 && a.moment > 0; }
function densLoad(){ try { return Object.assign({}, DENS_DEFAULT, JSON.parse(localStorage.getItem(DENS_KEY) || "{}")); } catch (e) { return Object.assign({}, DENS_DEFAULT); } }
function densSave(p){ try { localStorage.setItem(DENS_KEY, JSON.stringify(p)); } catch (e) {} }
/** Dichte kg/l bei Treibstofftemperatur (ohne Temperatur: 15 C) */
function fuelDensity(tempC, p){ p = p || densLoad(); if (tempC == null || isNaN(tempC)) tempC = 15; return p.rho15 - p.kPerC * (tempC - 15); }
function kgPerUsg(tempC, p){ return fuelDensity(tempC, p) * L_PER_USG; }
if (typeof module !== "undefined") module.exports = {AC_DEFAULTS, acComplete, fuelDensity, kgPerUsg, DENS_DEFAULT, L_PER_USG};
