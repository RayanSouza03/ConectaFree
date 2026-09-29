using System.ComponentModel.DataAnnotations;

namespace ConectaFree.Dtos
{
    public class AnuncioDto
    {
        [Required, MaxLength(150)]
        public required string Titulo { get; set; }

        [MaxLength(2000)]
        public string? Descricao { get; set; }

        [Range(0, 100000000)]
        public decimal ValorProposto { get; set; }

        [Required]
        public int HabilidadeId { get; set; }

        public bool Urgente { get; set; }

        public string? Status { get; set; }
    }

    public class CandidatarDto
    {
        [MaxLength(1000)]
        public string? Mensagem { get; set; }
    }

    public class AtualizarStatusCandidaturaDto
    {
        [Required]
        public required string Status { get; set; }
    }
}
