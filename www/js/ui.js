/* ===== UI, Berechnung, PDF ===== */
const $=id=>document.getElementById(id);
const APS=["dep","dest","altn"];
const APNAME={dep:"DEPARTURE",dest:"DESTINATION",altn:"ALTERNATE"};
let R={};
const f1=(v,d=1)=>v==null||isNaN(v)?"—":Number(v).toLocaleString("de-AT",{minimumFractionDigits:d,maximumFractionDigits:d});
const f0=v=>f1(v,0);
const num=id=>{ const e=$(id); if(!e) return null; const v=parseFloat(String(e.value).replace(",",".")); return isNaN(v)?null:v; };
const val=id=>{ const e=$(id); return e?(e.type==="checkbox"?e.checked:e.value):null; };
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- FBH-B Zitate (Kap. 5) ---------- */
const QUOTE = {
  dest: {ref:"5.2.2 Zielflugplatz (S. 96)", txt:"Das Wetter am Zielflugplatz muss gemäß dem aktuellen Wetter oder der Vorhersage oder jeglicher Kombination daraus im Zeitraum eine Stunde vor ETA bis eine Stunde nach ETA über den für den jeweiligen Anflug geforderten Mindestwerten liegen. Ist dies nicht der Fall, so kann der Flug mit zwei Ausweichflugplätzen geplant werden (siehe Kapitel 5.2.3.2)."},
  altGen: {ref:"5.2.3 Ausweichflugplatzplanung (S. 96)", txt:"Folgende Planungsvarianten sind möglich: Destination with Alternate · Closed Destination with 2 Alternates · Destination without Alternate Class I · Destination without Alternate Class II. Andere Planungsvarianten sind nicht erlaubt.\nGrundsätzlich muss die verfügbare Landestrecke auf einem Ausweichflugplatz mindestens 750 Meter betragen. Ausnahmen nur nach gesonderter Beurteilung des Flugauftragserteilenden.\nWenn für den Ausweichflugplatz ein RNP-Approach geplant ist, muss das zweite Anflugverfahren ein konventionelles Anflugverfahren, ein Visual Approach bzw. VFR Anflug aus der MHA/MRVA sein."},
  withAlt: {ref:"5.2.3.1 Destination with Alternate (S. 97)", txt:"Das Wetter am Ausweichflugplatz muss gemäß dem aktuellen Wetter oder der Vorhersage oder jeglicher Kombination daraus im Zeitraum eine Stunde vor ETA bis eine Stunde nach ETA über den für die Anflüge geforderten Mindestwerten liegen und es sind auf der voraussichtlich aktiven Betriebspiste\n• 2 voneinander unabhängige IFR-Anflugverfahren plan- und verfügbar, oder\n• ein Visual Approach bzw. VFR Anflug aus der MHA/MRVA möglich, oder\n• dieser Alternate ist von der Destination VFR erreichbar."},
  suitable: {ref:"Ablaufschema Ausweichflugplatzplanung (S. 99)", txt:"ALTERNATE SUITABLE? MET-Werte ETA ± 1 h:\n• MET-Werte vom zweitbesten Anflugverfahren, oder\n• Visibility 5 km, Ceiling MHA/MRVA + 500 ft, oder\n• VMC von Destination zum Alternate."},
  cls1: {ref:"5.2.3.3 Destination without Alternate Class I (S. 97)", txt:"Diese Planungsvariante ist nur bei Prioritätsflügen A und B erlaubt und wird im FBH-A Kapitel 9.3.4.2 (EINGESCHRÄNKT) erklärt."},
  cls1chart: {ref:"Ablaufschema – Class I (S. 99)", txt:"• anwendbar bei: Einsätze gemäß §2 Abs.2 Zi.3 WG 2001 oder Flüge Priorität „A“ oder „B“\n• Flugplatz verfügbar\n• auf voraussichtlicher Betriebspiste 2 unabhängige Anflugverfahren"},
  cls2: {ref:"5.2.3.4 Destination without Alternate Class II (S. 97–98)", txt:"Diese Planungsvariante ist nur nach gesonderter Beurteilung durch den Flugauftragserteilenden erlaubt.\nWetterbedingungen von Start bis ETA + 1h mindestens:\n• Tag: 1,5 km Sicht, 600 ft ceiling\n• Nacht: 3,5 km Sicht, 1.200 ft ceiling\nNotwendige Bedingungen:\n• Flugplatz ist verfügbar und verfügt über 2 unabhängige Landemöglichkeiten\n• auf der voraussichtlichen Betriebspiste sind 2 voneinander unabhängige IFR-Anflugverfahren plan- und verfügbar, oder\n• ein Visual Approach bzw. VFR Anflug aus der MHA/MRVA ist möglich.\nFür weitere Details siehe FBH-A Kapitel 9.3.4.2 (EINGESCHRÄNKT)."},
  addFuel: {ref:"5.3 Treibstoffplanung (S. 100)", txt:"Additional Fuel No Alternate Required: 5 USG (= 45 Min mit 75 % PWR)"}
};
function quotesFor(withAlt){
  return withAlt ? [QUOTE.dest,QUOTE.altGen,QUOTE.withAlt,QUOTE.suitable] : [QUOTE.dest,QUOTE.altGen,QUOTE.cls1,QUOTE.cls1chart,QUOTE.cls2,QUOTE.addFuel];
}

