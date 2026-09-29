using ConectaFree.Models;

namespace ConectaFree.Dtos
{
    public record HabilidadeDto(int Id, string Nome);
    public record LocalDto(string Cidade, string Estado);
    public record EnderecoRespostaDto(string Cep, string Logradouro, string Bairro, string Cidade, string Estado, string Numero, string? Complemento);

    public record ContratanteResumoDto(int Id, string Nome, string? FotoUrl, LocalDto? Endereco);

    public record AnuncioRespostaDto(
        int Id, string Titulo, string Descricao, decimal ValorProposto, bool Urgente,
        string Status, DateTime DataCriacao, HabilidadeDto Habilidade,
        ContratanteResumoDto Contratante, int TotalCandidaturas, string? MinhaCandidatura);

    public record PerfilRespostaDto(
        int Id, string Nome, string Email, string Telefone, string? Bio, string? FotoUrl,
        TipoUsuario TipoUsuario, string? OutraHabilidade, List<HabilidadeDto> Habilidades,
        EnderecoRespostaDto? Endereco, string Documento);

    public record PerfilPublicoDto(
        int Id, string Nome, string? Bio, string? FotoUrl, TipoUsuario TipoUsuario,
        string? OutraHabilidade, List<HabilidadeDto> Habilidades, LocalDto? Endereco);

    public record CandidatoDto(int Id, string Nome, string Email, string Telefone, string? Bio,
        string? FotoUrl, string? Funcao, LocalDto? Endereco);

    public record CandidaturaRespostaDto(int Id, string Status, DateTime DataCriacao, string? Mensagem, CandidatoDto Freelancer);

    public record MinhaCandidaturaDto(int Id, string Status, DateTime DataCriacao, AnuncioRespostaDto Anuncio);

    public record PortfolioItemRespostaDto(int Id, string Tipo, string Titulo, string? Descricao,
        string? FotoUrl, int? AnuncioId, DateTime DataCriacao);
}
