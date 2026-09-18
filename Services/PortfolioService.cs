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
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public PortfolioService(ConectaFreeDbContext context, IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
            _config = config;
        }

        public async Task<PortfolioItem> CriarAsync(int usuarioId, CriarPortfolioItemDto dto)
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
                item.FotoUrl = await SubirFotoAsync(dto.Foto, usuarioId);
            }
            else
            {
                if (dto.AnuncioId == null)
                    throw new InvalidOperationException("Informe a vaga.");

                var anuncio = await _context.Anuncios.FirstOrDefaultAsync(a => a.Id == dto.AnuncioId.Value);
                if (anuncio == null)
                    throw new InvalidOperationException("Vaga não encontrada.");

                if (anuncio.Status != StatusAnuncio.Concluida)
                    throw new InvalidOperationException("Só é possível adicionar vagas concluídas ao portfólio.");

                item.AnuncioId = anuncio.Id;
                item.Titulo = string.IsNullOrWhiteSpace(dto.Titulo) ? anuncio.Titulo : dto.Titulo;
                item.Descricao = dto.Descricao ?? anuncio.Descricao;
            }

            _context.PortfolioItens.Add(item);
            await _context.SaveChangesAsync();

            return item;
        }

        public async Task<List<PortfolioItem>> ListarPorUsuarioAsync(int usuarioId)
        {
            return await _context.PortfolioItens
                .Include(p => p.Anuncio)
                .Where(p => p.UsuarioId == usuarioId)
                .OrderByDescending(p => p.DataCriacao)
                .ToListAsync();
        }

        private async Task<string> SubirFotoAsync(IFormFile foto, int usuarioId)
        {
            var supabaseUrl = _config["Supabase:Url"];
            var serviceKey = _config["Supabase:ServiceRoleKey"];
            var bucket = _config["Supabase:Bucket"];

            var caminho = $"{usuarioId}/{Guid.NewGuid()}_{foto.FileName}";
            var uploadUrl = $"{supabaseUrl}/storage/v1/object/{bucket}/{caminho}";

            using var stream = foto.OpenReadStream();
            using var content = new StreamContent(stream);
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(foto.ContentType);

            using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
            request.Headers.Add("Authorization", $"Bearer {serviceKey}");
            request.Content = content;

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var erro = await response.Content.ReadAsStringAsync();
                throw new InvalidOperationException($"Falha ao subir foto: {erro}");
            }

            return $"{supabaseUrl}/storage/v1/object/public/{bucket}/{caminho}";
        }
    }
}