/* ---------- Zeiten ---------- */
function etdDate(){
  const d=val("dof"); const t=(val("etd")||"").replace(/\D/g,"").padStart(4,"0");
  if(!d) return null;
  const [y,m,dd]=d.split("-").map(Number);
  return new Date(Date.UTC(y,m-1,dd,+t.slice(0,2),+t.slice(2,4)));
}
const addMin=(d,m)=>d?new Date(+d+m*60000):null;
const hhmm=d=>d?String(d.getUTCHours()).padStart(2,"0")+String(d.getUTCMinutes()).padStart(2,"0")+" UTC":"—";

/* ---------- Hauptberechnung ---------- */
function compute(){
  const r={warn:[]};
  const withAlt=val("withAlt"); r.withAlt=withAlt;
  const ifr=val("rules")==="IFR"; r.ifr=ifr;
  r.etd=etdDate();
  const eetD=num("eetDest")||0, appr=num("apprMin")||0, eetA=num("eetAltn")||0;
  r.etaDest=addMin(r.etd,eetD+appr);
  r.etaAltn=withAlt?addMin(r.etaDest,eetA+appr):null;
  const timeOf={dep:r.etd,dest:r.etaDest,altn:r.etaAltn};
  const ref=r.etd||new Date();
  const varE=num("varE")||0;

  /* Wetter & Flugplatzdaten */
  r.ap={};
  for(const a of APS){
    if(a==="altn"&&!withAlt) continue;
    const o={icao:(val(a)||"").toUpperCase(),t:timeOf[a]};
    o.metar=parseMetar(val(a+"Metar"));
    o.taf=parseTaf(val(a+"Taf"),ref);
    o.win=o.t?[addMin(o.t,-60),addMin(o.t,60)]:null;
    o.rel=o.win?tafRelevant(o.taf,o.win[0],o.win[1]):[];
    if(o.taf&&o.win&&!(tafCovers(o.taf,o.win[0])&&tafCovers(o.taf,o.win[1]))) r.warn.push(`${o.icao||APNAME[a]}: TAF deckt den Zeitraum ${fmtZ(o.win[0])}–${fmtZ(o.win[1])} nicht vollständig ab.`);
    if(!o.taf) r.warn.push(`${o.icao||APNAME[a]}: kein TAF eingefügt.`);
    // Temperatur
    const mode=val(a+"TempMode"); let temp=null, tsrc="";
    const ti=o.t?tafTempAt(o.taf,o.t):null;
    if(mode==="manual"){ temp=num(a+"TempMan"); tsrc="manuell"; }
    else if(mode==="tx"){ if(o.taf&&o.taf.tx){ temp=o.taf.tx.val; tsrc="TAF TX (konservativ)"; } }
    else if(mode==="metar"){ if(o.metar&&o.metar.temp!=null){ temp=o.metar.temp; tsrc="METAR"; } }
    else { if(ti){ temp=ti.val; tsrc="TAF TX/TN, "+ti.how; } }
    if(temp==null && o.metar&&o.metar.temp!=null && mode!=="manual"){ temp=o.metar.temp; tsrc="METAR (TAF ohne TX/TN)"; r.warn.push(`${o.icao||APNAME[a]}: Temperatur aus TAF nicht verfügbar – METAR-Wert verwendet.`); }
    o.temp=temp; o.tsrc=tsrc;
    // QNH
    let qnh=num(a+"QnhMan"); o.qsrc="manuell";
    if(qnh==null&&o.metar&&o.metar.qnh){ qnh=o.metar.qnh; o.qsrc="METAR"; }
    if(qnh==null){ qnh=1013.25; o.qsrc="Standard (kein QNH)"; }
    o.qnh=qnh;
    o.elev=num(a+"Elev");
    if(o.elev==null) r.warn.push(`${o.icao||APNAME[a]}: Platzhöhe fehlt.`);
    o.pa=o.elev!=null?pressAlt(o.elev,qnh):null;
    // Wind
    const wm=(val(a+"WindMan")||"").trim().toUpperCase();
    let w=null; o.wsrc="";
    if(wm){ const m=/^(\d{3})\/?(\d{1,3})$/.exec(wm.replace("KT","")); if(m){ w={dir:+m[1],spd:+m[2]}; o.wsrc="manuell"; } }
    const rwy=num(a+"Rwy"); o.rwy=rwy!=null?(rwy<=36?rwy*10:rwy):null;
    if(!w&&o.t){
      const cands=tafWindCands(o.taf,o.t);
      if(cands.length){
        // ungünstigster Wind für die Piste (geringste Gegenwind-/größte Rückenwindkomponente)
        const hd=x=>(x.vrb||x.dir==null)?-x.spd:(o.rwy!=null?windComponents(x.dir,x.spd,o.rwy,varE).head:0);
        cands.sort((p,q)=>hd(p)-hd(q)); w=cands[0];
        o.wsrc="TAF "+w.src+(cands.length>1?", ungünstigster Wert":"");
      }
    }
    if(!w&&o.metar&&o.metar.wind){ w=o.metar.wind; o.wsrc="METAR"; }
    o.wind=w;
    o.surf=val(a+"Surf"); o.slope=num(a+"Slope")||0; o.len=num(a+"Len");
    o.comp=null;
    if(w&&o.rwy!=null){
      if(w.vrb||w.dir==null){ o.comp={head:-w.spd,cross:w.spd,vrb:true}; }
      else o.comp=windComponents(w.dir,w.spd,o.rwy,varE);
    }
    if(o.comp){
      if(o.comp.head<-FBH.wind.tail) r.warn.push(`${o.icao}: Rückenwindkomponente ${f0(-o.comp.head)} kt > ${FBH.wind.tail} kt (FBH-B 1.13).`);
      if(o.comp.cross>FBH.wind.cross) r.warn.push(`${o.icao}: Seitenwindkomponente ${f0(o.comp.cross)} kt > ${FBH.wind.cross} kt (FBH-B 1.13).`);
      if(w.spd>FBH.wind.mean) r.warn.push(`${o.icao}: Mittelwind ${w.spd} kt > 30 kt – kein Flugdienst planen (FBH-B 1.13).`);
    }
    r.ap[a]=o;
  }

  /* Treibstoff FBH-B 5.3 */
  const F={}; r.fuel=F;
  F.method=val("fuelMethod"); const cp=+val("cruisePwr");
  F.ffCruise = F.method==="rule"?6.6:FBH.ff[cp];
  F.ffClimb = FBH.ff[92];
  const climbMin = F.method==="rule"?0:Math.min(num("climbMin")||0,eetD);
  F.taxi=1;
  F.tripEnroute = climbMin/60*F.ffClimb + (eetD-climbMin)/60*F.ffCruise;
  F.tripAppr = ifr?2:0;
  F.trip = F.tripEnroute+F.tripAppr;
  F.cont = 0.10*F.trip;
  F.final = 3;
  if(withAlt){
    F.holdMin = ifr?(+val("holdMin")):0;
    F.holdPwr = +val("holdPwr");
    F.altEnroute = eetA/60*F.ffCruise;
    F.altAppr = ifr?2:0;
    F.altHold = F.holdMin/60*FBH.ff[F.holdPwr];
    F.alt = F.altEnroute+F.altAppr+F.altHold;
    F.add = 0;
  } else { F.alt=0; F.altEnroute=0; F.altAppr=0; F.altHold=0; F.add=5; }
  F.req = F.taxi+F.trip+F.cont+F.alt+F.add+F.final;
  F.fob = num("fob");
  F.extra = F.fob!=null?F.fob-F.req:null;
  F.afterLanding = F.fob!=null?F.fob-F.taxi-F.trip:null;
  F.endurance = F.fob!=null?(F.fob-F.taxi)/6.6*60:null;
  if(F.fob!=null&&F.fob>FBH.usableFuel) r.warn.push(`Fuel on board ${f1(F.fob)} USG > ${FBH.usableFuel} USG verfügbarer Treibstoff (FBH-B 5.3).`);
  if(F.extra!=null&&F.extra< -1e-6) r.warn.push(`Fuel on board unterschreitet den Mindesttreibstoff um ${f1(-F.extra)} USG.`);
  if(F.method==="rule"&&F.afterLanding!=null&&F.afterLanding<10) r.warn.push(`Faustformel 6,6 USG/h nur zulässig, wenn nach der Landung noch 10 USG vorhanden sind (vorhanden: ${f1(F.afterLanding)} USG) – genaue Berechnung nach FHB-Tabellen erforderlich (FBH-B 5.3).`);

  /* Weight & Balance FBH-B 6.1 */
  const W={}; r.wb=W; const A=FBH.arm, k=FBH.kgPerUSG;
  const eM=num("emptyM")||0, eMo=num("emptyMom")||0;
  const front=(num("seatL")||0)+(num("seatR")||0), rear=(num("rearL")||0)+(num("rearR")||0), bf=num("bagF")||0, ba=num("bagA")||0;
  W.rows=[["Empty mass",eM,eM?eMo/eM:null,eMo],["Front seats",front,A.front,front*A.front],["Rear seats",rear,A.rear,rear*A.rear],["FWD Baggage",bf,A.fwdBag,bf*A.fwdBag],["AFT Baggage",ba,A.aftBag,ba*A.aftBag]];
  const zfm=W.rows.reduce((s,x)=>s+x[1],0), zmo=W.rows.reduce((s,x)=>s+x[3],0);
  const phase=(name,m,mo,max)=>({name,m,mo,cg:m?mo/m:null,max});
  const fobKg=(F.fob||0)*k, taxiKg=F.taxi*k, tripKg=F.trip*k, altTripKg=(F.altEnroute+F.altAppr)*k;
  W.zfm=phase("Zero fuel mass",zfm,zmo,FBH.maxZFM);
  W.ramp=phase("Ramp mass (vor Taxi)",zfm+fobKg,zmo+fobKg*A.fuel,FBH.maxTXM);
  W.tom=phase("Take off mass",W.ramp.m-taxiKg,W.ramp.mo-taxiKg*A.fuel,FBH.maxTOM);
  W.lmDest=phase("Landing mass DEST",W.tom.m-tripKg,W.tom.mo-tripKg*A.fuel,FBH.maxLM);
  W.lmAltn=withAlt?phase("Landing mass ALTN",W.lmDest.m-altTripKg,W.lmDest.mo-altTripKg*A.fuel,FBH.maxLM):null;
  W.fuelKg={fob:fobKg,taxi:taxiKg,trip:tripKg,alt:altTripKg};
  W.phases=[W.zfm,W.ramp,W.tom,W.lmDest].concat(W.lmAltn?[W.lmAltn]:[]);
  for(const p of W.phases){
    p.fwd=cgFwdLimit(p.m); p.aft=CG_AFT;
    p.okMass=p.m<=p.max+1e-6; p.okCg=p.cg!=null&&p.cg>=p.fwd-1e-4&&p.cg<=p.aft+1e-4&&p.m>=FBH.minMass;
    if(p!==W.ramp&&eM){ if(!p.okMass) r.warn.push(`${p.name} ${f1(p.m)} kg > max. ${p.max} kg.`); if(!p.okCg) r.warn.push(`${p.name}: Schwerpunkt ${f1(p.cg,3)} m außerhalb ${f1(p.fwd,3)}–${f1(p.aft,3)} m.`); }
    if(p===W.ramp&&eM&&!p.okMass) r.warn.push(`Ramp mass ${f1(p.m)} kg > max. TXM ${p.max} kg.`);
  }
  if(bf>FBH.maxFwdBag) r.warn.push(`FWD Baggage ${bf} kg > 45 kg.`);
  if(ba>FBH.maxAftBag) r.warn.push(`AFT Baggage ${ba} kg > 18 kg.`);
  if(bf+ba>FBH.maxBagTotal) r.warn.push(`Gepäckraum gesamt ${bf+ba} kg > 45 kg (FBH-B 7.2).`);
  if(!eM) r.warn.push("Leermasse/Moment fehlen.");

  /* Performance FBH-B 4 */
  const P={}; r.perf=P; const fo=val("fairingsOff");
  P.vrTo=vrVapp(W.tom.m); P.vappDest=vrVapp(W.lmDest.m); P.vappAltn=W.lmAltn?vrVapp(W.lmAltn.m):null;
  const dep=r.ap.dep, dst=r.ap.dest, alt=r.ap.altn;
  const hw=o=>o.comp?o.comp.head:0;
  if(dep&&dep.pa!=null&&dep.temp!=null) P.to=runwayDistances("to",dep.pa,dep.temp,hw(dep),dep.surf,dep.slope,fo);
  if(dst&&dst.pa!=null&&dst.temp!=null) P.ldDest=runwayDistances("ld",dst.pa,dst.temp,hw(dst),dst.surf,dst.slope,false);
  if(alt&&alt.pa!=null&&alt.temp!=null) P.ldAltn=runwayDistances("ld",alt.pa,alt.temp,hw(alt),alt.surf,alt.slope,false);
  if(P.to&&P.to.ok&&P.ldDest) {}
  if(P.to&&P.to.ok){
    // Startabbruch bei VR: Start- + Landerollstrecke (FBH-B 4.6) am Startplatz
    const l=runwayDistances("ld",dep.pa,dep.temp,hw(dep),dep.surf,dep.slope,false);
    P.asd=l.ok?P.to.roll+l.roll:null;
    if(dep.len&&P.to.d50>dep.len) r.warn.push(`${dep.icao}: Startstrecke 15 m ${f0(P.to.d50)} m > TORA ${f0(dep.len)} m.`);
  }
  if(P.ldDest&&P.ldDest.ok&&dst.len&&P.ldDest.d50>dst.len) r.warn.push(`${dst.icao}: Landestrecke 15 m ${f0(P.ldDest.d50)} m > LDA ${f0(dst.len)} m.`);
  if(P.ldAltn&&P.ldAltn.ok&&alt.len&&P.ldAltn.d50>alt.len) r.warn.push(`${alt.icao}: Landestrecke 15 m ${f0(P.ldAltn.d50)} m > LDA ${f0(alt.len)} m.`);
  if(withAlt&&alt&&alt.len!=null&&alt.len<750) r.warn.push(`${alt.icao}: verfügbare Landestrecke ${f0(alt.len)} m < 750 m (FBH-B 5.2.3).`);
  for(const k of ["to","ldDest","ldAltn"]) if(P[k]&&!P[k].ok) r.warn.push(`Strecke ${k==="to"?"Start":"Landung"}: ${P[k].note}.`);

  // Steiggradient
  const grad=(tab,ias,m,o,red,label,req)=>{
    if(!o||o.pa==null||o.temp==null) return null;
    const c=climbRoc(tab,m,o.pa,o.temp); if(c.roc==null) return {label,note:c.note};
    const roc=c.roc-(fo?red:0);
    const tas=tasFromIas(ias,o.pa,o.temp);
    const tail=o.comp&&o.comp.head<0?-o.comp.head:0;
    const gs=tas+tail; // ungünstigste Variante: kein Gegenwind angerechnet
    const g=roc*0.98/gs;
    const rocReq=req*gs/0.98;
    return {label,ias,roc,tas,gs,tail,grad:g,req,rocReq,ok:g>=req,note:c.note};
  };
  const rd=num("reqGradDep")||3.3, rg=num("reqGradGA")||2.5;
  P.climbDep=[grad(FBH.crClimb,88,W.tom.m,dep,40,"Cruise Climb (flaps UP, 88 KIAS, 92 %)",rd),grad(FBH.toClimb,72,W.tom.m,dep,20,"Take-off Climb (flaps T/O, 72 KIAS, 92 %)",rd)].filter(Boolean);
  P.climbGA=[grad(FBH.toClimb,72,W.lmDest.m,dst,20,"Take-off Climb (flaps T/O, 72 KIAS, 92 %)",rg),grad(FBH.crClimb,88,W.lmDest.m,dst,40,"Cruise Climb (flaps UP, 88 KIAS, 92 %)",rg)].filter(Boolean);
  if(P.climbDep.length&&P.climbDep.every(x=>x.grad!=null&&!x.ok)) r.warn.push(`Abflug ${dep.icao}: geforderter Steiggradient ${f1(rd)} % wird nicht erreicht.`);
  else if(P.climbDep[0]&&P.climbDep[0].grad!=null&&!P.climbDep[0].ok) r.warn.push(`Abflug ${dep.icao}: Cruise Climb erreicht ${f1(rd)} % nicht – Take-off Climb anwenden (FBH-B 4.3 / LB 2113 Kap. 1.5).`);
  if(P.climbGA[0]&&P.climbGA[0].grad!=null&&!P.climbGA[0].ok) r.warn.push(`Durchstarten ${dst.icao}: geforderter Steiggradient ${f1(rg)} % wird nicht erreicht.`);
  return r;
}

