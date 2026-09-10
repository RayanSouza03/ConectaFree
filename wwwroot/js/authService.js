/**
 * Camada de serviço responsável pela comunicação com a API de autenticação.
 * Mantém o acesso à rede isolado da lógica de interface (login.js).
 */
const AuthService = {
  /**
   * Envia as credenciais para o back-end em C# e retorna a resposta.
   * O backend (LoginDto) espera os campos "email" e "senha".
   * @param {string} email
   * @param {string} senha
   * @returns {Promise<Object>} dados retornados pela API (token, nome, email, tipoUsuario)
   */
  async login(email, senha) {
    const url = `${CONFIG.API_BASE_URL}${CONFIG.LOGIN_ENDPOINT}`;

    const resposta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha }),
    });

    if (!resposta.ok) {
      const erro = await AuthService._extrairMensagemErro(resposta);
      throw new Error(erro);
    }

    return resposta.json();
  },

  /**
   * Tenta extrair uma mensagem de erro legível do corpo da resposta.
   * Cai em uma mensagem padrão caso o back não retorne JSON.
   */
  async _extrairMensagemErro(resposta) {
    try {
      const dados = await resposta.json();
      return dados.erro || dados.mensagem || dados.message || "E-mail ou senha inválidos.";
    } catch {
      return "Não foi possível entrar. Tente novamente.";
    }
  },
};
