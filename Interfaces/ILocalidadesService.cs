namespace ConectaFree.Interfaces
{
    public record EstadoDto(string Sigla, string Nome);
    public record CidadeDto(string Nome, string Uf);

    public class LocalidadesIndisponivelException : Exception
    {
        public LocalidadesIndisponivelException() : base("Serviço de localidades do IBGE indisponível.") { }
    }

    public interface ILocalidadesService
    {
        Task<List<EstadoDto>> EstadosAsync(CancellationToken ct = default);

        // uf nula/vazia = todas as cidades do país
        Task<List<CidadeDto>> CidadesAsync(string? uf, CancellationToken ct = default);
    }
}
