namespace ConectaFree.Dtos
{
    public class EnderecoDto
    {
        public required string Cep { get; set; }
        public required string Logradouro {get; set; }
        public required string Bairro { get; set; }
        public required string cidade { get; set; }
    }
}