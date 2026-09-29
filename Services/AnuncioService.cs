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

        private IQueryable<Anuncio> Base() =>
            _context.Anuncios
                .AsNoTracking()
                .Include(a => a.Habilidade)
                .Include(a => a.Contratante).ThenInclude(c => c.Endereco);

        private async Task<List<AnuncioRespostaDto>> MontarAsync(List<Anuncio> lista, int? freelancerId = null)
        {
            var ids = lista.Select(a => a.Id).ToList();

            var totais = await _context.Candidaturas
                .Where(c => ids.Contains(c.AnuncioId))
                .GroupBy(c => c.AnuncioId)
                .Select(g => new { g.Key, Total = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Total);

            var minhas = new Dictionary<int, string>();
            if (freelancerId.HasValue)
            {
                minhas = await _context.Candidaturas
                    .Where(c => c.FreelancerId == freelancerId.Value && ids.Contains(c.AnuncioId))
                    .ToDictionaryAsync(c => c.AnuncioId, c => c.Status.ToString());
            }

            return lista.Select(a => Mapeamento.ParaAnuncio(
                a,
                totais.TryGetValue(a.Id, out var t) ? t : 0,
                minhas.TryGetValue(a.Id, out var m) ? m : null)).ToList();
        }

        public async Task<List<AnuncioRespostaDto>> FiltrarAsync(FiltroVagaDto filtro)
        {
            var query = Base().Where(a => a.Status == StatusAnuncio.Aberta);

            if (filtro.HabilidadeId.HasValue)
                query = query.Where(a => a.HabilidadeId == filtro.HabilidadeId.Value);
            if (filtro.ValorMin.HasValue)
                query = query.Where(a => a.ValorProposto >= filtro.ValorMin.Value);
            if (filtro.ValorMax.HasValue)
                query = query.Where(a => a.ValorProposto <= filtro.ValorMax.Value);
            if (filtro.Urgente.HasValue)
                query = query.Where(a => a.Urgente == filtro.Urgente.Value);
            if (!string.IsNullOrWhiteSpace(filtro.Cidade))
                query = query.Where(a => a.Contratante.Endereco != null && EF.Functions.ILike(a.Contratante.Endereco.Cidade, "%" + filtro.Cidade.Trim().Replace("%", "").Replace("_", "") + "%"));
            if (!string.IsNullOrWhiteSpace(filtro.Estado))
                query = query.Where(a => a.Contratante.Endereco != null && EF.Functions.ILike(a.Contratante.Endereco.Estado, filtro.Estado.Trim().Replace("%", "").Replace("_", "")));

            var lista = await query
                .OrderByDescending(a => a.Urgente)
                .ThenByDescending(a => a.DataCriacao)
                .ToListAsync();

            return await MontarAsync(lista);
        }

        public async Task<AnuncioRespostaDto> ObterAsync(int id, int? freelancerId)
        {
            var anuncio = await Base().FirstOrDefaultAsync(a => a.Id == id)
                ?? throw new KeyNotFoundException("Vaga não encontrada.");

            return (await MontarAsync(new List<Anuncio> { anuncio }, freelancerId))[0];
        }

        public async Task<List<AnuncioRespostaDto>> ListarDoContratanteAsync(int contratanteId)
        {
            var lista = await Base()
                .Where(a => a.ContratanteId == contratanteId)
                .OrderByDescending(a => a.DataCriacao)
                .ToListAsync();

            return await MontarAsync(lista);
        }

        private static StatusAnuncio LerStatus(string? texto, StatusAnuncio padrao)
        {
            if (string.IsNullOrWhiteSpace(texto)) return padrao;
            if (!Enum.TryParse<StatusAnuncio>(texto, true, out var status))
                throw new InvalidOperationException("Status inválido.");
            return status;
        }

        public async Task<AnuncioRespostaDto> CriarAsync(int contratanteId, AnuncioDto dto)
        {
            if (!await _context.Habilidades.AnyAsync(h => h.Id == dto.HabilidadeId))
                throw new InvalidOperationException("Categoria inválida.");

            var anuncio = new Anuncio
            {
                Titulo = dto.Titulo.Trim(),
                Descricao = dto.Descricao?.Trim() ?? string.Empty,
                ValorProposto = dto.ValorProposto,
                HabilidadeId = dto.HabilidadeId,
                Urgente = dto.Urgente,
                ContratanteId = contratanteId,
                Status = LerStatus(dto.Status, StatusAnuncio.Aberta)
            };

            _context.Anuncios.Add(anuncio);
            await _context.SaveChangesAsync();

            return await ObterAsync(anuncio.Id, null);
        }

        public async Task<AnuncioRespostaDto> AtualizarAsync(int contratanteId, int id, AnuncioDto dto)
        {
            var anuncio = await _context.Anuncios.FirstOrDefaultAsync(a => a.Id == id && a.ContratanteId == contratanteId)
                ?? throw new KeyNotFoundException("Vaga não encontrada.");

            if (!await _context.Habilidades.AnyAsync(h => h.Id == dto.HabilidadeId))
                throw new InvalidOperationException("Categoria inválida.");

            anuncio.Titulo = dto.Titulo.Trim();
            anuncio.Descricao = dto.Descricao?.Trim() ?? string.Empty;
            anuncio.ValorProposto = dto.ValorProposto;
            anuncio.HabilidadeId = dto.HabilidadeId;
            anuncio.Urgente = dto.Urgente;
            anuncio.Status = LerStatus(dto.Status, anuncio.Status);

            await _context.SaveChangesAsync();
            return await ObterAsync(id, null);
        }

        public async Task ExcluirAsync(int contratanteId, int id)
        {
            var anuncio = await _context.Anuncios.FirstOrDefaultAsync(a => a.Id == id && a.ContratanteId == contratanteId)
                ?? throw new KeyNotFoundException("Vaga não encontrada.");

            var candidaturas = await _context.Candidaturas.Where(c => c.AnuncioId == id).ToListAsync();
            _context.Candidaturas.RemoveRange(candidaturas);
            _context.Anuncios.Remove(anuncio);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new InvalidOperationException("Esta vaga está no portfólio de um freelancer. Altere o status para Cancelada em vez de excluir.");
            }
        }

        public async Task CandidatarAsync(int freelancerId, int anuncioId, CandidatarDto dto)
        {
            var anuncio = await _context.Anuncios.FirstOrDefaultAsync(a => a.Id == anuncioId)
                ?? throw new KeyNotFoundException("Vaga não encontrada.");

            if (anuncio.Status != StatusAnuncio.Aberta)
                throw new InvalidOperationException("Esta vaga não está mais aberta.");

            if (await _context.Candidaturas.AnyAsync(c => c.AnuncioId == anuncioId && c.FreelancerId == freelancerId))
                throw new InvalidOperationException("Você já se candidatou a esta vaga.");

            _context.Candidaturas.Add(new Candidatura
            {
                AnuncioId = anuncioId,
                FreelancerId = freelancerId,
                Mensagem = dto.Mensagem?.Trim()
            });

            await _context.SaveChangesAsync();
        }

        public async Task<List<MinhaCandidaturaDto>> MinhasCandidaturasAsync(int freelancerId)
        {
            var candidaturas = await _context.Candidaturas
                .AsNoTracking()
                .Where(c => c.FreelancerId == freelancerId)
                .OrderByDescending(c => c.DataCriacao)
                .ToListAsync();

            var ids = candidaturas.Select(c => c.AnuncioId).ToList();
            var anuncios = await Base().Where(a => ids.Contains(a.Id)).ToListAsync();
            var dtos = (await MontarAsync(anuncios, freelancerId)).ToDictionary(a => a.Id);

            return candidaturas
                .Where(c => dtos.ContainsKey(c.AnuncioId))
                .Select(c => new MinhaCandidaturaDto(c.Id, c.Status.ToString(), c.DataCriacao, dtos[c.AnuncioId]))
                .ToList();
        }

        public async Task<List<CandidaturaRespostaDto>> CandidaturasDaVagaAsync(int contratanteId, int anuncioId)
        {
            if (!await _context.Anuncios.AnyAsync(a => a.Id == anuncioId && a.ContratanteId == contratanteId))
                throw new KeyNotFoundException("Vaga não encontrada.");

            var lista = await _context.Candidaturas
                .AsNoTracking()
                .Include(c => c.Freelancer).ThenInclude(f => f.Endereco)
                .Include(c => c.Freelancer).ThenInclude(f => f.Habilidades)
                .Where(c => c.AnuncioId == anuncioId)
                .OrderByDescending(c => c.DataCriacao)
                .ToListAsync();

            return lista
                .Select(c => new CandidaturaRespostaDto(c.Id, c.Status.ToString(), c.DataCriacao, c.Mensagem, Mapeamento.ParaCandidato(c.Freelancer)))
                .ToList();
        }

        public async Task AtualizarStatusCandidaturaAsync(int contratanteId, int candidaturaId, string status)
        {
            if (!Enum.TryParse<StatusCandidatura>(status, true, out var novo) || novo == StatusCandidatura.Pendente)
                throw new InvalidOperationException("Status inválido. Use Aceita ou Recusada.");

            var candidatura = await _context.Candidaturas
                .Include(c => c.Anuncio)
                .FirstOrDefaultAsync(c => c.Id == candidaturaId && c.Anuncio.ContratanteId == contratanteId)
                ?? throw new KeyNotFoundException("Candidatura não encontrada.");

            candidatura.Status = novo;

            if (novo == StatusCandidatura.Aceita && candidatura.Anuncio.Status == StatusAnuncio.Aberta)
                candidatura.Anuncio.Status = StatusAnuncio.EmAndamento;

            await _context.SaveChangesAsync();
        }

        public async Task<List<AnuncioRespostaDto>> VagasConcluidasDoFreelancerAsync(int freelancerId)
        {
            var ids = await _context.Candidaturas
                .Where(c => c.FreelancerId == freelancerId && c.Status == StatusCandidatura.Aceita)
                .Select(c => c.AnuncioId)
                .ToListAsync();

            var lista = await Base()
                .Where(a => ids.Contains(a.Id) && a.Status == StatusAnuncio.Concluida)
                .OrderByDescending(a => a.DataCriacao)
                .ToListAsync();

            return await MontarAsync(lista);
        }
    }
}
