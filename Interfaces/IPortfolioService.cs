using ConectaFree.Dtos;

namespace ConectaFree.Interfaces
{
    public interface IPortfolioService
    {
        Task<PortfolioItemRespostaDto> CriarAsync(int usuarioId, CriarPortfolioItemDto dto);
        Task<List<PortfolioItemRespostaDto>> ListarPorUsuarioAsync(int usuarioId);
        Task ExcluirAsync(int usuarioId, int itemId);
    }
}
