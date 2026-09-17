using System.ComponentModel.DataAnnotations;

namespace ConectaFree.Dtos
{
    public class FiltroVagaDto
    {
        public int? HabilidadeId { get; set; }
        public decimal? ValorMin { get; set; }
        public decimal? ValorMax { get; set; }
        public bool? Urgente { get; set; }

        [MaxLength(100)]
        public string? Cidade { get; set; }

        [MaxLength(2)]
        public string? Estado { get; set; }
    }
}
