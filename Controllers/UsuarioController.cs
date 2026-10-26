using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ConectaFree.Dtos;
using ConectaFree.Interfaces;
using Microsoft.AspNetCore.RateLimiting;

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

        // "login": limite por IP (ver Program.cs). Além disso a conta bloqueia após várias senhas erradas.
        [EnableRateLimiting("login")]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            try
            {
                var resultado = await _usuarioService.LoginAsync(dto);

                if (resultado == null)
                    return Unauthorized(new { erro = "Email ou senha inválidos." });

                return Ok(resultado);
            }
            catch (ContaBloqueadaException ex)
            {
                return StatusCode(429, new { erro = $"Muitas tentativas. Tente novamente em {ex.MinutosRestantes} minuto(s) ou redefina sua senha." });
            }
        }

        // Recebe o ID token do Google. Devolve o login (token JWT) ou { precisaCadastro: true } para contas novas.
        [EnableRateLimiting("login")]
        [HttpPost("google")]
        public async Task<IActionResult> LoginGoogle(GoogleLoginDto dto)
        {
            try
            {
                var r = await _usuarioService.LoginGoogleAsync(dto);
                if (r.Login != null) return Ok(r.Login);
                return Ok(new { precisaCadastro = true, nome = r.Nome, email = r.Email });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        // Sempre responde igual, exista o e-mail ou não (não dá para descobrir quem tem conta)
        [EnableRateLimiting("recuperacao")]
        [HttpPost("esqueci-senha")]
        public async Task<IActionResult> EsqueciSenha(EsqueciSenhaDto dto)
        {
            await _usuarioService.SolicitarRedefinicaoSenhaAsync(dto.Email);
            return Ok(new { mensagem = "Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha." });
        }

        [EnableRateLimiting("recuperacao")]
        [HttpPost("redefinir-senha")]
        public async Task<IActionResult> RedefinirSenha(RedefinirSenhaDto dto)
        {
            try
            {
                await _usuarioService.RedefinirSenhaAsync(dto.Token, dto.NovaSenha);
                return Ok(new { mensagem = "Senha alterada. Você já pode entrar." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        // Chamado pela janela de aceite exibida no login quando os termos são novos ou mudaram
        [Authorize]
        [HttpPost("aceitar-termos")]
        public async Task<IActionResult> AceitarTermos()
        {
            try
            {
                await _usuarioService.AceitarTermosAsync(UsuarioId);
                return Ok(new { mensagem = "Termos aceitos." });
            }
            catch (InvalidOperationException ex) { return NotFound(new { erro = ex.Message }); }
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
