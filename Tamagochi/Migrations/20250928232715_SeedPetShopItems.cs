using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tamagochi.Migrations
{
    /// <inheritdoc />
    public partial class SeedPetShopItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OwnedPets",
                table: "Inventories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "SelectedPetId",
                table: "Inventories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.InsertData(
                table: "ShopItems",
                columns: new[] { "Id", "Enabled", "PayloadJson", "Price", "Title", "Type" },
                values: new object[,]
                {
                    { "pet_cat", true, "{\"petId\":\"cat\"}", 500, "Открыть кота", "pet" },
                    { "pet_dragon", false, "{\"petId\":\"dragon\"}", 1500, "Открыть дракона", "pet" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "pet_cat");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "pet_dragon");

            migrationBuilder.DropColumn(
                name: "OwnedPets",
                table: "Inventories");

            migrationBuilder.DropColumn(
                name: "SelectedPetId",
                table: "Inventories");
        }
    }
}
