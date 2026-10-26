using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConectaFree.Migrations
{
    /// <inheritdoc />
    public partial class AddVersaoTermos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VersaoTermosAceita",
                table: "Usuarios",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VersaoTermosAceita",
                table: "Usuarios");
        }
    }
}
