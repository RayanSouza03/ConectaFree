using System.ComponentModel.DataAnnotations;
using ConectaFree.Models;
namespace ConectaFree.Dtos
{
    public class CadastroUsuarioDto
    {
        [Required]
        [MaxLength(100)]
        public required string Nome { get; set; }

        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        [MinLength(6)]
        public required string Senha { get; set; }

        [Required]
        [MaxLength(20)]
        public required string Telefone { get; set; }

        [Required]
        [MaxLength(14)]
        public required string Documento { get; set; }

        [Required]
        public required TipoUsuario TipoUsuario { get; set; }

        [Required]
        public required bool AceitouTermos { get; set; }

    }
}
