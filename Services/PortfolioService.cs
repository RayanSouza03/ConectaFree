using Microsoft.EntityFrameworkCore;
using ConectaFree.Data;
using ConectaFree.Dtos;
using ConectaFree.Interfaces;
using ConectaFree.Models;

namespace ConectaFree.Services
{
    public class PortfolioService : IPortfolioService
    {
        private readonly ConectaFreeDbContext _context;
        private readonly IStorageService _storage;

        public PortfolioService(ConectaFreeDbContext context, IStorageService storage)
        {
            _context = context;
            _storage = storage;
        }

        public async Task<PortfolioItemRespostaDto> CriarAsync(int usuarioId, CriarPortfolioItemDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId);
            if (usuario == null)
                throw new InvalidOperationException("Usuário não encontrado.");

            if (usuario.TipoUsuario != TipoUsuario.Freelancer)
                throw new InvalidOperationException("Somente Freelancers podem ter portfólio.");

            var item = new PortfolioItem
            {
                UsuarioId = usuarioId,
                Tipo = dto.Tipo,
                Titulo = dto.Titulo ?? string.Empty
            };

            if (dto.Tipo == TipoPortfolioItem.Foto)
            {
                if (dto.Foto == null)
                    throw new InvalidOperationException("Envie a foto.");

                if (string.IsNullOrWhiteSpace(dto.Titulo))
                    throw new InvalidOperationException("Título é obrigatório pra foto.");

                item.Descricao = dto.Descricao;
                item.FotoUrl = await _storage.UploadAsync(dto.Foto, $"portfolio/{usuarioId}");
            }
            else
            {
                if (dto.AnuncioId == null)
                    throw new InvalidOperationException("Informe a vaga.");

                var anuncio = await _context.Anuncios.FirstOrDefaultAsync(a => a.Id == dto.AnuncioId.Value);
                if (anuncio == null)
                    throw new InvalidOperationException("Vaga não encontrada.");

                var participou = await _context.Candidaturas.AnyAsync(c =>
                    c.AnuncioId == anuncio.Id && c.FreelancerId == usuarioId && c.Status == StatusCandidatura.Aceita);
                if (!participou)
                    throw new InvalidOperationException("Você não foi aprovado nesta vaga.");

                if (anuncio.Status != StatusAnuncio.Concluida)
                    throw new InvalidOperationException("Só é possível adicionar vagas concluídas ao portfólio.");

                item.AnuncioId = anuncio.Id;
                item.Titulo = string.IsNullOrWhiteSpace(dto.Titulo) ? anuncio.Titulo : dto.Titulo;
                item.Descricao = dto.Descricao ?? anuncio.Descricao;
            }

            _context.PortfolioItens.Add(item);
            await _context.SaveChangesAsync();

            return Mapeamento.ParaPortfolio(item);
        }

        public async Task<List<PortfolioItemRespostaDto>> ListarPorUsuarioAsync(int usuarioId)
        {
            var itens = await _context.PortfolioItens
                .AsNoTracking()
                .Where(p => p.UsuarioId == usuarioId)
                .OrderByDescending(p => p.DataCriacao)
                .ToListAsync();

            return itens.Select(Mapeamento.ParaPortfolio).ToList();
        }

        public async Task ExcluirAsync(int usuarioId, int itemId)
        {
            var item = await _context.PortfolioItens.FirstOrDefaultAsync(p => p.Id == itemId && p.UsuarioId == usuarioId)
                ?? throw new KeyNotFoundException("Item não encontrado.");

            _context.PortfolioItens.Remove(item);
            await _context.SaveChangesAsync();
        }
    }
}
