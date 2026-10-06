const NAMES = /Luca Keller|Mira Hoffmann|Jonas Berg/g;
localStorage.removeItem("gm.v1");
localStorage.removeItem("gm.v2");

function strip(root) {
  root.querySelectorAll("[data-tab='team']").forEach((node) => node.remove());
  root.querySelectorAll("small, .chip, button, p, span").forEach((node) => {
    if (!NAMES.test(node.textContent || "")) return;
    NAMES.lastIndex = 0;
    if (node.classList.contains("chip") || node.dataset.tab === "team") {
      node.remove();
      return;
    }
    node.innerHTML = node.innerHTML.replace(NAMES, "").replace(/\s·\s·/g, " ·").replace(/\s·\s*$/g, "");
  });
}

const start = () => {
  strip(document);
  new MutationObserver(() => strip(document)).observe(document.body, { childList: true, subtree: true });
};
if (document.body) start();
else document.addEventListener("DOMContentLoaded", start);
