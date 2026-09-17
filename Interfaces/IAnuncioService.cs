using ConectaFree.Dtos;
using ConectaFree.Models;

namespace ConectaFree.Interfaces
{
    public interface IAnuncioService
    {
        Task<List<Anuncio>> FiltrarAsync(FiltroVagaDto filtro);
    }
}
