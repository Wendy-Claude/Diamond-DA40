import assert from "node:assert/strict";
import { fuelDensity, kgPerUsg, usgToKg } from "../www/js/core/density.js";

// Referenz FBH-B 6.1: 39 USG = 118,1 kg bei 15 C
assert.ok(Math.abs(usgToKg(39, 15) - 118.1) < 0.2);
// kalt dichter, warm leichter
assert.ok(fuelDensity(-20) > fuelDensity(15) && fuelDensity(15) > fuelDensity(40));
assert.ok(Math.abs(fuelDensity(-20) - 0.8259) < 1e-4);
assert.ok(Math.abs(kgPerUsg(30) - 3.0) < 0.05);
// ohne Temperatur -> Referenz
assert.equal(fuelDensity(null), fuelDensity(15));
console.log("density OK", kgPerUsg(-20).toFixed(3), kgPerUsg(15).toFixed(3), kgPerUsg(35).toFixed(3));
