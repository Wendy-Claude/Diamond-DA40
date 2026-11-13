// Treibstoffdichte Jet A-1 in Abhaengigkeit von der Temperatur.
// Naeherung: linear um die Referenzdichte bei 15 C.
// Referenz 0,800 kg/l entspricht FBH-B Tabelle 6.1 (39 USG = 118,1 kg).
// Beide Parameter sind in den Einstellungen aenderbar.
export const L_PER_USG = 3.785411784;
export const DEFAULT_DENSITY = { rho15: 0.800, kPerC: 0.00074 }; // kg/l, kg/l je C

/** Dichte in kg/l bei Treibstofftemperatur tempC. */
export function fuelDensity(tempC, p = DEFAULT_DENSITY) {
  if (tempC == null || Number.isNaN(tempC)) tempC = 15; // ohne Temperatur: Referenz
  return p.rho15 - p.kPerC * (tempC - 15);
}

/** Masse je US-Gallone in kg. */
export function kgPerUsg(tempC, p = DEFAULT_DENSITY) {
  return fuelDensity(tempC, p) * L_PER_USG;
}

export const usgToKg = (usg, tempC, p) => usg * kgPerUsg(tempC, p);
export const kgToUsg = (kg, tempC, p) => kg / kgPerUsg(tempC, p);
