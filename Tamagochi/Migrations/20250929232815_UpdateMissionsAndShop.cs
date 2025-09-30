using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tamagochi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMissionsAndShop : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.UpdateData(
                table: "Missions",
                keyColumn: "Id",
                keyValue: 3,
                column: "Target",
                value: 3);

            migrationBuilder.UpdateData(
                table: "Missions",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Code", "Description", "ProductTag", "Repeatable", "RewardCoins", "RewardPetId", "RewardXp", "Target", "Title" },
                values: new object[] { "WEEKLY_BUDGET", "Составь план покупок и отметь три дня без импульсивных трат", "weekly_budget", true, 250, null, 200, 3, "Неделя осознанных трат" });

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.UpdateData(
                table: "Missions",
                keyColumn: "Id",
                keyValue: 3,
                column: "Target",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Missions",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Code", "Description", "ProductTag", "Repeatable", "RewardCoins", "RewardPetId", "RewardXp", "Target", "Title" },
                values: new object[] { "INVEST_PARROT", "Запусти инвестиционную копилку и сделай первое пополнение", "invest_piggy", false, 350, "parrot", 240, 1, "Инвесткопилка" });

            migrationBuilder.InsertData(
                table: "ShopItems",
                columns: new[] { "Id", "Enabled", "PayloadJson", "Price", "Title", "Type" },
                values: new object[,]
                {
                    { "ball", true, "{\"item\":\"ball\"}", 20, "Мячик", "item" },
                    { "bg_room", true, "{\"background\":\"room\"}", 30, "Фон: Комната", "bg" },
                    { "bg_sky", true, "{\"background\":\"sky\"}", 30, "Фон: Небо", "bg" },
                    { "food_big", true, "{\"satiety\":40}", 25, "Корм (бол.)", "food" },
                    { "food_small", true, "{\"satiety\":15}", 10, "Корм (мал.)", "food" },
                    { "pet_cat", false, "{\"petId\":\"cat\"}", 500, "Открыть кота", "pet" },
                    { "pet_dragon", false, "{\"petId\":\"dragon\"}", 1500, "Открыть дракона", "pet" }
                });
        }
    }
}
