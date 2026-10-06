const URL = "https://kekojtckeefmxhiaziur.supabase.co";
const KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";
const SESSION = "gm.rep.session";

function session() {
  try { return JSON.parse(localStorage.getItem(SESSION) || "null"); }
  catch { return null; }
}
async function saveStaff(person) {
  await fetch(`${URL}/rest/v1/gm_staff?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ id: person.id, name: person.name, role: "Vertrieb", pin: person.pin }),
  });
}
function gate() {
  if (session() || document.getElementById("login-gate")) return;
  const panel = document.createElement("form");
  panel.id = "login-gate";
  panel.innerHTML = `<div><b>Außendienst</b><p>Name und PIN. Der vorhandene Supabase-Key ist der Arbeitskey.</p><input name="name" placeholder="Name" required /><input name="pin" inputmode="numeric" maxlength="4" placeholder="PIN" required /><button type="submit">Start</button></div>`;
  document.body.appendChild(panel);
  const style = document.createElement("style");
  style.textContent = "#login-gate{position:fixed;inset:0;z-index:900;background:#0e1c16;display:grid;place-items:center;color:#e7f3ec} #login-gate div{width:min(360px,92vw);display:grid;gap:10px} #login-gate input,#login-gate button{min-height:46px;border-radius:10px;border:1px solid #3dd68c;background:#173528;color:#e7f3ec;padding:0 12px}";
  document.head.appendChild(style);
  panel.onsubmit = async (event) => {
    event.preventDefault();
    const person = { id: panel.name.value.trim().toLowerCase().replace(/\s+/g, "-"), name: panel.name.value.trim(), pin: panel.pin.value.trim() };
    localStorage.setItem(SESSION, JSON.stringify(person));
    localStorage.setItem("gm.rep", person.name);
    await saveStaff(person);
    panel.remove();
  };
}
setInterval(gate, 400);
