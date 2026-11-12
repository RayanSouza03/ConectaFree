using ConectaFree.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConectaFree.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ConectaFreeDbContext))]
    [Migration("20261112180000_AddQuantidadePessoasAnuncio")]
    public partial class AddQuantidadePessoasAnuncio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Vagas que já existem continuam precisando de 1 pessoa (comportamento de antes)
            migrationBuilder.AddColumn<int>(
                name: "QuantidadePessoas",
                table: "Anuncios",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "QuantidadePessoas", table: "Anuncios");
        }
    }
}
