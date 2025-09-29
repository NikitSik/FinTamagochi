using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tamagochi.Migrations
{
    /// <inheritdoc />
    public partial class AddMissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FinanceSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Income = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Expenses = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SavingsRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceSnapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MissionProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MissionId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Counter = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MissionProgresses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Missions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProductTag = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RewardCoins = table.Column<int>(type: "int", nullable: false),
                    RewardXp = table.Column<int>(type: "int", nullable: false),
                    Target = table.Column<int>(type: "int", nullable: false),
                    Repeatable = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Missions", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Missions",
                columns: new[] { "Id", "Code", "Description", "ProductTag", "Repeatable", "RewardCoins", "RewardXp", "Target", "Title" },
                values: new object[,]
                {
                    { 1, "DEPOSIT_6M", "Узнай про вклад на 6–12 месяцев и кликни на продукт", "deposit_6m", false, 200, 150, 1, "Открой вклад 6+ мес" },
                    { 2, "SAVINGS_CUSHION", "Накопи 1× месячных расходов (демо-цель) — импортируй выписку или нажми шаг", "long_savings", true, 300, 200, 3, "Финансовая подушка" },
                    { 3, "ANTIFRAUD_TUTORIAL", "Пройди мини-урок по антифроду (демо: кнопка 'пройдено')", "antifraud", false, 150, 100, 1, "Защита от мошенников" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FinanceSnapshots");

            migrationBuilder.DropTable(
                name: "MissionProgresses");

            migrationBuilder.DropTable(
                name: "Missions");
        }
    }
}
