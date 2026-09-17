using System.ComponentModel.DataAnnotations;

namespace ConectaFree.Models
{
    public enum StatusAnuncio
    {
        Aberta,
        EmAndamento,
        Concluida,
        Cancelada
    }
    public class Anuncio
    {
        public int Id { get; set; }

        [MaxLength(150)]
        public required string Titulo { get; set; }

        [MaxLength(2000)]
        public required string Descricao { get; set; }
        public decimal ValorProposto { get; set; }
        public int HabilidadeId { get; set; }
        public Habilidade Habilidade { get; set; } = null!;

        public int ContratanteId { get; set; } 
        public Usuario Contratante { get; set; } = null!;

        public StatusAnuncio Status { get; set; } = StatusAnuncio.Aberta;

        public bool Urgente { get; set; } = false;
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    }
}