using System.Text.Json;
using ConectaFree.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace ConectaFree.Services
{
    // Lista oficial de estados e municípios (API de Localidades do IBGE), com cache de 24h
    public class LocalidadesService : ILocalidadesService
    {
        private const string Base = "https://servicodados.ibge.gov.br/api/v1/localidades";
        private static readonly TimeSpan Validade = TimeSpan.FromHours(24);

        private readonly IHttpClientFactory _factory;
        private readonly IMemoryCache _cache;
        private readonly ILogger<LocalidadesService> _log;

        public LocalidadesService(IHttpClientFactory factory, IMemoryCache cache, ILogger<LocalidadesService> log)
        {
            _factory = factory;
            _cache = cache;
            _log = log;
        }

        public async Task<List<EstadoDto>> EstadosAsync(CancellationToken ct = default)
        {
            var lista = await _cache.GetOrCreateAsync("ibge:estados", async entrada =>
            {
                entrada.AbsoluteExpirationRelativeToNow = Validade;
                using var doc = await BaixarAsync($"{Base}/estados?orderBy=nome", ct);
                return doc.RootElement.EnumerateArray()
                    .Select(e => new EstadoDto(e.GetProperty("sigla").GetString() ?? "", e.GetProperty("nome").GetString() ?? ""))
                    .ToList();
            });
            return lista ?? new List<EstadoDto>();
        }

        public async Task<List<CidadeDto>> CidadesAsync(string? uf, CancellationToken ct = default)
        {
            var sigla = (uf ?? string.Empty).Trim().ToUpperInvariant();
            if (sigla.Length != 0 && (sigla.Length != 2 || !sigla.All(char.IsLetter)))
                return new List<CidadeDto>();

            var url = sigla.Length == 0
                ? $"{Base}/municipios?orderBy=nome"
                : $"{Base}/estados/{sigla}/municipios?orderBy=nome";

            var lista = await _cache.GetOrCreateAsync($"ibge:cidades:{(sigla.Length == 0 ? "*" : sigla)}", async entrada =>
            {
                entrada.AbsoluteExpirationRelativeToNow = Validade;
                using var doc = await BaixarAsync(url, ct);
                return doc.RootElement.EnumerateArray()
                    .Select(m => new CidadeDto(m.GetProperty("nome").GetString() ?? "", SiglaDoMunicipio(m, sigla)))
                    .Where(c => c.Nome.Length > 0)
                    .ToList();
            });
            return lista ?? new List<CidadeDto>();
        }

        // Estrutura do IBGE: microrregiao.mesorregiao.UF.sigla (alguns municípios novos só têm regiao-imediata)
        private static string SiglaDoMunicipio(JsonElement m, string ufConsultada)
        {
            if (ufConsultada.Length == 2) return ufConsultada;

            return Caminho(m, "microrregiao", "mesorregiao", "UF", "sigla")
                ?? Caminho(m, "regiao-imediata", "regiao-intermediaria", "UF", "sigla")
                ?? string.Empty;
        }

        private static string? Caminho(JsonElement raiz, params string[] chaves)
        {
            var atual = raiz;
            foreach (var chave in chaves)
            {
                if (atual.ValueKind != JsonValueKind.Object || !atual.TryGetProperty(chave, out var proximo)) return null;
                atual = proximo;
            }
            return atual.ValueKind == JsonValueKind.String ? atual.GetString() : null;
        }

        private async Task<JsonDocument> BaixarAsync(string url, CancellationToken ct)
        {
            var http = _factory.CreateClient();
            http.Timeout = TimeSpan.FromSeconds(20);
            try
            {
                var json = await http.GetStringAsync(url, ct);
                return JsonDocument.Parse(json);
            }
            catch (Exception ex) when (ex is HttpRequestException || ex is TaskCanceledException || ex is JsonException)
            {
                _log.LogWarning(ex, "IBGE Localidades indisponível ({Url}).", url);
                throw new LocalidadesIndisponivelException();
            }
        }
    }
}
