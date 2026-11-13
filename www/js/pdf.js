/* ===== PDF: A5-Broschüre (Booklet auf A4 quer, beidseitig) ===== */
const C={olive:[82,92,70],dark:[55,63,47],red:[200,16,46],light:[236,238,231],grey:[120,120,120],line:[170,170,160],mark:[255,236,150],bad:[200,16,46],good:[40,110,50]};
function pdfTxt(s){ return String(s==null?"":s).replace(/→/g,">").replace(/≥/g,">=").replace(/≤/g,"<=").replace(/[  ]/g," "); }

class Pg{
  constructor(doc,ox,n,N,r){ this.d=doc; this.ox=ox; this.n=n; this.N=N; this.r=r; this.W=148; this.H=210; this.m=8; this.y=0; }
  X(x){ return this.ox+x; }
  fill(c){ this.d.setFillColor(...c); } stroke(c){ this.d.setDrawColor(...c); } color(c){ this.d.setTextColor(...c); }
  font(sz,st="normal",fam="helvetica"){ this.d.setFont(fam,st); this.d.setFontSize(sz); }
  text(s,x,y,o={}){ this.d.text(pdfTxt(s),this.X(x),y,o); }
  frame(title){
    const d=this.d, r=this.r;
    this.fill(C.olive); d.rect(this.X(0),0,this.W,17,"F");
    try{ d.addImage(IMG_ROUNDEL,"PNG",this.X(6),3,11,11); }catch(e){}
    try{ d.addImage(IMG_BADGE,"PNG",this.X(this.W-6-6.3),2,6.3,13); }catch(e){}
    this.color([255,255,255]); this.font(7.5,"bold"); this.text("ÖSTERREICHISCHES BUNDESHEER",20,7.6);
    this.font(6.8); this.text("Flieger- & Fliegerabwehrtruppenschule",20,11.4);
    this.font(6); this.text("Institut Flieger · Lehrabteilung Fläche",20,14.6);
    // Titel
    this.tri(this.m,24.2); this.color(C.dark); this.font(11.5,"bold"); this.text(title,this.m+5,25.6);
    this.stroke(C.red); this.d.setLineWidth(0.5); this.d.line(this.X(this.m),28,this.X(this.W-this.m),28);
    // Fuß
    this.stroke(C.line); d.setLineWidth(0.2); d.line(this.X(this.m),this.H-11,this.X(this.W-this.m),this.H-11);
    this.color(C.grey); this.font(6);
    this.text(`FUEL & PERFORMANCE PLANNING D40 · ${r.cs||"—"} · ${r.reg||""} · ${r.dofTxt}`,this.m,this.H-7.5);
    this.text(`Grundlage: ${FBH.stand}`,this.m,this.H-4.5);
    this.text(`Seite ${this.n} / ${this.N}`,this.W-this.m,this.H-7.5,{align:"right"});
    this.y=33;
  }
  tri(x,y,s=3.2){ this.fill(C.red); this.d.triangle(this.X(x),y-s*0.75,this.X(x+s),y-s*0.75,this.X(x+s/2),y+s*0.35,"F"); }
  h(t){ this.y+=1.5; this.tri(this.m,this.y+0.3,2.6); this.color(C.olive); this.font(8.5,"bold"); this.text(t,this.m+4,this.y+1.4); this.y+=4.8; }
  para(t,sz=7,st="normal",w=null){ this.font(sz,st); this.color([30,30,30]); const L=this.d.splitTextToSize(pdfTxt(t),w||this.W-2*this.m); this.d.text(L,this.X(this.m),this.y+sz*0.35); this.y+=L.length*sz*0.42+1.2; }
  mono(t,sz=6.4,hl=false){ this.d.setFont("courier","normal"); this.d.setFontSize(sz); const L=this.d.splitTextToSize(pdfTxt(t),this.W-2*this.m-3); const lh=sz*0.42;
    if(hl){ this.fill(C.mark); this.d.rect(this.X(this.m),this.y,this.W-2*this.m,L.length*lh+1.6,"F"); }
    this.color([20,20,20]); this.d.text(L,this.X(this.m+1.5),this.y+sz*0.38+0.6); this.y+=L.length*lh+2.2; }
  table(widths,rows,o={}){
    const d=this.d, sz=o.sz||6.8, pad=1.1, lh=sz*0.40; let x0=this.m;
    const total=widths.reduce((a,b)=>a+b,0); const scale=(this.W-2*this.m)/total; const W=widths.map(w=>w*scale);
    rows.forEach((row,ri)=>{
      const head=o.head&&ri===0; const st=row._st||{};
      d.setFont("helvetica",head||st.bold?"bold":"normal"); d.setFontSize(sz);
      const cells=row.map((c,ci)=>d.splitTextToSize(pdfTxt(c==null?"":c),W[ci]-2*pad));
      const h=Math.max(...cells.map(c=>c.length))*lh+2*pad+0.4;
      let x=x0;
      if(head){ this.fill(C.olive); d.rect(this.X(x0),this.y,W.reduce((a,b)=>a+b,0),h,"F"); }
      else if(st.fill){ this.fill(st.fill); d.rect(this.X(x0),this.y,W.reduce((a,b)=>a+b,0),h,"F"); }
      else if(ri%2===0&&o.zebra!==false){ this.fill([246,247,243]); d.rect(this.X(x0),this.y,W.reduce((a,b)=>a+b,0),h,"F"); }
      cells.forEach((L,ci)=>{
        const right=(o.align||[])[ci]==="r";
        this.color(head?[255,255,255]:st.color||[25,25,25]);
        d.text(L,right?this.X(x+W[ci]-pad):this.X(x+pad),this.y+pad+sz*0.33,right?{align:"right"}:{});
        x+=W[ci];
      });
      this.stroke(C.line); d.setLineWidth(0.15); d.line(this.X(x0),this.y+h,this.X(x0+W.reduce((a,b)=>a+b,0)),this.y+h);
      this.y+=h;
    });
    this.y+=2;
  }
  quote(q){
    const d=this.d; const w=this.W-2*this.m-4;
    d.setFont("helvetica","bold"); d.setFontSize(6.6); const ref="FBH-B D40 · "+q.ref;
    d.setFont("helvetica","normal"); d.setFontSize(6.9);
    const L=d.splitTextToSize(pdfTxt(q.txt),w); const h=L.length*2.85+6.5;
    this.fill(C.light); d.rect(this.X(this.m),this.y,this.W-2*this.m,h,"F"); this.fill(C.red); d.rect(this.X(this.m),this.y,0.9,h,"F");
    this.color(C.olive); d.setFont("helvetica","bold"); d.setFontSize(6.6); d.text(pdfTxt(ref),this.X(this.m+3),this.y+3.4);
    this.color([25,25,25]); d.setFont("helvetica","normal"); d.setFontSize(6.9); d.text(L,this.X(this.m+3),this.y+6.6);
    this.y+=h+2;
  }
}

