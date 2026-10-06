const URL = "https://kekojtckeefmxhiaziur.supabase.co";
const KEY = "sb_publishable_dZDpEtY-YsfbulpdEC0Lxw_o82SPtwh";
const SESSION = "gm.rep.session";
const USERS = [
  { id: "orhan", name: "Orhan", pin: "E12026!" },
  { id: "luca", name: "Luca", pin: "E12026!" },
];

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
    body: JSON.stringify({ id: person.id, name: person.name, role: "Vertrieb" }),
  });
}
function gate() {
  if (session() || document.getElementById("login-gate")) return;
  const panel = document.createElement("form");
  panel.id = "login-gate";
  panel.innerHTML = `<div><b>Außendienst</b><p>Benutzer und Passwort.</p><input name="name" placeholder="Benutzer" required /><input name="pin" type="password" placeholder="Passwort" required /><button type="submit">Start</button><p class="empty" id="login-error"></p></div>`;
  document.body.appendChild(panel);
  const style = document.createElement("style");
  style.textContent = "#login-gate{position:fixed;inset:0;z-index:900;background:#0e1c16;display:grid;place-items:center;color:#e7f3ec} #login-gate div{width:min(360px,92vw);display:grid;gap:10px} #login-gate input,#login-gate button{min-height:46px;border-radius:10px;border:1px solid #3dd68c;background:#173528;color:#e7f3ec;padding:0 12px}";
  document.head.appendChild(style);
  panel.onsubmit = async (event) => {
    event.preventDefault();
    const name = panel.name.value.trim().toLowerCase();
    const pin = panel.pin.value;
    const person = USERS.find((user) => user.name.toLowerCase() === name && user.pin === pin);
    if (!person) {
      document.getElementById("login-error").textContent = "Benutzer oder Passwort falsch";
      return;
    }
    localStorage.setItem(SESSION, JSON.stringify(person));
    localStorage.setItem("gm.rep", person.name);
    await saveStaff(person);
    panel.remove();
  };
}
setInterval(gate, 400);
