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
  // 1 Deckblatt
  pages.push(pg=>{
    pg.frame("FUEL & PERFORMANCE PLANNING");
    pg.color(C.grey); pg.font(7); pg.text("Leichtluftfahrzeugsystem D40 · MOETA",pg.m,pg.y); pg.y+=4;
    pg.h("Flugdaten");
    pg.table([34,46,30,40],[["Datum (DOF)",r.dofTxt,"Flugregeln",r.ifr?"IFR":"VFR"],["Rufzeichen",r.cs||"—","Registration",r.reg||"—"],["Planungsvariante",{true:"DESTINATION WITH DESTINATION ALTERNATE",false:"DESTINATION WITHOUT ALTERNATE"+(r.cls?" – Class "+r.cls:"")}[r.withAlt],"",""]],{sz:6.9});
    pg.h("Flugplätze und Zeiten (UTC)");
    const rows=[["","ICAO","Zeit","EET","Piste / Länge"]];
    rows.push(["DEP",ap.dep.icao||"—","ETD "+hhmm(r.etd),"",(ap.dep.rwy!=null?"RWY "+String(Math.round(ap.dep.rwy/10)).padStart(2,"0"):"—")+(ap.dep.len?" · TORA "+f0(ap.dep.len)+" m":"")]);
    rows.push(["DEST",ap.dest.icao||"—","ETA "+hhmm(r.etaDest),f0(r.eetDest)+" min + "+f0(r.appr)+" min Anflug",(ap.dest.rwy!=null?"RWY "+String(Math.round(ap.dest.rwy/10)).padStart(2,"0"):"—")+(ap.dest.len?" · LDA "+f0(ap.dest.len)+" m":"")]);
    if(r.withAlt) rows.push(["ALTN",ap.altn.icao||"—","ETA "+hhmm(r.etaAltn),f0(r.eetAltn)+" min + "+f0(r.appr)+" min Anflug",(ap.altn.rwy!=null?"RWY "+String(Math.round(ap.altn.rwy/10)).padStart(2,"0"):"—")+(ap.altn.len?" · LDA "+f0(ap.altn.len)+" m":"")]);
    pg.table([14,16,28,40,40],rows,{head:true,sz:6.8});
    pg.h("Zusammenfassung");
    pg.table([42,26,42,26],[
      ["Minimum fuel",f1(F.req)+" USG","Fuel on board",f1(F.fob)+" USG"],
      ["Extra fuel",f1(F.extra)+" USG","Endurance (6,6 USG/h)",F.endurance!=null?Math.floor(F.endurance/60)+":"+String(Math.round(F.endurance%60)).padStart(2,"0")+" h":"—"],
      ["Take off mass / CG",f1(W.tom.m,0)+" kg / "+f1(W.tom.cg,3)+" m","Landing mass DEST / CG",f1(W.lmDest.m,0)+" kg / "+f1(W.lmDest.cg,3)+" m"],
      ["VR",(P.vrTo.vr??"—")+" KIAS","VAPP DEST"+(P.vappAltn?" / ALTN":""),(P.vappDest.vapp??"—")+(P.vappAltn?" / "+(P.vappAltn.vapp??"—"):"")+" KIAS"],
      ["Startrollstrecke / 15 m",P.to&&P.to.ok?f0(P.to.roll)+" / "+f0(P.to.d50)+" m":"—","Landerollstrecke DEST / 15 m",P.ldDest&&P.ldDest.ok?f0(P.ldDest.roll)+" / "+f0(P.ldDest.d50)+" m":"—"],
    ],{sz:6.7});
    pg.h(`Hinweise (${r.warn.length})`);
    if(!r.warn.length) pg.para("Keine Grenzwertüberschreitung erkannt.",6.8);
    else { pg.color(C.bad); r.warn.slice(0,9).forEach(w=>pg.para("• "+w,6.5)); if(r.warn.length>9) pg.para(`… und ${r.warn.length-9} weitere (siehe Tool).`,6.3); }
  });
  // 2 MET DEP/DEST
  pages.push(pg=>{ pg.frame("METAR / TAF"); wx(pg,"dep"); wx(pg,"dest"); });
  // 3 MET ALTN
  pages.push(pg=>{ pg.frame(r.withAlt?"METAR / TAF – ALTERNATE":"WETTER – OHNE ALTERNATE");
    if(r.withAlt) wx(pg,"altn");
    else { pg.para("Planungsvariante DESTINATION WITHOUT ALTERNATE"+(r.cls?" – Class "+r.cls:"")+": kein Destination Alternate geplant. Statt Alternate fuel wird Additional Fuel No Alternate Required (5 USG) eingerechnet.",7);
      pg.quote(QUOTE.cls2); }
    pg.h("Temperaturermittlung");
    pg.para("Die OAT für Start- und Landestrecke sowie Steiggradient wird je Flugplatz für den Zeitpunkt ETD bzw. ETA aus dem TAF übernommen (TX/TN). Bewertungszeitraum gemäß FBH-B 5.2.2/5.2.3.1: eine Stunde vor bis eine Stunde nach ETA. Gelb hinterlegt: TAF-Gruppen, die in diesen Zeitraum fallen.",6.7);
  });
  // 4 Fuel
  pages.push(pg=>{
    pg.frame("TREIBSTOFFBERECHNUNG");
    pg.para(`Berechnung gemäß FBH-B 5.3 (${r.ifr?"IFR":"VFR"}). Methode: ${F.method==="rule"?"Faustformel 6,6 USG/h":"FHB-Tabelle 4.4, "+r.cruisePwr+" % = "+f1(F.ffCruise)+" USG/h"+(r.climbMin?" · Steigflug "+f0(r.climbMin)+" min @ 92 % = 8,3 USG/h":"")}.`,6.8);
    const rows=[["Position","Grundlage","Zeit","USG","kg"]];
    const kg=v=>f1(v*(r.kgPerUsg||kgPerUsg(15)));
    rows.push(["Taxi fuel","1 USG","",f1(F.taxi),kg(F.taxi)]);
    rows.push(["Trip fuel",(r.ifr?"Start bis IAF":"Start bis Landung")+(r.ifr?" + 2 USG Anflug":""),f0(r.eetDest)+" min",f1(F.trip),kg(F.trip)]);
    rows.push(["Contingency fuel","10 % vom Trip fuel","",f1(F.cont),kg(F.cont)]);
    if(r.withAlt){
      rows.push(["Alternate fuel","DEST bis IAF ALTN"+(r.ifr?" + 2 USG Anflug":""),f0(r.eetAltn)+" min",f1(F.altEnroute+F.altAppr),kg(F.altEnroute+F.altAppr)]);
      if(r.ifr) rows.push(["  Warteverfahren",F.holdMin+" min @ "+F.holdPwr+" % ("+f1(FBH.ff[F.holdPwr])+" USG/h)",F.holdMin+" min",f1(F.altHold),kg(F.altHold)]);
    } else rows.push(["Additional fuel","No Alternate Required (45 min @ 75 %)","45 min",f1(F.add),kg(F.add)]);
    rows.push(["Final reserve fuel","3 USG","",f1(F.final),kg(F.final)]);
    const sum=["MINIMUM REQUIRED","","",f1(F.req),kg(F.req)]; sum._st={bold:true,fill:C.light}; rows.push(sum);
    rows.push(["Fuel on board","max. 39 USG verfügbar","",f1(F.fob),kg(F.fob||0)]);
    const ex=["Extra fuel","FOB – Minimum required","",f1(F.extra),kg(F.extra||0)]; ex._st={bold:true,color:F.extra<0?C.bad:C.good}; rows.push(ex);
    pg.table([30,52,16,16,16],rows,{head:true,align:["","","r","r","r"],sz:6.9});
    pg.table([60,30,50,30],[["Restmenge nach Landung DEST",f1(F.afterLanding)+" USG","Endurance (6,6 USG/h)",F.endurance!=null?Math.floor(F.endurance/60)+":"+String(Math.round(F.endurance%60)).padStart(2,"0")+" h":"—"]],{sz:6.8});
    pg.h("FBH-B 5.3 Treibstoffplanung (Auszug)");
    pg.quote({ref:"5.3 Treibstoffplanung (S. 100)",txt:"Ist der Treibstoffvorrat ausreichend genug, so dass nach der Landung noch 10 US Gal vorhanden sind, kann die Treibstoffplanung mittels Faustformel 6,6 US Gal/h berechnet werden. In allen anderen Fällen ist der genaue Treibstoffverbrauch mittels den Tabellen im FHB oder einer Flugplanungssoftware zu berechnen.\nTaxi fuel 1 USG · Trip fuel VFR: Strecke von Start bis Landung / IFR: Strecke von Start bis zum IAF + 2 USG für Anflug · Alternate fuel wie Trip fuel (IFR: + 30 Minuten für Warteverfahren, 15 Minuten bei Radar oder VMC) · Contingency fuel 10 % vom Trip fuel · Final reserve fuel 3 USG.\nBei vollen Tanks ist mit 39 US Gal verfügbarem Treibstoff zu rechnen.\nDer Final reserve fuel darf in der Planung nicht unterschritten werden. Sollten äußere Umstände erwarten lassen, dass der Final reserve fuel unterschritten wird, so ist gleich eine Notlage zu erklären „MAYDAY“ und „SHORT ON FUEL“ zu melden."});
  });
  // 5 W&B
  pages.push(pg=>{
    pg.frame("WEIGHT & BALANCE");
    const rows=[["Position","Arm m","Masse kg","Moment mkg","max kg"]];
    W.rows.forEach(x=>rows.push([x[0],f1(x[2],3),f1(x[1]),f1(x[3]),x[0]==="FWD Baggage"?"45":x[0]==="AFT Baggage"?"18":""]));
    const ph=(p,lab)=>{ const row=[lab,f1(p.cg,3),f1(p.m),f1(p.mo),String(p.max)]; row._st={bold:true,fill:C.light,color:(!p.okMass||!p.okCg)?C.bad:null}; return row; };
    rows.push(ph(W.zfm,"Zero fuel mass"));
    rows.push(["Fuel on board ("+f1(F.fob)+" USG)","2,630",f1(W.fuelKg.fob),f1(W.fuelKg.fob*2.63),""]);
    rows.push(["– Taxi fuel","2,630","-"+f1(W.fuelKg.taxi),"-"+f1(W.fuelKg.taxi*2.63),""]);
    rows.push(ph(W.tom,"Take off mass"));
    rows.push(["– Trip fuel","2,630","-"+f1(W.fuelKg.trip),"-"+f1(W.fuelKg.trip*2.63),""]);
    rows.push(ph(W.lmDest,"Landing mass DEST"));
    if(W.lmAltn){ rows.push(["– Alternate fuel (ohne Holding)","2,630","-"+f1(W.fuelKg.alt),"-"+f1(W.fuelKg.alt*2.63),""]); rows.push(ph(W.lmAltn,"Landing mass ALTN")); }
    pg.table([46,18,22,26,16],rows,{head:true,align:["","r","r","r","r"],sz:6.8});
    pg.table([46,30,30,30],[["Phase","CG zulässig von","bis","Status"]].concat(W.phases.filter(p=>p!==W.ramp).map(p=>{ const ok=p.okMass&&p.okCg; const row=[p.name,f1(p.fwd,3)+" m",f1(p.aft,3)+" m",ok?"im Bereich":"AUSSERHALB"]; row._st={color:ok?C.good:C.bad}; return row; })),{head:true,sz:6.6});
    // Diagramm
    const d=pg.d, x0=pg.m+14, w=pg.W-2*pg.m-20, y0=pg.y+2, h=Math.min(62,pg.H-14-y0-8);
    const X=c=>pg.X(x0+(c-2.39)/(2.54-2.39)*w), Y=m=>y0+h-(m-920)/(1330-920)*h;
    pg.fill([246,247,243]); d.rect(pg.X(x0),y0,w,h,"F");
    d.setLineWidth(0.1); pg.stroke([210,210,200]); pg.font(5.5); pg.color(C.grey);
    [2.40,2.42,2.44,2.46,2.48,2.50,2.52].forEach(c=>{ d.line(X(c),y0,X(c),y0+h); d.text(c.toFixed(2),X(c),y0+h+3,{align:"center"}); });
    [940,1000,1100,1200,1280,1310].forEach(m=>{ d.line(pg.X(x0),Y(m),pg.X(x0+w),Y(m)); d.text(String(m),pg.X(x0-1),Y(m)+1,{align:"right"}); });
    pg.stroke(C.dark); d.setLineWidth(0.6);
    const env=[[2.40,940],[2.40,1080],[2.469,1310],[2.53,1310],[2.53,940],[2.40,940]];
    for(let i=0;i<env.length-1;i++) d.line(X(env[i][0]),Y(env[i][1]),X(env[i+1][0]),Y(env[i+1][1]));
    const pts=W.phases.filter(p=>p!==W.ramp&&p.cg); const lab={"Zero fuel mass":"ZFM","Take off mass":"TOM","Landing mass DEST":"LM DEST","Landing mass ALTN":"LM ALTN"};
    pg.stroke(C.red); d.setLineWidth(0.3);
    for(let i=0;i<pts.length-1;i++) d.line(X(pts[i].cg),Y(pts[i].m),X(pts[i+1].cg),Y(pts[i+1].m));
    pts.forEach((p,i)=>{ pg.fill(C.red); d.circle(X(p.cg),Y(p.m),0.9,"F"); pg.color(C.red); pg.font(5.5,"bold"); const lx=pg.X(x0+w*0.62), ly=y0+h*0.55+i*4.2; pg.stroke(C.red); d.setLineWidth(0.1); d.line(X(p.cg)+1,Y(p.m),lx-1,ly-1); d.text(lab[p.name]+"  "+f1(p.m,0)+" kg / "+f1(p.cg,3)+" m",lx,ly); });
    pg.color(C.grey); pg.font(5.8); d.text("Center of Gravity Position [m]",pg.X(x0+w/2),y0+h+6,{align:"center"}); d.text("Flight Mass [kg]",pg.X(pg.m+2),y0+h/2,{angle:90});
    pg.y=y0+h+9;
  });
  // 6 Performance
  pages.push(pg=>{
    pg.frame("PERFORMANCE");
    pg.h("Geschwindigkeiten (FBH-B 4.1.2)");
    const sp=[["","Masse","Tabellenzeile","KIAS"]];
    sp.push(["VR (flaps T/O)",f0(W.tom.m)+" kg (TOM)",P.vrTo.row?"bis "+P.vrTo.row+" kg":"—",String(P.vrTo.vr??"—")]);
    sp.push(["VAPP DEST (flaps LDG)",f0(W.lmDest.m)+" kg (LM)",P.vappDest.row?"bis "+P.vappDest.row+" kg":"—",String(P.vappDest.vapp??"—")]);
    if(P.vappAltn) sp.push(["VAPP ALTN (flaps LDG)",f0(W.lmAltn.m)+" kg (LM)",P.vappAltn.row?"bis "+P.vappAltn.row+" kg":"—",String(P.vappAltn.vapp??"—")]);
    pg.table([40,34,34,16],sp,{head:true,align:["","","","r"],sz:6.8});
    pg.h("Start- und Landestrecke (FBH-B 4.2 / 4.5 / 4.6)");
    const dr=[["","PA / OAT","Rollstrecke","15 m / 50 ft"]];
    const add=(lab,o,dd)=>{ dr.push([lab,o&&o.pa!=null?f0(o.pa)+" ft / "+f1(o.temp)+" °C":"—",dd&&dd.ok?f0(dd.roll)+" m":"—",dd&&dd.ok?f0(dd.d50)+" m":(dd?dd.note:"—")]); };
    add("Start "+(ap.dep.icao||"DEP"),ap.dep,P.to); add("Landung "+(ap.dest.icao||"DEST"),ap.dest,P.ldDest); if(r.withAlt) add("Landung "+(ap.altn.icao||"ALTN"),ap.altn,P.ldAltn);
    if(P.asd) dr.push(["Startabbruch bei VR","Start- + Landerollstrecke",f0(P.asd)+" m",""]);
    pg.table([34,36,24,26],dr,{head:true,align:["","","r","r"],sz:6.8});
    const st=(lab,dd)=>{ if(dd&&dd.ok) pg.para(lab+": "+dd.steps.map(s=>s[0]+" "+f0(s[1])+"/"+f0(s[2])+" m").join("  >  ")+(dd.note?" · "+dd.note:""),5.9); };
    st("Start",P.to); st("Landung DEST",P.ldDest); if(r.withAlt) st("Landung ALTN",P.ldAltn);
    pg.para("Start-/Landestrecken aus AFM-Tabellen (Kap. 5.3.7/5.3.12), interpoliert nach Masse. Zuschläge nacheinander angewendet; Wind auf Roll- und Gesamtstrecke, Neigung/Belag auf die Rollstrecke."+(r.fairingsOff?" Ohne Radverkleidungen: +20 m / +30 m (Start), Steigrate -20/-40 ft/min.":""),5.9);
    const gt=(title,arr)=>{ pg.h(title); const rows=[["Verfahren","ROC","TAS / GS","Gradient","gefordert"]];
      arr.forEach(g=>{ if(g.grad==null){ rows.push([g.label,g.note,"","",""]); return; } const row=[g.label,f0(g.roc)+" ft/min",f0(g.tas)+" / "+f0(g.gs)+" kt",f1(g.grad)+" %",f1(g.req)+" % = "+f0(g.rocReq)+" ft/min"]; row._st={color:g.ok?C.good:C.bad}; rows.push(row); });
      if(arr.length===0) rows.push(["Daten fehlen","","","",""]);
      pg.table([46,20,22,16,28],rows,{head:true,align:["","r","r","r","r"],sz:6.5}); };
    gt(`Steiggradient Abflug ${ap.dep.icao||""} (TOM ${f0(W.tom.m)} kg)`,P.climbDep);
    gt(`Steiggradient Durchstarten ${ap.dest.icao||""} (LM ${f0(W.lmDest.m)} kg)`,P.climbGA);
    pg.para("Gradient [%] = ROC [ft/min] x 0,98 / GS [kt] (FBH-B 4.3). GS = TAS + Rückenwind, Gegenwind nicht angerechnet (ungünstigste Variante). Für das Instrumentenabflugverfahren ist grundsätzlich der Cruise Climb zu verwenden; wird der Mindeststeiggradient damit nicht erreicht, ist der Take-off Climb anzuwenden (LB 2113, Kap. 1.5).",5.9);
  });
  // 7 FBH Bestimmungen
  pages.push(pg=>{
    pg.frame(r.withAlt?"DESTINATION WITH ALTERNATE":"DESTINATION WITHOUT ALTERNATE");
    pg.para("Bestimmungen gemäß FBH-B D40, Kapitel 5.2 Instrumentenflug (wörtlich zitiert):",6.8,"bold");
    quotesFor(r.withAlt).forEach(q=>pg.quote(q));
  });
  // 8 Rückseite
  pages.push(pg=>{
    pg.frame("BESTÄTIGUNG");
    pg.h("Bemerkungen");
    pg.d.setLineWidth(0.15); pg.stroke(C.line); for(let i=0;i<8;i++){ pg.d.line(pg.X(pg.m),pg.y+6+i*7,pg.X(pg.W-pg.m),pg.y+6+i*7); } pg.y+=8*7+6;
    pg.h("Unterschriften");
    pg.table([50,50,50],[["Verantwortlicher Pilot (PIC)","Fluglehrer / Flugauftragserteilender","Datum / Uhrzeit"]],{head:true,sz:6.8,zebra:false});
    { const w3=(pg.W-2*pg.m)/3; pg.stroke(C.line); pg.d.setLineWidth(0.2); for(let i=0;i<3;i++) pg.d.rect(pg.X(pg.m+i*w3),pg.y-2,w3,18); pg.y+=19; }
    pg.h("Datengrundlage");
    pg.para(`Rechengrundlage: ${FBH.stand} – Kap. 1.8/1.13 (Grenzwerte), 4.1.2 (VR/VAPP), 4.2 (Startstrecke), 4.3 (Steiggradient), 4.4 (Treibstoffverbrauch), 4.5 (Landestrecke), 4.6 (Zuschläge), 5.2 (Ausweichflugplatzplanung), 5.3 (Treibstoffplanung), 6.1 (Weight & Balance). Basisleermassen gemäß Weight and Balance Sheet V1. Wetter: aviationweather.gov (METAR/TAF), Stand der Eingabe. Druckhöhe = Platzhöhe + (1013,25 – QNH) x 27 ft. Erstellt: ${new Date().toISOString().slice(0,16).replace("T"," ")} UTC.`,6.3);
    pg.para("Das Planungswerkzeug ersetzt nicht die Prüfung durch den verantwortlichen Piloten. Maßgeblich sind FHB/AFM und FBH-B in der gültigen Fassung sowie das offizielle Flugwetter-Briefing.",6.3,"bold");
  });
  return pages;
}

async function makePdf(mode){
  const st=$("pdfStatus");
  if(!window.jspdf){ st.textContent="PDF-Bibliothek nicht geladen (Internetverbindung nötig)."; return; }
  st.textContent="PDF wird erstellt …";
  const r={...R};
  r.cs=val("cs"); r.reg=val("reg"); r.dofTxt=val("dof")?val("dof").split("-").reverse().join("."):"—";
  r.eetDest=num("eetDest")||0; r.eetAltn=num("eetAltn")||0; r.appr=num("apprMin")||0; r.cruisePwr=val("cruisePwr"); r.climbMin=val("fuelMethod")==="rule"?0:(num("climbMin")||0);
  r.fairingsOff=val("fairingsOff"); r.cls=r.withAlt?null:val("cls");
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
  const ok=await offerFile(fn,blob);
  st.textContent=ok?(mode==="a5"?"A5-PDF erstellt.":"Broschüre erstellt – beidseitig drucken, an der kurzen Kante wenden, falten."):"Speichern nicht möglich.";
}
