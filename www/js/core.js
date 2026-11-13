/* ===== D40 Fuel & Performance – Rechenkern (Grundlage: FBH-B D40, Stand 01 09 26) ===== */
const FBH = {
  stand: "FBH-B D40, Stand 01 09 26",
  // 4.1.2 Rotier- und Anfluggeschwindigkeiten (Masse kg -> KIAS)
  vrVapp: [[1000,58,68],[1100,61,72],[1125,62,73],[1150,63,74],[1175,64,75],[1200,65,76],[1280,67,77],[1310,67,77]],
  // 4.4 Treibstoffverbrauch (Leistung % -> USG/h)
  ff: {30:2.9,35:3.3,40:3.7,45:4.0,50:4.4,55:4.7,60:5.1,65:5.6,70:6.1,75:6.6,80:7.1,85:7.6,90:8.1,92:8.3,100:9.4},
  // 4.2 Startstrecke 1310 kg, Flaps T/O, dry paved level. Zeilen PA 0..10000 ft, Spalten OAT 0..50 °C
  toPA: [0,1000,2000,3000,4000,5000,6000,7000,8000,9000,10000],
  toT: [0,10,20,30,40,50],
  toRoll: [
    [365,385,410,430,460,495],[390,410,435,465,500,535],[415,440,465,500,540,575],[440,470,500,540,580,625],
    [470,500,540,590,630,680],[505,535,585,640,685,null],[540,585,640,700,750,null],[580,640,700,765,820,null],
    [635,700,770,845,900,null],[695,770,850,915,990,null],[765,850,910,995,null,null]],
  to50: [
    [550,580,610,640,680,720],[580,610,640,680,730,770],[610,640,680,730,780,830],[650,680,720,780,840,890],
    [690,720,780,840,900,960],[730,770,840,910,970,null],[770,830,900,980,1040,null],[820,900,980,1060,1130,null],
    [890,970,1060,1160,1230,null],[970,1060,1160,1250,1330,null],[1050,1160,1240,1340,null,null]],
  // 4.5 Landestrecke 1310 kg, Flaps LDG
  ldRoll: [
    [305,315,325,335,355,375],[315,325,335,350,370,395],[325,335,350,370,390,415],[335,350,365,385,410,435],
    [350,360,380,405,430,455],[360,375,400,425,450,null],[375,395,420,445,475,null],[400,430,460,485,515,null],
    [455,485,520,550,585,null],[520,555,585,625,660,null],[580,620,655,695,null,null]],
  ld50: [
    [620,650,670,680,720,760],[640,660,680,700,740,790],[650,670,690,730,770,810],[670,690,710,750,800,840],
    [680,700,740,780,830,870],[700,720,770,810,860,null],[710,750,790,840,890,null],[750,790,840,890,940,null],
    [810,870,920,970,1020,null],[890,950,1000,1060,1120,null],[970,1030,1090,1140,null,null]],
  // 4.3 Steigraten [ft/min]; Massen 1310/1280/1200; PA 0..16400; OAT -20..50
  clM: [1310,1280,1200],
  clPA: [0,2000,4000,6000,8000,10000,12000,14000,16000,16400],
  clT: [-20,-10,0,10,20,30,40,50],
  toClimb: { // Take-off Climb, flaps T/O, 72 KIAS, 92 %
    1310:[[660,650,640,630,620,615,590,550],[640,630,620,610,605,595,555,515],[620,610,600,595,585,560,520,475],[600,590,580,570,555,520,475,null],[580,570,555,540,525,480,435,null],[555,540,525,510,480,435,null,null],[525,510,495,480,435,400,null,null],[500,485,475,460,425,360,null,null],[490,470,440,385,325,null,null,null],[475,450,420,370,305,null,null,null]],
    1280:[[675,665,655,645,635,625,600,560],[655,645,635,625,615,605,570,525],[635,625,615,605,595,575,530,485],[615,605,595,580,570,535,485,null],[595,580,565,550,535,490,445,null],[565,550,535,520,490,445,null,null],[535,520,505,490,445,410,null,null],[510,495,485,470,430,370,null,null],[500,480,450,395,330,null,null,null],[485,460,430,375,310,null,null,null]],
    1200:[[740,730,720,710,700,690,665,620],[720,710,700,690,680,670,630,585],[700,690,680,670,660,635,590,540],[680,670,660,645,630,595,545,null],[660,645,630,615,600,545,500,null],[630,615,600,585,550,500,null,null],[595,580,565,550,505,460,null,null],[575,560,545,530,490,420,null,null],[560,540,510,450,380,null,null,null],[545,520,490,430,360,null,null,null]]
  },
  crClimb: { // Cruise Climb, flaps UP, 88 KIAS, 92 %
    1310:[[665,660,655,650,645,645,620,585],[655,650,645,640,635,630,595,555],[645,640,635,630,620,605,565,525],[635,630,620,615,605,580,540,null],[620,615,605,600,590,550,505,null],[605,600,590,580,555,510,null,null],[590,580,570,560,520,480,null,null],[575,565,555,540,500,445,null,null],[560,550,520,470,405,null,null,null],[545,535,500,450,380,null,null,null]],
    1280:[[690,685,680,675,670,665,645,605],[680,675,670,665,660,655,615,575],[670,665,660,650,645,630,590,545],[660,650,645,635,630,600,560,null],[645,635,630,620,610,570,525,null],[630,620,615,605,580,535,null,null],[615,605,590,580,540,500,null,null],[595,585,580,560,525,465,null,null],[585,575,545,490,425,null,null,null],[570,555,525,470,400,null,null,null]],
    1200:[[750,750,745,740,735,730,705,665],[745,740,735,730,725,720,680,635],[735,730,725,715,710,690,650,605],[725,715,710,700,695,660,620,null],[710,700,695,685,675,630,585,null],[695,685,680,670,640,590,null,null],[680,665,655,645,600,560,null,null],[660,650,640,625,585,520,null,null],[650,640,605,550,480,null,null,null],[635,620,585,525,455,null,null,null]]
  },
  // 1.8 / 6.1 Massen und Schwerpunkt
  maxTXM:1314, maxTOM:1310, maxLM:1280, maxZFM:1265, minMass:940,
  arm:{front:2.30, rear:3.25, fwdBag:3.89, aftBag:4.54, fuel:2.63},
  maxFwdBag:45, maxAftBag:18, maxBagTotal:45,
  kgPerUSG: 118.1/39, // Tabelle 6.1 (JET A1): 39 USG = 118,1 kg
  usableFuel: 39,
  // Basisleermasse / Moment (Weight & Balance Sheet V1)
  empty: {"3H-DA":[941.5,2303.3],"3H-DB":[942.8,2309.2],"3H-DC":[939.4,2297.5],"3H-DD":[942.1,2303.3]},
  // 1.13 Windgrenzwerte
  wind: {head:35, cross:25, tail:5, mean:30}
};

