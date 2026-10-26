using ConectaFree.Interfaces;
using ConectaFree.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ConectaFree.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CnpjController : ControllerBase
    {
        private readonly ICnpjService _cnpj;

        public CnpjController(ICnpjService cnpj)
        {
            _cnpj = cnpj;
        }

        // Usado pela tela de cadastro (ainda sem login) para validar e preencher os dados da empresa
        [EnableRateLimiting("consulta")]
        [HttpGet("{cnpj}")]
        public async Task<IActionResult> Consultar(string cnpj, CancellationToken ct)
        {
            if (!DocumentoValidador.CnpjValido(cnpj))
                return BadRequest(new { erro = "CNPJ inválido. Confira os números." });

            try
            {
                var dados = await _cnpj.ConsultarAsync(cnpj, ct);
                return dados is null
                    ? NotFound(new { erro = "CNPJ não encontrado na Receita Federal." })
                    : Ok(dados);
            }
            catch (CnpjIndisponivelException)
            {
                return StatusCode(503, new { erro = "Não foi possível consultar o CNPJ agora. Tente novamente em instantes." });
            }
        }
    }
}
