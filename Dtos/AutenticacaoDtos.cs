using System.ComponentModel.DataAnnotations;
using ConectaFree.Models;

namespace ConectaFree.Dtos
{
    // Login/cadastro com Google. Só "Credential" é obrigatório; os demais campos
    // são enviados na segunda chamada, quando o e-mail ainda não tem conta.
    public class GoogleLoginDto
    {
        [Required]
        public required string Credential { get; set; }

        [MaxLength(100)]
        public string? Nome { get; set; }

        public TipoUsuario? TipoUsuario { get; set; }

        [MaxLength(20)]
        public string? Telefone { get; set; }

        [MaxLength(14)]
        public string? Documento { get; set; }

        public bool? AceitouTermos { get; set; }
    }

    public class GoogleLoginResultado
    {
        public LoginResponseDto? Login { get; set; }
        public bool PrecisaCadastro { get; set; }
        public string? Nome { get; set; }
        public string? Email { get; set; }
    }

    public class EsqueciSenhaDto
    {
        [Required, EmailAddress]
        public required string Email { get; set; }
    }

    public class RedefinirSenhaDto
    {
        [Required]
        public required string Token { get; set; }

        [Required, MinLength(6)]
        public required string NovaSenha { get; set; }
    }
}