/* ---------- Darstellung ---------- */
function fmtWind(w){ if(!w) return "—"; return (w.vrb||w.dir==null?"VRB":String(w.dir).padStart(3,"0"))+"°/"+w.spd+(w.gst?"G"+w.gst:"")+" kt"; }
function tafHtml(o){
  if(!o.taf) return '<span class="muted">kein TAF</span>';
  const rel=new Set(o.rel);
  return o.taf.groups.map((g,i)=>{ const t=esc(i===0?(g.head?g.head+" ":"")+g.text:g.text); return rel.has(g)?`<mark title="relevant ETA ±1 h">${t}</mark>`:t; }).join(" ");
}
function render(){
  const r=R=compute();
  document.body.classList.toggle("noalt",!r.withAlt);
  $("planLabel").textContent=r.withAlt?"DESTINATION WITH DESTINATION ALTERNATE":"DESTINATION WITHOUT ALTERNATE";
  $("quotes").innerHTML=quotesFor(r.withAlt).map(q=>`<blockquote><div class="qref">FBH-B D40 · ${esc(q.ref)}</div>${esc(q.txt).replace(/\n/g,"<br>")}</blockquote>`).join("");
  $("etaOut").innerHTML=`ETD ${hhmm(r.etd)} · ETA DEST ${hhmm(r.etaDest)}${r.withAlt?" · ETA ALTN "+hhmm(r.etaAltn):""}`;
  for(const a of APS){
    const o=r.ap[a]; const box=$(a+"Out"); if(!box) continue;
    if(!o){ box.innerHTML=""; continue; }
    box.innerHTML=`<div class="kv"><span>Zeitpunkt</span><b>${hhmm(o.t)}</b><span>Fenster ±1 h</span><b>${o.win?fmtZ(o.win[0])+" – "+fmtZ(o.win[1]):"—"}</b>
      <span>OAT</span><b>${o.temp!=null?f1(o.temp)+" °C":"—"}</b><span>Quelle</span><b class="small">${esc(o.tsrc||"—")}</b>
      <span>QNH</span><b>${f0(o.qnh)} hPa <small>(${esc(o.qsrc)})</small></b><span>Druckhöhe</span><b>${o.pa!=null?f0(o.pa)+" ft":"—"}</b>
      <span>Wind</span><b>${fmtWind(o.wind)} <small>(${esc(o.wsrc||"—")})</small></b><span>Komponenten</span><b>${o.comp?(o.comp.head>=0?"Gegenwind ":"Rückenwind ")+f0(Math.abs(o.comp.head))+" kt · Seitenwind "+f0(o.comp.cross)+" kt":"Piste eingeben"}</b></div>
      <div class="raw">${tafHtml(o)}</div>`;
  }
  // Treibstoff
  const F=r.fuel;
  const fr=(l,d,v,cls="")=>`<tr class="${cls}"><td>${l}</td><td>${d}</td><td class="n">${f1(v)}</td></tr>`;
  $("fuelOut").innerHTML=`<table class="t"><thead><tr><th>Position</th><th>Grundlage FBH-B 5.3</th><th class="n">USG</th></tr></thead><tbody>
   ${fr("Taxi fuel","1 USG",F.taxi)}
   ${fr("Trip fuel",(r.ifr?"Start bis IAF ":"Start bis Landung ")+f0(num("eetDest"))+" min · "+(F.method==="rule"?"Faustformel 6,6 USG/h":"FHB 4.4: "+val("cruisePwr")+" % = "+f1(F.ffCruise)+" USG/h"+(num("climbMin")?", Steigflug "+f0(num("climbMin"))+" min @ 92 %":""))+(r.ifr?" + 2 USG Anflug":""),F.trip)}
   ${fr("Contingency fuel","10 % vom Trip fuel",F.cont)}
   ${r.withAlt?fr("Alternate fuel","wie Trip fuel ("+f0(num("eetAltn"))+" min"+(r.ifr?" + 2 USG Anflug + "+F.holdMin+" min Warteverfahren @ "+F.holdPwr+" %":"")+")",F.alt):fr("Additional fuel","No Alternate Required: 5 USG (= 45 min @ 75 %)",F.add)}
   ${fr("Final reserve fuel","3 USG",F.final)}
   ${fr("<b>Minimum required</b>","",F.req,"sum")}
   ${fr("Fuel on board","max. 39 USG verfügbar",F.fob)}
   ${fr("Extra fuel","FOB – Minimum",F.extra,F.extra<0?"bad":"")}
   </tbody></table><div class="kv"><span>Nach Landung DEST</span><b>${f1(F.afterLanding)} USG</b><span>Endurance (6,6 USG/h)</span><b>${F.endurance!=null?Math.floor(F.endurance/60)+" h "+String(Math.round(F.endurance%60)).padStart(2,"0")+" min":"—"}</b></div>`;
  // W&B
  const W=r.wb;
  $("wbOut").innerHTML=`<table class="t"><thead><tr><th></th><th class="n">Masse kg</th><th class="n">Arm m</th><th class="n">Moment mkg</th><th class="n">max kg</th></tr></thead><tbody>
   ${W.rows.map(x=>`<tr><td>${x[0]}</td><td class="n">${f1(x[1])}</td><td class="n">${f1(x[2],3)}</td><td class="n">${f1(x[3])}</td><td class="n">${x[0]==="FWD Baggage"?45:x[0]==="AFT Baggage"?18:""}</td></tr>`).join("")}
   </tbody></table>
   <table class="t"><thead><tr><th>Phase</th><th class="n">Masse kg</th><th class="n">CG m</th><th class="n">zulässig m</th><th class="n">max kg</th></tr></thead><tbody>
   ${W.phases.map(p=>`<tr class="${(!p.okMass||(!p.okCg&&p!==W.ramp))?"bad":""}"><td>${p.name}</td><td class="n">${f1(p.m)}</td><td class="n">${f1(p.cg,3)}</td><td class="n">${f1(p.fwd,3)}–${f1(p.aft,2)}</td><td class="n">${p.max}</td></tr>`).join("")}
   </tbody></table><div class="note">Treibstoff: ${f1(FBH.kgPerUSG,3)} kg/USG (FBH-B 6.1, JET A1), Arm 2,63 m. Landemasse ALTN ohne Warteverfahren-Verbrauch (konservativ schwer).</div>${cgSvg(W)}`;
  // Performance
  const P=r.perf;
  const dRow=(lab,d)=>!d?`<tr><td>${lab}</td><td colspan="2" class="muted">Daten fehlen</td></tr>`:!d.ok?`<tr class="bad"><td>${lab}</td><td colspan="2">${esc(d.note)}</td></tr>`:`<tr><td>${lab}</td><td class="n">${f0(d.roll)}</td><td class="n">${f0(d.d50)}</td></tr>`;
  const steps=d=>d&&d.ok?`<div class="note">${d.steps.map(s=>esc(s[0])+": "+f0(s[1])+" / "+f0(s[2])+" m").join(" → ")}${d.note?" · "+esc(d.note):""}</div>`:"";
  const gRow=g=>g.grad==null?`<tr><td>${esc(g.label)}</td><td colspan="4">${esc(g.note)}</td></tr>`:`<tr class="${g.ok?"good":"bad"}"><td>${esc(g.label)}</td><td class="n">${f0(g.roc)}</td><td class="n">${f0(g.gs)}</td><td class="n">${f1(g.grad)} %</td><td class="n">${f1(g.req)} % / ${f0(g.rocReq)} ft/min</td></tr>`;
  $("perfOut").innerHTML=`<div class="kv"><span>V<sub>R</sub> (TOM ${f0(W.tom.m)} kg)</span><b>${P.vrTo.vr??"—"} KIAS</b><span>V<sub>APP</sub> DEST (LM ${f0(W.lmDest.m)} kg)</span><b>${P.vappDest.vapp??"—"} KIAS</b>${P.vappAltn?`<span>V<sub>APP</sub> ALTN (LM ${f0(W.lmAltn.m)} kg)</span><b>${P.vappAltn.vapp??"—"} KIAS</b>`:""}</div>
   <table class="t"><thead><tr><th>Strecke (FBH-B 4.2 / 4.5)</th><th class="n">Rollstrecke m</th><th class="n">über 15 m/50 ft m</th></tr></thead><tbody>
   ${dRow("Start "+(r.ap.dep.icao||"DEP"),P.to)}${dRow("Landung "+(r.ap.dest.icao||"DEST"),P.ldDest)}${r.withAlt?dRow("Landung "+(r.ap.altn.icao||"ALTN"),P.ldAltn):""}
   ${P.asd?`<tr><td>Startabbruch bei V<sub>R</sub> (Start- + Landerollstrecke)</td><td class="n">${f0(P.asd)}</td><td></td></tr>`:""}</tbody></table>
   ${steps(P.to)}${steps(P.ldDest)}${r.withAlt?steps(P.ldAltn):""}
   <h4>Steiggradient Abflug ${esc(r.ap.dep.icao)} (TOM)</h4><table class="t"><thead><tr><th>Verfahren</th><th class="n">ROC ft/min</th><th class="n">GS kt</th><th class="n">Gradient</th><th class="n">gefordert</th></tr></thead><tbody>${P.climbDep.map(gRow).join("")||'<tr><td colspan="5" class="muted">Daten fehlen</td></tr>'}</tbody></table>
   <h4>Steiggradient Durchstarten ${esc(r.ap.dest.icao)} (LM DEST)</h4><table class="t"><thead><tr><th>Verfahren</th><th class="n">ROC ft/min</th><th class="n">GS kt</th><th class="n">Gradient</th><th class="n">gefordert</th></tr></thead><tbody>${P.climbGA.map(gRow).join("")||'<tr><td colspan="5" class="muted">Daten fehlen</td></tr>'}</tbody></table>
   <div class="note">Gradient [%] = ROC × 0,98 / GS (FBH-B 4.3). GS = TAS + Rückenwind; Gegenwind wird nicht angerechnet (ungünstigste Variante, LB 2113 Kap. 1.5). Start-/Landetabellen gelten für 1310 kg.</div>`;
  $("warnOut").innerHTML=r.warn.length?r.warn.map(w=>`<li>${esc(w)}</li>`).join(""):'<li class="ok">Keine Grenzwertüberschreitung erkannt.</li>';
  $("warnCount").textContent=r.warn.length;
  save();
}
function cgSvg(W){
  const X=c=>40+(c-2.39)/(2.54-2.39)*250, Y=m=>170-(m-920)/(1330-920)*155;
  const env=[[2.40,940],[2.40,1080],[2.469,1310],[2.53,1310],[2.53,940]];
  const pts=W.phases.filter(p=>p.cg&&p.name!=="Ramp mass (vor Taxi)");
  const lab={ "Zero fuel mass":"ZFM","Take off mass":"TOM","Landing mass DEST":"LM D","Landing mass ALTN":"LM A"};
  return `<svg viewBox="0 0 300 195" class="cg"><rect x="40" y="15" width="250" height="155" fill="#f4f5f1"/>
   ${[2.40,2.42,2.44,2.46,2.48,2.50,2.52].map(c=>`<line x1="${X(c)}" x2="${X(c)}" y1="15" y2="170" stroke="#ddd"/><text x="${X(c)}" y="182" font-size="8" text-anchor="middle">${c.toFixed(2)}</text>`).join("")}
   ${[940,1000,1100,1200,1280,1310].map(m=>`<line x1="40" x2="290" y1="${Y(m)}" y2="${Y(m)}" stroke="#ddd"/><text x="36" y="${Y(m)+3}" font-size="8" text-anchor="end">${m}</text>`).join("")}
   <polygon points="${env.map(p=>X(p[0])+","+Y(p[1])).join(" ")}" fill="none" stroke="#3f4736" stroke-width="2"/>
   <polyline points="${pts.map(p=>X(p.cg)+","+Y(p.m)).join(" ")}" fill="none" stroke="#c8102e" stroke-dasharray="3 2"/>
   ${pts.map((p,i)=>`<circle cx="${X(p.cg)}" cy="${Y(p.m)}" r="3" fill="#c8102e"/><line x1="${X(p.cg)}" y1="${Y(p.m)}" x2="198" y2="${102+i*12}" stroke="#c8102e" stroke-width=".4"/><text x="200" y="${105+i*12}" font-size="8" fill="#c8102e">${lab[p.name]} ${f0(p.m)} kg</text>`).join("")}
   <text x="165" y="194" font-size="8" text-anchor="middle">Center of Gravity Position [m]</text></svg>`;
}

