/**
 * Controla a interação do formulário de login com o usuário.
 * Delega a chamada de rede para AuthService (authService.js).
 */
document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("form-login");
  const campoUsuario = document.getElementById("usuario"); // guarda o e-mail digitado
  const campoSenha = document.getElementById("senha");
  const botaoEntrar = document.getElementById("btn-entrar");
  const mensagemErro = document.getElementById("mensagem-erro");
  const botaoCriarConta = document.getElementById("btn-criar-conta");

  
  botaoCriarConta.addEventListener("click", () => {
  window.location.href = "cadastro.html";
  });

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limparErro();

    const email = campoUsuario.value.trim();
    const senha = campoSenha.value;

    if (!validarCampos(email, senha)) {
      return;
    }

    definirCarregando(true);

    try {
      const dados = await AuthService.login(email, senha);
      tratarLoginComSucesso(dados);
    } catch (erro) {
      exibirErro(erro.message);
    } finally {
      definirCarregando(false);
    }
  });

  function validarCampos(email, senha) {
    if (!email || !senha) {
      exibirErro("Preencha e-mail e senha.");
      return false;
    }
    return true;
  }

  function tratarLoginComSucesso(dados) {
    // Guarda o token no localStorage: toda requisição futura à API
    // (rotas protegidas) vai precisar mandar esse token no header Authorization.
    localStorage.setItem("token", dados.token);
    localStorage.setItem("nome", dados.nome);
    localStorage.setItem("email", dados.email);

    // TipoUsuario vem como número do backend: 0 = Freelancer, 1 = Contratante, 2 = Admin
    // (enum TipoUsuario em Models/TipoUsuario.cs)
    if (dados.tipoUsuario === 0) {
      window.location.href = "dashboard-freelancer.html";
    } else if (dados.tipoUsuario === 1) {
      window.location.href = "dashboard-contratante.html";
    } else {
      window.location.href = "dashboard-admin.html";
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
