using ConectaFree.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ConectaFree.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocalidadesController : ControllerBase
    {
        private readonly ILocalidadesService _localidades;

        public LocalidadesController(ILocalidadesService localidades)
        {
            _localidades = localidades;
        }

        [HttpGet("estados")]
        [ResponseCache(Duration = 86400)]
        public async Task<IActionResult> Estados(CancellationToken ct)
        {
            try { return Ok(await _localidades.EstadosAsync(ct)); }
            catch (LocalidadesIndisponivelException) { return StatusCode(503, new { erro = "Lista de estados indisponível no momento." }); }
        }

        // /api/Localidades/cidades?uf=PR  (sem uf: todas as cidades do Brasil)
        [HttpGet("cidades")]
        [ResponseCache(Duration = 86400, VaryByQueryKeys = new[] { "uf" })]
        public async Task<IActionResult> Cidades([FromQuery] string? uf, CancellationToken ct)
        {
            try { return Ok(await _localidades.CidadesAsync(uf, ct)); }
            catch (LocalidadesIndisponivelException) { return StatusCode(503, new { erro = "Lista de cidades indisponível no momento." }); }
        }
    }
}
