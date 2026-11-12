/* Janela de detalhes de um item do portfólio (foto ou arquivo). */
const PortfolioUI = {
  ehPdf(url) { return /\.pdf($|\?)/i.test(url || ""); },

  garantir() {
    let m = document.getElementById("modalPortfolio");
    if (m) return m;
    m = document.createElement("div");
    m.id = "modalPortfolio";
    m.className = "modal-fundo";
    m.hidden = true;
    m.innerHTML = '<div class="modal-caixa" role="dialog" aria-modal="true"><button type="button" class="modal-fechar" aria-label="Fechar">×</button><div id="modalConteudo"></div></div>';
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".modal-fechar")) this.fechar(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") this.fechar(); });
    return m;
  },

  fechar() { const m = document.getElementById("modalPortfolio"); if (m) m.hidden = true; },

  abrir(it) {
    const m = this.garantir();
    const esc = Util.esc;
    let topo = "";
    let acoes = "";
    if (it.fotoUrl && this.ehPdf(it.fotoUrl)) {
      topo = '<div class="modal-arquivo"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#293330" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><polyline points="14 3 14 8 19 8"/></svg></div>';
      acoes = `<a href="${esc(it.fotoUrl)}" target="_blank" rel="noopener noreferrer">Abrir arquivo</a>`;
    } else if (it.fotoUrl) {
      topo = `<img class="modal-foto" src="${esc(it.fotoUrl)}" alt="${esc(it.titulo)}">`;
      acoes = `<a href="${esc(it.fotoUrl)}" target="_blank" rel="noopener noreferrer">Abrir foto em tamanho real</a>`;
    } else {
      topo = '<div class="modal-arquivo"><strong style="color:#293330;font-size:20px">Vaga concluída pela plataforma</strong></div>';
    }
    if (it.anuncioId && AuthService.obterTipoUsuario() === 0) {
      acoes += `<a href="vaga.html?id=${it.anuncioId}">Ver vaga</a>`;
    }
    document.getElementById("modalConteudo").innerHTML = `${topo}
      <div class="modal-corpo">
        <h3>${esc(it.titulo || "Sem título")}</h3>
        <p class="modal-meta">${it.tipo === "Vaga" ? "Vaga concluída" : "Trabalho"} · adicionado em ${Util.data(it.dataCriacao)}</p>
        <p class="modal-desc">${esc(it.descricao || "Sem descrição adicionada.")}</p>
        ${acoes ? `<div class="modal-acoes">${acoes}</div>` : ""}
      </div>`;
    m.hidden = false;
  },
};
