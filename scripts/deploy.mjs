// Baut die App und kopiert das Ergebnis in den Repo-Root (GitHub Pages liefert den Root aus).
import { execSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, renameSync, rmSync } from "node:fs";

execSync("npm run build", { stdio: "inherit" });

renameSync("dist/app.html", "dist/index.html");

rmSync("assets", { recursive: true, force: true });
for (const file of readdirSync(".")) {
  if (/^workbox-.*\.js$/.test(file)) rmSync(file);
}
for (const file of ["sw.js", "registerSW.js", "manifest.webmanifest"]) {
  if (existsSync(file)) rmSync(file);
}

cpSync("dist", ".", { recursive: true });
console.log("Deploy-Dateien im Root aktualisiert.");
