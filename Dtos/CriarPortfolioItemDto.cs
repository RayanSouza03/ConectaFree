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

        // Obrigatório só quando Tipo == Foto
        public IFormFile? Foto { get; set; }

        // Obrigatório só quando Tipo == Vaga
        public int? AnuncioId { get; set; }
    }
}