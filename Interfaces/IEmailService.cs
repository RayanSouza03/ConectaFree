namespace ConectaFree.Interfaces
{
    public interface IEmailService
    {
        // Envia e devolve se deu certo (nunca lança exceção)
        Task<bool> EnviarAsync(string para, string? nomeDestino, string assunto, string html, CancellationToken ct = default);

        // Dispara em segundo plano: a requisição do usuário não espera o provedor de e-mail
        void Enfileirar(string para, string? nomeDestino, string assunto, string html);
    }
}
