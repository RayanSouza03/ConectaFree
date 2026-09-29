using ConectaFree.Dtos;
using ConectaFree.Models;

namespace ConectaFree.Interfaces
{
    public interface IUsuarioService
    {
        Task<Usuario> CadastrarAsync(CadastroUsuarioDto dto);
        Task<LoginResponseDto?> LoginAsync(LoginDto dto);
        Task<PerfilRespostaDto> ObterPerfilAsync(int usuarioId);
        Task<PerfilPublicoDto> ObterPublicoAsync(int usuarioId);
        Task<PerfilRespostaDto> AtualizarPerfilAsync(int usuarioId, AtualizarPerfilDto dto);
        Task<string> AtualizarFotoAsync(int usuarioId, IFormFile foto);
        Task<List<PerfilPublicoDto>> FiltrarFreelancersAsync(FiltroFreelancerDto filtro);
    }
}
