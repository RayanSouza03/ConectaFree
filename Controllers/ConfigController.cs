using Microsoft.AspNetCore.Mvc;

namespace ConectaFree.Controllers
{
    // Configurações públicas que o front precisa (nada secreto aqui)
    [ApiController]
    [Route("api/[controller]")]
    public class ConfigController : ControllerBase
    {
        private readonly IConfiguration _config;

        public ConfigController(IConfiguration config)
        {
            _config = config;
        }

        [HttpGet]
        public IActionResult Obter() => Ok(new { googleClientId = _config["Google:ClientId"] ?? "" });
    }
}
