/* Esqueci a senha: sem token pede o e-mail; com ?token=... (link do e-mail) pede a nova senha. */
document.addEventListener("DOMContentLoaded", () => {
  const token = new URLSearchParams(window.location.search).get("token");

  const passoEmail = document.getElementById("passoEmail");
  const passoSenha = document.getElementById("passoSenha");
  (token ? passoSenha : passoEmail).classList.remove("hidden");
  (token ? passoEmail : passoSenha).classList.add("hidden");

  async function enviar(endpoint, corpo) {
    let resposta;
    try {
      resposta = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
    } catch {
      throw new Error("Não foi possível conectar ao servidor.");
    }

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      const msg = dados.erro || (dados.errors ? Object.values(dados.errors).flat().join(" ") : "Não foi possível concluir. Tente novamente.");
      throw new Error(msg);
    }
    return dados;
  }

  function mostrar(el, texto) {
    el.textContent = texto;
    el.classList.add("visible");
  }

  function esconder(...els) {
    els.forEach((el) => { el.textContent = ""; el.classList.remove("visible"); });
  }

  /* ----- Passo 1: pedir o link ----- */
  document.getElementById("formEmail").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erro = document.getElementById("erroEmail");
    const ok = document.getElementById("okEmail");
    const botao = document.getElementById("btnEnviarLink");
    const email = document.getElementById("email").value.trim();
    esconder(erro, ok);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      mostrar(erro, "Informe um e-mail válido.");
      return;
    }

    botao.disabled = true;
    botao.textContent = "Enviando...";
    try {
      const dados = await enviar(CONFIG.ESQUECI_SENHA_ENDPOINT, { email });
      mostrar(ok, dados.mensagem || "Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.");
      botao.textContent = "Link enviado";
      // permite reenviar depois de um tempo, caso o e-mail não chegue
      setTimeout(() => { botao.disabled = false; botao.textContent = "Enviar novamente"; }, 30000);
    } catch (err) {
      mostrar(erro, err.message);
      botao.disabled = false;
      botao.textContent = "Enviar link";
    }
  });

  /* ----- Passo 2: definir a nova senha ----- */
  document.getElementById("formSenha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const erro = document.getElementById("erroSenha");
    const ok = document.getElementById("okSenha");
    const botao = document.getElementById("btnSalvarSenha");
    const nova = document.getElementById("novaSenha").value;
    const confirmar = document.getElementById("confirmarNovaSenha").value;
    esconder(erro, ok);

    if (nova.length < 6) {
      mostrar(erro, "A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (nova !== confirmar) {
      mostrar(erro, "As senhas não coincidem.");
      return;
    }

    botao.disabled = true;
    botao.textContent = "Salvando...";
    try {
      await enviar(CONFIG.REDEFINIR_SENHA_ENDPOINT, { token, novaSenha: nova });
      mostrar(ok, "Senha alterada! Redirecionando para o login...");
      botao.textContent = "Senha alterada";
      setTimeout(() => { window.location.href = "index.html"; }, 1800);
    } catch (err) {
      mostrar(erro, err.message);
      botao.disabled = false;
      botao.textContent = "Salvar nova senha";
    }
  });
});
