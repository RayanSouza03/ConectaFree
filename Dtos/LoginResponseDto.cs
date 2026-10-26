using System.Runtime.CompilerServices;
using ConectaFree.Models;

namespace ConectaFree.Dtos
{
    public class LoginResponseDto
    {
        public required string Token { get; set; }
        public required string Nome { get; set; }
        public required string Email { get; set; }

        public required TipoUsuario TipoUsuario { get; set; }

        // true = a pessoa ainda não aceitou a versão atual dos Termos: o front exibe o aceite antes de liberar o sistema
        public bool PrecisaAceitarTermos { get; set; }
    }
}