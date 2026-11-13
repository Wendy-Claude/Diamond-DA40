/* ===== Vertikalprofil: Modell, SVG (interaktiv) und PDF ===== */
/** Phasen aus der Treibstoffberechnung. Zeitachse; jede Phase mit Mindestbreite (nicht massstaeblich). */
function profileModel(r){
  const F=r.fuel, ap=r.ap; if(!F||!F.tripLeg||!F.tripLeg.ok) return null;
  const ph=[]; const elev=o=>o&&o.elev!=null?o.elev:0;
  const add=o=>{ if(!(o.min>0.05)&&!o.always) return; ph.push(o); };
  const leg=(L,A,startElev,tag,field,distField)=>{
    add({label:"Steigflug",a0:startElev,a1:L.alt,nm:L.cl.nm,min:L.cl.min,usg:L.cl.usg,leg:tag,always:true});
    const iaf=A&&A.mode==="self"&&A.ok?A.alt:null;
    if(iaf!=null&&iaf<L.alt&&L.crMin>0){ const dmin=Math.min((L.alt-iaf)/500,L.crMin*0.6), f=dmin/L.crMin;
      add({label:"Reiseflug",a0:L.alt,a1:L.alt,nm:L.remNm*(1-f),min:L.crMin-dmin,usg:L.crUsg*(1-f),leg:tag,drag:field,dist:distField});
      add({label:"Sinkflug",a0:L.alt,a1:iaf,nm:L.remNm*f,min:dmin,usg:L.crUsg*f,leg:tag});
      return iaf; }
    add({label:"Reiseflug",a0:L.alt,a1:L.alt,nm:L.remNm,min:L.crMin,usg:L.crUsg,leg:tag,drag:field,dist:distField,always:true});
    return L.alt;
  };
  let a=leg(F.tripLeg,F.tripAp,elev(ap.dep),"TRIP","altTrip","distTrip");
  if(F.tripAp&&F.tripAp.min>0) add({label:"Anflug",a0:a,a1:elev(ap.dest),nm:F.tripAp.mode==="self"?F.tripAp.dist:null,min:F.tripAp.min,usg:F.tripAp.usg,leg:"TRIP"});
  const marks=[{i:0,name:ap.dep.icao||"DEP"},{i:ph.length,name:ap.dest.icao||"DEST",pull:F.pullUp}];
  if(r.withAlt&&F.altLeg&&F.altLeg.ok){
    a=leg(F.altLeg,F.altAp,elev(ap.dest),"ALTN","altAlt","distAlt");
    if(r.ifr&&F.holdMin>0) add({label:"Holding",a0:a,a1:a,nm:null,min:F.holdMin,usg:F.altHold,leg:"ALTN",hold:true});
    if(F.altAp&&F.altAp.min>0) add({label:"Anflug",a0:a,a1:elev(ap.altn),nm:F.altAp.mode==="self"?F.altAp.dist:null,min:F.altAp.min,usg:F.altAp.usg,leg:"ALTN"});
    marks.push({i:ph.length,name:ap.altn.icao||"ALTN"});
  }
  const maxAlt=Math.max(...ph.map(p=>Math.max(p.a0,p.a1)));
  return {ph,marks,top:Math.max(4000,Math.ceil(maxAlt*1.2/1000)*1000)};
}
/** x-Positionen: Mindestbreite je Phase + Rest proportional zur Zeit */
function profileLayout(M,W,minW){
  const T=M.ph.reduce((s,p)=>s+p.min,0)||1, free=Math.max(0,W-minW*M.ph.length);
  let x=0; return M.ph.map(p=>{ const w=minW+free*p.min/T; const o={x0:x,x1:x+w}; x+=w; return o; });
}
const fmtAlt=a=>a>=3000&&a%100===0&&a>=5000?"FL"+String(Math.round(a/100)).padStart(3,"0"):Math.round(a)+" ft";

