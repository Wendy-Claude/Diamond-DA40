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
function compute(guess){
  guess=guess||{d:60,a:30,n:0};
  const r={warn:[]};
  const withAlt=val("withAlt"); r.withAlt=withAlt;
  const ifr=val("rules")==="IFR"; r.ifr=ifr;
  r.etd=etdDate();
  const eetD=guess.d, eetA=guess.a, appr=0;
  r.etaDest=addMin(r.etd,eetD);
  r.etaAltn=withAlt?addMin(r.etaDest,eetA):null;
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
    else if(mode==="auto"){
      const mt=(o.metar&&o.metar.time&&o.metar.temp!=null&&o.t)?resolveDay(o.metar.time.d,o.metar.time.h,o.metar.time.m,o.t):null;
      if(mt&&Math.abs(mt-o.t)<=90*60000){ temp=o.metar.temp; tsrc="METAR "+fmtZ(mt)+" (innerhalb ±90 min)"; }
      else if(ti){ temp=ti.val; tsrc="TAF TX/TN, "+ti.how; }
    }
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
    if(!w&&o.metar&&o.metar.wind){ w=o.metar.wind; o.wsrc="METAR"; }
    if(!w&&o.t){
      const cands=tafWindCands(o.taf,o.t);
      if(cands.length){
        // ungünstigster Wind für die Piste (geringste Gegenwind-/größte Rückenwindkomponente)
        const hd=x=>(x.vrb||x.dir==null)?-x.spd:(o.rwy!=null?windComponents(x.dir,x.spd,o.rwy,varE).head:0);
        cands.sort((p,q)=>hd(p)-hd(q)); w=cands[0];
        o.wsrc="TAF "+w.src+(cands.length>1?", ungünstigster Wert":"");
      }
    }
    o.wind=w;
    o.surf={grass:val(a+"Grass")?val(a+"GrassLen"):"",wet:!!val(a+"Wet"),soft:!!val(a+"Soft")}; o.slope=num(a+"Slope")||0; o.len=num(a+"Len"); o.rwyAip=val(a+"RwyAip")||""; o.surch=surfaceFactors(a==="dep"?"to":"ld",o.surf,o.slope);
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

  /* Dichte und Masse-Schaetzung fuer Steigflug (TOM = ZFM + FOB - Taxi) */
  const dens=densLoad(); const kU=kgPerUsg(r.ap.dep&&r.ap.dep.temp,dens); r.kgPerUsg=kU; r.density=fuelDensity(r.ap.dep&&r.ap.dep.temp,dens);
  const loadKg=(num("emptyM")||0)+(num("seatL")||0)+(num("seatR")||0)+(num("rearL")||0)+(num("rearR")||0)+(num("bagF")||0)+(num("bagA")||0);

  /* Treibstoff FBH-B 5.3 mit Steigflug (AFM 5.3.10) und Reiseflug (AFM 5.3.11) */
  const F={}; r.fuel=F;
  F.method=val("fuelMethod"); const cp=+val("cruisePwr");
  F.pwr = F.method==="rule"?75:cp;
  F.ffCruise = F.method==="rule"?6.6:FBH.ff[cp];
  F.taxi=1; F.final=3;
  F.fob=num("fob");
  const tomEst=loadKg+(F.fob||0)*kU-F.taxi*kU;
  const parseAlt=s=>{ s=String(s||"").trim().toUpperCase().replace(/\s+/g,""); if(!s) return null; let m=/^FL(\d{2,3})$/.exec(s); if(m) return +m[1]*100; m=/^(\d+)(FT)?$/.exec(s); if(!m) return null; const v=+m[1]; return v<400?v*100:v; };
  const leg=(prefix,ap,mass,tag)=>{
    const o={dist:num("dist"+prefix),alt:parseAlt(val("alt"+prefix)),tasIn:num("tas"+prefix),ok:false};
    if(!o.dist||o.alt==null||!ap||ap.pa==null||ap.temp==null||!(mass>0)){ o.note="Strecke, Reiseflughöhe, Platzhöhe und Temperatur eingeben"; return o; }
    const cl=climbToAlt(mass,ap.pa,ap.temp,o.alt); if(!cl.ok){ o.note=cl.note; return o; }
    o.cl=cl; o.dev=cl.dev;
    const cruiseOat=isaTemp(o.alt)+(ap.temp-isaTemp(ap.pa));
    o.tas=o.tasIn||cruiseTas(o.alt,cruiseOat,F.pwr); o.tasSrc=o.tasIn?"manuell":"AFM 5.3.11";
    if(!o.tas){ o.note="TAS aus AFM nicht ermittelbar (Leistung 45–92 %) – TAS manuell eingeben"; return o; }
    o.remNm=Math.max(0,o.dist-cl.nm); if(o.dist<cl.nm) r.warn.push(`${tag}: Strecke ${f0(o.dist)} NM kürzer als der Steigflug (${f0(cl.nm)} NM).`);
    o.crMin=o.remNm/o.tas*60; o.crUsg=o.crMin/60*F.ffCruise; o.min=cl.min+o.crMin; o.usg=cl.usg+o.crUsg; o.ok=true;
    return o;
  };
  /* Anflug IAF -> Touchdown: Standard FBH-B (IFR 2 USG = 20 min) oder selbst: Distanz + Hoehe am IAF, Zeit mit TAS */
  const approach=(pre,ap)=>{
    const mode=val("apMode"+pre)==="self"?"self":"fbh";
    if(mode==="fbh") return {mode,ok:true,usg:ifr?2:0,min:ifr?20:0};
    const dist=num("apDist"+pre), alt=parseAlt(val("apAlt"+pre));
    if(!dist||alt==null) return {mode,ok:false,usg:0,min:0,note:"Anflug: Distanz und Höhe am IAF eingeben"};
    const dev=ap&&ap.temp!=null&&ap.pa!=null?ap.temp-isaTemp(ap.pa):0;
    const tas=num("tas"+pre)||cruiseTas(alt,isaTemp(alt)+dev,F.pwr);
    if(!tas) return {mode,ok:false,usg:0,min:0,note:"Anflug: TAS nicht ermittelbar – TAS manuell eingeben"};
    const min=dist/tas*60; return {mode,ok:true,dist,alt,tas,min,usg:min/60*F.ffCruise};
  };
  F.tripLeg=leg("Trip",r.ap.dep,tomEst,"Trip");
  F.tripEnroute=F.tripLeg.ok?F.tripLeg.usg:0;
  F.tripAp=approach("Trip",r.ap.dest); F.tripAppr=F.tripAp.usg; if(!F.tripAp.ok) r.warn.push("Trip fuel: "+F.tripAp.note+".");
  F.trip = F.tripEnroute+F.tripAppr;
  F.cont = 0.10*F.trip;
  r.eetDest = F.tripLeg.ok?F.tripLeg.min:0; r.tripTot=r.eetDest+F.tripAp.min;
  const lmEst=tomEst-F.trip*kU;
  if(withAlt){
    F.altLeg=leg("Alt",r.ap.dest,lmEst,"Alternate");
    F.holdMin = ifr?(+val("holdMin")):0;
    F.holdPwr = +val("holdPwr");
    F.altEnroute = F.altLeg.ok?F.altLeg.usg:0;
    F.altAp=approach("Alt",r.ap.altn); F.altAppr=F.altAp.usg; if(!F.altAp.ok) r.warn.push("Alternate fuel: "+F.altAp.note+".");
    F.altHold = F.holdMin/60*FBH.ff[F.holdPwr];
    F.alt = F.altEnroute+F.altAppr+F.altHold;
    F.add = 0;
    r.eetAltn = F.altLeg.ok?F.altLeg.min:0; r.altTot=r.eetAltn+F.altAp.min;
  } else { F.alt=0; F.altEnroute=0; F.altAppr=0; F.altHold=0; F.add=5; r.eetAltn=0; r.altTot=0; F.altAp=null; }
  if(!F.tripLeg.ok) r.warn.push("Trip fuel: "+F.tripLeg.note+".");
  if(withAlt&&F.altLeg&&!F.altLeg.ok) r.warn.push("Alternate fuel: "+F.altLeg.note+".");
  F.req = F.taxi+F.trip+F.cont+F.alt+F.add+F.final;
  F.extra = F.fob!=null?F.fob-F.req:null;
  F.afterLanding = F.fob!=null?F.fob-F.taxi-F.trip:null;
  F.endurance = F.fob!=null?(F.fob-F.taxi)/6.6*60:null;
  if(F.fob!=null&&F.fob>FBH.usableFuel) r.warn.push(`Fuel on board ${f1(F.fob)} USG > ${FBH.usableFuel} USG verfügbarer Treibstoff (FBH-B 5.3).`);
  if(F.extra!=null&&F.extra< -1e-6) r.warn.push(`Fuel on board unterschreitet den Mindesttreibstoff um ${f1(-F.extra)} USG.`);
  if(F.method==="rule"&&F.afterLanding!=null&&F.afterLanding<10) r.warn.push(`Faustformel 6,6 USG/h nur zulässig, wenn nach der Landung noch 10 USG vorhanden sind (vorhanden: ${f1(F.afterLanding)} USG) – genaue Berechnung nach FHB-Tabellen erforderlich (FBH-B 5.3).`);

  /* Weight & Balance FBH-B 6.1 */
  const W={}; r.wb=W; const A=FBH.arm; const k=kU;
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
  if(!eM) r.warn.push("Leermasse/Moment für "+val("reg")+" fehlen – im Menü „Flugzeuge“ eintragen. Keine Berechnung von Masse und Schwerpunkt.");

  /* Performance FBH-B 4 */
  const P={}; r.perf=P; const fo=val("fairingsOff");
  P.vrTo=vrVapp(W.tom.m); P.vappDest=vrVapp(W.lmDest.m); P.vappAltn=W.lmAltn?vrVapp(W.lmAltn.m):null;
  const dep=r.ap.dep, dst=r.ap.dest, alt=r.ap.altn;
  const hw=o=>o.comp?o.comp.head:0;
  if(dep&&dep.pa!=null&&dep.temp!=null) P.to=runwayDistances("to",W.tom.m,dep.pa,dep.temp,hw(dep),dep.surf,dep.slope,fo);
  if(dst&&dst.pa!=null&&dst.temp!=null) P.ldDest=runwayDistances("ld",W.lmDest.m,dst.pa,dst.temp,hw(dst),dst.surf,dst.slope,false);
  if(alt&&alt.pa!=null&&alt.temp!=null) P.ldAltn=runwayDistances("ld",W.lmAltn.m,alt.pa,alt.temp,hw(alt),alt.surf,alt.slope,false);
  if(P.to&&P.to.ok&&P.ldDest) {}
  if(P.to&&P.to.ok){
    // Startabbruch bei VR: Start- + Landerollstrecke (FBH-B 4.6) am Startplatz
    const l=runwayDistances("ld",W.tom.m,dep.pa,dep.temp,hw(dep),dep.surf,dep.slope,false);
    P.asd=l.ok?P.to.roll+l.roll:null;
    { const rw=dep.rwyAip&&typeof AIP_RWY!=="undefined"&&AIP_RWY[dep.icao]&&AIP_RWY[dep.icao][dep.rwyAip];
      if(rw&&rw.tora){ const list=[{from:"volle Pistenlänge",tora:rw.tora,toda:rw.toda,asda:rw.asda}].concat(rw.int||[]);
        P.ints={icao:dep.icao,rwy:dep.rwyAip,rows:list.map(x=>{ const o={...x,okRoll:P.to.roll<=x.tora,okD50:x.toda!=null&&P.to.d50<=x.toda,okAsd:P.asd!=null&&x.asda!=null&&P.asd<=x.asda,afm:P.to.d50<=x.tora}; o.ok=o.okRoll&&o.okD50&&o.okAsd; return o; })}; } }
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
    return {label,ias,roc,tas,gs,tail,grad:g,ftnm:g*60.7612,req,rocReq,ok:g>=req,note:c.note};
  };
  const rd=num("reqGradDep")||3.3, rg=num("reqGradGA")||2.5;
  P.climbDep=[grad(AFM_DATA.climbCR,88,W.tom.m,dep,40,"Cruise Climb (flaps UP, 88 KIAS, 92 %)",rd),grad(AFM_DATA.climbTO,72,W.tom.m,dep,20,"Take-off Climb (flaps T/O, 72 KIAS, 92 %)",rd)].filter(Boolean);
  P.climbGA=[grad(AFM_DATA.climbTO,72,W.lmDest.m,dst,20,"Take-off Climb (flaps T/O, 72 KIAS, 92 %)",rg),grad(AFM_DATA.climbCR,88,W.lmDest.m,dst,40,"Cruise Climb (flaps UP, 88 KIAS, 92 %)",rg)].filter(Boolean);
  if(P.climbDep.length&&P.climbDep.every(x=>x.grad!=null&&!x.ok)) r.warn.push(`Abflug ${dep.icao}: geforderter Steiggradient ${f1(rd)} % wird nicht erreicht.`);
  else if(P.climbDep[0]&&P.climbDep[0].grad!=null&&!P.climbDep[0].ok) r.warn.push(`Abflug ${dep.icao}: Cruise Climb erreicht ${f1(rd)} % nicht – Take-off Climb anwenden (FBH-B 4.3 / LB 2113 Kap. 1.5).`);
  if(P.climbGA[0]&&P.climbGA[0].grad!=null&&!P.climbGA[0].ok) r.warn.push(`Durchstarten ${dst.icao}: geforderter Steiggradient ${f1(rg)} % wird nicht erreicht.`);
  r.appr=appr; r.tripMin=r.eetDest; r.guess=guess;
  if(!guess.n&&(Math.abs(r.tripTot-guess.d)>1||Math.abs(r.altTot-guess.a)>1)) return compute({d:r.tripTot,a:r.altTot,n:1});
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
  const F=r.fuel; const setT=(id,v)=>{ const e=$(id); if(e) e.textContent=v; };
  const legOut=(p,L,ap)=>{
    const ok=L&&L.ok;
    setT(p+"ClInfo",ok?`${f0(ap.pa)} → ${f0(L.alt)} ft${L.dev>0?" · ISA+"+f0(L.dev):""}`:(L&&L.note)||"");
    setT(p+"ClMin",ok?f0(L.cl.min):""); setT(p+"ClNm",ok?f0(L.cl.nm):""); setT(p+"ClF",ok?f1(L.cl.usg):"");
    setT(p+"CrInfo",ok?`TAS ${f0(L.tas)} kt (${L.tasSrc}) · ${f1(F.ffCruise)} USG/h`:"");
    setT(p+"CrMin",ok?f0(L.crMin):""); setT(p+"CrNm",ok?f0(L.remNm):""); setT(p+"CrF",ok?f1(L.crUsg):"");
    setT(p+"TotNm",ok?f0(L.dist):"");
  };
  const apOut=(p,pre,A)=>{ const self=A&&A.mode==="self"; document.querySelectorAll(`tr.apself[data-for="${pre}"]`).forEach(tr=>tr.style.display=self?"":"none");
    setT(p+"ApInfo",!A?"":self?(A.ok?`TAS ${f0(A.tas)} kt · ${f1(F.ffCruise)} USG/h`:A.note):(r.ifr?"2 USG (FBH-B 5.3) = 20 min":"VFR: kein Zuschlag"));
    setT(p+"ApMin",A&&A.min?f0(A.min):""); setT(p+"ApNm",self&&A.ok?f0(A.dist):""); setT(p+"Ap",A?f1(A.usg):""); };
  legOut("t",F.tripLeg,r.ap.dep); apOut("t","Trip",F.tripAp); setT("tTotMin",f0(r.tripTot)); setT("tCont",f1(F.cont)); setT("tTotF",f1(F.trip+0));
  if(r.withAlt){ legOut("a",F.altLeg,r.ap.dest); apOut("a","Alt",F.altAp); setT("aTotMin",f0(r.altTot+(r.ifr?F.holdMin:0)));
    setT("aHoldInfo",r.ifr?`${F.holdMin} min @ ${F.holdPwr} % (${f1(FBH.ff[F.holdPwr])} USG/h)`:"entfällt (VFR)"); setT("aHoldMin",r.ifr?f0(F.holdMin):""); setT("aHoldF",f1(F.altHold)); setT("aTotF",f1(F.alt)); }
  const fr=(l,d,v,cls="")=>`<tr class="${cls}"><td>${l}</td><td>${d}</td><td class="n">${f1(v)}</td></tr>`;
  $("fuelOut").innerHTML=`<table class="t"><thead><tr><th>Position</th><th>Grundlage</th><th class="n">USG</th></tr></thead><tbody>
   ${fr("Taxi fuel","1 USG",F.taxi)}
   ${fr("Trip fuel","inkl. Steigflug und Anflug",F.trip)}
   ${fr("Contingency fuel","10 % vom Trip fuel",F.cont)}
   ${r.withAlt?fr("Alternate fuel","inkl. Anflug"+(r.ifr?" und Warteverfahren":""),F.alt):fr("Additional fuel","No Alternate Required: 5 USG (= 45 min @ 75 %)",F.add)}
   ${fr("Final reserve fuel","3 USG",F.final)}
   ${fr("<b>Minimum required</b>","",F.req,"sum")}
   ${fr("Fuel on board","max. 39 USG verfügbar",F.fob)}
   ${fr("Extra fuel","FOB – Minimum",F.extra,F.extra<0?"bad":"")}
   </tbody></table><div class="kv"><span>ETA DEST</span><b>${hhmm(r.etaDest)}</b>${r.withAlt?`<span>ETA ALTN</span><b>${hhmm(r.etaAltn)}</b>`:""}<span>Nach Landung DEST</span><b>${f1(F.afterLanding)} USG</b><span>Endurance (6,6 USG/h)</span><b>${F.endurance!=null?Math.floor(F.endurance/60)+" h "+String(Math.round(F.endurance%60)).padStart(2,"0")+" min":"—"}</b></div>`;
  // W&B
  const W=r.wb; { const m=num("emptyM"),mo=num("emptyMom"); $("emptyArm").value=m&&mo?(mo/m).toFixed(3).replace(".",","):"–"; }
  $("wbOut").innerHTML=`<table class="t"><thead><tr><th></th><th class="n">Masse kg</th><th class="n">Arm m</th><th class="n">Moment mkg</th><th class="n">max kg</th></tr></thead><tbody>
   ${W.rows.map(x=>`<tr><td>${x[0]}</td><td class="n">${f1(x[1])}</td><td class="n">${f1(x[2],3)}</td><td class="n">${f1(x[3])}</td><td class="n">${x[0]==="FWD Baggage"?45:x[0]==="AFT Baggage"?18:""}</td></tr>`).join("")}
   </tbody></table>
   <table class="t"><thead><tr><th>Phase</th><th class="n">Masse kg</th><th class="n">CG m</th><th class="n">zulässig m</th><th class="n">max kg</th></tr></thead><tbody>
   ${W.phases.map(p=>`<tr class="${(!p.okMass||(!p.okCg&&p!==W.ramp))?"bad":""}"><td>${p.name}</td><td class="n">${f1(p.m)}</td><td class="n">${f1(p.cg,3)}</td><td class="n">${f1(p.fwd,3)}–${f1(p.aft,2)}</td><td class="n">${p.max}</td></tr>`).join("")}
   </tbody></table><div class="note">Treibstoff: ${f1(r.kgPerUsg,3)} kg/USG (Dichte ${f1(r.density,3)} kg/l bei ${r.ap.dep&&r.ap.dep.temp!=null?f1(r.ap.dep.temp)+' °C OAT '+(r.ap.dep.icao||''):'15 °C (keine Temperatur)'}), Arm 2,63 m. Landemasse ALTN ohne Warteverfahren-Verbrauch (konservativ schwer).</div>${cgSvg(W)}`;
  // Performance
  const P=r.perf;
  const dRow=(lab,d)=>!d?`<tr><td>${lab}</td><td colspan="2" class="muted">Daten fehlen</td></tr>`:!d.ok?`<tr class="bad"><td>${lab}</td><td colspan="2">${esc(d.note)}</td></tr>`:`<tr><td>${lab}</td><td class="n">${f0(d.roll)}</td><td class="n">${f0(d.d50)}</td></tr>`;
  const steps=d=>d&&d.ok?`<div class="note">${d.steps.map(s=>esc(s[0])+": "+f0(s[1])+" / "+f0(s[2])+" m").join(" → ")}${d.note?" · "+esc(d.note):""}</div>`:"";
  const gRow=g=>g.grad==null?`<tr><td>${esc(g.label)}</td><td colspan="4">${esc(g.note)}</td></tr>`:`<tr class="${g.ok?"good":"bad"}"><td>${esc(g.label)}</td><td class="n">${f0(g.roc)}</td><td class="n">${f0(g.gs)}</td><td class="n">${f1(g.grad)} %<br><small>${f0(g.ftnm)} ft/NM</small></td><td class="n">${f1(g.req)} % / ${f0(g.rocReq)} ft/min</td></tr>`;
  $("perfOut").innerHTML=`<div class="kv"><span>V<sub>R</sub> (TOM ${f0(W.tom.m)} kg)</span><b>${P.vrTo.vr??"—"} KIAS</b><span>V<sub>APP</sub> DEST (LM ${f0(W.lmDest.m)} kg)</span><b>${P.vappDest.vapp??"—"} KIAS</b>${P.vappAltn?`<span>V<sub>APP</sub> ALTN (LM ${f0(W.lmAltn.m)} kg)</span><b>${P.vappAltn.vapp??"—"} KIAS</b>`:""}</div>
   <table class="t"><thead><tr><th>Strecke (AFM 5.3.7 / 5.3.12)</th><th class="n">Rollstrecke m</th><th class="n">über 15 m/50 ft m</th></tr></thead><tbody>
   ${dRow("Start "+(r.ap.dep.icao||"DEP"),P.to)}${dRow("Landung "+(r.ap.dest.icao||"DEST"),P.ldDest)}${r.withAlt?dRow("Landung "+(r.ap.altn.icao||"ALTN"),P.ldAltn):""}
   ${P.asd?`<tr><td>Startabbruch bei V<sub>R</sub> (Start- + Landerollstrecke)</td><td class="n">${f0(P.asd)}</td><td></td></tr>`:""}</tbody></table>
   ${steps(P.to)}${steps(P.ldDest)}${r.withAlt?steps(P.ldAltn):""}
   <h4>Steiggradient Abflug ${esc(r.ap.dep.icao)} (TOM)</h4><table class="t"><thead><tr><th>Verfahren</th><th class="n">ROC ft/min</th><th class="n">GS kt</th><th class="n">Gradient</th><th class="n">gefordert</th></tr></thead><tbody>${P.climbDep.map(gRow).join("")||'<tr><td colspan="5" class="muted">Daten fehlen</td></tr>'}</tbody></table>
   <h4>Steiggradient Durchstarten ${esc(r.ap.dest.icao)} (LM DEST)</h4><table class="t"><thead><tr><th>Verfahren</th><th class="n">ROC ft/min</th><th class="n">GS kt</th><th class="n">Gradient</th><th class="n">gefordert</th></tr></thead><tbody>${P.climbGA.map(gRow).join("")||'<tr><td colspan="5" class="muted">Daten fehlen</td></tr>'}</tbody></table>
   <div class="note">Gradient [%] = ROC × 0,98 / GS (FBH-B 4.3). GS = TAS + Rückenwind; Gegenwind wird nicht angerechnet (ungünstigste Variante, LB 2113 Kap. 1.5). Start-/Landestrecken: AFM-Tabellen, interpoliert nach Masse (1100/1200/1280/1310 kg).</div>`;
  for(const a of APS){ const o=r.ap[a], n=$(a+"Surch"); if(!n) continue;
    n.innerHTML=!o?"":(o.surch.length?"<b>Zuschläge "+(a==="dep"?"Start":"Landung")+":</b> "+o.surch.map(s=>esc(s[0])+" +"+f0((s[1]-1)*100)+" % <small>("+esc(s[2])+")</small>").join(" · "):"Keine Zuschläge für Belag/Neigung (befestigte, trockene Piste). Wind wird automatisch berücksichtigt (FBH-B 4.6.1)."); }
  if(P.ints){ const I=P.ints, ck=b=>b?'<td class="n ok">✓</td>':'<td class="n no">✗</td>';
    $("perfOut").insertAdjacentHTML("beforeend",`<h4>Intersection-Starts ${esc(I.icao)} RWY ${esc(I.rwy)} (AIP AD 2.13)</h4><table class="t ints"><thead><tr><th>Startpunkt</th><th class="n">TORA</th><th class="n">TODA</th><th class="n">ASDA</th><th class="n">Roll ≤ TORA</th><th class="n">15 m ≤ TODA</th><th class="n">Abbruch ≤ ASDA</th><th>Ergebnis</th></tr></thead><tbody>${I.rows.map(x=>`<tr><td>${esc(x.from)}</td><td class="n">${f0(x.tora)}</td><td class="n">${f0(x.toda)}</td><td class="n">${f0(x.asda)}</td>${ck(x.okRoll)}${ck(x.okD50)}${ck(x.okAsd)}<td class="${x.ok?"ok":"no"}">${x.ok?"ausreichend":"nicht ausreichend"}${x.ok&&!x.afm?" <small>(15 m > TORA, AFM-Warnung)</small>":""}</td></tr>`).join("")}</tbody></table>
    <div class="note">Benötigt: Startrollstrecke ${f0(P.to.roll)} m, Startstrecke über 15 m ${f0(P.to.d50)} m, Startabbruch bei V<sub>R</sub> (Start- + Landerollstrecke, FBH-B 4.6) ${f0(P.asd)} m – jeweils inkl. Zuschläge. AFM 5.3.7: Die verfügbare Pistenlänge muss mindestens der Startstrecke über 15 m entsprechen.</div>`); }
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
async function fetchWx(a,quiet){
  const icao=(val(a)||"").toUpperCase().trim(); const st=$(a+"Wx");
  if(!/^[A-Z]{4}$/.test(icao)){ if(!quiet) st.textContent="ICAO-Code eingeben."; return false; }
  st.textContent="lade …";
  try{
    const base="https://aviationweather.gov/api/data/";
    const [m,t]=await Promise.all([fetch(base+"metar?ids="+icao+"&format=raw&hours=2").then(x=>{ if(!x.ok) throw new Error(x.status); return x.text(); }),fetch(base+"taf?ids="+icao+"&format=raw").then(x=>{ if(!x.ok) throw new Error(x.status); return x.text(); })]);
    const mLine=(m||"").trim().split("\n")[0]||"";
    if(mLine) $(a+"Metar").value=mLine;
    if((t||"").trim()) $(a+"Taf").value=t.trim().replace(/\s+/g," ");
    st.textContent=mLine||t?"geladen "+new Date().toISOString().slice(11,16)+"Z":"keine Daten für "+icao;
    render(); return true;
  }catch(e){
    st.innerHTML='Direkter Abruf gesperrt (Browser). Über „Wetter einfügen“ übernehmen.';
    return false;
  }
}
/** Text von aviationweather.gov (METAR + TAF, mehrere Plaetze) den Plaetzen zuordnen */
function importWx(txt){
  const lines=String(txt||"").replace(/\r/g,"").split("\n"); const blocks=[]; let cur=null;
  for(const raw of lines){ const l=raw.trim(); if(!l) continue;
    const m=/^(METAR|SPECI|TAF)(?:\s+(?:AMD|COR|RTD))?\s+([A-Z]{4})\b/.exec(l) || (/^([A-Z]{4})\s+\d{6}Z/.test(l)?[l,"METAR",l.slice(0,4)]:null);
    if(m){ cur={type:m[1]==="TAF"?"TAF":"METAR",icao:m[2],text:l}; blocks.push(cur); }
    else if(cur&&cur.type==="TAF") cur.text+=" "+l; }
  const done=[];
  for(const a of APS){ const icao=(val(a)||"").toUpperCase(); if(!icao) continue;
    const met=blocks.find(x=>x.icao===icao&&x.type==="METAR"), taf=blocks.find(x=>x.icao===icao&&x.type==="TAF");
    if(met){ $(a+"Metar").value=met.text.replace(/^(METAR|SPECI)\s+/,""); }
    if(taf){ $(a+"Taf").value=taf.text.replace(/\s+/g," "); }
    if(met||taf){ done.push(icao+(met?" METAR":"")+(taf?" TAF":"")); $(a+"Wx").textContent="eingefügt "+new Date().toISOString().slice(11,16)+"Z"; } }
  render(); return done;
}
function wxAllUrl(){ const ids=APS.map(a=>(val(a)||"").toUpperCase()).filter(x=>/^[A-Z]{4}$/.test(x)); return "https://aviationweather.gov/api/data/metar?ids="+ids.join(",")+"&format=raw&taf=true&hours=1"; }
function initWxImport(){
  const dlg=$("wxDlg");
  const open=()=>{ $("wxOpenLink").href=wxAllUrl(); $("wxPasteMsg").textContent=""; dlg.showModal(); };
  $("wxPasteBtn").onclick=open; $("wxClose").onclick=()=>dlg.close();
  $("wxApply").onclick=()=>{ const d=importWx($("wxPaste").value); $("wxPasteMsg").textContent=d.length?"Übernommen: "+d.join(" · "):"Keine Meldung für die eingetragenen Plätze gefunden."; if(d.length) setTimeout(()=>dlg.close(),900); };
  $("wxAll").onclick=async()=>{ let ok=true; for(const a of APS){ if(a==="altn"&&!val("withAlt")) continue; if(val(a)) ok=(await fetchWx(a,true))&&ok; } if(!ok) open(); };
}
function wxLink(a){ const icao=(val(a)||"").toUpperCase(); const l=$(a+"Link"); if(l) l.href="https://aviationweather.gov/data/metar/?ids="+icao+"&taf=1&hours=1"; }

/* ---------- Downloads ---------- */
async function offerFile(name,data){ return saveFile(name,data,/\.json$/.test(name)?"application/json":undefined); }

/* ---------- Init ---------- */
function setEmpty(){ const a=acLoad()[val("reg")]; if(acComplete(a)){ $("emptyM").value=a.mass; $("emptyMom").value=a.moment; } else { $("emptyM").value=""; $("emptyMom").value=""; } }
document.addEventListener("input",e=>{ if(e.target.dataset&&e.target.dataset.k!==undefined){ if(e.target.id==="reg") setEmpty(); if(APS.includes(e.target.id)) wxLink(e.target.id); render(); } });
document.addEventListener("change",e=>{ if(e.target.dataset&&e.target.dataset.k!==undefined){ if(e.target.id==="reg") setEmpty(); render(); } });
APS.forEach(a=>{ $(a+"Btn").onclick=()=>fetchWx(a); });
$("btnBooklet").onclick=()=>makePdf("booklet");
buildReg();
if(!load()){ $("dof").value=new Date().toISOString().slice(0,10); }
if(!acComplete(acLoad()[$("reg").value])){ const f=Object.keys(AC_DEFAULTS).find(k=>acComplete(acLoad()[k])); if(f) $("reg").value=f; }
setEmpty(); initDensity(); initAcMenu();
APS.forEach(wxLink);
render();

/* ---------- Registrationsauswahl, Dichte, Flugzeugmenue ---------- */
function buildReg(){
  const all=acLoad(), sel=$("reg"), cur=sel.value;
  sel.innerHTML=Object.keys(AC_DEFAULTS).map(k=>`<option value="${k}">${k}${acComplete(all[k])?"":" – Daten fehlen"}</option>`).join("");
  if(cur&&all[cur]) sel.value=cur;
}
function initDensity(){
  const p=densLoad(); $("dens15").value=p.rho15; $("densK").value=p.kPerC;
  const upd=()=>{ const a=parseFloat($("dens15").value.replace(",",".")), b=parseFloat($("densK").value.replace(",","."));
    if(a>0.7&&a<0.9&&b>=0&&b<0.005){ densSave({rho15:a,kPerC:b}); render(); } };
  $("dens15").oninput=upd; $("densK").oninput=upd;
}
function initAcMenu(){
  const dlg=$("acDlg"), rows=$("acRows"), msg=$("acMsg");
  const draw=(all)=>{
    rows.innerHTML=Object.keys(AC_DEFAULTS).map(k=>{ const a=all[k]; const arm=acComplete(a)?(a.moment/a.mass).toFixed(3).replace(".",","):"–";
      return `<div class="acr" data-reg="${k}"><div class="reg">${k}</div>
        <label>Leermasse (kg)<input data-f="mass" inputmode="decimal" value="${a.mass??""}"></label>
        <label>Moment (mkg)<input data-f="moment" inputmode="decimal" value="${a.moment??""}"></label>
        <div class="wide"><label>Wägedatum<input data-f="date" type="date" value="${esc(a.date||"")}"></label><label>Notiz<input data-f="note" value="${esc(a.note||"")}"></label></div>
        <div class="st ${acComplete(a)?"ok":"miss"}">${acComplete(a)?"bereit · Hebelarm "+arm+" m":"Daten fehlen – Berechnung gesperrt"}</div></div>`; }).join("");
  };
  const read=()=>{ const out={}, errs=[];
    rows.querySelectorAll(".acr").forEach(r=>{ const k=r.dataset.reg, o={};
      r.querySelectorAll("input").forEach(i=>{ o[i.dataset.f]=i.value; });
      const m=o.mass===""?null:parseFloat(String(o.mass).replace(",",".")), mo=o.moment===""?null:parseFloat(String(o.moment).replace(",","."));
      if((m==null)!==(mo==null)) errs.push(k+": Masse und Moment gemeinsam eintragen.");
      else if(m!=null){ if(!(m>700&&m<1100)) errs.push(k+": Leermasse "+m+" kg nicht plausibel (700–1100 kg).");
        else if(!(mo/m>2.0&&mo/m<3.0)) errs.push(k+": Hebelarm "+(mo/m).toFixed(2)+" m nicht plausibel (2,0–3,0 m)."); }
      out[k]={mass:m,moment:mo,date:o.date||"",note:o.note||""}; });
    return {out,errs}; };
  $("btnAc").onclick=()=>{ draw(acLoad()); msg.textContent=""; dlg.showModal(); };
  $("acClose").onclick=()=>dlg.close();
  $("acSave").onclick=()=>{ const {out,errs}=read(); if(errs.length){ msg.innerHTML=errs.map(esc).join("<br>"); msg.style.color="#c8102e"; return; }
    acSave(out); draw(out); buildReg(); setEmpty(); render(); msg.style.color=""; msg.textContent="Gespeichert."; };
  $("acReset").onclick=()=>{ if(confirm("Alle Flugzeugdaten auf die Ausgangswerte zurücksetzen?")){ try{localStorage.removeItem(AC_KEY);}catch(e){} const a=acLoad(); draw(a); buildReg(); setEmpty(); render(); msg.textContent="Zurückgesetzt."; } };
  $("acExport").onclick=()=>offerFile("D40_Flugzeugdaten.json",JSON.stringify(acLoad(),null,2));
  $("acImport").onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ const j=JSON.parse(await f.text()); const o={}; for(const k of Object.keys(AC_DEFAULTS)) if(j[k]) o[k]=Object.assign({},AC_DEFAULTS[k],j[k]); acSave(o); draw(acLoad()); buildReg(); setEmpty(); render(); msg.style.color=""; msg.textContent="Importiert – bitte prüfen und speichern."; }catch(err){ msg.style.color="#c8102e"; msg.textContent="Datei ungültig."; } e.target.value=""; };
}

