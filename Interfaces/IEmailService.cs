namespace ConectaFree.Interfaces
{
    public interface IEmailService
    {
        Task<bool> EnviarAsync(string para, string? nomeDestino, string assunto, string html, CancellationToken ct = default);

        void Enfileirar(string para, string? nomeDestino, string assunto, string html);
    }
}