function pdfPages(r){
  const F=r.fuel, W=r.wb, P=r.perf, ap=r.ap;
  const pages=[];
  const wx=(pg,a)=>{
    const o=ap[a]; if(!o) return;
    pg.h(`${APNAME[a]} ${o.icao||""} – ${a==="dep"?"ETD":"ETA"} ${hhmm(o.t)}`);
    pg.font(6.3,"bold"); pg.color(C.grey); pg.text("METAR",pg.m,pg.y+1.6); pg.y+=2.4;
    pg.mono(o.metar?o.metar.raw:"— kein METAR —");
    pg.font(6.3,"bold"); pg.color(C.grey); pg.text("TAF",pg.m,pg.y+1.6); pg.y+=2.4;
    pg.mono(o.taf?o.taf.raw:"— kein TAF —");
    if(o.rel&&o.rel.length){ pg.font(6.3,"bold"); pg.color(C.grey); pg.text(`Relevante TAF-Gruppen ${fmtZ(o.win[0])} – ${fmtZ(o.win[1])} (ETA ± 1 h)`,pg.m,pg.y+1.6); pg.y+=2.4;
      pg.mono(o.rel.map(g=>g.type==="BASE"?(g.head?g.head+" ":"")+g.text:g.text).join("\n"),6.4,true); }
    pg.table([30,40,30,40],[
      ["OAT",o.temp!=null?f1(o.temp)+" °C":"—","Quelle",o.tsrc||"—"],
      ["QNH",f0(o.qnh)+" hPa ("+o.qsrc+")","Platzhöhe / PA",(o.elev!=null?f0(o.elev):"—")+" / "+(o.pa!=null?f0(o.pa):"—")+" ft"],
      ["Wind",fmtWind(o.wind)+(o.wsrc?" ("+o.wsrc+")":""),"Piste "+(o.rwy!=null?String(Math.round(o.rwy/10)).padStart(2,"0"):"—"),o.comp?(o.comp.head>=0?"HW ":"TW ")+f0(Math.abs(o.comp.head))+" kt / XW "+f0(o.comp.cross)+" kt":"—"],
    ],{sz:6.6,zebra:true});
  };
  const kg=v=>f1(v*(r.kgPerUsg||kgPerUsg(15)));
  const rwy=o=>o&&o.rwy!=null?"RWY "+String(Math.round(o.rwy/10)).padStart(2,"0"):"—";
  // Seite 1: Flugdaten + Treibstoff
  pages.push(pg=>{
    pg.frame("FUEL & PERFORMANCE PLANNING");
    pg.table([30,44,26,40],[["Datum (DOF)",r.dofTxt,"Flugregeln",r.ifr?"IFR":"VFR"],["Rufzeichen",r.cs||"—","Registration",r.reg||"—"],["Planungsvariante",r.withAlt?"DESTINATION WITH ALTERNATE":"DESTINATION WITHOUT ALTERNATE"+(r.cls?" – Class "+r.cls:""),"Fuel on board",f1(F.fob)+" USG / "+kg(F.fob||0)+" kg"]],{sz:6.4});
    const rows=[["","ICAO","Zeit UTC","Piste","Länge"]];
    rows.push(["DEP",ap.dep.icao||"—","ETD "+hhmm(r.etd),rwy(ap.dep),ap.dep.len?"TORA "+f0(ap.dep.len)+" m":"—"]);
    rows.push(["DEST",ap.dest.icao||"—","ETA "+hhmm(r.etaDest),rwy(ap.dest),ap.dest.len?"LDA "+f0(ap.dest.len)+" m":"—"]);
    if(r.withAlt) rows.push(["ALTN",ap.altn.icao||"—","ETA "+hhmm(r.etaAltn),rwy(ap.altn),ap.altn.len?"LDA "+f0(ap.altn.len)+" m":"—"]);
    pg.table([14,18,30,20,30],rows,{head:true,sz:6.4});
    pg.h(`Treibstoff (FBH-B 5.3 · AFM 5.3.10/5.3.11) · ${F.method==="rule"?"Faustformel 6,6 USG/h":r.cruisePwr+" % = "+f1(F.ffCruise)+" USG/h"}`);
    const T=[["Position","Grundlage","min","NM","USG","kg"]];
    const sub=(lab,g,min,nm,usg)=>T.push(["  "+lab,g,min==null?"":f0(min),nm==null?"":f0(nm),f1(usg),kg(usg)]);
    const bold=(row,fill)=>{ row._st={bold:true,fill:fill||C.light}; T.push(row); };
    T.push(["Taxi fuel","1 USG","","",f1(F.taxi),kg(F.taxi)]);
    const L=F.tripLeg, A=F.tripAp;
    if(L&&L.ok){ sub("Steigflug",`${f0(ap.dep.pa)} > ${f0(L.alt)} ft, 88 KIAS, 92 %`,L.cl.min,L.cl.nm,L.cl.usg); sub("Reiseflug",`TAS ${f0(L.tas)} kt`,L.crMin,L.remNm,L.crUsg); }
    if(A) sub("Anflug",A.mode==="self"?`${f0(A.dist)} NM, ${f0(A.alt)} ft, TAS ${f0(A.tas)} kt`:(r.ifr?"Standard FBH-B: 2 USG = 20 min":"VFR"),A.min,A.mode==="self"?A.dist:null,A.usg);
    bold(["Trip fuel",L&&L.ok?"":"Strecke/Höhe fehlt",f0(r.tripTot),L&&L.ok?f0(L.dist+(A&&A.mode==="self"?A.dist:0)):"",f1(F.trip),kg(F.trip)]);
    T.push(["Contingency fuel","10 % vom Trip fuel","","",f1(F.cont),kg(F.cont)]);
    if(r.withAlt){ const pu=["PULL UP FUEL",`Mindestmenge beim Durchstarten an ${ap.dest.icao||"DEST"} (Alternate + Final reserve)`,"","",f1(F.pullUp),kg(F.pullUp)]; pu._st={bold:true,fill:C.mark}; T.push(pu); }
    if(r.withAlt){ const M=F.altLeg, B=F.altAp;
      if(M&&M.ok){ sub("Steigflug",`${f0(ap.dest.pa)} > ${f0(M.alt)} ft`,M.cl.min,M.cl.nm,M.cl.usg); sub("Reiseflug",`TAS ${f0(M.tas)} kt`,M.crMin,M.remNm,M.crUsg); }
      if(B) sub("Anflug",B.mode==="self"?`${f0(B.dist)} NM, ${f0(B.alt)} ft, TAS ${f0(B.tas)} kt`:(r.ifr?"Standard FBH-B: 2 USG = 20 min":"VFR"),B.min,B.mode==="self"?B.dist:null,B.usg);
      if(r.ifr) sub("Warteverfahren",`${F.holdMin} min @ ${F.holdPwr} %`,F.holdMin,null,F.altHold);
      bold(["Alternate fuel",M&&M.ok?"":"Strecke/Höhe fehlt",f0(r.altTot+(r.ifr?F.holdMin:0)),"",f1(F.alt),kg(F.alt)]);
    } else T.push(["Additional fuel","No Alternate Required (45 min @ 75 %)","45","",f1(F.add),kg(F.add)]);
    T.push(["Final reserve fuel","3 USG (Unterschreiten = MAYDAY)","","",f1(F.final),kg(F.final)]);
    bold(["MINIMUM REQUIRED","","","",f1(F.req),kg(F.req)],[220,223,212]);
    T.push(["Fuel on board","max. 39 USG","","",f1(F.fob),kg(F.fob||0)]);
    const ex=["Extra fuel","FOB – Minimum","","",f1(F.extra),kg(F.extra||0)]; ex._st={bold:true,color:F.extra<0?C.bad:C.good}; T.push(ex);
    pg.table([30,50,11,11,13,13],T,{head:true,align:["","","r","r","r","r"],sz:6.1});
    if(pg.H-14-pg.y>34){ pg.h("Vertikalprofil (nicht maßstäblich)"); profilePdf(pg,r,Math.min(22,pg.H-14-pg.y-18)); r._profDone=true; }
    pg.para(`Dichte ${f1(r.density,3)} kg/l (${f1(r.kgPerUsg,3)} kg/USG) bei OAT Start. Restmenge nach Landung DEST ${f1(F.afterLanding)} USG · Endurance (6,6 USG/h) ${F.endurance!=null?Math.floor(F.endurance/60)+":"+String(Math.round(F.endurance%60)).padStart(2,"0")+" h":"—"}.`,5.8);
  });
  // Seite 2: Wetter
  pages.push(pg=>{ pg.frame("METAR / TAF");
    for(const a of ["dep","dest"].concat(r.withAlt?["altn"]:[])){ const o=ap[a]; if(!o) continue;
      pg.h(`${APNAME[a]} ${o.icao||""} · ${a==="dep"?"ETD":"ETA"} ${hhmm(o.t)}`);
      pg.mono("METAR "+(o.metar?o.metar.raw:"—"),5.6);
      pg.mono(o.taf?o.taf.raw:"TAF —",5.6);
      if(o.rel&&o.rel.length) pg.mono("ETA ±1 h: "+o.rel.map(g=>g.type==="BASE"?"Basis "+g.text:g.text).join(" | "),5.6,true);
      pg.table([18,40,24,40],[["OAT",o.temp!=null?f1(o.temp)+" °C ("+(o.tsrc||"")+")":"—","QNH / PA",f0(o.qnh)+" hPa / "+(o.pa!=null?f0(o.pa)+" ft":"—")],["Wind",fmtWind(o.wind)+(o.wsrc?" ("+o.wsrc+")":""),rwy(o),o.comp?(o.comp.head>=0?"HW ":"TW ")+f0(Math.abs(o.comp.head))+" kt / XW "+f0(o.comp.cross)+" kt":"—"]],{sz:5.9});
    }
    if(!r._profDone&&pg.H-14-pg.y>40){ pg.h("Vertikalprofil (nicht maßstäblich)"); profilePdf(pg,r,24); r._profDone=true; }
    pg.para("Temperatur: Maximum aus dem TAF (TX), sonst aktueller METAR-Wert. Wind und QNH aus dem METAR. Gelb: TAF-Gruppen im Zeitraum ETA ± 1 h (FBH-B 5.2.2 / 5.2.3.1).",5.7);
  });
  // Seite 3: Weight & Balance
  pages.push(pg=>{
    pg.frame("WEIGHT & BALANCE");
    const rows=[["Position","Arm m","Masse kg","Moment mkg"]];
    W.rows.forEach(x=>rows.push([x[0]+(x[0]==="FWD Baggage"?" (max 45)":x[0]==="AFT Baggage"?" (max 18)":""),f1(x[2],3),f1(x[1]),f1(x[3])]));
    const ph=(p,lab)=>{ const row=[lab+" (max "+p.max+")",f1(p.cg,3),f1(p.m),f1(p.mo)]; row._st={bold:true,fill:C.light,color:(!p.okMass||!p.okCg)?C.bad:null}; return row; };
    rows.push(ph(W.zfm,"Zero fuel mass"));
    rows.push(["+ Fuel on board ("+f1(F.fob)+" USG)","2,630",f1(W.fuelKg.fob),f1(W.fuelKg.fob*2.63)]);
    rows.push(["– Taxi fuel","2,630","-"+f1(W.fuelKg.taxi),"-"+f1(W.fuelKg.taxi*2.63)]);
    rows.push(ph(W.tom,"Take off mass"));
    rows.push(["– Trip fuel","2,630","-"+f1(W.fuelKg.trip),"-"+f1(W.fuelKg.trip*2.63)]);
    rows.push(ph(W.lmDest,"Landing mass DEST"));
    if(W.lmAltn){ rows.push(["– Alternate fuel (ohne Holding)","2,630","-"+f1(W.fuelKg.alt),"-"+f1(W.fuelKg.alt*2.63)]); rows.push(ph(W.lmAltn,"Landing mass ALTN")); }
    pg.table([54,18,22,26],rows,{head:true,align:["","r","r","r"],sz:6.2});
    pg.table([46,26,26,30],[["Phase","CG vorne","CG hinten","Status"]].concat(W.phases.filter(p=>p!==W.ramp).map(p=>{ const ok=p.okMass&&p.okCg; const row=[p.name,f1(p.fwd,3)+" m",f1(p.aft,3)+" m",ok?"im Bereich":"AUSSERHALB"]; row._st={color:ok?C.good:C.bad}; return row; })),{head:true,sz:6.0});
    const d=pg.d, x0=pg.m+14, w=pg.W-2*pg.m-20, y0=pg.y+2, h=Math.max(30,Math.min(58,pg.H-14-y0-9));
    const X=c=>pg.X(x0+(c-2.39)/(2.54-2.39)*w), Y=m=>y0+h-(m-920)/(1330-920)*h;
    pg.fill([246,247,243]); d.rect(pg.X(x0),y0,w,h,"F");
    d.setLineWidth(0.1); pg.stroke([210,210,200]); pg.font(5.3); pg.color(C.grey);
    [2.40,2.42,2.44,2.46,2.48,2.50,2.52].forEach(c=>{ d.line(X(c),y0,X(c),y0+h); d.text(c.toFixed(2),X(c),y0+h+3,{align:"center"}); });
    [940,1000,1100,1200,1280,1310].forEach(m=>{ d.line(pg.X(x0),Y(m),pg.X(x0+w),Y(m)); d.text(String(m),pg.X(x0-1),Y(m)+1,{align:"right"}); });
    pg.stroke(C.dark); d.setLineWidth(0.6);
    const env=[[2.40,940],[2.40,1080],[2.469,1310],[2.53,1310],[2.53,940],[2.40,940]];
    for(let i=0;i<env.length-1;i++) d.line(X(env[i][0]),Y(env[i][1]),X(env[i+1][0]),Y(env[i+1][1]));
    const pts=W.phases.filter(p=>p!==W.ramp&&p.cg); const lab={"Zero fuel mass":"ZFM","Take off mass":"TOM","Landing mass DEST":"LM DEST","Landing mass ALTN":"LM ALTN"};
    pg.stroke(C.red); d.setLineWidth(0.3);
    for(let i=0;i<pts.length-1;i++) d.line(X(pts[i].cg),Y(pts[i].m),X(pts[i+1].cg),Y(pts[i+1].m));
    pts.forEach((p,i)=>{ pg.fill(C.red); d.circle(X(p.cg),Y(p.m),0.9,"F"); pg.color(C.red); pg.font(5.3,"bold"); const lx=pg.X(x0+w*0.6), ly=y0+h*0.55+i*3.8; pg.stroke(C.red); d.setLineWidth(0.1); d.line(X(p.cg)+1,Y(p.m),lx-1,ly-1); d.text(lab[p.name]+"  "+f1(p.m,0)+" kg / "+f1(p.cg,3)+" m",lx,ly); });
    pg.color(C.grey); pg.font(5.5); d.text("Center of Gravity Position [m]",pg.X(x0+w/2),y0+h+6,{align:"center"});
    pg.y=y0+h+8;
  });
  // Seite 4: Performance, Hinweise, Unterschriften
  pages.push(pg=>{
    pg.frame("PERFORMANCE");
    pg.table([42,40,40],[["VR (flaps T/O)",f0(W.tom.m)+" kg (TOM)",(P.vrTo.vr??"—")+" KIAS"],["VAPP DEST (flaps LDG)",f0(W.lmDest.m)+" kg (LM)",(P.vappDest.vapp??"—")+" KIAS"]].concat(P.vappAltn?[["VAPP ALTN (flaps LDG)",f0(W.lmAltn.m)+" kg (LM)",(P.vappAltn.vapp??"—")+" KIAS"]]:[]),{sz:6.1});
    const dr=[["AFM 5.3.7 / 5.3.12","PA / OAT","Rollstrecke","15 m / 50 ft"]];
    const add=(lab,o,dd)=>{ dr.push([lab,o&&o.pa!=null?f0(o.pa)+" ft / "+f1(o.temp)+" °C":"—",dd&&dd.ok?f0(dd.roll)+" m":"—",dd&&dd.ok?f0(dd.d50)+" m":(dd?dd.note:"—")]); };
    add("Start "+(ap.dep.icao||"DEP"),ap.dep,P.to); add("Landung "+(ap.dest.icao||"DEST"),ap.dest,P.ldDest); if(r.withAlt) add("Landung "+(ap.altn.icao||"ALTN"),ap.altn,P.ldAltn);
    if(P.asd) dr.push(["Startabbruch bei VR","Start- + Landerollstrecke",f0(P.asd)+" m",""]);
    pg.table([36,36,24,26],dr,{head:true,align:["","","r","r"],sz:6.1});
    const gt=(title,arr)=>{ const rows=[[title,"ROC","GS","Gradient","gefordert"]];
      arr.forEach(g=>{ if(g.grad==null){ rows.push([g.label,g.note,"","",""]); return; } const row=[g.label.replace(/ \(.*\)/,""),f0(g.roc)+" ft/min",f0(g.gs)+" kt",f1(g.grad)+" % / "+f0(g.ftnm)+" ft/NM",f1(g.req)+" %"]; row._st={color:g.ok?C.good:C.bad}; rows.push(row); });
      pg.table([40,20,14,34,16],rows,{head:true,align:["","r","r","r","r"],sz:6.0}); };
    gt(`Abflug ${ap.dep.icao||""} (TOM)`,P.climbDep);
    gt(`Durchstarten ${ap.dest.icao||""} (LM)`,P.climbGA);
    pg.para("Gradient = ROC x 0,98 / GS (AFM 5.3.8 / FBH-B 4.3), GS = TAS + Rückenwind.",5.6);
    const zs=[["dep","Start"],["dest","Landung"]].concat(r.withAlt?[["altn","Landung"]]:[]).map(([a,k])=>ap[a]&&ap[a].surch&&ap[a].surch.length?`${k} ${ap[a].icao||""}: `+ap[a].surch.map(s=>s[0]+" +"+f0((s[1]-1)*100)+" % ("+s[2]+")").join(", "):null).filter(Boolean);
    if(zs.length) pg.para("Zuschläge (inkl. in den Strecken): "+zs.join(" · "),5.6);
    if(P.ints){ const I=P.ints; const rows=[[`Intersection-Starts ${I.icao} RWY ${I.rwy}`,"TORA","TODA","ASDA","Ergebnis"]];
      I.rows.forEach(x=>{ const row=[x.from,f0(x.tora),f0(x.toda),f0(x.asda),x.ok?"ausreichend":"nicht ausreichend"]; row._st={color:x.ok?C.good:C.bad}; rows.push(row); });
      pg.table([40,16,16,16,30],rows,{head:true,align:["","r","r","r",""],sz:5.9});
      pg.para(`Benötigt inkl. Zuschläge: Rollstrecke ${f0(P.to.roll)} m ≤ TORA, Startstrecke 15 m ${f0(P.to.d50)} m ≤ TODA, Startabbruch ${f0(P.asd)} m ≤ ASDA (AIP AD 2.13, FBH-B 4.6).`,5.4); }
    const sigTop=pg.H-11-22; // Unterschriftenblock immer ueber der Fusszeile
    if(pg.y<sigTop-8){ pg.h(`Hinweise (${r.warn.length})`);
      if(!r.warn.length) pg.para("Keine Grenzwertüberschreitung erkannt.",5.6);
      else { pg.color(C.bad); let i=0; while(i<r.warn.length&&pg.y<sigTop-6){ pg.para("• "+r.warn[i],5.4); i++; } if(i<r.warn.length) pg.para(`… und ${r.warn.length-i} weitere (siehe App).`,5.3); } }
    pg.y=Math.max(pg.y,sigTop);
    pg.table([50,50,50],[["Verantwortlicher Pilot (PIC)","Fluglehrer / Flugauftragserteilender","Datum / Uhrzeit"]],{head:true,sz:5.8,zebra:false});
    { const w3=(pg.W-2*pg.m)/3; pg.stroke(C.line); pg.d.setLineWidth(0.2); for(let i=0;i<3;i++) pg.d.rect(pg.X(pg.m+i*w3),pg.y-2,w3,12); }
  });
  return pages;
}

