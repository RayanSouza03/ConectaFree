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

public DbSet<Habilidade> Habilidades { get; set; }

public DbSet<Anuncio> Anuncios { get; set; }
public DbSet<PortfolioItem> PortfolioItens { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Habilidade>().HasData(
            new Habilidade { Id = 1, Nome = "Design gráfico" },
            new Habilidade { Id = 2, Nome = "Ilustração" },
            new Habilidade { Id = 3, Nome = "Social media" },
            new Habilidade { Id = 4, Nome = "Programação" },
            new Habilidade { Id = 5, Nome = "Babá" },
            new Habilidade { Id = 6, Nome = "Garçom" },
            new Habilidade { Id = 7, Nome = "Marketing digital" },
            new Habilidade { Id = 8, Nome = "Edição de vídeo" },
            new Habilidade { Id = 9, Nome = "Fotografia" },
            new Habilidade { Id = 10, Nome = "UI/UX Design" },
            new Habilidade { Id = 11, Nome = "Desenvolvimento Web" },
            new Habilidade { Id = 12, Nome = "Desenvolvimento Mobile" },
            new Habilidade { Id = 13, Nome = "Consultoria" },
            new Habilidade { Id = 14, Nome = "Contabilidade" },
            new Habilidade { Id = 15, Nome = "Advocacia" },
            new Habilidade { Id = 16, Nome = "Arquitetura" },
            new Habilidade { Id = 17, Nome = "Engenharia" },
            new Habilidade { Id = 18, Nome = "Professor particular" },
            new Habilidade { Id = 19, Nome = "Cuidador de idosos" },
            new Habilidade { Id = 20, Nome = "Pintor" },
            new Habilidade { Id = 21, Nome = "Eletricista" },
            new Habilidade { Id = 22, Nome = "Encanador" },
            new Habilidade { Id = 23, Nome = "Cuidador de pet" },
            new Habilidade { Id = 24, Nome = "Bartender" },
            new Habilidade { Id = 25, Nome = "Jardineiro" }
        );

        modelBuilder.Entity<Usuario>()
        .HasIndex(u => u.Documento)
        .IsUnique();
    }
}
}