/* ---------- Speichern ---------- */
const FIELDS=()=>[...document.querySelectorAll("[data-k]")];
function save(){ try{ const o={}; FIELDS().forEach(e=>o[e.id]=e.type==="checkbox"?e.checked:e.value); localStorage.setItem("d40fpp",JSON.stringify(o)); }catch(e){} }
function load(){ try{ const o=JSON.parse(localStorage.getItem("d40fpp")||"null"); if(!o) return false; FIELDS().forEach(e=>{ if(e.id in o){ if(e.type==="checkbox") e.checked=o[e.id]; else e.value=o[e.id]; } }); return true; }catch(e){ return false; } }

/* ---------- Wetter laden ---------- */
async function fetchWx(a){
  const icao=(val(a)||"").toUpperCase().trim(); const st=$(a+"Wx");
  if(!/^[A-Z]{4}$/.test(icao)){ st.textContent="ICAO-Code eingeben."; return; }
  st.textContent="lade …";
  try{
    const base="https://aviationweather.gov/api/data/";
    const [m,t]=await Promise.all([fetch(base+"metar?ids="+icao+"&format=raw&hours=2").then(x=>x.text()),fetch(base+"taf?ids="+icao+"&format=raw").then(x=>x.text())]);
    const mLine=(m||"").trim().split("\n")[0]||"";
    if(mLine) $(a+"Metar").value=mLine;
    if((t||"").trim()) $(a+"Taf").value=t.trim().replace(/\s+/g," ");
    st.textContent=mLine||t?"geladen "+new Date().toISOString().slice(11,16)+"Z":"keine Daten für "+icao;
    render();
  }catch(e){
    st.innerHTML=`Live-Abruf in dieser Ansicht gesperrt. METAR/TAF auf <a href="https://aviationweather.gov/data/metar/?ids=${icao}&taf=1&hours=1" target="_blank" rel="noopener">aviationweather.gov</a> öffnen und Text hier einfügen – oder die Offline-Version verwenden.`;
  }
}
function wxLink(a){ const icao=(val(a)||"").toUpperCase(); const l=$(a+"Link"); if(l) l.href="https://aviationweather.gov/data/metar/?ids="+icao+"&taf=1&hours=1"; }

