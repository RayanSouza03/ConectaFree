using Microsoft.EntityFrameworkCore;
using ConectaFree.Models;


namespace ConectaFree.Data
{
    
    public class ConectaFreeDbContext : DbContext
    {
       
        public ConectaFreeDbContext(DbContextOptions<ConectaFreeDbContext> options)
            : base(options) { }

        
        public DbSet<Usuario> Usuarios { get; set; }

        public DbSet<Endereco> Enderecos { get; set; }
        
    }
}