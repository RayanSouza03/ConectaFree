using System;
using ConectaFree.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConectaFree.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ConectaFreeDbContext))]
    [Migration("20261015200000_AddServicoLocalAnuncio")]
    public partial class AddServicoLocalAnuncio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "DataServico",
                table: "Anuncios",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "UsarEnderecoEmpresa",
                table: "Anuncios",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "LocalBairro",
                table: "Anuncios",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocalCep",
                table: "Anuncios",
                type: "character varying(9)",
                maxLength: 9,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocalCidade",
                table: "Anuncios",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocalComplemento",
                table: "Anuncios",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocalEstado",
                table: "Anuncios",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocalLogradouro",
                table: "Anuncios",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocalNumero",
                table: "Anuncios",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "DataServico", table: "Anuncios");
            migrationBuilder.DropColumn(name: "UsarEnderecoEmpresa", table: "Anuncios");
            migrationBuilder.DropColumn(name: "LocalBairro", table: "Anuncios");
            migrationBuilder.DropColumn(name: "LocalCep", table: "Anuncios");
            migrationBuilder.DropColumn(name: "LocalCidade", table: "Anuncios");
            migrationBuilder.DropColumn(name: "LocalComplemento", table: "Anuncios");
            migrationBuilder.DropColumn(name: "LocalEstado", table: "Anuncios");
            migrationBuilder.DropColumn(name: "LocalLogradouro", table: "Anuncios");
            migrationBuilder.DropColumn(name: "LocalNumero", table: "Anuncios");
        }
    }
}
