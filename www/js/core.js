/* ===== D40 Fuel & Performance – Rechenkern (Grundlage: FBH-B D40, Stand 01 09 26) ===== */
const FBH = {
  stand: "FBH-B D40, Stand 01 09 26",
  // 4.1.2 Rotier- und Anfluggeschwindigkeiten (Masse kg -> KIAS)
  vrVapp: [[1000,58,68],[1100,61,72],[1125,62,73],[1150,63,74],[1175,64,75],[1200,65,76],[1280,67,77],[1310,67,77]],
  // 4.4 Treibstoffverbrauch (Leistung % -> USG/h)
  ff: {30:2.9,35:3.3,40:3.7,45:4.0,50:4.4,55:4.7,60:5.1,65:5.6,70:6.1,75:6.6,80:7.1,85:7.6,90:8.1,92:8.3,100:9.4},
  // Start-/Lande-/Steigdaten: siehe afm-data.js (AFM Kap. 5.3.7-5.3.12)
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

function massBracket(mass){ // [leichter, schwerer, t]; unter kleinster Masse: kleinste Tabelle (AFM 5.2)
  const M=AFM_DATA.masses;
  if(mass<=M[0]) return [M[0],M[0],0];
  for(let i=0;i<M.length-1;i++){ if(mass<=M[i+1]+1e-9) return [M[i],M[i+1],(mass-M[i])/(M[i+1]-M[i])]; }
  return null;
}
function climbRoc(table,mass,pa,oat){
  if(mass>FBH.maxTOM+0.01) return {roc:null,note:"Masse über 1310 kg"};
  let note=""; if(mass<AFM_DATA.masses[0]) note="Masse < 1100 kg: Werte für 1100 kg (AFM 5.2)";
  if(oat<-20) oat=-20; if(pa<0) pa=0;
  const [lo,hi,t]=massBracket(mass);
  const a=interp2(AFM_DATA.climbPA,AFM_DATA.climbT,table[lo],pa,oat), b=interp2(AFM_DATA.climbPA,AFM_DATA.climbT,table[hi],pa,oat);
  if(a==null||b==null) return {roc:null,note:"außerhalb der Tabelle"};
  return {roc:lerp(a,b,t),note};
}

function distMass(kind,mass,pa,oat){
  const T=AFM_DATA[kind]; let note="";
  const br=massBracket(mass); if(!br) return {roll:null,d50:null,note:"Masse über 1310 kg"};
  if(mass<AFM_DATA.masses[0]) note="Masse < 1100 kg: Werte für 1100 kg (AFM 5.2)";
  let o=oat; if(o<0){ o=0; note=(note?note+"; ":"")+"OAT < 0 °C: Spalte 0 °C verwendet"; }
  if(pa>10000) return {roll:null,d50:null,note:"PA > 10.000 ft – außerhalb der Tabelle"};
  const p=Math.max(pa,0);
  const [lo,hi,t]=br;
  const r0=interp2(AFM_DATA.distPA,AFM_DATA.distT,T[lo].roll,p,o), r1=interp2(AFM_DATA.distPA,AFM_DATA.distT,T[hi].roll,p,o);
  const d0=interp2(AFM_DATA.distPA,AFM_DATA.distT,T[lo].d50,p,o), d1=interp2(AFM_DATA.distPA,AFM_DATA.distT,T[hi].d50,p,o);
  if(r0==null||r1==null||d0==null||d1==null) return {roll:null,d50:null,note:"außerhalb der Tabelle"};
  return {roll:lerp(r0,r1,t),d50:lerp(d0,d1,t),note};
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
    const g={"grass5":["Gras trocken ≤ 5 cm",1.30],"grass10":["Gras trocken > 5 cm (mind. 45 %)",1.45],"grass25":["Gras trocken > 5 cm (mind. 45 %)",1.45],"grasswet":["nasses Gras",1.15],"soft":["weicher Boden",1.15],"wet":["befestigte, nasse Piste",1.15]}[surface];
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

function runwayDistances(kind,mass,pa,oat,headwind,surface,slope,fairingsOff){
  const t = distMass(kind,mass,pa,oat);
  if(t.roll==null) return {ok:false,note:t.note};
  const steps=[];
  let roll=t.roll, d50=t.d50;
  steps.push(["AFM-Tabellenwert ("+Math.round(mass)+" kg)",roll,d50]);
  if(kind==="to" && fairingsOff){ roll+=20; d50+=30; steps.push(["ohne Radverkleidungen (+20/+30 m)",roll,d50]); }
  const wf=windFactor(kind,headwind||0);
  if(Math.abs(wf-1)>1e-6){ roll*=wf; d50*=wf; steps.push([(headwind>=0?"Gegenwind ":"Rückenwind ")+Math.abs(headwind).toFixed(0)+" kt ("+((wf-1)*100).toFixed(0)+" %)",roll,d50]); }
  for(const [lab,f] of surfaceFactors(kind,surface,slope)){
    const inc=roll*(f-1); roll+=inc; d50+=inc; steps.push([lab+" (+"+((f-1)*100).toFixed(0)+" % Rollstrecke)",roll,d50]);
  }
  return {ok:true,roll,d50,steps,note:t.note};
}


/* ===== Steigflug / Reiseflug (AFM 5.3.10, 5.3.11) ===== */
function isaTemp(paFt){ return 15-1.98*paFt/1000; }
function profileAt(mass,pa){ // [min, USG, NM] ab Meereshoehe (ISA), Masse interpoliert
  const P=AFM_DATA.climbProfile, PA=AFM_DATA.climbProfilePA;
  const [lo,hi,t]=massBracket(mass);
  const at=(m)=>{ const [i,ti]=bracket(PA,Math.max(0,Math.min(pa,PA[PA.length-1])));
    return [0,1,2].map(k=>lerp(P[m][i][k],P[m][i+1][k],ti)); };
  const a=at(lo), b=at(hi); return a.map((v,k)=>lerp(v,b[k],t));
}
/** Steigflug von Platzhoehe (PA) auf Reiseflughoehe (PA), 88 KIAS / 92 %. AFM: +5 % Zeit/Treibstoff, +10 % Strecke je 10 C ueber ISA. */
function climbToAlt(mass,depPA,depOAT,cruisePA){
  if(cruisePA>16000) return {ok:false,note:"Reiseflughöhe > 16.000 ft – außerhalb der AFM-Tabelle"};
  if(mass>FBH.maxTOM+0.01) return {ok:false,note:"Masse über 1310 kg"};
  const a=profileAt(mass,Math.max(depPA,0)), b=profileAt(mass,cruisePA);
  let min=Math.max(0,b[0]-a[0]), usg=Math.max(0,b[1]-a[1]), nm=Math.max(0,b[2]-a[2]);
  const dev=Math.max(0,(depOAT==null?isaTemp(depPA):depOAT)-isaTemp(depPA));
  const ft=1+0.05*dev/10, fd=1+0.10*dev/10;
  return {ok:true,min:min*ft,usg:usg*ft,nm:nm*fd,dev,note:dev>0?`ISA+${dev.toFixed(0)} °C: Zeit/Treibstoff +${(5*dev/10).toFixed(1)} %, Strecke +${(10*dev/10).toFixed(1)} % (AFM 5.3.10)`:""};
}
/** Reiseflug-TAS aus AFM 5.3.11 (1310 kg), Leistung zwischen den Stufen 45/60/75/92 % linear interpoliert */
function cruiseTas(paFt,oatC,power){
  const D=AFM_DATA, pa=Math.max(D.cruisePA[0],Math.min(paFt,D.cruisePA[D.cruisePA.length-1]));
  const dev=Math.max(D.cruiseDev[0],Math.min(oatC-isaTemp(paFt),D.cruiseDev[D.cruiseDev.length-1]));
  const [i,ti]=bracket(D.cruisePA,pa), [j,tj]=bracket(D.cruiseDev,dev);
  const tas=p=>{ const T=D.cruiseTas[p]; return lerp(lerp(T[i][j],T[i][j+1],tj),lerp(T[i+1][j],T[i+1][j+1],tj),ti); };
  const levels=[45,60,75,92]; if(power<levels[0]||power>levels[3]) return null;
  let k=0; while(k<levels.length-2&&power>levels[k+1]) k++;
  const t=(power-levels[k])/(levels[k+1]-levels[k]);
  return lerp(tas(levels[k]),tas(levels[k+1]),t);
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

if(typeof module!=="undefined") module.exports={AFM_DATA,isaTemp,climbToAlt,cruiseTas,massBracket,distMass,cgFwdLimit,CG_AFT,interp2,pressAlt,tasFromIas,vrVapp,climbRoc,runwayDistances,windComponents,parseMetar,parseTaf,tafWindAt,tafTempAt,tafRelevant,tafCovers,fmtZ,windFactor};
