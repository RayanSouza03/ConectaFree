document.addEventListener("DOMContentLoaded", () => {
  if (AuthService.redirecionarSeLogado()) return;

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

      // A decisao da tela vem do enum retornado pelo backend.
      AuthService.redirecionarPorTipo(dados.tipoUsuario);
    } catch (erro) {
      exibirErro(erro.message);
    } finally {
      definirCarregando(false);
    }
  });

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
