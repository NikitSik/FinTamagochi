using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tamagochi.Migrations
{
    /// <inheritdoc />
    public partial class AddParrotCompanion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RewardPetId",
                table: "Missions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RewardClaimed",
                table: "MissionProgresses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Missions",
                keyColumn: "Id",
                keyValue: 1,
                column: "RewardPetId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Missions",
                keyColumn: "Id",
                keyValue: 2,
                column: "RewardPetId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Missions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "RewardCoins", "RewardPetId", "RewardXp" },
                values: new object[] { 200, "cat", 120 });

            migrationBuilder.InsertData(
                table: "Missions",
                columns: new[] { "Id", "Code", "Description", "ProductTag", "Repeatable", "RewardCoins", "RewardPetId", "RewardXp", "Target", "Title" },
                values: new object[] { 4, "INVEST_PARROT", "Запусти инвестиционную копилку и сделай первое пополнение", "invest_piggy", false, 350, "parrot", 240, 1, "Инвесткопилка" });

            migrationBuilder.UpdateData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "pet_cat",
                column: "Enabled",
                value: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Missions",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DropColumn(
                name: "RewardPetId",
                table: "Missions");

            migrationBuilder.DropColumn(
                name: "RewardClaimed",
                table: "MissionProgresses");

            migrationBuilder.UpdateData(
                table: "Missions",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "RewardCoins", "RewardXp" },
                values: new object[] { 150, 100 });

            migrationBuilder.UpdateData(
                table: "ShopItems",
                keyColumn: "Id",
                keyValue: "pet_cat",
                column: "Enabled",
                value: true);
        }
    }
}
