namespace ConectaFree.Services
{
    public static class DocumentoValidador
    {
        public static string Digitos(string? texto) =>
            new string((texto ?? string.Empty).Where(char.IsDigit).ToArray());

        // Valida o formato e os dois dígitos verificadores (não consulta a Receita)
        public static bool CnpjValido(string? cnpj)
        {
            var d = Digitos(cnpj);
            if (d.Length != 14 || d.Distinct().Count() == 1) return false;

            int[] pesos1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] pesos2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

            return DigitoVerificador(d, pesos1) == d[12] - '0'
                && DigitoVerificador(d, pesos2) == d[13] - '0';
        }

        private static int DigitoVerificador(string digitos, int[] pesos)
        {
            var soma = 0;
            for (var i = 0; i < pesos.Length; i++)
                soma += (digitos[i] - '0') * pesos[i];

            var resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        }
    }
}
