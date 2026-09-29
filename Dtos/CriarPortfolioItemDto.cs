using System.ComponentModel.DataAnnotations;
using ConectaFree.Models;

namespace ConectaFree.Dtos
{
    public class CriarPortfolioItemDto
    {
        [Required]
        public required TipoPortfolioItem Tipo { get; set; }

        [MaxLength(150)]
        public string? Titulo { get; set; }

        [MaxLength(2000)]
        public string? Descricao { get; set; }

        public IFormFile? Foto { get; set; }

        public int? AnuncioId { get; set; }
    }
}
