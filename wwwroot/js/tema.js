(function () {
  const ALVOS = "h1, .jobs-section h2, .destacar-ultima";
  const LETRA = /[\p{L}\p{N}]/u;

  function destacar(el) {
    if (el.querySelector(".dest") || el.dataset.semDestaque !== undefined) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let ultimo = null;
    while (walker.nextNode()) if (LETRA.test(walker.currentNode.nodeValue)) ultimo = walker.currentNode;
    if (!ultimo) return;
    const m = ultimo.nodeValue.match(/^([\s\S]*?)([\p{L}\p{N}][\p{L}\p{N}'’\-]*)([^\p{L}\p{N}]*)$/u);
    if (!m) return;
    const frag = document.createDocumentFragment();
    if (m[1]) frag.appendChild(document.createTextNode(m[1]));
    const span = document.createElement("span");
    span.className = "dest";
    span.textContent = m[2];
    frag.appendChild(span);
    if (m[3]) frag.appendChild(document.createTextNode(m[3]));
    ultimo.parentNode.replaceChild(frag, ultimo);
  }

  let agendado = false;
  function aplicar() {
    agendado = false;
    document.querySelectorAll(ALVOS).forEach(destacar);
  }
  function agendar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(aplicar);
  }

  document.addEventListener("DOMContentLoaded", () => {
    aplicar();
    new MutationObserver(agendar).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
