using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tamagochi.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryConsumables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Consumables",
                table: "Inventories",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.InsertData(
                table: "ShopItems",
                columns: new[] { "Id", "Description", "Enabled", "PayloadJson", "Price", "Title", "Type" },
                values: new object[] { "med_kit", "+35 к здоровью", true, "{\"health\":35,\"mood\":5}", 35, "Аптечка", "medicine" }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "med_kit");

            migrationBuilder.DropColumn(
                name: "Consumables",
                table: "Inventories");
        }
    }
}
