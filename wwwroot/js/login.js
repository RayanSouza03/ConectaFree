document.addEventListener("DOMContentLoaded", () => {
  if (AuthService.redirecionarSeLogado()) return;

  // Sessão salva, mas os termos ainda não foram aceitos (ex.: fechou a página no meio): pede o aceite agora
  if (AuthService.estaAutenticado() && AuthService.termosPendentes()) {
    Termos.exigirAceite().then(() => AuthService.redirecionarSeLogado());
  }

  const formulario = document.getElementById("form-login");
  const campoUsuario = document.getElementById("usuario");
  const campoSenha = document.getElementById("senha");
  const botaoEntrar = document.getElementById("btn-entrar");
  const mensagemErro = document.getElementById("mensagem-erro");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErro();

    const email = campoUsuario.value.trim();
    const senha = campoSenha.value;

    if (!email || !senha) {
      exibirErro("Preencha email e senha.");
      return;
    }

    definirCarregando(true);

    try {
      const dados = await AuthService.login(email, senha);

      // Termos novos ou ainda não aceitos: só segue depois do aceite (recusar encerra a sessão)
      if (dados.precisaAceitarTermos && !(await Termos.exigirAceite())) return;

      // A decisao da tela vem do enum retornado pelo backend.
      AuthService.redirecionarPorTipo(dados.tipoUsuario);
    } catch (erro) {
      exibirErro(erro.message);
    } finally {
      definirCarregando(false);
    }
  });

  iniciarGoogle();

  /* ----- Entrar com o Google (Google Identity Services) ----- */
  async function iniciarGoogle() {
    const area = document.getElementById("area-google");
    const alvo = document.getElementById("google-btn");
    if (!area || !alvo) return;

    let clientId = "";
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.PUBLICO_CONFIG_ENDPOINT}`);
      if (r.ok) clientId = (await r.json()).googleClientId || "";
    } catch { /* sem servidor: o login normal continua funcionando */ }
    if (!clientId) return; // sem Client ID o botão fica oculto

    try {
      await carregarScript("https://accounts.google.com/gsi/client");
    } catch {
      return; // bloqueado/sem internet: oculta o botão
    }

    google.accounts.id.initialize({ client_id: clientId, callback: aoReceberCredencial });
    area.hidden = false;
    google.accounts.id.renderButton(alvo, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      locale: "pt-BR",
      width: Math.min(400, Math.max(200, area.clientWidth || 320)),
    });
  }

  function carregarScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.onload = resolve;
      el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  async function aoReceberCredencial(resposta) {
    limparErro();
    try {
      const dados = await AuthService.loginGoogle(resposta.credential);

      if (dados.precisaCadastro) {
        // E-mail novo: falta tipo de conta, telefone e CPF/CNPJ. A tela de cadastro termina o processo.
        sessionStorage.setItem("googleCredential", resposta.credential);
        sessionStorage.setItem("googlePerfil", JSON.stringify({ nome: dados.nome || "", email: dados.email || "" }));
        window.location.href = "cadastro.html?google=1";
        return;
      }

      if (dados.precisaAceitarTermos && !(await Termos.exigirAceite())) return;

      AuthService.redirecionarPorTipo(dados.tipoUsuario);
    } catch (erro) {
      exibirErro(erro.message);
    }
  }

  function exibirErro(texto) {
    mensagemErro.textContent = texto;
  }

  function limparErro() {
    mensagemErro.textContent = "";
  }

  function definirCarregando(carregando) {
    botaoEntrar.disabled = carregando;
    botaoEntrar.textContent = carregando ? "Entrando..." : "Entrar";
  }
});
