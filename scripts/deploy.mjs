// Baut die App nach dist/ und benennt app.html in index.html um (GitHub Pages braucht index.html).
// Veröffentlicht wird dist/ auf dem Branch "main" (siehe README).
import { execSync } from "node:child_process";
import { renameSync } from "node:fs";

execSync("npm run build", { stdio: "inherit" });
renameSync("dist/app.html", "dist/index.html");
console.log("Fertig: dist/ ist bereit zum Veröffentlichen.");
