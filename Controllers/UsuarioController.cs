using Microsoft.AspNetCore.Mvc;
using ConectaFree.Dtos;
using ConectaFree.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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
        [HttpPut("perfil")]
        public async Task<IActionResult> AtualizarPerfil([FromBody] AtualizarPerfilDto dto)
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (usuarioIdClaim == null)
                return Unauthorized();

            var usuarioId = int.Parse(usuarioIdClaim);

            try
            {
                var usuario = await _usuarioService.AtualizarPerfilAsync(usuarioId, dto);
                return Ok(usuario);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("filtrar-freelancers")]
        public async Task<IActionResult>  FiltrarFreelancers([FromQuery] FiltroFreelancerDto filtro)
        {
            var Resultado = await _usuarioService.FiltrarFreelancersAsync(filtro);
            return Ok(Resultado);   
        }
    }
}