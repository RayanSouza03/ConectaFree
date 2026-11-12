/* Destaca em azul a última palavra dos títulos (contraste de cor nas escritas). */
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

  const OLHO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  const OLHO_FECHADO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('input[type="password"]').forEach((input) => {
      if (input.closest(".password-wrapper") || input.closest(".senha-wrap")) return;
      const wrap = document.createElement("div");
      wrap.className = "senha-wrap";
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "olho-senha";
      btn.setAttribute("aria-label", "Mostrar senha");
      btn.innerHTML = OLHO;
      btn.addEventListener("click", () => {
        const mostrar = input.type === "password";
        input.type = mostrar ? "text" : "password";
        btn.innerHTML = mostrar ? OLHO_FECHADO : OLHO;
        btn.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      });
      wrap.appendChild(btn);
    });
  });
})();
