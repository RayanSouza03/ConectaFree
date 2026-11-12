const AuthService = {
  async login(email, senha) {
    const resposta = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.LOGIN_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    if (!resposta.ok) {
      const erro = await this._extrairMensagemErro(resposta);
      throw new Error(erro);
    }

    return this.salvarSessao(await resposta.json());
  },

  // Guarda a sessão devolvida pelo backend (login normal ou Google).
  // TipoUsuario vem como enum numerico: 0 = Freelancer, 1 = Contratante, 2 = Admin.
  salvarSessao(dados) {
    if (!dados || !dados.token) {
      throw new Error("A API nao retornou o token de autenticacao.");
    }

    localStorage.setItem("token", dados.token);
    localStorage.setItem("usuarioNome", dados.nome || "");
    localStorage.setItem("usuarioEmail", dados.email || "");
    localStorage.setItem("tipoUsuario", String(dados.tipoUsuario));
    // Marca que ainda falta aceitar os termos: as telas internas não abrem até o aceite
    if (dados.precisaAceitarTermos) localStorage.setItem("termosPendentes", "1");
    else localStorage.removeItem("termosPendentes");

    return dados;
  },

  // Envia o ID token do Google. Devolve a sessão (já salva) ou { precisaCadastro, nome, email }
  // quando o e-mail ainda não tem conta; nesse caso reenvie com tipoUsuario, telefone, documento e aceitouTermos.
  async loginGoogle(credential, extras = {}) {
    const resposta = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.GOOGLE_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, ...extras }),
    });

    if (!resposta.ok) {
      throw new Error(await this._extrairMensagemErro(resposta, "Não foi possível entrar com o Google."));
    }

    const dados = await resposta.json();
    return dados.token ? this.salvarSessao(dados) : dados;
  },

  // Le o payload do JWT (sem validar assinatura: quem valida e o servidor).
  _payload() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(b64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  },

  obterTipoUsuario() {
    const valor = localStorage.getItem("tipoUsuario");
    if (valor !== null && valor !== "" && !Number.isNaN(Number(valor))) return Number(valor);

    // Se o tipo sumiu do storage mas o token existe, recupera pelo papel dentro do token.
    const p = this._payload();
    const papel = p && (p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || p.role);
    const mapa = { Freelancer: 0, Contratante: 1, Admin: 2 };
    return papel in mapa ? mapa[papel] : null;
  },

  obterToken() {
    return localStorage.getItem("token");
  },

  // Logado = token presente e ainda dentro da validade. F5 nao desloga.
  estaAutenticado() {
    const token = this.obterToken();
    if (!token) return false;
    const p = this._payload();
    if (p && p.exp && p.exp * 1000 <= Date.now()) {
      this.limparSessao();
      return false;
    }
    return true;
  },

  // Unico caminho de logout (botao Sair).
  sair() {
    this.limparSessao();
    window.location.href = "index.html";
  },

  // Na tela de login: quem ja esta logado vai direto para a sua tela.
  redirecionarSeLogado() {
    if (!this.estaAutenticado()) return false;
    if (this.termosPendentes()) return false; // fica no login para mostrar o aceite
    try {
      this.redirecionarPorTipo(this.obterTipoUsuario());
      return true;
    } catch {
      return false;
    }
  },

  limparSessao() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioNome");
    localStorage.removeItem("usuarioEmail");
    localStorage.removeItem("tipoUsuario");
    localStorage.removeItem("termosPendentes");
  },

  termosPendentes() {
    return localStorage.getItem("termosPendentes") === "1";
  },

  // Registra o aceite no servidor e libera a sessão
  async aceitarTermos() {
    const resposta = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ACEITAR_TERMOS_ENDPOINT}`, {
      method: "POST",
      headers: this.montarCabecalhos(),
    });
    if (!resposta.ok) throw new Error("Não foi possível registrar o aceite. Tente novamente.");
    localStorage.removeItem("termosPendentes");
  },

  redirecionarPorTipo(tipoUsuario) {
    const tipo = typeof tipoUsuario === "string"
      ? tipoUsuario.toLowerCase()
      : Number(tipoUsuario);

    if (tipo === 0 || tipo === "0" || tipo === "freelancer") {
      window.location.href = "inicio.html";
      return;
    }

    if (tipo === 1 || tipo === "1" || tipo === "contratante") {
      window.location.href = "contratante.html";
      return;
    }

    if (tipo === 2 || tipo === "2" || tipo === "admin") {
      throw new Error("A area do administrador ainda nao esta disponivel.");
    }

    throw new Error("Tipo de usuario invalido retornado pela API.");
  },

  paginaInicial() {
    return this.obterTipoUsuario() === 1 ? "contratante.html" : "inicio.html";
  },

  // Protege a tela: sem login (ou tipo errado) volta para o login.
  exigirTipo(tipoPermitido) {
    if (!this.estaAutenticado()) {
      window.location.replace("index.html");
      return false;
    }
    if (this.termosPendentes()) {
      // Sessão salva sem aceite (ex.: fechou a janela): volta ao login, que pede o aceite
      window.location.replace("index.html");
      return false;
    }
    if (this.obterTipoUsuario() !== tipoPermitido) {
      // Logado, mas na tela do outro perfil: manda para a tela certa (nao para o login).
      window.location.replace(this.paginaInicial());
      return false;
    }
    return true;
  },

  async _extrairMensagemErro(resposta, padrao = "Email ou senha invalidos.") {
    try {
      const dados = await resposta.json();
      if (dados.erro || dados.mensagem || dados.message) return dados.erro || dados.mensagem || dados.message;
      if (dados.errors) return Object.values(dados.errors).flat().join(" ");
      return padrao;
    } catch {
      return "Nao foi possivel entrar. Tente novamente.";
    }
  },

  montarCabecalhos() {
    const token = this.obterToken();
    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  },
};
