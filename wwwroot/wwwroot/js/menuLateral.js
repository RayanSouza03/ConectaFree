/**
 * Menu lateral compartilhado entre as telas.
 * Fica em um único lugar: para mudar os links, edite a lista ITENS abaixo.
 *
 * Uso: coloque este script logo depois de <body> e informe a tela atual em
 * <body data-menu-ativo="pagina.html">. A tela de cadastro não usa o menu.
 */
(function () {
  const ICONES = {
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
    cadastro: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.6 3.1-6 7-6s7 2.4 7 6"/><path d="M19 8v6M16 11h6"/>',
    inicio: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    ver: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    editar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    portfolio: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/>',
    vagas: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    faq: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1-1.5 2.2"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
  };

  const tipo = Number(localStorage.getItem("tipoUsuario"));
  const ehContratante = tipo === 1;
  const HOME = ehContratante ? "contratante.html" : "inicio.html";

  const ITENS = ehContratante
    ? [
        { href: "contratante.html", rotulo: "Início", icone: "inicio" },
        { href: "vagas.html", rotulo: "Minhas vagas", icone: "vagas" },
        { href: "visualizar-perfil.html", rotulo: "Perfil", icone: "ver" },
        { href: "faq.html", rotulo: "FAQ", icone: "faq" },
      ]
    : [
        { href: "inicio.html", rotulo: "Início", icone: "inicio" },
        { href: "candidaturas.html", rotulo: "Candidaturas", icone: "vagas" },
        { href: "visualizar-perfil.html", rotulo: "Perfil", icone: "ver" },
        { href: "portfolio.html", rotulo: "Portfólio", icone: "portfolio" },
        { href: "faq.html", rotulo: "FAQ", icone: "faq" },
      ];
  const script = document.currentScript;
  const ativo = document.body.dataset.menuAtivo || "";

  const links = ITENS.map((item) => {
    const atual = item.href === ativo ? ' class="ativo" aria-current="page"' : "";
    return `
        <a href="${item.href}"${atual} title="${item.rotulo}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONES[item.icone]}</svg>
          <span class="rotulo">${item.rotulo}</span>
        </a>`;
  }).join("");

  const menu = document.createElement("aside");
  menu.className = "menu-lateral";
  menu.id = "menuLateral";
  menu.innerHTML = `
    <div class="cabecalho-menu">
      <a class="logo-marca" href="${HOME}">
        <img src="img/logo-verde.png" alt="ConectaFree">
        <span class="logo-texto">ConectaFree</span>
      </a>
      <button class="botao-retrair" id="botaoRetrair" type="button" aria-label="Recolher menu" aria-expanded="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
    </div>

    <div class="bloco-navegacao">
      <nav class="nav-lateral">${links}</nav>
    </div>

    <div class="acoes-menu">
      <button type="button" class="link-sair" id="btnSairMenu" title="Sair da conta" aria-label="Sair da conta">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-4"/>
        </svg>
        <span class="rotulo">Sair da conta</span>
      </button>
    </div>

    <p class="rodape-menu">ConectaFree</p>`;

  script.parentNode.insertBefore(menu, script);

  /* Retrair / expandir (o estado fica salvo entre as telas) */
  const botao = document.getElementById("botaoRetrair");

  const logo = menu.querySelector(".logo-marca");

  function aplicar(fechado) {
    menu.classList.toggle("fechado", fechado);
    botao.setAttribute("aria-expanded", String(!fechado));
    botao.setAttribute("aria-label", fechado ? "Expandir menu" : "Recolher menu");
    // Recolhido: só a logo aparece e ela vira o botão de expandir
    logo.title = fechado ? "Expandir menu" : "";
    logo.setAttribute("aria-label", fechado ? "Expandir menu" : "ConectaFree");
  }

  function alternar(fechado) {
    aplicar(fechado);
    try { localStorage.setItem("menuFechado", fechado ? "1" : "0"); } catch { /* ignora */ }
  }

  try {
    aplicar(localStorage.getItem("menuFechado") === "1");
  } catch { /* sem storage disponível */ }

  const btnSair = document.getElementById("btnSairMenu");
  if (btnSair) {
    btnSair.addEventListener("click", () => AuthService.sair());
  }

  botao.addEventListener("click", () => alternar(!menu.classList.contains("fechado")));

  logo.addEventListener("click", (e) => {
    if (!menu.classList.contains("fechado")) return; // aberto: a logo leva para o início
    e.preventDefault();
    alternar(false);
  });
})();
