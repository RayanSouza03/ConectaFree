(async () => {
  const ul = document.getElementById("listaCandidaturas");
  const vazio = document.getElementById("vazioCandidaturas");
  try {
    const lista = await Api.get(`${CONFIG.ANUNCIO_ENDPOINT}/candidaturas/minhas`);
    vazio.hidden = lista.length > 0;
    ul.innerHTML = lista.map((c) => `
      <li><a class="card-vaga" href="vaga.html?id=${c.anuncio.id}" style="text-decoration:none;display:block">
        <div class="linha-topo"><h3>${Util.esc(c.anuncio.titulo)}</h3>
          <span class="selo-status ${Util.classeCandidatura(c.status, c.anuncio.status)}">${Util.rotuloCandidatura(c.status, c.anuncio.status)}</span></div>
        <div class="meta"><span>${Util.esc(c.anuncio.habilidade.nome)}</span>
          <span>Vaga: ${Util.ROTULO_STATUS[c.anuncio.status] || c.anuncio.status}</span>
          <span>Enviada em ${Util.data(c.dataCriacao)}</span></div>
        <div class="rodape-card"><span class="valor">${Util.valor(c.anuncio.valorProposto)}</span>
          <span>${Util.esc(c.anuncio.contratante.nome)}</span></div>
      </a></li>`).join("");
  } catch (e) {
    document.getElementById("erroCandidaturas").textContent = e.message;
  }
})();
