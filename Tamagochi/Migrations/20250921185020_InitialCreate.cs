using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tamagochi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tamagochies");

            migrationBuilder.CreateTable(
                name: "Tamagochis",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Developer = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tamagochis", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Tamagochis",
                columns: new[] { "Id", "Developer", "Title" },
                values: new object[,]
                {
                    { 1, "Nikita", "Cat" },
                    { 2, "Nikita", "Dog" },
                    { 3, "Nikita", "Dragon" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tamagochis");

            migrationBuilder.CreateTable(
                name: "Tamagochies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Developer = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tamagochies", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Tamagochies",
                columns: new[] { "Id", "Developer", "Title" },
                values: new object[,]
                {
                    { 1, "Nikita", "Cat" },
                    { 2, "Nikita", "dOG" },
                    { 3, "Nikita", "Dragon" }
                });
        }
    }
}
