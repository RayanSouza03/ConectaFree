using System.ComponentModel.DataAnnotations;

namespace ConectaFree.Dtos
{
    public class AtualizarPerfilDto
    {
        [MaxLength(100)]
        public string? Nome { get; set; }

        [MaxLength(20)]
        public string? Telefone { get; set; }

        [MaxLength(500)]
        public string? Bio { get; set; }

        [MaxLength(300)]
        public string? FotoUrl { get; set; }

        [MaxLength(200)]
        public string? OutraHabilidade { get; set; }

        public List<int>? HabilidadeIds { get; set; }

        public EnderecoDto? Endereco { get; set; }

        public bool RemoverFoto { get; set; }
    }
}