function cgFwdLimit(m){ if(m<=1080) return 2.40; return 2.40 + (m-1080)*(2.469-2.40)/(1310-1080); }
const CG_AFT = 2.53;

function lerp(a,b,t){ return a+(b-a)*t; }
function bracket(arr,v){ // returns [i,t] with arr ascending; clamps
  if(v<=arr[0]) return [0,0];
  for(let i=0;i<arr.length-1;i++){ if(v<=arr[i+1]) return [i,(v-arr[i])/(arr[i+1]-arr[i])]; }
  return [arr.length-2,1];
}
function interp2(rows,cols,tab,r,c){
  if(r<rows[0]) r=rows[0];
  if(r>rows[rows.length-1]||c>cols[cols.length-1]) return null;
  const [i,ti]=bracket(rows,r), [j,tj]=bracket(cols,c);
  const g=(a,b)=>tab[a][b];
  const v00=g(i,j),v01=g(i,j+1),v10=g(i+1,j),v11=g(i+1,j+1);
  const need=[[v00,(1-ti)*(1-tj)],[v01,(1-ti)*tj],[v10,ti*(1-tj)],[v11,ti*tj]];
  let s=0; for(const [v,w] of need){ if(w>1e-9){ if(v==null) return null; s+=v*w; } }
  return s;
}

// Druckhöhe: 1 hPa ≈ 27 ft
function pressAlt(elevFt,qnh){ return elevFt + (1013.25-qnh)*27; }
function sigma(paFt,oatC){ const p=Math.pow(1-6.8756e-6*paFt,5.2559); return p*288.15/(oatC+273.15); }
function tasFromIas(ias,paFt,oatC){ return ias/Math.sqrt(sigma(paFt,oatC)); }

function vrVapp(mass){
  const t=FBH.vrVapp; for(const r of t){ if(mass<=r[0]+1e-6) return {vr:r[1],vapp:r[2],row:r[0]}; }
  return {vr:null,vapp:null,row:null};
}

