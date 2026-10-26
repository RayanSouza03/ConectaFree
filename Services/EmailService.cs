using System.Net.Http.Headers;
using System.Net.Http.Json;
using ConectaFree.Interfaces;

namespace ConectaFree.Services
{
    // Envia e-mail por Resend ou Brevo (Email:Provedor). Sem chave configurada, só registra um aviso no log.
    public class EmailService : IEmailService
    {
        private readonly IHttpClientFactory _factory;
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _log;

        public EmailService(IHttpClientFactory factory, IConfiguration config, ILogger<EmailService> log)
        {
            _factory = factory;
            _config = config;
            _log = log;
        }

        public void Enfileirar(string para, string? nomeDestino, string assunto, string html)
        {
            // EnviarAsync captura qualquer erro, então a tarefa nunca termina com exceção não observada
            _ = Task.Run(() => EnviarAsync(para, nomeDestino, assunto, html));
        }

        public async Task<bool> EnviarAsync(string para, string? nomeDestino, string assunto, string html, CancellationToken ct = default)
        {
            var provedor = (_config["Email:Provedor"] ?? "Resend").Trim();
            var chave = _config["Email:ApiKey"];
            var remetente = _config["Email:RemetenteEmail"];
            var remetenteNome = _config["Email:RemetenteNome"] ?? "ConectaFree";

            if (string.IsNullOrWhiteSpace(chave) || string.IsNullOrWhiteSpace(remetente))
            {
                _log.LogWarning("E-mail não enviado: configure Email:ApiKey e Email:RemetenteEmail.");
                return false;
            }

            try
            {
                using var http = _factory.CreateClient();
                http.Timeout = TimeSpan.FromSeconds(10);

                using var requisicao = provedor.Equals("Brevo", StringComparison.OrdinalIgnoreCase)
                    ? MontarBrevo(chave, remetente, remetenteNome, para, nomeDestino, assunto, html)
                    : MontarResend(chave, remetente, remetenteNome, para, assunto, html);

                using var resposta = await http.SendAsync(requisicao, ct);
                if (resposta.IsSuccessStatusCode) return true;

                var corpo = await resposta.Content.ReadAsStringAsync(ct);
                _log.LogError("{Provedor} recusou o e-mail ({Status}): {Corpo}", provedor, (int)resposta.StatusCode, corpo);
                return false;
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Falha ao enviar e-mail por {Provedor}.", provedor);
                return false;
            }
        }

        private static HttpRequestMessage MontarResend(string chave, string remetente, string remetenteNome, string para, string assunto, string html)
        {
            var req = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", chave);
            req.Headers.UserAgent.ParseAdd("ConectaFree/1.0"); // a Resend rejeita requisições sem User-Agent
            req.Content = JsonContent.Create(new
            {
                from = $"{remetenteNome} <{remetente}>",
                to = new[] { para },
                subject = assunto,
                html
            });
            return req;
        }

        private static HttpRequestMessage MontarBrevo(string chave, string remetente, string remetenteNome, string para, string? nomeDestino, string assunto, string html)
        {
            var req = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
            req.Headers.Add("api-key", chave);
            req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            req.Content = JsonContent.Create(new
            {
                sender = new { name = remetenteNome, email = remetente },
                to = new[] { new { email = para, name = string.IsNullOrWhiteSpace(nomeDestino) ? para : nomeDestino } },
                subject = assunto,
                htmlContent = html
            });
            return req;
        }
    }
}
