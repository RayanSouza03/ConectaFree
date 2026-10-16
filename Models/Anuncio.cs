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

        // Dia em que o serviço acontece
        public DateOnly? DataServico { get; set; }

        // true: o serviço é no endereço do contratante; false: usa os campos Local* abaixo
        public bool UsarEnderecoEmpresa { get; set; } = true;

        [MaxLength(9)] public string? LocalCep { get; set; }
        [MaxLength(150)] public string? LocalLogradouro { get; set; }
        [MaxLength(20)] public string? LocalNumero { get; set; }
        [MaxLength(100)] public string? LocalComplemento { get; set; }
        [MaxLength(100)] public string? LocalBairro { get; set; }
        [MaxLength(100)] public string? LocalCidade { get; set; }
        [MaxLength(2)] public string? LocalEstado { get; set; }
    }
}