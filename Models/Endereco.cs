using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.SignalR;

namespace ConectaFree.Models
{
    public class Endereco
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(9)]
        public required string Cep { get; set; }

        [MaxLength(150)]
        public required string Logradouro { get; set;}

        [MaxLength(100)]
        public required string Bairro  { get; set;}

        [MaxLength (100)]
        public required string Cidade { get; set;}

        [MaxLength (2)]
        public required string Estado { get; set;}

        [MaxLength (20)]
        public required string Numero { get; set;}

        [MaxLength (100)]
        public required string? Complemento { get; set;}

        public int UsuarioId { get; set;}
        public Usuario Usuario {get; set;}
    }
}