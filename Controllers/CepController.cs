using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace ConectaFree.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CepController : ControllerBase
    {
        private readonly IHttpClientFactory _factory;
        private readonly IConfiguration _config;

        public CepController(IHttpClientFactory factory, IConfiguration config)
        {
            _factory = factory;
            _config = config;
        }

        private static string Txt(JsonElement e, string nome) =>
            e.TryGetProperty(nome, out var v) && v.ValueKind == JsonValueKind.String ? (v.GetString() ?? "") : "";

        [HttpGet("{cep}")]
        public async Task<IActionResult> Buscar(string cep)
        {
            var digitos = new string(cep.Where(char.IsDigit).ToArray());
            if (digitos.Length != 8)
                return BadRequest(new { erro = "CEP inválido." });

            var http = _factory.CreateClient();
            http.Timeout = TimeSpan.FromSeconds(8);

            try
            {
                using var doc = JsonDocument.Parse(await http.GetStringAsync($"https://viacep.com.br/ws/{digitos}/json/"));
                var r = doc.RootElement;
                if (!r.TryGetProperty("erro", out _))
                    return Ok(new { cep = digitos, logradouro = Txt(r, "logradouro"), bairro = Txt(r, "bairro"), cidade = Txt(r, "localidade"), estado = Txt(r, "uf"), fonte = "ViaCEP" });
            }
            catch {  }

            try
            {
                using var doc = JsonDocument.Parse(await http.GetStringAsync($"https://brasilapi.com.br/api/cep/v1/{digitos}"));
                var r = doc.RootElement;
                return Ok(new { cep = digitos, logradouro = Txt(r, "street"), bairro = Txt(r, "neighborhood"), cidade = Txt(r, "city"), estado = Txt(r, "state"), fonte = "BrasilAPI" });
            }
            catch {  }

            var chave = _config["Google:MapsKey"];
            if (!string.IsNullOrWhiteSpace(chave))
            {
                try
                {
                    var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={digitos}&components=country:BR&language=pt-BR&key={chave}";
                    using var doc = JsonDocument.Parse(await http.GetStringAsync(url));
                    var results = doc.RootElement.GetProperty("results");
                    if (results.GetArrayLength() > 0)
                    {
                        string rua = "", bairro = "", cidade = "", estado = "";
                        foreach (var comp in results[0].GetProperty("address_components").EnumerateArray())
                        {
                            var tipos = comp.GetProperty("types").EnumerateArray().Select(t => t.GetString()).ToList();
                            if (tipos.Contains("route")) rua = Txt(comp, "long_name");
                            else if (tipos.Contains("sublocality_level_1") || tipos.Contains("sublocality")) bairro = Txt(comp, "long_name");
                            else if (tipos.Contains("administrative_area_level_2")) cidade = Txt(comp, "long_name");
                            else if (tipos.Contains("administrative_area_level_1")) estado = Txt(comp, "short_name");
                        }
                        return Ok(new { cep = digitos, logradouro = rua, bairro, cidade, estado, fonte = "Google" });
                    }
                }
                catch {  }
            }

            return NotFound(new { erro = "CEP não encontrado." });
        }
    }
}
