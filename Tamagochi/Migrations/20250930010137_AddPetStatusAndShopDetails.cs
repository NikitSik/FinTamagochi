using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tamagochi.Migrations
{
    /// <inheritdoc />
    public partial class AddPetStatusAndShopDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "bg_city_lights");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "bg_cozy_home");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "food_balanced_meal");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "food_energy_bowl");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "item_budget_planner");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "item_travel_insurance");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ShopItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PetStatuses",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Mood = table.Column<int>(type: "int", nullable: false),
                    Satiety = table.Column<int>(type: "int", nullable: false),
                    Health = table.Column<int>(type: "int", nullable: false),
                    LastUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastFedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastPlayedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastHealedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PetStatuses", x => x.UserId);
                });

            migrationBuilder.InsertData(
                table: "ShopItems",
                columns: new[] { "Id", "Description", "Enabled", "PayloadJson", "Price", "Title", "Type" },
                values: new object[,]
                {
                    { "ball", "Игра повышает настроение", true, "{\"item\":\"ball\"}", 20, "Мячик", "item" },
                    { "bg_room", "Уютное убежище", true, "{\"background\":\"room\"}", 30, "Фон: Комната", "bg" },
                    { "bg_sky", "Лёгкие облака", true, "{\"background\":\"sky\"}", 30, "Фон: Небо", "bg" },
                    { "food_big", "+40 к сытости", true, "{\"satiety\":40,\"mood\":5}", 25, "Корм (бол.)", "food" },
                    { "food_small", "+15 к сытости", true, "{\"satiety\":15}", 10, "Корм (мал.)", "food" },
                    { "pet_cat", "Компаньон с миссии", false, "{\"petId\":\"cat\"}", 500, "Открыть кота", "pet" },
                    { "pet_dragon", "Эпический друг", false, "{\"petId\":\"dragon\"}", 1500, "Открыть дракона", "pet" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PetStatuses");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "ball");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "bg_room");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "bg_sky");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "food_big");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "food_small");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "pet_cat");

            migrationBuilder.DeleteData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "pet_dragon");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "ShopItems");

            migrationBuilder.InsertData(
                table: "ShopItems",
                columns: new[] { "Id", "Enabled", "PayloadJson", "Price", "Title", "Type" },
                values: new object[,]
                {
                    { "bg_city_lights", true, "{\"background\":\"city\"}", 40, "Фон: Городские огни", "bg" },
                    { "bg_cozy_home", true, "{\"background\":\"cozy\"}", 40, "Фон: Домашний уют", "bg" },
                    { "food_balanced_meal", true, "{\"satiety\":20}", 18, "Рацион \"Баланс инвестора\"", "food" },
                    { "food_energy_bowl", true, "{\"satiety\":45}", 32, "Боул \"Энергия рынка\"", "food" },
                    { "item_budget_planner", true, "{\"item\":\"planner\"}", 28, "Гаджет \"Планировщик бюджета\"", "item" },
                    { "item_travel_insurance", true, "{\"item\":\"travel_insurance\"}", 35, "Папка \"Защита путешествий\"", "item" }
                });
        }
    }
}
