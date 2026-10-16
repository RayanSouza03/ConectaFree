using ConectaFree.Models;

namespace ConectaFree.Dtos
{
    public static class Mapeamento
    {
        public static LocalDto? ParaLocal(Endereco? e) =>
            e == null ? null : new LocalDto(e.Cidade, e.Estado);

        public static LocalVagaDto? ParaLocalVaga(Endereco? e) =>
            e == null ? null : new LocalVagaDto(e.Bairro, e.Cidade, e.Estado);

        public static EnderecoRespostaDto? ParaEndereco(Endereco? e) =>
            e == null ? null : new EnderecoRespostaDto(e.Cep, e.Logradouro, e.Bairro, e.Cidade, e.Estado, e.Numero, e.Complemento);

        public static List<HabilidadeDto> ParaHabilidades(IEnumerable<Habilidade> hs) =>
            hs.Select(h => new HabilidadeDto(h.Id, h.Nome)).ToList();

        public static PerfilRespostaDto ParaPerfil(Usuario u) =>
            new(u.Id, u.Nome, u.Email, u.Telefone, u.Bio, u.FotoUrl, u.TipoUsuario,
                u.OutraHabilidade, ParaHabilidades(u.Habilidades), ParaEndereco(u.Endereco), u.Documento);

        public static PerfilPublicoDto ParaPublico(Usuario u) =>
            new(u.Id, u.Nome, u.Bio, u.FotoUrl, u.TipoUsuario,
                u.OutraHabilidade, ParaHabilidades(u.Habilidades), ParaLocal(u.Endereco));

        public static CandidatoDto ParaCandidato(Usuario u) =>
            new(u.Id, u.Nome, u.Email, u.Telefone, u.Bio, u.FotoUrl,
                u.Habilidades.FirstOrDefault()?.Nome ?? u.OutraHabilidade, ParaLocal(u.Endereco));

        public static LocalServicoDto ParaLocalServico(Anuncio a, bool completo)
        {
            if (a.UsarEnderecoEmpresa)
            {
                var e = a.Contratante.Endereco;
                return e == null
                    ? new LocalServicoDto(true, null, null, null, null, null, null, null)
                    : new LocalServicoDto(true,
                        completo ? e.Cep : null, completo ? e.Logradouro : null, completo ? e.Numero : null, completo ? e.Complemento : null,
                        e.Bairro, e.Cidade, e.Estado);
            }
            return new LocalServicoDto(false,
                completo ? a.LocalCep : null, completo ? a.LocalLogradouro : null, completo ? a.LocalNumero : null, completo ? a.LocalComplemento : null,
                a.LocalBairro, a.LocalCidade, a.LocalEstado);
        }

        public static AnuncioRespostaDto ParaAnuncio(Anuncio a, int total = 0, string? minhaCandidatura = null, bool completo = false) =>
            new(a.Id, a.Titulo, a.Descricao, a.ValorProposto, a.Urgente, a.Status.ToString(), a.DataCriacao,
                new HabilidadeDto(a.Habilidade.Id, a.Habilidade.Nome),
                new ContratanteResumoDto(a.Contratante.Id, a.Contratante.Nome, a.Contratante.FotoUrl, ParaLocalVaga(a.Contratante.Endereco)),
                total, minhaCandidatura, a.DataServico, ParaLocalServico(a, completo));

        public static PortfolioItemRespostaDto ParaPortfolio(PortfolioItem p) =>
            new(p.Id, p.Tipo.ToString(), p.Titulo, p.Descricao, p.FotoUrl, p.AnuncioId, p.DataCriacao);
    }
}
