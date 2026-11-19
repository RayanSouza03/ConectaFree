using System.Security.Claims;
using ConectaFree.Dtos;
using ConectaFree.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConectaFree.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnuncioController : ControllerBase
    {
        private readonly IAnuncioService _service;

        public AnuncioController(IAnuncioService service)
        {
            _service = service;
        }

        private int UsuarioId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        private async Task<IActionResult> Executar(Func<Task<IActionResult>> acao)
        {
            try { return await acao(); }
            catch (KeyNotFoundException ex) { return NotFound(new { erro = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { erro = ex.Message }); }
        }

        [HttpGet("filtrar")]
        public async Task<IActionResult> Filtrar([FromQuery] FiltroVagaDto filtro) =>
            Ok(await _service.FiltrarAsync(filtro));

        [Authorize]
        [HttpGet("{id:int}")]
        public Task<IActionResult> Obter(int id) => Executar(async () =>
            Ok(await _service.ObterAsync(id, User.IsInRole("Freelancer") ? UsuarioId : null)));

        [Authorize(Roles = "Freelancer")]
        [HttpPost("{id:int}/candidatar")]
        public Task<IActionResult> Candidatar(int id, [FromBody] CandidatarDto dto) => Executar(async () =>
        {
            await _service.CandidatarAsync(UsuarioId, id, dto ?? new CandidatarDto());
            return Ok(new { mensagem = "Candidatura enviada." });
        });

        [Authorize(Roles = "Freelancer")]
        [HttpGet("candidaturas/minhas")]
        public async Task<IActionResult> MinhasCandidaturas() =>
            Ok(await _service.MinhasCandidaturasAsync(UsuarioId));

        [Authorize(Roles = "Freelancer")]
        [HttpGet("concluidas/minhas")]
        public async Task<IActionResult> MinhasConcluidas() =>
            Ok(await _service.VagasConcluidasDoFreelancerAsync(UsuarioId));

        [Authorize(Roles = "Contratante")]
        [HttpGet("minhas")]
        public async Task<IActionResult> Minhas() =>
            Ok(await _service.ListarDoContratanteAsync(UsuarioId));

        [Authorize(Roles = "Contratante")]
        [HttpPost]
        public Task<IActionResult> Criar([FromBody] AnuncioDto dto) => Executar(async () =>
            Ok(await _service.CriarAsync(UsuarioId, dto)));

        [Authorize(Roles = "Contratante")]
        [HttpPut("{id:int}")]
        public Task<IActionResult> Atualizar(int id, [FromBody] AnuncioDto dto) => Executar(async () =>
            Ok(await _service.AtualizarAsync(UsuarioId, id, dto)));

        [Authorize(Roles = "Contratante")]
        [HttpDelete("{id:int}")]
        public Task<IActionResult> Excluir(int id) => Executar(async () =>
        {
            await _service.ExcluirAsync(UsuarioId, id);
            return NoContent();
        });

        [Authorize(Roles = "Contratante")]
        [HttpGet("{id:int}/candidaturas")]
        public Task<IActionResult> Candidaturas(int id) => Executar(async () =>
            Ok(await _service.CandidaturasDaVagaAsync(UsuarioId, id)));

        [Authorize(Roles = "Contratante")]
        [HttpPut("candidaturas/{candidaturaId:int}/status")]
        public Task<IActionResult> AtualizarStatus(int candidaturaId, [FromBody] AtualizarStatusCandidaturaDto dto) => Executar(async () =>
        {
            await _service.AtualizarStatusCandidaturaAsync(UsuarioId, candidaturaId, dto.Status);
            return NoContent();
        });
    }
}
