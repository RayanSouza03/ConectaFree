using ConectaFree.Dtos;
using ConectaFree.Models;

namespace ConectaFree.Interfaces
{
    public interface IPortfolioService
    {
        Task<PortfolioItem> CriarAsync(int usuarioId, CriarPortfolioItemDto dto);
        Task<List<PortfolioItem>> ListarPorUsuarioAsync(int usuarioId);
    }
}