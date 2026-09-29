document.addEventListener("DOMContentLoaded", async () => {
  const fotoUsuario = document.getElementById("foto-usuario");
  const fotoUsuarioPlaceholder = document.getElementById("foto-usuario-placeholder");
  const nomeUsuario = document.getElementById("nome-usuario");
  const categoriaUsuario = document.getElementById("categoria-usuario");

  const infoNome = document.getElementById("info-nome");
  const infoDocumento = document.getElementById("info-documento");
  const infoEmail = document.getElementById("info-email");
  const infoTelefone = document.getElementById("info-telefone");
  const infoCategoria = document.getElementById("info-categoria");
  const infoHabilidades = document.getElementById("info-habilidades");
  const infoEndereco = document.getElementById("info-endereco");
  const infoBio = document.getElementById("info-bio");

  const idOutro = new URLSearchParams(window.location.search).get("id");
  const modoPublico = Boolean(idOutro);

  try {
    const perfil = modoPublico
      ? await PerfilService.buscarPublico(idOutro)
      : await PerfilService.buscarPerfil();
    preencherTela(perfil || {});
    if (modoPublico) esconderDadosPrivados();
    await carregarPortfolio(perfil.id, perfil.tipoUsuario);
  } catch (erro) {
    console.warn("Não foi possível carregar o perfil:", erro.message);
    preencherTela({});
  }

  function esconderDadosPrivados() {
    [infoDocumento, infoEmail, infoTelefone].forEach((dd) => {
      dd.closest(".linha-info").style.display = "none";
    });
    document.querySelectorAll(".btn-editar").forEach((b) => {
      if (b.id !== "linkPortfolioCompleto") b.closest(".rodape-painel").style.display = "none";
    });
  }

  async function carregarPortfolio(usuarioId, tipoUsuario) {
    const alvo = document.getElementById("lista-portfolio-perfil");
    if (!alvo) return;
    if (tipoUsuario === 1) {
      alvo.closest(".painel-portfolio").hidden = true;
      return;
    }
    try {
      const itens = await Api.get(`${CONFIG.PORTFOLIO_ENDPOINT}/${usuarioId}`);
      const link = document.getElementById("linkPortfolioCompleto");
      if (modoPublico) {
        link.textContent = "Ver portfólio completo";
        link.href = `portfolio.html?usuario=${encodeURIComponent(usuarioId)}`;
        link.closest(".rodape-painel").style.display = itens.length ? "" : "none";
      }
      if (!itens.length) {
        alvo.innerHTML = '<p class="texto-em-breve">Nenhum item no portfólio ainda.</p>';
        return;
      }
      alvo.innerHTML = '<div class="grade-portfolio">' + itens.slice(0, 6).map((it, i) => `
        <div class="mini-item" data-i="${i}">
          <div class="mini-img">${it.fotoUrl && !PortfolioUI.ehPdf(it.fotoUrl) ? `<img src="${Util.esc(it.fotoUrl)}" alt="">` : (it.fotoUrl ? "PDF" : "Vaga")}</div>
          <div class="mini-corpo"><strong>${Util.esc(it.titulo)}</strong><span>${it.tipo === "Vaga" ? "Vaga concluída" : "Trabalho"} · ${Util.data(it.dataCriacao)}</span></div>
        </div>`).join("") + "</div>";
      alvo.onclick = (e) => {
        const card = e.target.closest(".mini-item");
        if (card) PortfolioUI.abrir(itens[Number(card.dataset.i)]);
      };
    } catch {
      alvo.innerHTML = '<p class="texto-em-breve">Não foi possível carregar o portfólio.</p>';
    }
  }

  function preencherTela(perfil) {
    const habilidades = (perfil.habilidades || []).map((h) => h.nome);
    const nomeCategoria = habilidades[0] || "";

    definirFoto(perfil.fotoUrl);
    definirTexto(nomeUsuario, perfil.nome, "placeholder-medio placeholder-claro");
    definirTexto(categoriaUsuario, nomeCategoria, "placeholder-curto placeholder-claro");

    definirCampoInfo(infoNome, perfil.nome, "placeholder-medio");
    definirCampoInfo(infoDocumento, formatarDocumento(perfil.documento), "placeholder-medio");
    definirCampoInfo(infoEmail, perfil.email, "placeholder-longo");
    definirCampoInfo(infoTelefone, formatarTelefone(perfil.telefone), "placeholder-medio");
    definirCampoInfo(infoCategoria, nomeCategoria, "placeholder-curto");

    const outras = perfil.outraHabilidade
      ? perfil.outraHabilidade.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    definirHabilidades([...habilidades, ...outras]);

    definirCampoInfo(infoEndereco, formatarEndereco(perfil.endereco), "placeholder-longo");

    definirBio(perfil.bio);
  }

  function definirCampoInfo(elemento, valor, classesPlaceholder) {
    if (valor && String(valor).trim()) {
      elemento.textContent = valor;
      return;
    }
    elemento.innerHTML = `<span class="placeholder-campo ${classesPlaceholder}"></span>`;
  }

  function definirTexto(elemento, valor, classesPlaceholder) {
    if (valor && String(valor).trim()) {
      elemento.textContent = valor;
      return;
    }
    elemento.innerHTML = `<span class="placeholder-campo ${classesPlaceholder}"></span>`;
  }

  function definirFoto(fotoUrl) {
    if (fotoUrl) {
      fotoUsuario.src = fotoUrl;
      fotoUsuario.style.display = "block";
      fotoUsuarioPlaceholder.style.display = "none";
    } else {
      fotoUsuario.style.display = "none";
      fotoUsuarioPlaceholder.style.display = "flex";
    }
  }

  function definirHabilidades(habilidades) {
    infoHabilidades.innerHTML = "";

    if (!Array.isArray(habilidades) || habilidades.length === 0) {
      const larguras = [70, 95, 60];
      larguras.forEach((largura) => {
        const placeholder = document.createElement("span");
        placeholder.className = "placeholder-tag";
        placeholder.style.width = `${largura}px`;
        infoHabilidades.appendChild(placeholder);
      });
      return;
    }

    habilidades.forEach((habilidade) => {
      const tag = document.createElement("span");
      tag.className = "tag-visualizacao";
      tag.textContent = habilidade;
      infoHabilidades.appendChild(tag);
    });
  }

  function definirBio(bio) {
    if (bio && bio.trim()) {
      infoBio.textContent = bio;
      return;
    }

    infoBio.innerHTML = `
      <span class="placeholder-linhas-bio">
        <span></span>
        <span></span>
        <span></span>
      </span>
    `;
  }

  function formatarDocumento(documento) {
    if (!documento) return "";
    const numeros = documento.replace(/\D/g, "");

    if (numeros.length === 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (numeros.length === 14) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return documento;
  }

  function formatarTelefone(telefone) {
    if (!telefone) return "";
    const numeros = telefone.replace(/\D/g, "");

    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return telefone;
  }

  function formatarEndereco(endereco) {
    if (!endereco) return "";

    const partes = [];

    if (endereco.logradouro) {
      let linha = endereco.logradouro;
      if (endereco.numero) linha += `, ${endereco.numero}`;
      partes.push(linha);
    }

    if (endereco.complemento) partes.push(endereco.complemento);
    if (endereco.bairro) partes.push(endereco.bairro);

    if (endereco.cidade || endereco.estado) {
      partes.push([endereco.cidade, endereco.estado].filter(Boolean).join(" - "));
    }

    if (endereco.cep) {
      const cep = endereco.cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2");
      partes.push(`CEP ${cep}`);
    }

    return partes.join(" · ");
  }
});
