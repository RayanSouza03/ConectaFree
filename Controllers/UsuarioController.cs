using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ConectaFree.Dtos;
using ConectaFree.Interfaces;

namespace ConectaFree.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        public UsuariosController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        private int UsuarioId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpPost("cadastro")]
        public async Task<IActionResult> Cadastrar(CadastroUsuarioDto dto)
        {
            try
            {
                var usuario = await _usuarioService.CadastrarAsync(dto);
                return Ok(new { usuario.Id, usuario.Nome, usuario.Email });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var resultado = await _usuarioService.LoginAsync(dto);

            if (resultado == null)
                return Unauthorized(new { erro = "Email ou senha inválidos." });

            return Ok(resultado);
        }

        [Authorize]
        [HttpGet("perfil")]
        public async Task<IActionResult> ObterPerfil()
        {
            try { return Ok(await _usuarioService.ObterPerfilAsync(UsuarioId)); }
            catch (InvalidOperationException ex) { return NotFound(new { erro = ex.Message }); }
        }

        [Authorize]
        [HttpPut("perfil")]
        public async Task<IActionResult> AtualizarPerfil([FromBody] AtualizarPerfilDto dto)
        {
            try { return Ok(await _usuarioService.AtualizarPerfilAsync(UsuarioId, dto)); }
            catch (InvalidOperationException ex) { return BadRequest(new { erro = ex.Message }); }
        }

        [Authorize]
        [HttpPost("perfil/foto")]
        public async Task<IActionResult> AtualizarFoto([FromForm] IFormFile foto)
        {
            try
            {
                var url = await _usuarioService.AtualizarFotoAsync(UsuarioId, foto);
                return Ok(new { fotoUrl = url });
            }
            catch (InvalidOperationException ex) { return BadRequest(new { erro = ex.Message }); }
        }

        [Authorize]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> ObterPublico(int id)
        {
            try { return Ok(await _usuarioService.ObterPublicoAsync(id)); }
            catch (KeyNotFoundException ex) { return NotFound(new { erro = ex.Message }); }
        }

        [Authorize]
        [HttpGet("filtrar-freelancers")]
        public async Task<IActionResult> FiltrarFreelancers([FromQuery] FiltroFreelancerDto filtro) =>
            Ok(await _usuarioService.FiltrarFreelancersAsync(filtro));
    }
}
