using System.ComponentModel.DataAnnotations;

namespace ConectaFree.Dtos
{
    // Usado para criar e para editar uma vaga
    public class AnuncioDto
    {
        [Required, MaxLength(150)]
        public required string Titulo { get; set; }

        [MaxLength(2000)]
        public string? Descricao { get; set; }

        [Range(0, 100000000)]
        public decimal ValorProposto { get; set; }

        [Required]
        public int HabilidadeId { get; set; }

        public bool Urgente { get; set; }

        // Dia do serviço (yyyy-MM-dd)
        public DateOnly? DataServico { get; set; }

        // true = endereço cadastrado do contratante; false = usa LocalVaga
        public bool UsarEnderecoEmpresa { get; set; } = true;
        public LocalVagaEntradaDto? LocalVaga { get; set; }

        // Aberta | EmAndamento | Concluida | Cancelada (opcional; padrão Aberta na criação)
        public string? Status { get; set; }
    }

    public class LocalVagaEntradaDto
    {
        [MaxLength(9)] public string? Cep { get; set; }
        [MaxLength(150)] public string? Logradouro { get; set; }
        [MaxLength(20)] public string? Numero { get; set; }
        [MaxLength(100)] public string? Complemento { get; set; }
        [MaxLength(100)] public string? Bairro { get; set; }
        [MaxLength(100)] public string? Cidade { get; set; }
        [MaxLength(2)] public string? Estado { get; set; }
    }

    public class CandidatarDto
    {
        [MaxLength(1000)]
        public string? Mensagem { get; set; }
    }

    public class AtualizarStatusCandidaturaDto
    {
        // Aceita | Recusada
        [Required]
        public required string Status { get; set; }
    }
}
