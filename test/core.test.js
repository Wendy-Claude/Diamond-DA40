const assert=require("node:assert/strict");
global.AFM_DATA=require("../www/js/afm-data.js").AFM_DATA;
const C=require("../www/js/core.js");
const near=(a,b,tol=0.51,msg="")=>assert.ok(Math.abs(a-b)<=tol,`${msg} ${a} != ${b}`);

// Exakte AFM-Tabellenpunkte (Seitenangaben AFM Rev 4)
let d=C.distMass("to",1310,0,0);   near(d.roll,365); near(d.d50,550);      // 5-13 SL 0C
d=C.distMass("to",1280,2000,20);   near(d.roll,460); near(d.d50,670);      // 5-14
d=C.distMass("to",1200,4000,30);   near(d.roll,525); near(d.d50,750);      // 5-15
d=C.distMass("to",1100,8000,10);   near(d.roll,545); near(d.d50,760);      // 5-16
d=C.distMass("ld",1310,3000,50);   near(d.roll,435); near(d.d50,840);      // 5-30
d=C.distMass("ld",1280,0,40);      near(d.roll,345); near(d.d50,710);      // 5-31
d=C.distMass("ld",1200,6000,20);   near(d.roll,390); near(d.d50,750);      // 5-32
d=C.distMass("ld",1100,10000,0);   near(d.roll,535); near(d.d50,910);      // 5-33
// Masse-Interpolation: 1240 kg = Mitte zwischen 1200 und 1280 (SL 0C Start)
d=C.distMass("to",1240,0,0);       near(d.roll,(325+365)/2); near(d.d50,(490+540)/2);
// unter 1100 kg: Werte fuer 1100 kg
d=C.distMass("to",1000,0,0);       near(d.roll,280); assert.match(d.note,/1100/);
// Temperatur/Hoehe-Interpolation
d=C.distMass("to",1310,500,5);     near(d.roll,(365+385+390+410)/4); 
// ausserhalb der Tabelle
assert.equal(C.distMass("to",1310,6000,50).roll,null);
assert.equal(C.distMass("to",1320,0,0).roll,null);
// Steigrate
let r=C.climbRoc(AFM_DATA.climbTO,1310,0,-20);     near(r.roc,660);
r=C.climbRoc(AFM_DATA.climbTO,1100,4000,10);       near(r.roc,760);
r=C.climbRoc(AFM_DATA.climbCR,1200,6000,20);       near(r.roc,695);
r=C.climbRoc(AFM_DATA.climbTO,1240,0,0);           near(r.roc,(720+655)/2);
r=C.climbRoc(AFM_DATA.climbTO,1050,0,0);           near(r.roc,815); assert.match(r.note,/1100/);
// Zuschlaege: Gegenwind 12 kt Start -10 %, Rueckenwind 2 kt +10 %
let x=C.runwayDistances("to",1310,0,0,12,"paved",0,false); near(x.roll,365*0.9,0.6);
x=C.runwayDistances("to",1310,0,0,-2,"paved",0,false);     near(x.roll,365*1.1,0.6);
// Landung, nasses Gras / langes Gras gemaess AFM 5.3.12
x=C.runwayDistances("ld",1310,0,0,0,"grass10",0,false);    near(x.roll,305*1.45,0.6);
// Gradient AFM: ROC/TAS*0.98
near(640/76*0.98,8.25,0.01);
// Steigflug AFM 5.3.10: Beispiel im AFM (1310 kg, Platz PA 2000 ft, OAT 11 C = ISA, Reiseflug 16000 ft): 23 min, 3.3 USG, 38 NM
let cl=C.climbToAlt(1310,2000,11,16000); near(cl.min,23,0.01); near(cl.usg,3.3,0.01); near(cl.nm,38,0.01);
// Temperaturzuschlag: ISA+10 -> +5 % Zeit/Treibstoff, +10 % Strecke
cl=C.climbToAlt(1310,2000,21,16000); near(cl.min,23*1.05,0.1); near(cl.nm,38*1.1,0.1);
// Masse-Interpolation 1100 kg: SL -> 16000: 20 min, 2.8 USG, 33 NM
cl=C.climbToAlt(1100,0,15,16000); near(cl.min,20,0.01); near(cl.usg,2.8,0.01); near(cl.nm,33,0.01);
assert.equal(C.climbToAlt(1310,0,15,17000).ok,false);
// Reiseflug TAS AFM 5.3.11: 75 % / 6000 ft / ISA = 129 kt; 60 % / 10000 ft / ISA+10 = 121 kt
near(C.cruiseTas(6000,C.isaTemp(6000),75),129,0.6); near(C.cruiseTas(10000,C.isaTemp(10000)+10,60),121,0.6);
near(C.cruiseTas(4000,C.isaTemp(4000),67.5),(114+127)/2,0.6);
assert.equal(C.cruiseTas(4000,10,95),null);
console.log("core OK");