function profileSvg(r){
  const M=profileModel(r); if(!M) return '<div class="note">Vertikalprofil: Strecke und Reiseflughöhe für Trip eingeben.</div>';
  const W=720, L=46, PW=W-L-8, top=14, H=150, band=64, Ht=top+H+band+6;
  const X=profileLayout(M,PW,70).map(o=>({x0:L+o.x0,x1:L+o.x1}));
  const Y=a=>top+H-(a/M.top)*H;
  let s=`<svg viewBox="0 0 ${W} ${Ht}" class="profile" data-top="${M.top}" data-y0="${top}" data-h="${H}">`;
  for(let a=0;a<=M.top;a+=M.top>10000?2000:1000){ s+=`<line x1="${L}" x2="${W-8}" y1="${Y(a)}" y2="${Y(a)}" class="pg"/><text x="${L-4}" y="${Y(a)+3}" class="pt" text-anchor="end">${a}</text>`; }
  // Legs farbig hinterlegen
  const legSpan=tag=>{ const ix=M.ph.map((p,i)=>p.leg===tag?i:-1).filter(i=>i>=0); return ix.length?[X[ix[0]].x0,X[ix[ix.length-1]].x1]:null; };
  [["TRIP","#eef1e8"],["ALTN","#f7ece8"]].forEach(([t,c])=>{ const sp=legSpan(t); if(sp) s+=`<rect x="${sp[0]}" y="${top}" width="${sp[1]-sp[0]}" height="${H}" fill="${c}"/><text x="${sp[0]+4}" y="${top+11}" class="pl">${t==="TRIP"?"TRIP":"ALTERNATE"}</text>`; });
  // Linie
  let d=""; M.ph.forEach((p,i)=>{ d+=(i?"L":"M")+X[i].x0+","+Y(p.a0)+" L"+X[i].x1+","+Y(p.a1)+" "; });
  s+=`<path d="${d}" class="pline"/>`;
  M.ph.forEach((p,i)=>{ if(p.hold){ const cx=(X[i].x0+X[i].x1)/2, cy=Y(p.a0); s+=`<ellipse cx="${cx}" cy="${cy-9}" rx="${Math.min(26,(X[i].x1-X[i].x0)/2-4)}" ry="7" class="phold"/>`; } });
  // Platzmarken
  M.marks.forEach(m=>{ const x=m.i<X.length?X[m.i].x0:X[X.length-1].x1; const a=m.i<M.ph.length?M.ph[m.i].a0:M.ph[M.ph.length-1].a1;
    s+=`<line x1="${x}" x2="${x}" y1="${top}" y2="${top+H}" class="pm"/><circle cx="${x}" cy="${Y(a)}" r="4" class="pdot"/><text x="${x}" y="${top+H+12}" text-anchor="middle" class="pmt">${esc(m.name)}</text>`+(m.pull!=null?`<rect x="${x-52}" y="${top+20}" width="104" height="30" rx="4" class="ppu"/><text x="${x}" y="${top+32}" text-anchor="middle" class="ppt">PULL UP FUEL</text><text x="${x}" y="${top+45}" text-anchor="middle" class="ppv">${f1(m.pull)} USG</text>`:""); });
  // Zieh-Griffe Reiseflughoehe, antippbare Strecke
  M.ph.forEach((p,i)=>{ if(!p.drag) return; const cx=(X[i].x0+X[i].x1)/2, cy=Y(p.a0);
    s+=`<g class="phandle" data-field="${p.drag}" data-min="${Math.max(1000,Math.ceil((p.leg==="TRIP"?(r.ap.dep.elev||0):(r.ap.dest.elev||0))/500)*500+500)}"><circle cx="${cx}" cy="${cy}" r="11"/><text x="${cx}" y="${cy+4}" text-anchor="middle">↕</text></g><text x="${cx}" y="${cy-15}" text-anchor="middle" class="palt" data-for="${p.drag}">${fmtAlt(p.a0)}</text>`;
    s+=`<text x="${cx}" y="${top+H-6}" text-anchor="middle" class="pdist" data-dist="${p.dist}">Strecke ${f0(p.leg==="TRIP"?r.fuel.tripLeg.dist:r.fuel.altLeg.dist)} NM ✎</text>`; });
  // Werte-Band
  const by=top+H+20;
  M.ph.forEach((p,i)=>{ const cx=(X[i].x0+X[i].x1)/2; s+=`<line x1="${X[i].x0}" x2="${X[i].x0}" y1="${by-4}" y2="${by+band-12}" class="pm"/>`;
    s+=`<text x="${cx}" y="${by+6}" text-anchor="middle" class="pbh">${p.label}</text><text x="${cx}" y="${by+18}" text-anchor="middle" class="pb">${p.nm!=null?f0(p.nm)+" NM":"–"}</text><text x="${cx}" y="${by+30}" text-anchor="middle" class="pb">${f0(p.min)} min</text><text x="${cx}" y="${by+42}" text-anchor="middle" class="pb">${f1(p.usg)} USG</text>`; });
  s+=`<text x="${L}" y="${Ht-2}" class="pt">Höhe ft · Zeitachse nicht maßstäblich · ↕ ziehen = Reiseflughöhe, ✎ antippen = Strecke</text></svg>`;
  return s;
}
/** Interaktion: Hoehe ziehen (500-ft-Schritte), Strecke antippen */
function initProfileUi(){
  const box=document.getElementById("profile"); let drag=null;
  const altFromY=(svg,clientY)=>{ const pt=svg.createSVGPoint(); pt.y=clientY; pt.x=0; const p=pt.matrixTransform(svg.getScreenCTM().inverse());
    const top=+svg.dataset.top, y0=+svg.dataset.y0, h=+svg.dataset.h; return (y0+h-p.y)/h*top; };
  box.addEventListener("pointerdown",e=>{ const g=e.target.closest(".phandle"); if(g){ e.preventDefault(); const svg=g.ownerSVGElement; drag={g,svg,field:g.dataset.field,min:+g.dataset.min}; g.setPointerCapture&&g.setPointerCapture(e.pointerId); return; }
    const t=e.target.closest(".pdist"); if(t){ const f=t.dataset.dist, cur=document.getElementById(f).value; const v=prompt("Strecke in NM",cur); if(v!=null&&v.trim()!==""){ document.getElementById(f).value=v.trim(); render(); } } });
  box.addEventListener("pointermove",e=>{ if(!drag) return; e.preventDefault();
    let a=Math.round(altFromY(drag.svg,e.clientY)/500)*500; a=Math.max(drag.min,Math.min(16000,a));
    const c=drag.g.querySelector("circle"), t=drag.g.querySelector("text"), y=+drag.svg.dataset.y0+ +drag.svg.dataset.h-(a/ +drag.svg.dataset.top)* +drag.svg.dataset.h;
    c.setAttribute("cy",y); t.setAttribute("y",y+4); const lab=drag.svg.querySelector(`.palt[data-for="${drag.field}"]`); if(lab){ lab.setAttribute("y",y-15); lab.textContent=fmtAlt(a); }
    document.getElementById(drag.field).value=a; drag.val=a; });
  const end=()=>{ if(drag){ drag=null; render(); } };
  box.addEventListener("pointerup",end); box.addEventListener("pointercancel",end);
}
/** PDF: Profil mit Werten (jsPDF) */
function profilePdf(pg,r,h){
  const M=profileModel(r); if(!M) return false; const d=pg.d;
  const L=pg.m+9, PW=pg.W-pg.m-L, top=pg.y+1, H=h, by=top+H+3;
  const X=profileLayout(M,PW,14).map(o=>({x0:L+o.x0,x1:L+o.x1})); const Y=a=>top+H-(a/M.top)*H;
  d.setLineWidth(0.1); pg.stroke([215,215,205]); pg.font(4.8); pg.color(C.grey);
  for(let a=0;a<=M.top;a+=M.top>10000?4000:2000){ d.line(pg.X(L),Y(a),pg.X(L+PW),Y(a)); d.text(String(a),pg.X(L-1),Y(a)+1,{align:"right"}); }
  pg.stroke(C.red); d.setLineWidth(0.5);
  M.ph.forEach((p,i)=>{ d.line(pg.X(X[i].x0),Y(p.a0),pg.X(X[i].x1),Y(p.a1)); if(p.hold){ d.setLineWidth(0.25); d.ellipse(pg.X((X[i].x0+X[i].x1)/2),Y(p.a0)-2.2,Math.min(6,(X[i].x1-X[i].x0)/2-1),1.6); d.setLineWidth(0.5); } });
  M.marks.forEach(m=>{ const x=m.i<X.length?X[m.i].x0:X[X.length-1].x1; pg.stroke(C.dark); d.setLineWidth(0.15); d.line(pg.X(x),top,pg.X(x),top+H); pg.color(C.dark); pg.font(5.2,"bold"); d.text(pdfTxt(m.name),pg.X(x),top-0.6,{align:"center"});
    if(m.pull!=null){ pg.fill(C.mark); d.rect(pg.X(x-11),top+1.5,22,5.6,"F"); pg.color(C.dark); pg.font(4.6,"bold"); d.text("PULL UP FUEL",pg.X(x),top+3.6,{align:"center"}); d.text(f1(m.pull)+" USG",pg.X(x),top+6.2,{align:"center"}); } });
  M.ph.forEach((p,i)=>{ if(p.drag){ pg.color(C.red); pg.font(5,"bold"); d.text(fmtAlt(p.a0),pg.X((X[i].x0+X[i].x1)/2),Y(p.a0)-1.2,{align:"center"}); } });
  pg.color([30,30,30]);
  M.ph.forEach((p,i)=>{ const cx=pg.X((X[i].x0+X[i].x1)/2); pg.stroke([200,200,190]); d.setLineWidth(0.1); d.line(pg.X(X[i].x0),by-1,pg.X(X[i].x0),by+10);
    pg.font(4.9,"bold"); d.text(pdfTxt(p.label),cx,by+1.5,{align:"center"}); pg.font(4.7);
    d.text(p.nm!=null?f0(p.nm)+" NM":"–",cx,by+4.2,{align:"center"}); d.text(f0(p.min)+" min",cx,by+6.8,{align:"center"}); d.text(f1(p.usg)+" USG",cx,by+9.4,{align:"center"}); });
  pg.y=by+12; return true;
}
