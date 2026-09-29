using ConectaFree.Dtos;

namespace ConectaFree.Interfaces
{
    public interface IAnuncioService
    {
        Task<List<AnuncioRespostaDto>> FiltrarAsync(FiltroVagaDto filtro);
        Task<AnuncioRespostaDto> ObterAsync(int id, int? freelancerId);
        Task<List<AnuncioRespostaDto>> ListarDoContratanteAsync(int contratanteId);
        Task<AnuncioRespostaDto> CriarAsync(int contratanteId, AnuncioDto dto);
        Task<AnuncioRespostaDto> AtualizarAsync(int contratanteId, int id, AnuncioDto dto);
        Task ExcluirAsync(int contratanteId, int id);

        Task CandidatarAsync(int freelancerId, int anuncioId, CandidatarDto dto);
        Task<List<MinhaCandidaturaDto>> MinhasCandidaturasAsync(int freelancerId);
        Task<List<CandidaturaRespostaDto>> CandidaturasDaVagaAsync(int contratanteId, int anuncioId);
        Task AtualizarStatusCandidaturaAsync(int contratanteId, int candidaturaId, string status);
        Task<List<AnuncioRespostaDto>> VagasConcluidasDoFreelancerAsync(int freelancerId);
    }
}
