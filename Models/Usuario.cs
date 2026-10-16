using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ConectaFree.Models
{
    public class Usuario
    {
        public List<Habilidade> Habilidades { get; set; } = new();

        [MaxLength(200)]
        public string? OutraHabilidade { get; set; }  
        public int Id { get; set; }

        [MaxLength(100)]
        public required string Nome { get; set; }

        [MaxLength(100)]
        public required string Email { get; set; }

        [JsonIgnore]
        [MaxLength(255)]
        public required string SenhaHash { get; set; }

        [MaxLength(20)]
        public required string Telefone { get; set; }

        [JsonIgnore]
        [MaxLength(14)]
        public required string Documento { get; set; }

        [MaxLength(500)]
        public string? Bio { get; set; }

        [MaxLength(300)]
        public string? FotoUrl { get; set; }

        public required TipoUsuario TipoUsuario { get; set; }

        public bool AceitouTermos  { get; set; } = false;
        public DateTime? DataAceiteTermos { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public DateTime? DataAtualizacao { get; set; }

        public Endereco? Endereco { get; set; }

    }
}