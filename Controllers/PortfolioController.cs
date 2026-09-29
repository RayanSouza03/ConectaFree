using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ConectaFree.Dtos;
using ConectaFree.Interfaces;

namespace ConectaFree.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PortfolioController : ControllerBase
    {
        private readonly IPortfolioService _portfolioService;

        public PortfolioController(IPortfolioService portfolioService)
        {
            _portfolioService = portfolioService;
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Criar([FromForm] CriarPortfolioItemDto dto)
        {
            var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            try
            {
                var item = await _portfolioService.CriarAsync(usuarioId, dto);
                return Ok(item);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [Authorize]
        [HttpDelete("{itemId:int}")]
        public async Task<IActionResult> Excluir(int itemId)
        {
            var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            try
            {
                await _portfolioService.ExcluirAsync(usuarioId, itemId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { erro = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("{usuarioId:int}")]
        public async Task<IActionResult> ListarPorUsuario(int usuarioId)
        {
            var itens = await _portfolioService.ListarPorUsuarioAsync(usuarioId);
            return Ok(itens);
        }
    }
}
