document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("form-perfil");

  const campoNome = document.getElementById("nome");
  const campoTelefone = document.getElementById("telefone");
  const campoCategoria = document.getElementById("categoria");
  const campoBio = document.getElementById("bio");
  const contadorBio = document.getElementById("contador-bio");

  const campoCep = document.getElementById("cep");
  const campoLogradouro = document.getElementById("logradouro");
  const campoBairro = document.getElementById("bairro");
  const campoCidade = document.getElementById("cidade");
  const campoEstado = document.getElementById("estado");
  const campoNumero = document.getElementById("numero");
  const campoComplemento = document.getElementById("complemento");
  const statusCep = document.getElementById("status-cep");

  const inputFoto = document.getElementById("input-foto");
  const previewFoto = document.getElementById("preview-foto");
  const btnRemoverFoto = document.getElementById("btn-remover-foto");
  let arquivoFotoSelecionado = null;
  let fotoRemovida = false;

  const campoHabilidades = document.getElementById("campo-habilidades");
  const inputHabilidade = document.getElementById("input-habilidade");
  let listaHabilidades = [];

  const btnSalvar = document.getElementById("btn-salvar-perfil");
  const mensagemErro = document.getElementById("mensagem-erro-perfil");
  const mensagemSucesso = document.getElementById("mensagem-sucesso-perfil");

  let ehContratante = AuthService.obterTipoUsuario() === 1;

  Autocomplete.criar(campoCategoria, {
    permitirCriar: true,
    itens: () => HABILIDADES.map((h) => ({ id: h.id, nome: h.nome })),
    aoEscolher: (it) => { campoCategoria.dataset.id = it.criar ? "" : String(it.id); },
  });
  campoCategoria.addEventListener("input", () => {
    const exato = HABILIDADES.find((h) => Autocomplete.norm(h.nome) === Autocomplete.norm(campoCategoria.value));
    campoCategoria.dataset.id = exato ? String(exato.id) : "";
  });
  if (ehContratante) {
    document.getElementById("grupo-categoria").hidden = true;
    document.getElementById("grupo-habilidades").hidden = true;
  }

  inicializar();
  destacarSecaoPelaAncora();

  async function inicializar() {
    try {
      const perfil = await PerfilService.buscarPerfil();
      preencherFormulario(perfil);
    } catch (erro) {
      exibirErro(erro.message);
    }
  }

  function preencherFormulario(perfil = {}) {
    campoNome.value = perfil.nome || "";
    campoTelefone.value = perfil.telefone || "";
    const principal = (perfil.habilidades || [])[0];
    campoCategoria.value = principal ? principal.nome : "";
    campoCategoria.dataset.id = principal ? String(principal.id) : "";
    campoBio.value = perfil.bio || "";
    atualizarContadorBio();

    const endereco = perfil.endereco || {};
    campoCep.value = endereco.cep || "";
    campoLogradouro.value = endereco.logradouro || "";
    campoBairro.value = endereco.bairro || "";
    campoCidade.value = endereco.cidade || "";
    campoEstado.value = endereco.estado || "";
    campoNumero.value = endereco.numero || "";
    campoComplemento.value = endereco.complemento || "";

    if (perfil.fotoUrl) {
      previewFoto.src = perfil.fotoUrl;
    }

    listaHabilidades = perfil.outraHabilidade
      ? perfil.outraHabilidade.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    renderizarHabilidades();
  }

  campoBio.addEventListener("input", atualizarContadorBio);

  function atualizarContadorBio() {
    contadorBio.textContent = campoBio.value.length;
  }

  function destacarSecaoPelaAncora() {
    if (window.location.hash !== "#secao-bio") {
      return;
    }

    const secaoBio = document.getElementById("secao-bio");
    secaoBio.scrollIntoView({ behavior: "smooth", block: "center" });
    secaoBio.classList.add("destaque-ancora");
    campoBio.focus();
  }

  campoTelefone.addEventListener("input", () => {
    campoTelefone.value = mascararTelefone(campoTelefone.value);
  });

  campoCep.addEventListener("input", () => {
    campoCep.value = mascararCep(campoCep.value);
  });

  function apenasNumeros(valor) {
    return valor.replace(/\D/g, "");
  }

  function mascararTelefone(valor) {
    const numeros = apenasNumeros(valor).slice(0, 11);
    return numeros
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function mascararCep(valor) {
    const numeros = apenasNumeros(valor).slice(0, 8);
    return numeros.replace(/(\d{5})(\d)/, "$1-$2");
  }

  campoCep.addEventListener("blur", async () => {
    const cep = apenasNumeros(campoCep.value);

    if (cep.length !== 8) {
      return;
    }

    definirStatusCep("Buscando endereço...", "buscando");

    try {
      const endereco = await PerfilService.buscarEnderecoPorCep(cep);
      campoLogradouro.value = endereco.logradouro;
      campoBairro.value = endereco.bairro;
      campoCidade.value = endereco.cidade;
      campoEstado.value = endereco.estado;
      definirStatusCep("Endereço encontrado.", "");
      document.getElementById("numero").focus();
    } catch (erro) {
      definirStatusCep(erro.message, "erro");
    }
  });

  function definirStatusCep(texto, classe) {
    statusCep.textContent = texto;
    statusCep.className = "status-cep" + (classe ? ` ${classe}` : "");
  }

  inputFoto.addEventListener("change", () => {
    const arquivo = inputFoto.files[0];
    if (!arquivo) {
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      exibirErro("A foto deve ter no máximo 5MB.");
      inputFoto.value = "";
      return;
    }

    arquivoFotoSelecionado = arquivo;
    fotoRemovida = false;

    const leitor = new FileReader();
    leitor.onload = (evento) => {
      previewFoto.src = evento.target.result;
    };
    leitor.readAsDataURL(arquivo);
  });

  btnRemoverFoto.addEventListener("click", () => {
    arquivoFotoSelecionado = null;
    fotoRemovida = true;
    inputFoto.value = "";
    previewFoto.src = "https://via.placeholder.com/120x120.png?text=Foto";
  });

  inputHabilidade.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === ",") {
      evento.preventDefault();
      adicionarHabilidade(inputHabilidade.value);
    } else if (evento.key === "Backspace" && inputHabilidade.value === "") {
      listaHabilidades.pop();
      renderizarHabilidades();
    }
  });

  function adicionarHabilidade(valor) {
    const texto = valor.trim();

    if (!texto) {
      return;
    }

    const jaExiste = listaHabilidades.some(
      (habilidade) => habilidade.toLowerCase() === texto.toLowerCase()
    );

    if (!jaExiste) {
      listaHabilidades.push(texto);
      renderizarHabilidades();
    }

    inputHabilidade.value = "";
  }

  function removerHabilidade(indice) {
    listaHabilidades.splice(indice, 1);
    renderizarHabilidades();
  }

  function renderizarHabilidades() {
    campoHabilidades
      .querySelectorAll(".tag-habilidade")
      .forEach((tag) => tag.remove());

    listaHabilidades.forEach((habilidade, indice) => {
      const tag = document.createElement("span");
      tag.className = "tag-habilidade";
      tag.textContent = habilidade;

      const botaoRemover = document.createElement("button");
      botaoRemover.type = "button";
      botaoRemover.textContent = "×";
      botaoRemover.setAttribute("aria-label", `Remover ${habilidade}`);
      botaoRemover.addEventListener("click", () => removerHabilidade(indice));

      tag.appendChild(botaoRemover);
      campoHabilidades.insertBefore(tag, inputHabilidade);
    });
  }

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparMensagens();

    if (!validarFormulario()) {
      return;
    }

    definirCarregando(true);

    try {
      if (!ehContratante && !campoCategoria.dataset.id) {
        campoCategoria.dataset.id = String(await Categorias.resolver(campoCategoria.value));
      }
      if (arquivoFotoSelecionado) {
        const resultado = await PerfilService.enviarFoto(arquivoFotoSelecionado);
        if (resultado?.fotoUrl) previewFoto.src = resultado.fotoUrl;
        arquivoFotoSelecionado = null;
      }

      const dadosPerfil = coletarDadosFormulario();
      await PerfilService.atualizarPerfil(dadosPerfil);

      exibirSucesso("Perfil atualizado com sucesso!");
    } catch (erro) {
      exibirErro(erro.message);
    } finally {
      definirCarregando(false);
    }
  });

  function coletarDadosFormulario() {
    const dados = {
      nome: campoNome.value.trim(),
      telefone: apenasNumeros(campoTelefone.value),
      bio: campoBio.value.trim(),
      endereco: {
        cep: apenasNumeros(campoCep.value),
        logradouro: campoLogradouro.value.trim(),
        bairro: campoBairro.value.trim(),
        cidade: campoCidade.value.trim(),
        estado: campoEstado.value,
        numero: campoNumero.value.trim(),
        complemento: campoComplemento.value.trim() || null,
      },
    };

    if (!ehContratante) {
      dados.habilidadeIds = campoCategoria.dataset.id ? [Number(campoCategoria.dataset.id)] : [];
      dados.outraHabilidade = listaHabilidades.join(", ").slice(0, 200);
    }

    if (fotoRemovida) {
      dados.removerFoto = true;
    }

    return dados;
  }

  function validarFormulario() {
    if (!campoNome.value.trim()) {
      exibirErro("Informe seu nome completo.");
      return false;
    }

    if (apenasNumeros(campoTelefone.value).length < 10) {
      exibirErro("Informe um telefone válido.");
      return false;
    }

    if (!ehContratante && !campoCategoria.value.trim()) {
      exibirErro("Informe sua categoria (escolha uma sugestão ou digite uma nova).");
      return false;
    }

    if (apenasNumeros(campoCep.value).length !== 8 || !campoLogradouro.value.trim() || !campoNumero.value.trim() ||
        !campoBairro.value.trim() || !campoCidade.value.trim() || !campoEstado.value) {
      exibirErro("Preencha o endereço completo (CEP, número, cidade e UF).");
      return false;
    }

    return true;
  }

  function exibirErro(texto) {
    mensagemErro.textContent = texto;
  }

  function exibirSucesso(texto) {
    mensagemSucesso.textContent = texto;
  }

  function limparMensagens() {
    mensagemErro.textContent = "";
    mensagemSucesso.textContent = "";
  }

  function definirCarregando(carregando) {
    btnSalvar.disabled = carregando;
    btnSalvar.textContent = carregando ? "Salvando..." : "Salvar alterações";
  }
});
