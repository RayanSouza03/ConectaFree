using ConectaFree.Dtos;
using ConectaFree.Models;

namespace ConectaFree.Interfaces
{
    // Lançada quando a conta está temporariamente bloqueada por excesso de senhas erradas
    public class ContaBloqueadaException : Exception
    {
        public int MinutosRestantes { get; }
        public ContaBloqueadaException(int minutos) : base("Conta temporariamente bloqueada.") { MinutosRestantes = minutos; }
    }

    public interface IUsuarioService
    {
        Task<Usuario> CadastrarAsync(CadastroUsuarioDto dto);
        Task<LoginResponseDto?> LoginAsync(LoginDto dto);
        Task<GoogleLoginResultado> LoginGoogleAsync(GoogleLoginDto dto);
        Task AceitarTermosAsync(int usuarioId);
        Task SolicitarRedefinicaoSenhaAsync(string email);
        Task RedefinirSenhaAsync(string token, string novaSenha);
        Task<PerfilRespostaDto> ObterPerfilAsync(int usuarioId);
        Task<PerfilPublicoDto> ObterPublicoAsync(int usuarioId);
        Task<PerfilRespostaDto> AtualizarPerfilAsync(int usuarioId, AtualizarPerfilDto dto);
        Task<string> AtualizarFotoAsync(int usuarioId, IFormFile foto);
        Task<List<PerfilPublicoDto>> FiltrarFreelancersAsync(FiltroFreelancerDto filtro);
    }
}
