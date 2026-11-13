// Plausibilitaetspruefung der AFM-Tabellen (faengt Tippfehler bei der Uebernahme)
const assert=require("node:assert/strict");
const {AFM_DATA:D}=require("../www/js/afm-data.js");
const MS=D.masses;
function chk(name,tab,monoRows,monoCols,nR,nC){
  assert.equal(tab.length,nR,name+" Zeilen"); tab.forEach(r=>assert.equal(r.length,nC,name+" Spalten"));
}
let nChecks=0;
for(const kind of ["to","ld"]) for(const part of ["roll","d50"]){
  for(const m of MS){
    const t=D[kind][m][part]; chk(`${kind}${m}${part}`,t,0,0,11,6);
    for(let i=0;i<11;i++) for(let j=0;j<6;j++){
      const v=t[i][j]; if(v==null) continue; nChecks++;
      if(j>0&&t[i][j-1]!=null) assert.ok(v>=t[i][j-1],`${kind} ${m} ${part} [${i}][${j}] Temperatur-Monotonie`);
      if(i>0&&t[i-1][j]!=null) assert.ok(v>=t[i-1][j],`${kind} ${m} ${part} [${i}][${j}] Hoehen-Monotonie`);
    }
  }
  // schwerere Masse -> laengere Strecke (Takeoff); Landung ebenso
  for(let k=1;k<MS.length;k++) for(let i=0;i<11;i++) for(let j=0;j<6;j++){
    const a=D[kind][MS[k-1]][part][i][j], b=D[kind][MS[k]][part][i][j]; if(a==null||b==null) continue;
    nChecks++; assert.ok(b>=a,`${kind} ${part} Masse ${MS[k]}>=${MS[k-1]} [${i}][${j}]: ${b} vs ${a}`);
  }
}
// d50 > roll
for(const kind of ["to","ld"]) for(const m of MS) for(let i=0;i<11;i++) for(let j=0;j<6;j++){
  const r=D[kind][m].roll[i][j], d=D[kind][m].d50[i][j]; if(r==null) continue; nChecks++; assert.ok(d>r);
}
for(const k of ["climbTO","climbCR"]) for(const m of MS){
  const t=D[k][m]; chk(k+m,t,0,0,10,8);
  for(let i=0;i<10;i++) for(let j=0;j<8;j++){
    const v=t[i][j]; if(v==null) continue; nChecks++;
    if(j>0&&t[i][j-1]!=null) assert.ok(v<=t[i][j-1],`${k} ${m} [${i}][${j}] Temp: Steigrate faellt`);
    if(i>0&&t[i-1][j]!=null) assert.ok(v<=t[i-1][j],`${k} ${m} [${i}][${j}] Hoehe: Steigrate faellt`);
  }
}
for(const k of ["climbTO","climbCR"]) for(let q=1;q<MS.length;q++) for(let i=0;i<10;i++) for(let j=0;j<8;j++){
  const a=D[k][MS[q-1]][i][j], b=D[k][MS[q]][i][j]; if(a==null||b==null) continue; nChecks++;
  assert.ok(a>=b,`${k} leichtere Masse steigt besser [${i}][${j}] ${MS[q-1]}:${a} ${MS[q]}:${b}`);
}
console.log("AFM-Daten OK,",nChecks,"Pruefungen");
