(async () => {
  const alvo = document.getElementById("detalheVaga");
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const rotulo = (s) => Util.ROTULO_STATUS[s] || s;
  const cls = (s) => String(s).toLowerCase();

  if (!id) { alvo.innerHTML = '<p class="msg-inline erro">Vaga não informada.</p>'; return; }

  function desenhar(v) {
    const podeCandidatar = v.status === "Aberta" && !v.minhaCandidatura;
    alvo.innerHTML = `
      <div class="cartao-detalhe">
        <div class="linha-topo"><h2>${Util.esc(v.titulo)}${v.urgente ? '<span class="selo-urgente">URGENTE</span>' : ""}</h2>
          <span class="selo-status ${cls(v.status)}">${rotulo(v.status)}</span></div>
        <div class="grade-meta">
          <div class="meta-detalhe destaque-data"><small>Dia do serviço</small><strong>${v.dataServico ? Util.dataServico(v.dataServico) : "A combinar"}</strong></div>
          <div class="meta-detalhe meta-local"><small>Local</small><strong>${Util.esc(Util.localDaVaga(v))}</strong></div>
          <div class="meta-detalhe"><small>Categoria</small><strong>${Util.esc(v.habilidade.nome)}</strong></div>
          <div class="meta-detalhe"><small>Valor</small><strong>${Util.valor(v.valorProposto)}</strong></div>
        </div>
        <p class="publicada-detalhe">Publicada em ${Util.data(v.dataCriacao)}</p>
        <h4>Contratante</h4>
        <div style="display:flex;align-items:center;gap:12px;margin:6px 0 14px">
          ${v.contratante.fotoUrl ? `<img class="avatar-foto" src="${Util.esc(v.contratante.fotoUrl)}" alt="">` : `<div class="avatar-inicial">${Util.esc(Util.iniciais(v.contratante.nome))}</div>`}
          <a href="visualizar-perfil.html?id=${v.contratante.id}" style="font-weight:700;color:inherit;text-decoration:none" title="Ver perfil do contratante">${Util.esc(v.contratante.nome)} →</a></div>
        <h4>Descrição</h4>
        <p class="texto-descricao">${v.descricao ? Util.esc(v.descricao) : "Sem descrição informada."}</p>
        ${v.minhaCandidatura
          ? `<p class="msg-inline"><span class="selo-status ${Util.classeCandidatura(v.minhaCandidatura, v.status)}">${Util.rotuloCandidatura(v.minhaCandidatura, v.status)}</span></p>`
          : podeCandidatar
            ? `<div class="campo" style="margin-top:18px"><label for="mensagem">Mensagem para o contratante (opcional)</label>
                 <textarea id="mensagem" maxlength="1000" placeholder="Apresente-se e diga por que você é a pessoa certa"></textarea></div>
               <div class="acoes-detalhe"><button type="button" class="botao-primario" id="btnCandidatar">Candidatar-se</button></div>`
            : `<p class="msg-inline">Esta vaga não recebe mais candidaturas.</p>`}
        <p class="msg-inline" id="msgVaga"></p>
      </div>`;

    const btn = document.getElementById("btnCandidatar");
    if (btn) {
      btn.addEventListener("click", async () => {
        const msg = document.getElementById("msgVaga");
        btn.disabled = true;
        msg.className = "msg-inline";
        msg.textContent = "Enviando...";
        try {
          await Api.post(`${CONFIG.ANUNCIO_ENDPOINT}/${id}/candidatar`, { mensagem: document.getElementById("mensagem").value.trim() || null });
          desenhar(await Api.get(`${CONFIG.ANUNCIO_ENDPOINT}/${id}`));
        } catch (e) {
          btn.disabled = false;
          msg.className = "msg-inline erro";
          msg.textContent = e.message;
        }
      });
    }
  }

  try {
    desenhar(await Api.get(`${CONFIG.ANUNCIO_ENDPOINT}/${id}`));
  } catch (e) {
    alvo.innerHTML = `<p class="msg-inline erro">${Util.esc(e.message)}</p>`;
  }
})();
