using System.Net;

namespace ConectaFree.Services
{
    // Textos dos e-mails. Todo dado vindo de usuário passa por HtmlEncode.
    public static class EmailTemplates
    {
        private static string H(string? texto) => WebUtility.HtmlEncode(texto ?? string.Empty);

        private static string Layout(string titulo, string corpoHtml, string? botaoTexto = null, string? botaoUrl = null)
        {
            var botao = botaoTexto is null || botaoUrl is null ? "" : $@"
          <p style=""margin:28px 0 8px"">
            <a href=""{H(botaoUrl)}"" style=""background:#2B6B57;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:6px;display:inline-block"">{H(botaoTexto)}</a>
          </p>";

            return $@"<!DOCTYPE html>
<html lang=""pt-BR"">
<body style=""margin:0;padding:24px;background:#F4FAF7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#293330"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"">
    <tr><td align=""center"">
      <table role=""presentation"" width=""560"" cellpadding=""0"" cellspacing=""0"" style=""max-width:560px;background:#ffffff;border:1px solid #CFE3DB;border-radius:10px"">
        <tr><td style=""background:#293330;color:#ffffff;padding:18px 28px;font-size:18px;font-weight:700;border-radius:10px 10px 0 0"">ConectaFree</td></tr>
        <tr><td style=""padding:28px"">
          <h1 style=""margin:0 0 14px;font-size:20px"">{H(titulo)}</h1>
          <div style=""font-size:15px;line-height:1.55"">{corpoHtml}</div>{botao}
        </td></tr>
        <tr><td style=""padding:16px 28px;border-top:1px solid #E3EFE9;font-size:12px;color:#6B7A75"">Você recebeu este e-mail porque tem uma conta no ConectaFree.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
        }

        public static string RedefinirSenha(string nome, string link) =>
            Layout("Redefinir sua senha",
                $@"<p>Olá, {H(nome)}.</p>
                   <p>Recebemos um pedido para redefinir a senha da sua conta. O link abaixo vale por <strong>1 hora</strong> e só pode ser usado uma vez.</p>
                   <p style=""color:#6B7A75"">Se não foi você, ignore este e-mail: sua senha continua a mesma.</p>",
                "Criar nova senha", link);

        public static string NovoCandidato(string nomeContratante, string tituloVaga, string nomeFreelancer, string link) =>
            Layout("Você tem um novo candidato",
                $@"<p>Olá, {H(nomeContratante)}.</p>
                   <p><strong>{H(nomeFreelancer)}</strong> se candidatou à sua vaga <strong>{H(tituloVaga)}</strong>.</p>
                   <p>Veja o perfil e a mensagem do candidato e decida se aceita.</p>",
                "Ver candidatos", link);

        public static string CandidaturaAceita(string nomeFreelancer, string tituloVaga, string nomeContratante, string link) =>
            Layout("Sua candidatura foi aceita!",
                $@"<p>Olá, {H(nomeFreelancer)}.</p>
                   <p><strong>{H(nomeContratante)}</strong> aceitou sua candidatura para a vaga <strong>{H(tituloVaga)}</strong>.</p>
                   <p>Acompanhe os detalhes da vaga no ConectaFree.</p>",
                "Ver minhas candidaturas", link);
    }
}
