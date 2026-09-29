using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814

namespace ConectaFree.Migrations
{
    public partial class AddOutraHabilidade : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OutraHabilidade",
                table: "Usuarios",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Habilidades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Habilidades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Habilidades_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Habilidades",
                columns: new[] { "Id", "Nome", "UsuarioId" },
                values: new object[,]
                {
                    { 1, "Design gráfico", null },
                    { 2, "Ilustração", null },
                    { 3, "Social media", null },
                    { 4, "Programação", null },
                    { 5, "Babá", null },
                    { 6, "Garçom", null },
                    { 7, "Marketing digital", null },
                    { 8, "Edição de vídeo", null },
                    { 9, "Fotografia", null },
                    { 10, "UI/UX Design", null },
                    { 11, "Desenvolvimento Web", null },
                    { 12, "Desenvolvimento Mobile", null },
                    { 13, "Consultoria", null },
                    { 14, "Contabilidade", null },
                    { 15, "Advocacia", null },
                    { 16, "Arquitetura", null },
                    { 17, "Engenharia", null },
                    { 18, "Professor particular", null },
                    { 19, "Cuidador de idosos", null },
                    { 20, "Pintor", null },
                    { 21, "Eletricista", null },
                    { 22, "Encanador", null },
                    { 23, "Cuidador de pet", null },
                    { 24, "Bartender", null },
                    { 25, "Jardineiro", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Habilidades_UsuarioId",
                table: "Habilidades",
                column: "UsuarioId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Habilidades");

            migrationBuilder.DropColumn(
                name: "OutraHabilidade",
                table: "Usuarios");
        }
    }
}
