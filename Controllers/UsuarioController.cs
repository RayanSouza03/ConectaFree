using Microsoft.AspNetCore.Mvc;
using ConectaFree.Dtos;
using ConectaFree.Interfaces;

namespace ConectaFree.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // vira /api/usuarios
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioService _usuarioService;

        // Injeção de dependência: o Controller recebe a Service pronta,
        // não sabe (nem precisa saber) como ela funciona por dentro.
        public UsuariosController(IUsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        [HttpPost("cadastro")] // POST /api/usuarios/cadastro
        public async Task<IActionResult> Cadastrar(CadastroUsuarioDto dto)
        {
            try
            {
                var usuario = await _usuarioService.CadastrarAsync(dto);
                return Ok(new { usuario.Id, usuario.Nome, usuario.Email });
            }
            catch (InvalidOperationException ex)
            {
                // Email duplicado, por exemplo
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpPost("login")] // POST /api/usuarios/login
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var resultado = await _usuarioService.LoginAsync(dto);

            if (resultado == null)
                return Unauthorized(new { erro = "Email ou senha inválidos." });

            return Ok(resultado);
        }
    }
}