function climbRoc(table,mass,pa,oat){
  if(mass>FBH.maxTOM+0.01) return {roc:null,note:"Masse über 1310 kg"};
  let note="";
  const m = Math.max(mass,1200); if(mass<1200) note="Masse < 1200 kg: Werte für 1200 kg (konservativ)";
  if(oat<-20) oat=-20;
  if(pa<0) pa=0;
  const M=FBH.clM; // descending
  let hi,lo; if(m>=1280){hi=1310;lo=1280;} else {hi=1280;lo=1200;}
  const t=(m-lo)/(hi-lo);
  const a=interp2(FBH.clPA,FBH.clT,table[lo],pa,oat), b=interp2(FBH.clPA,FBH.clT,table[hi],pa,oat);
  if(a==null||b==null) return {roc:null,note:"außerhalb der Tabelle"};
  return {roc:lerp(a,b,t),note};
}

function distTable(rollTab,d50Tab,pa,oat){
  let note=""; let o=oat;
  if(o<0){ o=0; note="OAT < 0 °C: Spalte 0 °C verwendet (konservativ)"; }
  const roll=interp2(FBH.toPA,FBH.toT,rollTab,Math.max(pa,0),o);
  const d50=interp2(FBH.toPA,FBH.toT,d50Tab,Math.max(pa,0),o);
  if(pa>10000) return {roll:null,d50:null,note:"PA > 10.000 ft – außerhalb der Tabelle"};
  if(roll==null||d50==null) return {roll:null,d50:null,note:"außerhalb der Tabelle"};
  return {roll,d50,note};
}

/* Zuschläge FBH-B 4.6 – Faktoren werden nacheinander angewendet */
function surfaceFactors(kind,surface,slope){
  // returns {roll:[...[label,factor]], all:[...]} ; "all" gilt für Roll- und Gesamtstrecke (Wind)
  const roll=[];
  if(kind==="to"){
    if(slope>0) roll.push([`Neigung bergauf ${slope} %`,1+0.15*slope]);
    const g={"grass5":["Gras 0–5 cm",1.10],"grass10":["Gras 5–10 cm",1.30],"grass25":["Gras 10–25 cm",1.45],"grasswet":["nasses Gras",1.20],"soft":["weicher Boden",1.50]}[surface];
    if(g) roll.push(g);
  } else {
    if(slope<0) roll.push([`Neigung bergab ${-slope} %`,1+0.10*(-slope)]);
    const g={"grass5":["Gras",1.30],"grass10":["Gras",1.30],"grass25":["Gras",1.30],"grasswet":["nasses Gras",1.15],"soft":["weicher Boden",1.15],"wet":["befestigte, nasse Piste",1.15]}[surface];
    if(g) roll.push(g);
  }
  return roll;
}
function windFactor(kind,headwind){ // headwind >0 Gegenwind, <0 Rückenwind (kt)
  if(headwind>=0) return 1 - 0.10*headwind/(kind==="to"?12:20);
  return 1 + 0.10*(-headwind)/(kind==="to"?2:3);
}

function windComponents(windDirTrue,windSpd,rwyMag,varE){
  if(windDirTrue==null||windSpd==null||rwyMag==null) return null;
  const dirMag = windDirTrue - (varE||0);
  const a=(dirMag-rwyMag)*Math.PI/180;
  return {head: windSpd*Math.cos(a), cross: Math.abs(windSpd*Math.sin(a))};
}

function runwayDistances(kind,pa,oat,headwind,surface,slope,fairingsOff){
  const t = kind==="to" ? distTable(FBH.toRoll,FBH.to50,pa,oat) : distTable(FBH.ldRoll,FBH.ld50,pa,oat);
  if(t.roll==null) return {ok:false,note:t.note};
  const steps=[];
  let roll=t.roll, d50=t.d50;
  steps.push(["Tabellenwert (1310 kg)",roll,d50]);
  if(kind==="to" && fairingsOff){ roll+=20; d50+=30; steps.push(["ohne Radverkleidungen (+20/+30 m)",roll,d50]); }
  const wf=windFactor(kind,headwind||0);
  if(Math.abs(wf-1)>1e-6){ roll*=wf; d50*=wf; steps.push([(headwind>=0?"Gegenwind ":"Rückenwind ")+Math.abs(headwind).toFixed(0)+" kt ("+((wf-1)*100).toFixed(0)+" %)",roll,d50]); }
  for(const [lab,f] of surfaceFactors(kind,surface,slope)){
    const inc=roll*(f-1); roll+=inc; d50+=inc; steps.push([lab+" (+"+((f-1)*100).toFixed(0)+" % Rollstrecke)",roll,d50]);
  }
  return {ok:true,roll,d50,steps,note:t.note};
}

