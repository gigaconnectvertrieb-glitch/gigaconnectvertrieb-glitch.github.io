function boot() {
  document.title = "E1 Außendienst";
  const title = document.querySelector(".brand h1");
  const sub = document.querySelector(".brand p");
  if (title) title.textContent = "E1 Außendienst";
  if (sub) sub.innerHTML = `<a href="https://e1direktvertrieb.de" target="_blank" rel="noopener">e1direktvertrieb.de</a> · Strom und Gas`;
  if (document.getElementById("e1-note")) return;
  const side = document.querySelector(".side");
  if (!side) return;
  const note = document.createElement("p");
  note.id = "e1-note";
  note.className = "empty";
  note.textContent = "Türgespräch: Gebiet, Straße, nächstes Haus, Besuch. Orhan und Luca.";
  side.appendChild(note);
}
setInterval(boot, 400);
