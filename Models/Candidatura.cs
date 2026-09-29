using System.ComponentModel.DataAnnotations;

namespace ConectaFree.Models
{
    public enum StatusCandidatura
    {
        Pendente,
        Aceita,
        Recusada
    }

    public class Candidatura
    {
        public int Id { get; set; }

        public int AnuncioId { get; set; }
        public Anuncio Anuncio { get; set; } = null!;

        public int FreelancerId { get; set; }
        public Usuario Freelancer { get; set; } = null!;

        [MaxLength(1000)]
        public string? Mensagem { get; set; }

        public StatusCandidatura Status { get; set; } = StatusCandidatura.Pendente;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    }
}
