document.addEventListener("DOMContentLoaded", async () => {
  if (!AuthService.estaAutenticado() || AuthService.obterTipoUsuario() !== 0) {
    window.location.href = AuthService.estaAutenticado() ? AuthService.paginaInicial() : "index.html";
    return;
  }

  const nome = localStorage.getItem("usuarioNome");
  const alvoNome = document.getElementById("nomeUsuarioInicio");
  if (alvoNome && nome) alvoNome.textContent = nome.split(" ")[0];

  const campo = document.getElementById("searchInput");
  const resumo = document.getElementById("resumoBusca");
  const lista = document.getElementById("listaVagas");
  const titulo = document.getElementById("tituloLista");
  const tabs = document.getElementById("tabsVagas");
  let vagas = [];
  let aba = "recentes";

  const PIN = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const CAL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  const USR = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6"/></svg>';

  const esc = Util.esc;

  // Canhoto com o dia do serviço (a informação principal da vaga)
  function avatar(v) {
    const d = Util.diaServico(v.dataServico);
    if (!d) return '<div class="bloco-dia sem-data" title="Data a combinar"><span class="dia">—</span><span class="mes">a combinar</span></div>';
    return `<div class="bloco-dia${d.passou ? " passou" : ""}" title="Dia do serviço: ${Util.dataServico(v.dataServico)}"><span class="sem">${d.sem}</span><span class="dia">${d.dia}</span><span class="mes">${d.mes}</span></div>`;
  }

  function linha(v) {
    return `
      <article class="vaga-linha${v.urgente ? " urgente" : ""}" data-id="${v.id}" tabindex="0">
        ${avatar(v)}
        <div class="vaga-info">
          <div class="vaga-topo">
            <h3>${esc(v.titulo)}</h3>
            <span class="job-tag">${esc(v.habilidade.nome)}</span>
            ${v.urgente ? '<span class="badge-urgente">URGENTE</span>' : ""}
          </div>
          <p class="vaga-desc">${esc(v.descricao || "Sem descrição informada.")}</p>
          <div class="vaga-meta">
            <span class="meta-i local">${PIN}${esc(Util.localDaVaga(v))}</span>
            <span class="meta-i dia-servico">${CAL}${v.dataServico ? Util.dataServico(v.dataServico) : "Data a combinar"}</span>
            <span class="meta-i">${USR}${v.totalCandidaturas} candidato(s)</span>
            <span class="vaga-contratante">${esc(v.contratante.nome)}</span>
            <span class="publicada">publicada em ${Util.data(v.dataCriacao)}</span>
          </div>
        </div>
        <div class="vaga-lado">
          <div class="vaga-preco"><small>valor proposto</small>${Util.valor(v.valorProposto)}</div>
          <button type="button" class="btn-ver">Ver vaga</button>
        </div>
      </article>`;
  }

  const porData = (a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao);

  function filtrar() {
    const q = campo.value.trim();
    const achadas = vagas.filter((v) =>
      !q || Autocomplete.combina(q, v.titulo) || Autocomplete.combina(q, v.habilidade.nome) ||
      Autocomplete.norm(v.descricao).includes(Autocomplete.norm(q)) ||
      Autocomplete.norm(Util.localDaVaga(v)).includes(Autocomplete.norm(q)));

    const recentes = [...achadas].sort(porData);
    const urgentes = recentes.filter((v) => v.urgente);
    document.getElementById("contRecentes").textContent = recentes.length;
    document.getElementById("contUrgentes").textContent = urgentes.length;

    let exibir, vazio;
    if (q) {
      // Buscando: mistura urgentes e recentes (urgentes primeiro, depois por data)
      tabs.hidden = true;
      exibir = [...urgentes, ...recentes.filter((v) => !v.urgente)];
      titulo.textContent = "Resultados da busca";
      vazio = "Nenhuma vaga encontrada para essa busca.";
      resumo.textContent = `${achadas.length} vaga(s) encontrada(s) para "${q}"`;
    } else {
      tabs.hidden = false;
      exibir = aba === "urgentes" ? urgentes : recentes;
      titulo.textContent = aba === "urgentes" ? "Vagas urgentes" : "Vagas recentes";
      vazio = aba === "urgentes" ? "Nenhuma vaga urgente no momento." : "Quando um contratante publicar uma vaga, ela aparecerá aqui.";
      resumo.textContent = "";
    }
    lista.innerHTML = exibir.length ? exibir.map(linha).join("") : `<div class="vazio-lista">${esc(vazio)}</div>`;
  }

  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-aba]");
    if (!b) return;
    aba = b.dataset.aba;
    tabs.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    filtrar();
  });

  // Sugestões: categorias + títulos das vagas que existem
  Autocomplete.criar(campo, {
    itens: () => {
      const cats = HABILIDADES.map((h) => ({ nome: h.nome, dica: "categoria" }));
      const titulos = [...new Set(vagas.map((v) => v.titulo))].map((t) => ({ nome: t, dica: "vaga" }));
      return [...cats, ...titulos];
    },
    aoEscolher: filtrar,
  });

  campo.addEventListener("input", filtrar);
  campo.addEventListener("keydown", (e) => { if (e.key === "Enter") filtrar(); });
  document.getElementById("btnBuscarVagas").addEventListener("click", filtrar);

  function abrir(e) {
    const el = e.target.closest(".vaga-linha");
    if (el) window.location.href = `vaga.html?id=${encodeURIComponent(el.dataset.id)}`;
  }
  lista.addEventListener("click", abrir);
  lista.addEventListener("keydown", (e) => { if (e.key === "Enter") abrir(e); });

  try {
    vagas = await Api.get(CONFIG.VAGAS_ENDPOINT);
    filtrar();
  } catch (erro) {
    lista.innerHTML = `<div class="vazio-lista">${esc(erro.message)}</div>`;
  }
});
