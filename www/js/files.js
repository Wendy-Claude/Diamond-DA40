/* Dateien speichern/teilen: Android (Capacitor Filesystem + Share) oder Browser-Download */
const CapG = window.Capacitor;
const isNative = () => !!(CapG && CapG.isNativePlatform && CapG.isNativePlatform());
function blobToBase64(blob){ return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.onerror = rej; fr.readAsDataURL(blob); }); }
async function saveFile(name, data, mime){
  const blob = data instanceof Blob ? data : new Blob([data], {type: mime || "application/octet-stream"});
  if (isNative()) {
    try {
      const FS = CapG.registerPlugin("Filesystem"), SH = CapG.registerPlugin("Share");
      const w = await FS.writeFile({path: name, data: await blobToBase64(blob), directory: "CACHE"});
      await SH.share({title: name, url: w.uri, dialogTitle: "Speichern oder teilen"});
      return true;
    } catch (e) { if (/cancel/i.test(String(e && (e.message || e)))) return true; console.error(e); return false; }
  }
  try { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); return true; } catch (e) { return false; }
}
/** PDF-Vorschau (pdf.js) mit Speichern-Knopf */
async function showPdfPreview(blob, name, hint){
  const dlg = document.getElementById("pdfDlg"), box = document.getElementById("pdfPages");
  box.innerHTML = '<div class="note">Vorschau wird erstellt …</div>'; dlg.showModal();
  document.getElementById("pdfHint").textContent = hint || "";
  document.getElementById("pdfSave").onclick = async () => { const ok = await saveFile(name, blob, "application/pdf"); document.getElementById("pdfHint").textContent = ok ? "Gespeichert bzw. geteilt." : "Speichern nicht möglich."; };
  document.getElementById("pdfClose").onclick = () => dlg.close();
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "lib/pdf.worker.min.js";
    const pdf = await pdfjsLib.getDocument({data: new Uint8Array(await blob.arrayBuffer())}).promise;
    box.innerHTML = "";
    const width = Math.min(box.clientWidth || 360, 720);
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i), v0 = page.getViewport({scale: 1}), dpr = window.devicePixelRatio || 1;
      const scale = width / v0.width, v = page.getViewport({scale: scale * dpr});
      const c = document.createElement("canvas"); c.width = v.width; c.height = v.height; c.style.width = width + "px"; c.style.height = (v.height / dpr) + "px";
      c.className = "pdfpage"; box.appendChild(c);
      await page.render({canvasContext: c.getContext("2d"), viewport: v}).promise;
    }
  } catch (e) { console.error(e); box.innerHTML = '<div class="note" style="color:#c8102e">Vorschau nicht möglich – das PDF kann trotzdem gespeichert werden.</div>'; }
}