/* ===== METAR / TAF ===== */
function parseWind(tok){
  const m=/^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?(KT|MPS)$/.exec(tok);
  if(!m) return null;
  let f=m[4]==="MPS"?1.944:1;
  return {dir:m[1]==="VRB"?null:+m[1], vrb:m[1]==="VRB", spd:Math.round(+m[2]*f), gst:m[3]?Math.round(+m[3]*f):null};
}
function parseMetar(raw){
  if(!raw) return null;
  const s=raw.replace(/\s+/g," ").trim().replace(/=$/,"");
  const toks=s.split(" ");
  const r={raw:s};
  for(const t of toks){
    const w=parseWind(t); if(w&&!r.wind) r.wind=w;
    const tm=/^(M?\d{2})\/(M?\d{2})?$/.exec(t); if(tm&&r.temp==null){ r.temp=+tm[1].replace("M","-"); if(tm[2]) r.dew=+tm[2].replace("M","-"); }
    const q=/^Q(\d{4})$/.exec(t); if(q) r.qnh=+q[1];
    const a=/^A(\d{4})$/.exec(t); if(a&&r.qnh==null) r.qnh=Math.round(+a[1]/100*33.8639);
    const st=/^([A-Z]{4})$/.exec(t); if(st&&!r.station&&t!=="METAR"&&t!=="SPECI"&&t!=="AUTO"&&t!=="CAVOK") r.station=t;
    const ts=/^(\d{2})(\d{2})(\d{2})Z$/.exec(t); if(ts&&!r.time) r.time={d:+ts[1],h:+ts[2],m:+ts[3]};
  }
  return r;
}
function resolveDay(d,h,mi,ref){ // ref: Date (UTC)
  let best=null;
  for(const dm of [-1,0,1]){
    const dt=new Date(Date.UTC(ref.getUTCFullYear(),ref.getUTCMonth()+dm,d,h,mi||0));
    if(dt.getUTCDate()!==((d-1)%31)+1 && h!==24) {/* Monat ohne diesen Tag */}
    if(!best||Math.abs(dt-ref)<Math.abs(best-ref)) best=dt;
  }
  return best;
}
function parseTaf(raw,ref){
  if(!raw) return null;
  const s=raw.replace(/\s+/g," ").trim().replace(/=$/,"");
  const toks=s.split(" ");
  const res={raw:s,groups:[],tx:null,tn:null};
  let i=0;
  while(i<toks.length && /^(TAF|AMD|COR|RTD)$/.test(toks[i])) i++;
  if(/^[A-Z]{4}$/.test(toks[i]||"")){ res.station=toks[i]; i++; }
  const iss=/^(\d{2})(\d{2})(\d{2})Z$/.exec(toks[i]||""); if(iss){ res.issue=resolveDay(+iss[1],+iss[2],+iss[3],ref); i++; }
  const per=(t)=>{ const m=/^(\d{2})(\d{2})\/(\d{2})(\d{2})$/.exec(t||""); if(!m) return null; const r0=res.issue||ref; return [resolveDay(+m[1],+m[2],0,r0),resolveDay(+m[3],+m[4],0,r0)]; };
  const v=per(toks[i]); if(v){ res.from=v[0]; res.to=v[1]; i++; }
  let cur={type:"BASE",start:res.from,end:res.to,toks:[]};
  res.groups.push(cur);
  for(;i<toks.length;i++){
    const t=toks[i];
    const fm=/^FM(\d{2})(\d{2})(\d{2})$/.exec(t);
    if(fm){ cur={type:"FM",start:resolveDay(+fm[1],+fm[2],+fm[3],res.issue||ref),end:res.to,toks:[t]}; res.groups.push(cur); continue; }
    if(t==="BECMG"||t==="TEMPO"||/^PROB\d{2}$/.test(t)){
      let type=t, label=[t]; let j=i+1;
      if(/^PROB/.test(t)&&toks[j]==="TEMPO"){ type=t+" TEMPO"; label.push("TEMPO"); j++; }
      const p=per(toks[j]);
      if(p){ label.push(toks[j]); cur={type,start:p[0],end:p[1],toks:label}; i=j; }
      else { cur={type,start:null,end:null,toks:label}; i=j-1; }
      res.groups.push(cur); continue;
    }
    const tx=/^(TX|TN)(M?\d{2})\/(\d{2})(\d{2})Z$/.exec(t);
    if(tx){ const o={val:+tx[2].replace("M","-"),time:resolveDay(+tx[3],+tx[4],0,res.issue||ref)}; if(tx[1]==="TX") res.tx=o; else res.tn=o; cur.toks.push(t); continue; }
    cur.toks.push(t);
  }
  // FM-Gruppen enden mit nächster FM-Gruppe
  const fms=res.groups.filter(g=>g.type==="FM"||g.type==="BASE");
  for(let k=0;k<fms.length-1;k++){ fms[k].end = fms[k+1].start < fms[k].end ? fms[k+1].start : fms[k].end; }
  for(const g of res.groups){ g.text=g.toks.join(" "); for(const t of g.toks){ const w=parseWind(t); if(w){ g.wind=w; break; } } }
  if(res.groups[0]){ const hdr=toks.slice(0,toks.length-0).join(" "); const n=res.groups[0].toks.length; const start=s.indexOf(res.groups[0].toks[0]||"§"); res.groups[0].head=start>0?s.slice(0,start).trim():s; }
  return res;
}
function tafCovers(taf,t){ return taf&&taf.from&&taf.to&&t>=taf.from&&t<=taf.to; }
function tafWindAt(taf,t){
  if(!taf) return null;
  let w=taf.groups[0]&&taf.groups[0].wind||null, src="Basis";
  for(const g of taf.groups){
    if((g.type==="FM"||g.type==="BECMG")&&g.start&&g.start<=t&&g.wind){ w=g.wind; src=g.type+" "+fmtZ(g.start); }
  }
  return w?{...w,src}:null;
}
function tafWindCands(taf,t){ // alle zum Zeitpunkt möglichen vorherrschenden Winde (BECMG-Übergang: alt + neu)
  if(!taf) return [];
  let cur=taf.groups[0]&&taf.groups[0].wind?[{...taf.groups[0].wind,src:"Basis"}]:[];
  for(const g of taf.groups){
    if(!g.wind||!g.start||g.start>t) continue;
    const w={...g.wind,src:g.type+" "+fmtZ(g.start)};
    if(g.type==="FM") cur=[w];
    else if(g.type==="BECMG"){ cur = (g.end&&t<g.end) ? cur.concat([{...w,src:w.src+" (Übergang)"}]) : [w]; }
  }
  return cur;
}
function tafRelevant(taf,a,b){ // Gruppen, die das Fenster [a,b] berühren
  if(!taf) return [];
  const fmAfter=(g)=>taf.groups.some(h=>h.type==="FM"&&h.start>g.start&&h.start<=a);
  return taf.groups.filter(g=>{
    if(!g.start||!g.end) return false;
    if(g.type==="BECMG") return g.start<b && !fmAfter(g); // BECMG-Bedingungen gelten nach Übergang weiter
    return g.start<b&&g.end>a;
  });
}
function tafTempAt(taf,t){
  if(!taf||!taf.tx||!taf.tn) return null;
  const pts=[taf.tx,taf.tn].sort((x,y)=>x.time-y.time);
  if(t<=pts[0].time) return {val:pts[0].val,how:"vor erstem TX/TN-Zeitpunkt – Wert übernommen"};
  if(t>=pts[1].time) return {val:pts[1].val,how:"nach letztem TX/TN-Zeitpunkt – Wert übernommen"};
  const f=(t-pts[0].time)/(pts[1].time-pts[0].time);
  return {val:lerp(pts[0].val,pts[1].val,f),how:"linear zwischen TN und TX interpoliert"};
}
function fmtZ(d){ if(!d) return "—"; const p=n=>String(n).padStart(2,"0"); return p(d.getUTCDate())+"/"+p(d.getUTCHours())+p(d.getUTCMinutes())+"Z"; }

if(typeof module!=="undefined") module.exports={FBH,cgFwdLimit,CG_AFT,interp2,pressAlt,tasFromIas,vrVapp,climbRoc,distTable,runwayDistances,windComponents,parseMetar,parseTaf,tafWindAt,tafTempAt,tafRelevant,tafCovers,fmtZ,windFactor};
