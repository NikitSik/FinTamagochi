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
    public DbSet<PetStatus> PetStatuses => Set<PetStatus>();

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
        modelBuilder.Entity<PetStatus>().HasKey(x => x.UserId);
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
            new ShopItem { Id = "food_small", Title = "Корм (мал.)", Description = "+15 к сытости", Price = 10, Type = "food", PayloadJson = "{\"satiety\":15}", Enabled = true },
            new ShopItem { Id = "food_big", Title = "Корм (бол.)", Description = "+40 к сытости", Price = 25, Type = "food", PayloadJson = "{\"satiety\":40,\"mood\":5}", Enabled = true },
            new ShopItem { Id = "bg_sky", Title = "Фон: Небо", Description = "Лёгкие облака", Price = 30, Type = "bg", PayloadJson = "{\"background\":\"sky\"}", Enabled = true },
            new ShopItem { Id = "bg_room", Title = "Фон: Комната", Description = "Уютное убежище", Price = 30, Type = "bg", PayloadJson = "{\"background\":\"room\"}", Enabled = true },
            new ShopItem { Id = "ball", Title = "Мячик", Description = "Игра повышает настроение", Price = 20, Type = "item", PayloadJson = "{\"item\":\"ball\"}", Enabled = true },
            new ShopItem { Id = "pet_cat", Title = "Открыть кота", Description = "Компаньон с миссии", Price = 500, Type = "pet", PayloadJson = "{\"petId\":\"cat\"}", Enabled = false },
            new ShopItem { Id = "pet_dragon", Title = "Открыть дракона", Description = "Эпический друг", Price = 1500, Type = "pet", PayloadJson = "{\"petId\":\"dragon\"}", Enabled = false }
        );

        modelBuilder.Entity<PetProfile>()
          .Property(e => e.OwnedPetIds)
          .HasConversion(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new()
  );
    }
}