/* ---------- Downloads ---------- */
async function offerFile(name,data){
  try{ if(window.claude&&window.claude.use){ const d=await window.claude.use("downloads"); if(d){ await d.save({filename:name,data}); return true; } } }catch(e){ if(e&&e.code==="declined") return true; }
  try{ const blob=data instanceof Blob?data:new Blob([data]); const u=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),5000); return true; }catch(e){ return false; }
}

/* ---------- Init ---------- */
function setEmpty(){ const e=FBH.empty[val("reg")]; if(e){ $("emptyM").value=e[0]; $("emptyMom").value=e[1]; } }
document.addEventListener("input",e=>{ if(e.target.dataset&&e.target.dataset.k!==undefined){ if(e.target.id==="reg") setEmpty(); if(APS.includes(e.target.id)) wxLink(e.target.id); render(); } });
document.addEventListener("change",e=>{ if(e.target.dataset&&e.target.dataset.k!==undefined){ if(e.target.id==="reg") setEmpty(); render(); } });
APS.forEach(a=>{ $(a+"Btn").onclick=()=>fetchWx(a); });
$("btnBooklet").onclick=()=>makePdf("booklet");
$("btnA5").onclick=()=>makePdf("a5");
$("btnReset").onclick=()=>{ try{localStorage.removeItem("d40fpp");}catch(e){} location.reload(); };
if(!load()){ $("dof").value=new Date().toISOString().slice(0,10); setEmpty(); }
APS.forEach(wxLink);
render();
