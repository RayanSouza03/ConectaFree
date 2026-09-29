using System.ComponentModel.DataAnnotations;

namespace ConectaFree.Models
{
    public enum TipoPortfolioItem
    {
        Foto,
        Vaga
    }

    public class PortfolioItem
    {
        public int Id { get; set; }

        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        public TipoPortfolioItem Tipo { get; set; }

        [MaxLength(150)]
        public required string Titulo { get; set; }

        [MaxLength(2000)]
        public string? Descricao { get; set; }

        [MaxLength(500)]
        public string? FotoUrl { get; set; }

        public int? AnuncioId { get; set; }
        public Anuncio? Anuncio { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    }
}
