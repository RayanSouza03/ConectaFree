using ConectaFree.Dtos;
using ConectaFree.Models;

namespace ConectaFree.Interfaces
{
 public interface IUsuarioService
    {
        Task<Usuario> CadastrarAsync(CadastroUsuarioDto dto);
        Task<LoginResponseDto?> LoginAsync(LoginDto dto);
        Task<Usuario> AtualizarPerfilAsync(int usuarioId, AtualizarPerfilDto dto);
        Task<List<Usuario>> FiltrarFreelancersAsync(FiltroFreelancerDto filtro);
    }   
}