/* ---------- Formular zuruecksetzen, Fluege speichern, Flugplatzdaten ---------- */
function resetForm(){
  if(!confirm("Formular neu eingeben? Alle Eingaben und Werte werden geleert (gespeicherte Flüge und Flugzeugdaten bleiben erhalten).")) return;
  FIELDS().forEach(e=>{ if(e.tagName==="SELECT"){ let d=[...e.options].findIndex(o=>o.defaultSelected); e.selectedIndex=d<0?0:d; } else if(e.type==="checkbox") e.checked=e.defaultChecked; else e.value=""; });
  $("reg").selectedIndex=0; buildReg(); const f=Object.keys(AC_DEFAULTS).find(k=>acComplete(acLoad()[k])); if(f) $("reg").value=f;
  $("dof").value=new Date().toISOString().slice(0,10); $("etd").value="0900"; $("varE").value="4.5";
  $("reqGradDep").value="3.3"; $("reqGradGA").value="2.5"; $("fob").value="39";
  ["dep","dest","altn"].forEach(a=>{ const e=$(a+"Elev"); delete e.dataset.auto; const n=$(a+"ElevNote"); if(n) n.textContent=""; $(a+"Wx").textContent=""; });
  setEmpty(); wxLink("dep"); wxLink("dest"); wxLink("altn"); render(); window.scrollTo(0,0);
}
const FL_KEY="d40flights.v1";
const flRead=()=>{ try{ return JSON.parse(localStorage.getItem(FL_KEY)||"[]"); }catch(e){ return []; } };
function flDraw(sel){ const l=flRead(); $("flList").innerHTML=l.length?l.map(x=>`<option value="${esc(x.id)}">${esc(x.name)} (${esc(x.saved.slice(0,16).replace("T"," "))})</option>`).join(""):'<option value="">– keine –</option>'; if(sel) $("flList").value=sel; }
function initFlights(){
  flDraw();
  $("flSave").onclick=()=>{ const name=($("flName").value||[val("cs"),val("dep")&&val("dest")?val("dep").toUpperCase()+"–"+val("dest").toUpperCase():"",val("dof")].filter(Boolean).join(" ")||"Flug").trim();
    const o={}; FIELDS().forEach(e=>o[e.id]=e.type==="checkbox"?e.checked:e.value); const l=flRead(); const id=String(Date.now());
    l.unshift({id,name,saved:new Date().toISOString(),fields:o}); try{ localStorage.setItem(FL_KEY,JSON.stringify(l.slice(0,50))); }catch(e){ $("flMsg").textContent="Speichern nicht möglich."; return; }
    flDraw(id); $("flMsg").textContent="Gespeichert: "+name; };
  $("flLoad").onclick=()=>{ const x=flRead().find(f=>f.id===$("flList").value); if(!x){ $("flMsg").textContent="Kein Flug ausgewählt."; return; }
    FIELDS().forEach(e=>{ if(e.id in x.fields){ if(e.type==="checkbox") e.checked=x.fields[e.id]; else e.value=x.fields[e.id]; } });
    setEmpty(); ["dep","dest","altn"].forEach(wxLink); render(); $("flMsg").textContent="Geladen: "+x.name; window.scrollTo(0,0); };
  $("flDel").onclick=()=>{ const id=$("flList").value; if(!id||!confirm("Diesen gespeicherten Flug löschen?")) return; try{ localStorage.setItem(FL_KEY,JSON.stringify(flRead().filter(f=>f.id!==id))); }catch(e){} flDraw(); $("flMsg").textContent="Gelöscht."; };
  $("btnNewTop").onclick=resetForm; $("btnNewBottom").onclick=resetForm;
}
function initAirports(){
  const apply=a=>{ const e=$(a+"Elev"), n=$(a+"ElevNote"); const hit=apLookup(val(a));
    if(hit){ if(!e.value||e.dataset.auto==="1"){ e.value=hit.elev; e.dataset.auto="1"; } n.textContent=e.dataset.auto==="1"?`${hit.name}: ${hit.elev} ft – ${hit.src}`:""; }
    else { if(e.dataset.auto==="1"){ e.value=""; delete e.dataset.auto; } n.textContent=(val(a)||"").length===4?"Platz nicht in der Datenbank – Höhe manuell eingeben.":""; } };
  const rwySel=a=>{ const s=$(a+"RwyAip"), R=(typeof AIP_RWY!=="undefined"&&AIP_RWY[(val(a)||"").toUpperCase()])||{}, cur=s.value;
    const ks=Object.keys(R).filter(k=>a==="dep"?R[k].tora:R[k].lda);
    s.innerHTML='<option value="">– manuell –</option>'+ks.map(k=>`<option value="${k}">${k} · ${a==="dep"?"TORA "+R[k].tora:"LDA "+R[k].lda} m${R[k].int&&R[k].int.length&&a==="dep"?" · "+R[k].int.length+" Intersections":""}</option>`).join("");
    if(ks.includes(cur)) s.value=cur; else { const rn=String(val(a+"Rwy")||"").replace(/\D/g,""); const m=ks.find(k=>rn&&k.replace(/\D/g,"")===rn.padStart(2,"0")); if(m) s.value=m; } };
  ["dep","dest","altn"].forEach(a=>{ rwySel(a); $(a).addEventListener("input",()=>rwySel(a)); $(a+"RwyAip").addEventListener("change",()=>{ const k=$(a+"RwyAip").value, R=AIP_RWY[(val(a)||"").toUpperCase()]; if(k&&R&&R[k]){ $(a+"Rwy").value=k.replace(/\D/g,""); $(a+"Len").value=a==="dep"?R[k].tora:R[k].lda; } render(); }); });
  ["dep","dest","altn"].forEach(a=>{ const e=$(a+"Elev"); const n=document.createElement("div"); n.className="note"; n.id=a+"ElevNote"; e.parentElement.appendChild(n);
    e.addEventListener("input",()=>{ delete e.dataset.auto; n.textContent=""; }); $(a).addEventListener("input",()=>{ apply(a); render(); }); apply(a); });
  const dlg=$("apDlg");
  $("btnAp").onclick=()=>{ const u=apUser(); $("apText").value=Object.keys(u).map(k=>k+";"+u[k][0]+";"+u[k][1]).join("\n"); $("apMsg").textContent=""; dlg.showModal(); };
  $("apClose").onclick=()=>dlg.close();
  $("apSave").onclick=()=>{ const {out,bad}=apParse($("apText").value); try{ localStorage.setItem(AP_KEY,JSON.stringify(out)); }catch(e){} $("apMsg").textContent=Object.keys(out).length+" Plätze gespeichert"+(bad.length?" · nicht gelesen: "+bad.join(" | "):"."); ["dep","dest","altn"].forEach(a=>$(a).dispatchEvent(new Event("input"))); };
  $("apClear").onclick=()=>{ try{ localStorage.removeItem(AP_KEY); }catch(e){} $("apText").value=""; $("apMsg").textContent="Eigene Daten gelöscht."; ["dep","dest","altn"].forEach(a=>$(a).dispatchEvent(new Event("input"))); };
}
initFlights(); initAirports(); initWxImport();
