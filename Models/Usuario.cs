using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.SignalR;

namespace ConectaFree.Models
{
    public class Usuario
    {
        public int Id { get; set; }

        [MaxLength(100)]
        public required string Nome { get; set; }

        [MaxLength(100)]
        public required string Email { get; set; }

        [MaxLength(255)]
        public required string SenhaHash { get; set; }

        [MaxLength(20)]
        public required string Telefone { get; set; }

        public required TipoUsuario TipoUsuario { get; set; }

        public bool AceitouTermos  { get; set; } = false;
        public DateTime? DataAceiteTermos { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public DateTime? DataAtualizacao { get; set; }

        public Endereco? Endereco { get; set; }

    }
}