using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace ConectaFree.Services
{
    public static class FiltroPalavras
    {
        private static readonly string[] Longas =
        {
            "porra", "caralho", "buceta", "bosta", "merda", "foder", "fodase", "fodido", "punheta", "puta", "putaria",
            "viado", "viadinho", "bicha", "sapatao", "arrombado", "cuzao", "escroto", "babaca", "otario", "imbecil",
            "idiota", "retardado", "mongoloide", "vagabundo", "vagabunda", "vadia", "piranha", "corno", "desgraca",
            "desgracado", "filhadaputa", "filhodaputa", "fdp", "vsf", "pqp", "cacete", "cassete", "xoxota", "xereca",
            "pirocao", "piroca", "rola", "nazista", "nazismo", "hitler", "macaco", "crioulo", "neguinho", "preto fedido",
            "estupro", "estuprador", "pedofilo", "pedofilia", "terrorista", "genocidio", "cocaina", "maconha", "crack",
            "traficante", "assassino", "assassinato", "sexo", "porn", "pornografia", "prostituta", "prostituicao"
        };

        private static readonly HashSet<string> Curtas = new() { "cu", "pau", "pica", "tnc", "kct", "fdp" };

        private static string Normalizar(string texto)
        {
            var d = texto.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var c in d)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
                sb.Append(c switch { '0' => 'o', '1' => 'i', '3' => 'e', '4' => 'a', '5' => 's', '7' => 't', '@' => 'a', '$' => 's', _ => char.ToLowerInvariant(c) });
            }
            return sb.ToString();
        }

        public static bool Contem(string? texto)
        {
            if (string.IsNullOrWhiteSpace(texto)) return false;
            var n = Normalizar(texto);
            var colado = Regex.Replace(n, "[^a-z]", "");
            var tokens = Regex.Split(n, "[^a-z]+").Where(t => t.Length > 0);

            if (tokens.Any(t => Curtas.Contains(t))) return true;
            foreach (var p in Longas)
            {
                var alvo = p.Replace(" ", "");
                if (tokens.Any(t => t == alvo || (alvo.Length >= 5 && t.Contains(alvo)))) return true;
                if (alvo.Length >= 6 && colado.Contains(alvo)) return true;
            }
            return false;
        }

        public static string? ValidarCategoria(string? nome)
        {
            var n = (nome ?? "").Trim();
            if (n.Length < 2 || n.Length > 40) return "A categoria deve ter de 2 a 40 caracteres.";
            if (!Regex.IsMatch(n, @"^[\p{L}\p{N}][\p{L}\p{N} /&+\-\.]*$")) return "Use apenas letras, números e espaços na categoria.";
            if (Contem(n)) return "Esse termo não é permitido. Escolha um nome de categoria adequado.";
            return null;
        }
    }
}