async function makePdf(mode){
  const st=$("pdfStatus");
  if(!window.jspdf){ st.textContent="PDF-Bibliothek nicht geladen ."; return; }
  st.textContent="PDF wird erstellt …";
  const r={...R};
  r.cs=val("cs"); r.reg=val("reg"); r.dofTxt=val("dof")?val("dof").split("-").reverse().join("."):"—";
  r.cruisePwr=val("cruisePwr"); r.climbMin=0;
  r.fairingsOff=val("fairingsOff"); r.cls=r.withAlt?null:(val("clsI")?"I":"II");
  const pages=pdfPages(r); const N=pages.length;
  const {jsPDF}=window.jspdf; let doc;
  if(mode==="a5"){
    doc=new jsPDF({unit:"mm",format:"a5",orientation:"portrait"});
    pages.forEach((fn,i)=>{ if(i) doc.addPage("a5","portrait"); fn(new Pg(doc,0,i+1,N,r)); });
  } else {
    doc=new jsPDF({unit:"mm",format:"a4",orientation:"landscape"});
    const sheets=[]; for(let s=0;s<N/4;s++){ sheets.push([N-2*s,1+2*s]); sheets.push([2+2*s,N-1-2*s]); }
    sheets.forEach((pair,i)=>{ if(i) doc.addPage("a4","landscape"); pair.forEach((pn,k)=>pages[pn-1](new Pg(doc,k*148.5,pn,N,r)));
      doc.setDrawColor(200,200,200); doc.setLineWidth(0.1); doc.setLineDashPattern([1,1.5],0); doc.line(148.5,0,148.5,4); doc.line(148.5,206,148.5,210); doc.setLineDashPattern([],0); });
  }
  doc.setProperties({title:"Fuel & Performance Planning D40 "+(r.cs||""),author:"FlFlATS",subject:FBH.stand});
  const fn=`D40_FPP_${(r.cs||"").replace(/\W+/g,"")}_${(val("dof")||"").replace(/-/g,"")}_${mode==="a5"?"A5":"Broschuere_A4"}.pdf`;
  const blob=doc.output("blob");
  st.textContent="";
  await showPdfPreview(blob,fn,mode==="a5"?"A5-Seiten – zum Speichern oder Teilen „PDF speichern“ drücken.":"Broschüre: auf A4 quer beidseitig drucken, an der kurzen Kante wenden, in der Mitte falten.");
}
