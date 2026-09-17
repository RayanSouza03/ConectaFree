using Microsoft.EntityFrameworkCore;
using ConectaFree.Data;
using ConectaFree.Dtos;
using ConectaFree.Interfaces;
using ConectaFree.Models;

namespace ConectaFree.Services
{
    public class AnuncioService : IAnuncioService
    {
        private readonly ConectaFreeDbContext _context;

        public AnuncioService(ConectaFreeDbContext context)
        {
            _context = context;
        }

        public async Task<List<Anuncio>> FiltrarAsync(FiltroVagaDto filtro)
        {
            var query = _context.Anuncios
                .Include(a => a.Habilidade)
                .Include(a => a.Contratante)
                    .ThenInclude(c => c.Endereco)
                .Where(a => a.Status == StatusAnuncio.Aberta)
                .AsQueryable();

            if (filtro.HabilidadeId.HasValue)
                query = query.Where(a => a.HabilidadeId == filtro.HabilidadeId.Value);

            if (filtro.ValorMin.HasValue)
                query = query.Where(a => a.ValorProposto >= filtro.ValorMin.Value);

            if (filtro.ValorMax.HasValue)
                query = query.Where(a => a.ValorProposto <= filtro.ValorMax.Value);

            if (filtro.Urgente.HasValue)
                query = query.Where(a => a.Urgente == filtro.Urgente.Value);

            if (!string.IsNullOrWhiteSpace(filtro.Cidade))
                query = query.Where(a => a.Contratante.Endereco != null &&
                                         a.Contratante.Endereco.Cidade == filtro.Cidade);

            if (!string.IsNullOrWhiteSpace(filtro.Estado))
                query = query.Where(a => a.Contratante.Endereco != null &&
                                         a.Contratante.Endereco.Estado == filtro.Estado);

            query = query.OrderByDescending(a => a.Urgente).ThenByDescending(a => a.DataCriacao);

            return await query.ToListAsync();
        }
    }
}
