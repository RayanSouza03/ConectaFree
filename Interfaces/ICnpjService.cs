namespace ConectaFree.Interfaces
{
    public record EnderecoCnpj(
        string Cep, string Logradouro, string Numero, string? Complemento,
        string Bairro, string Cidade, string Estado);

    public record DadosCnpj(
        string Cnpj, string RazaoSocial, string? NomeFantasia,
        string Situacao, bool Ativa, EnderecoCnpj Endereco);

    // Lançada quando a BrasilAPI está fora do ar / lenta (diferente de "CNPJ não existe")
    public class CnpjIndisponivelException : Exception
    {
        public CnpjIndisponivelException() : base("Serviço de consulta de CNPJ indisponível.") { }
    }

    public interface ICnpjService
    {
        // null = CNPJ não encontrado na Receita
        Task<DadosCnpj?> ConsultarAsync(string cnpj, CancellationToken ct = default);
    }
}
