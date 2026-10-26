using System.Globalization;
using System.Text.Json;
using ConectaFree.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace ConectaFree.Services
{
    // Consulta o CNPJ na BrasilAPI (dados da Receita Federal)
    public class CnpjService : ICnpjService
    {
        private readonly IHttpClientFactory _factory;
        private readonly IMemoryCache _cache;
        private readonly ILogger<CnpjService> _log;

        public CnpjService(IHttpClientFactory factory, IMemoryCache cache, ILogger<CnpjService> log)
        {
            _factory = factory;
            _cache = cache;
            _log = log;
        }

        public async Task<DadosCnpj?> ConsultarAsync(string cnpj, CancellationToken ct = default)
        {
            var digitos = DocumentoValidador.Digitos(cnpj);
            if (!DocumentoValidador.CnpjValido(digitos)) return null;

            // A tela consulta ao digitar e o cadastro consulta de novo ao salvar: cache curto evita a segunda chamada
            if (_cache.TryGetValue($"cnpj:{digitos}", out DadosCnpj? emCache)) return emCache;

            var http = _factory.CreateClient();
            http.Timeout = TimeSpan.FromSeconds(10);
            // HttpClient não manda User-Agent por padrão e a BrasilAPI (Cloudflare) pode barrar com 403
            http.DefaultRequestHeaders.UserAgent.ParseAdd("ConectaFree/1.0");
            http.DefaultRequestHeaders.Accept.ParseAdd("application/json");

            HttpResponseMessage resposta;
            try
            {
                resposta = await http.GetAsync($"https://brasilapi.com.br/api/cnpj/v1/{digitos}", ct);
            }
            catch (Exception ex) when (ex is HttpRequestException || ex is TaskCanceledException)
            {
                _log.LogWarning(ex, "BrasilAPI (CNPJ) indisponível.");
                throw new CnpjIndisponivelException();
            }

            using (resposta)
            {
                if (resposta.StatusCode == System.Net.HttpStatusCode.NotFound ||
                    resposta.StatusCode == System.Net.HttpStatusCode.BadRequest)
                    return null;

                if (!resposta.IsSuccessStatusCode)
                {
                    _log.LogWarning("BrasilAPI (CNPJ) respondeu {Status}: {Corpo}", (int)resposta.StatusCode, await resposta.Content.ReadAsStringAsync(ct));
                    throw new CnpjIndisponivelException();
                }

                using var doc = JsonDocument.Parse(await resposta.Content.ReadAsStringAsync(ct));
                var r = doc.RootElement;

                var situacao = Txt(r, "descricao_situacao_cadastral");
                var tipoLogradouro = Txt(r, "descricao_tipo_de_logradouro");
                var logradouro = Txt(r, "logradouro");
                var rua = string.IsNullOrWhiteSpace(tipoLogradouro) ? logradouro : $"{tipoLogradouro} {logradouro}";
                var numero = Txt(r, "numero");

                var dados = new DadosCnpj(
                    Cnpj: digitos,
                    RazaoSocial: Titulo(Txt(r, "razao_social")),
                    NomeFantasia: string.IsNullOrWhiteSpace(Txt(r, "nome_fantasia")) ? null : Titulo(Txt(r, "nome_fantasia")),
                    Situacao: string.IsNullOrWhiteSpace(situacao) ? "Não informada" : Titulo(situacao),
                    Ativa: situacao.Trim().Equals("ATIVA", StringComparison.OrdinalIgnoreCase),
                    Endereco: new EnderecoCnpj(
                        Cep: DocumentoValidador.Digitos(Txt(r, "cep")),
                        Logradouro: Cortar(Titulo(rua), 150),
                        Numero: Cortar(string.IsNullOrWhiteSpace(numero) ? "S/N" : numero, 20),
                        Complemento: string.IsNullOrWhiteSpace(Txt(r, "complemento")) ? null : Cortar(Titulo(Txt(r, "complemento")), 100),
                        Bairro: Cortar(Titulo(Txt(r, "bairro")), 100),
                        Cidade: Cortar(Titulo(Txt(r, "municipio")), 100),
                        Estado: Txt(r, "uf").Trim().ToUpperInvariant()));

                _cache.Set($"cnpj:{digitos}", dados, TimeSpan.FromMinutes(30));
                return dados;
            }
        }

        // Lê string ou número do JSON (a BrasilAPI às vezes manda o CEP/número como número)
        private static string Txt(JsonElement e, string nome)
        {
            if (!e.TryGetProperty(nome, out var v)) return string.Empty;
            return v.ValueKind switch
            {
                JsonValueKind.String => v.GetString() ?? string.Empty,
                JsonValueKind.Number => v.GetRawText(),
                _ => string.Empty
            };
        }

        private static string Cortar(string texto, int max) =>
            texto.Length <= max ? texto : texto[..max];

        // A Receita devolve tudo em MAIÚSCULAS: "RUA CARLOS DE CARVALHO" -> "Rua Carlos de Carvalho"
        private static readonly HashSet<string> Minusculas = new(StringComparer.OrdinalIgnoreCase)
            { "de", "da", "do", "das", "dos", "e" };

        private static string Titulo(string texto)
        {
            if (string.IsNullOrWhiteSpace(texto)) return string.Empty;
            var cultura = new CultureInfo("pt-BR");
            var palavras = texto.Trim().ToLower(cultura).Split(' ', StringSplitOptions.RemoveEmptyEntries);
            for (var i = 0; i < palavras.Length; i++)
            {
                if (i > 0 && Minusculas.Contains(palavras[i])) continue;
                palavras[i] = cultura.TextInfo.ToTitleCase(palavras[i]);
            }
            return string.Join(' ', palavras);
        }
    }
}
