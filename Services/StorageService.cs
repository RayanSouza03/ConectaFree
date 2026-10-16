using System.Net.Http.Headers;

namespace ConectaFree.Services
{
    public interface IStorageService
    {
        Task<string> UploadAsync(IFormFile arquivo, string pasta);
    }

    public class StorageService : IStorageService
    {
        private static readonly Dictionary<string, string> Tipos = new()
        {
            ["image/jpeg"] = ".jpg",
            ["image/png"] = ".png",
            ["image/webp"] = ".webp"
        };

        private static readonly Dictionary<string, string> TiposPortfolio = new()
        {
            ["application/pdf"] = ".pdf"
        };

        private static bool _bucketGarantido;

        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _env;

        public StorageService(IHttpClientFactory factory, IConfiguration config, IWebHostEnvironment env)
        {
            _http = factory.CreateClient();
            _config = config;
            _env = env;
        }

        private static bool Configurado(string? valor) =>
            !string.IsNullOrWhiteSpace(valor) && !valor.Contains("SEU-PROJETO") && !valor.StartsWith("COLE_AQUI");

        public async Task<string> UploadAsync(IFormFile arquivo, string pasta)
        {
            if (arquivo == null || arquivo.Length == 0)
                throw new InvalidOperationException("Envie uma imagem.");
            if (arquivo.Length > 5 * 1024 * 1024)
                throw new InvalidOperationException("A imagem deve ter no máximo 5MB.");
            var tipo = arquivo.ContentType ?? "";
            var aceitaPdf = pasta.StartsWith("portfolio");
            if (!Tipos.TryGetValue(tipo, out var extensao) && !(aceitaPdf && TiposPortfolio.TryGetValue(tipo, out extensao)))
                throw new InvalidOperationException(aceitaPdf ? "Use imagem JPG, PNG, WEBP ou arquivo PDF." : "Use imagem JPG, PNG ou WEBP.");

            var url = _config["Supabase:Url"];
            var chave = _config["Supabase:ServiceRoleKey"];
            var bucket = _config["Supabase:Bucket"];
            if (string.IsNullOrWhiteSpace(bucket)) bucket = "conectafree";
            if (!Configurado(url) || !Configurado(chave))
                return await SalvarLocalAsync(arquivo, pasta, extensao);

            url = url!.TrimEnd('/');
            await GarantirBucketAsync(url, chave!, bucket);

            var caminho = $"{pasta}/{Guid.NewGuid()}{extensao}";

            using var stream = arquivo.OpenReadStream();
            using var conteudo = new StreamContent(stream);
            conteudo.Headers.ContentType = new MediaTypeHeaderValue(arquivo.ContentType!);

            using var req = new HttpRequestMessage(HttpMethod.Post, $"{url}/storage/v1/object/{bucket}/{caminho}");
            AplicarChave(req, chave);
            req.Content = conteudo;

            var resp = await _http.SendAsync(req);
            if (!resp.IsSuccessStatusCode)
                throw new InvalidOperationException("Falha ao enviar a imagem para o armazenamento.");

            return $"{url}/storage/v1/object/public/{bucket}/{caminho}";
        }

        // Chave nova (sb_secret_...) vai só em "apikey"; chave legada (JWT eyJ...) também em Authorization.
        private static void AplicarChave(HttpRequestMessage req, string chave)
        {
            req.Headers.Add("apikey", chave);
            if (!chave.StartsWith("sb_")) req.Headers.Add("Authorization", $"Bearer {chave}");
        }

        // Cria o bucket público na primeira vez (se já existir, o Supabase apenas recusa e seguimos).
        private async Task GarantirBucketAsync(string url, string chave, string bucket)
        {
            if (_bucketGarantido) return;
            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Post, $"{url}/storage/v1/bucket");
                AplicarChave(req, chave);
                req.Content = new StringContent($"{{\"id\":\"{bucket}\",\"name\":\"{bucket}\",\"public\":true}}", System.Text.Encoding.UTF8, "application/json");
                await _http.SendAsync(req);
            }
            catch { /* segue: o upload mostrará o erro real se houver */ }
            _bucketGarantido = true;
        }

        // Sem Supabase configurado: grava em wwwroot/uploads e serve pelo próprio site.
        private async Task<string> SalvarLocalAsync(IFormFile arquivo, string pasta, string extensao)
        {
            var raiz = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var destino = Path.Combine(raiz, "uploads", pasta.Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(destino);

            var nome = $"{Guid.NewGuid()}{extensao}";
            await using (var fs = new FileStream(Path.Combine(destino, nome), FileMode.Create))
            {
                await arquivo.CopyToAsync(fs);
            }

            return $"/uploads/{pasta}/{nome}";
        }
    }
}
