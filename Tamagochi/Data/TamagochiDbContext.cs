using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Tamagochi.Models;

namespace Tamagochi.Data;

public class TamagochiDbContext : DbContext
{
    public TamagochiDbContext(DbContextOptions<TamagochiDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Tamagochi.Models.Tamagochi> Tamagochis => Set<Tamagochi.Models.Tamagochi>();
    public DbSet<Mission> Missions => Set<Mission>();
    public DbSet<MissionProgress> MissionProgresses => Set<MissionProgress>();
    public DbSet<FinanceSnapshot> FinanceSnapshots => Set<FinanceSnapshot>();
    public DbSet<PetProfile> PetProfiles => Set<PetProfile>();
    public DbSet<SavingsAccount> SavingsAccounts => Set<SavingsAccount>();

    // 👇 Новые таблицы
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<ShopItem> ShopItems => Set<ShopItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.PublicId)
            .IsUnique();

        // ключи новых сущностей
        modelBuilder.Entity<Wallet>().HasKey(x => x.UserId);
        modelBuilder.Entity<Inventory>().HasKey(x => x.UserId);
        modelBuilder.Entity<ShopItem>().HasKey(x => x.Id);
        modelBuilder.Entity<PetProfile>().HasKey(x => x.UserId);
        modelBuilder.Entity<SavingsAccount>().HasKey(x => x.UserId);

        // Inventory.Items как JSON
        modelBuilder.Entity<Inventory>()
            .Property(e => e.Items)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new()
            );

        // сид питомцев (как было)
        modelBuilder.Entity<Tamagochi.Models.Tamagochi>().HasData(
            new Tamagochi.Models.Tamagochi { Id = 1, Title = "Cat", Developer = "Nikita" },
            new Tamagochi.Models.Tamagochi { Id = 2, Title = "Dog", Developer = "Nikita" },
            new Tamagochi.Models.Tamagochi { Id = 3, Title = "Dragon", Developer = "Nikita" }
        );

        // сид миссий (как было)
        modelBuilder.Entity<Mission>().HasData(
            new Mission { Id = 1, Code = "DEPOSIT_6M", Title = "Открой вклад 6+ мес", Description = "Узнай про вклад на 6–12 месяцев и кликни на продукт", ProductTag = "deposit_6m", RewardCoins = 200, RewardXp = 150, Target = 1, Repeatable = false, RewardPetId = null },
            new Mission { Id = 2, Code = "SAVINGS_CUSHION", Title = "Финансовая подушка", Description = "Накопи 1× месячных расходов (демо-цель)", ProductTag = "long_savings", RewardCoins = 300, RewardXp = 200, Target = 3, Repeatable = true, RewardPetId = null },
            new Mission { Id = 3, Code = "ANTIFRAUD_TUTORIAL", Title = "Защита от мошенников", Description = "Пройди мини-урок по антифроду", ProductTag = "antifraud", RewardCoins = 200, RewardXp = 120, Target = 3, Repeatable = false, RewardPetId = "cat" },
            new Mission { Id = 4, Code = "WEEKLY_BUDGET", Title = "Неделя осознанных трат", Description = "Составь план покупок и отметь три дня без импульсивных трат", ProductTag = "weekly_budget", RewardCoins = 250, RewardXp = 200, Target = 3, Repeatable = true, RewardPetId = null }
        );

        // 💾 сид магазина
        modelBuilder.Entity<ShopItem>().HasData(
            new ShopItem { Id = "food_balanced_meal", Title = "Рацион \"Баланс инвестора\"", Price = 18, Type = "food", PayloadJson = "{\"satiety\":20}", Enabled = true },
            new ShopItem { Id = "food_energy_bowl", Title = "Боул \"Энергия рынка\"", Price = 32, Type = "food", PayloadJson = "{\"satiety\":45}", Enabled = true },
            new ShopItem { Id = "bg_city_lights", Title = "Фон: Городские огни", Price = 40, Type = "bg", PayloadJson = "{\"background\":\"city\"}", Enabled = true },
            new ShopItem { Id = "bg_cozy_home", Title = "Фон: Домашний уют", Price = 40, Type = "bg", PayloadJson = "{\"background\":\"cozy\"}", Enabled = true },
            new ShopItem { Id = "item_budget_planner", Title = "Гаджет \"Планировщик бюджета\"", Price = 28, Type = "item", PayloadJson = "{\"item\":\"planner\"}", Enabled = true },
            new ShopItem { Id = "item_travel_insurance", Title = "Папка \"Защита путешествий\"", Price = 35, Type = "item", PayloadJson = "{\"item\":\"travel_insurance\"}", Enabled = true }
        );

        modelBuilder.Entity<PetProfile>()
          .Property(e => e.OwnedPetIds)
          .HasConversion(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new()
  );
    }
}
