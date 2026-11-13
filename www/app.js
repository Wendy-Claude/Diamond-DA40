// Platzhalter: Flugzeugliste. Leermassen werden spaeter im Untermenue gepflegt.
const AIRCRAFT = ["3H-DA","3H-DB","3H-DC","3H-DD","3H-DE","3H-DF","3H-DG"];
const ul = document.getElementById("aircraft");
for (const reg of AIRCRAFT) {
  const li = document.createElement("li");
  li.innerHTML = `<span>${reg}</span><span class="missing">Daten fehlen</span>`;
  ul.appendChild(li);
}
