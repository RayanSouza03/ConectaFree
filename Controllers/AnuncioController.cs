using ConectaFree.Dtos;
using ConectaFree.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ConectaFree.Controllers
{
    [ApiController]
    [Route("Api/[Controller]")]
    public class AnuncioController : ControllerBase
    {
        private readonly IAnuncioService _anuncioService;
        public AnuncioController(IAnuncioService anuncioService)
        {
            _anuncioService = anuncioService;
        }

        [HttpGet("filtrar")]
        public async Task<IActionResult> Filtrar([FromQuery] FiltroVagaDto filtro)
        {
            var Resultado = await _anuncioService.FiltrarAsync(filtro);
            return Ok(Resultado);
        }
    }
}