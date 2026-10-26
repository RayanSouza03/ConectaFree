/* Janela de aceite dos Termos de Uso, exibida no login quando a pessoa ainda não aceitou a versão atual.
   Termos.exigirAceite() devolve uma Promise:
   - true  -> aceitou (o aceite já foi gravado no servidor)
   - false -> recusou (a sessão é encerrada) */
const Termos = {
  exigirAceite() {
    return new Promise((resolve) => {
      // Fundo escuro que cobre a tela inteira; não fecha clicando fora (precisa aceitar ou recusar)
      const fundo = document.createElement("div");
      fundo.className = "termos-fundo";
      fundo.innerHTML = `
        <div class="termos-modal" role="dialog" aria-modal="true" aria-labelledby="termos-titulo">
          <h2 id="termos-titulo">Termos de Uso e <span class="termos-acento">Privacidade</span></h2>
          <p>Para usar o ConectaFree você precisa aceitar os nossos Termos de Uso e a Política de Privacidade.</p>
          <ul>
            <li>O ConectaFree conecta freelancers e contratantes; <strong>não é parte</strong> dos serviços combinados entre vocês.</li>
            <li>Usamos seus dados (nome, e-mail, telefone, CPF/CNPJ, endereço e perfil) para operar a plataforma, conforme a LGPD.</li>
            <li>Você pode exercer seus direitos sobre os dados a qualquer momento.</li>
          </ul>
          <p><a href="termos.html" target="_blank" rel="noopener">Ler os termos completos</a></p>
          <label class="termos-check">
            <input type="checkbox" id="termos-aceite"> Li e aceito os Termos de Uso e a Política de Privacidade
          </label>
          <p id="termos-erro" class="termos-erro" role="alert"></p>
          <div class="termos-acoes">
            <button type="button" id="termos-recusar" class="termos-btn-sec">Recusar e sair</button>
            <button type="button" id="termos-confirmar" class="termos-btn" disabled>Aceitar e continuar</button>
          </div>
        </div>`;
      document.body.appendChild(fundo);

      const check = fundo.querySelector("#termos-aceite");
      const confirmar = fundo.querySelector("#termos-confirmar");
      const recusar = fundo.querySelector("#termos-recusar");
      const erro = fundo.querySelector("#termos-erro");

      // O botão só habilita depois de marcar a caixa
      check.addEventListener("change", () => { confirmar.disabled = !check.checked; });

      confirmar.addEventListener("click", async () => {
        confirmar.disabled = true;
        erro.textContent = "";
        try {
          await AuthService.aceitarTermos();
          fundo.remove();
          resolve(true);
        } catch (e) {
          erro.textContent = e.message;
          confirmar.disabled = !check.checked;
        }
      });

      // Recusou: encerra a sessão (volta ao login) e não libera o sistema
      recusar.addEventListener("click", () => {
        AuthService.limparSessao();
        fundo.remove();
        resolve(false);
      });
    });
  },
};
