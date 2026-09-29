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
  const listaRecentes = document.getElementById("listaRecentes");
  const listaUrgentes = document.getElementById("listaUrgentes");
  const secaoUrgentes = document.getElementById("secaoUrgentes");
  const tituloRecentes = document.getElementById("tituloRecentes");
  let vagas = [];

  const esc = Util.esc;

  function avatar(v) {
    const c = v.contratante;
    return c.fotoUrl
      ? `<img class="avatar-foto" src="${esc(c.fotoUrl)}" alt="">`
      : `<div class="avatar-inicial">${esc(Util.iniciais(c.nome))}</div>`;
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
            <span>${esc(v.contratante.nome)}</span>
            <span>${esc(Util.local(v.contratante.endereco))}</span>
            <span>Publicada em ${Util.data(v.dataCriacao)}</span>
            <span>${v.totalCandidaturas} candidato(s)</span>
          </div>
        </div>
        <div class="vaga-lado">
          <div class="vaga-preco"><small>valor proposto</small>${Util.valor(v.valorProposto)}</div>
          <button type="button" class="btn-ver">Ver vaga</button>
        </div>
      </article>`;
  }

  function desenhar(lista, alvo, vazio) {
    alvo.innerHTML = lista.length ? lista.map(linha).join("") : `<div class="vazio-lista">${esc(vazio)}</div>`;
  }

  function filtrar() {
    const q = campo.value.trim();
    const achadas = vagas.filter((v) =>
      !q || Autocomplete.combina(q, v.titulo) || Autocomplete.combina(q, v.habilidade.nome) ||
      Autocomplete.norm(v.descricao).includes(Autocomplete.norm(q)));

    const ordenadas = [...achadas].sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
    const urgentes = ordenadas.filter((v) => v.urgente);

    secaoUrgentes.hidden = urgentes.length === 0;
    desenhar(urgentes, listaUrgentes, "");
    tituloRecentes.textContent = q ? "Resultados da busca" : "Vagas recentes";
    desenhar(ordenadas, listaRecentes,
      q ? "Nenhuma vaga encontrada para essa busca." : "Quando um contratante publicar uma vaga, ela aparecerá aqui.");
    resumo.textContent = q ? `${achadas.length} vaga(s) encontrada(s) para "${q}"` : "";
  }

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
  [listaRecentes, listaUrgentes].forEach((l) => {
    l.addEventListener("click", abrir);
    l.addEventListener("keydown", (e) => { if (e.key === "Enter") abrir(e); });
  });

  try {
    vagas = await Api.get(CONFIG.VAGAS_ENDPOINT);
    filtrar();
  } catch (erro) {
    listaRecentes.innerHTML = `<div class="vazio-lista">${esc(erro.message)}</div>`;
  }
});
