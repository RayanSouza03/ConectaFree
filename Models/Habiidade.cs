using System.ComponentModel.DataAnnotations;

namespace ConectaFree.Models
{
    public class Habilidade
    {
        public int Id { get; set; }

        [MaxLength(50)]
        public required string Nome { get; set; }
    }
}
