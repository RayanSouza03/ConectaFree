using ConectaFree.Data;
using ConectaFree.Dtos;
using ConectaFree.Models;
using ConectaFree.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace ConectaFree.Controllers
{
    public class NovaCategoriaDto
    {
        [Required, MaxLength(60)]
        public required string Nome { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class HabilidadesController : ControllerBase
    {
        private readonly ConectaFreeDbContext _context;

        public HabilidadesController(ConectaFreeDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var lista = await _context.Habilidades.AsNoTracking().OrderBy(h => h.Nome).ToListAsync();
            return Ok(lista.Select(h => new HabilidadeDto(h.Id, h.Nome)));
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> ObterOuCriar([FromBody] NovaCategoriaDto dto)
        {
            var nome = System.Text.RegularExpressions.Regex.Replace((dto.Nome ?? "").Trim(), @"\s+", " ");

            var erro = FiltroPalavras.ValidarCategoria(nome);
            if (erro != null) return BadRequest(new { erro });

            var existente = await _context.Habilidades.FirstOrDefaultAsync(h => EF.Functions.ILike(h.Nome, nome));
            if (existente != null) return Ok(new HabilidadeDto(existente.Id, existente.Nome));

            var nova = new Habilidade { Nome = nome };
            _context.Habilidades.Add(nova);
            await _context.SaveChangesAsync();
            return Ok(new HabilidadeDto(nova.Id, nova.Nome));
        }
    }
}
