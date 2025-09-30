using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Data;
using Tamagochi.Infrastructure;
using Xunit;

namespace Tamagochi.Tests.Services;

public class PetStateServiceTests
{
    private static TamagochiDbContext CreateContext(string name)
    {
        var options = new DbContextOptionsBuilder<TamagochiDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        return new TamagochiDbContext(options);
    }

    [Fact]
    public async Task BuildStateAsync_RegeneratesCoins_AndAppliesDecay()
    {
        using var db = CreateContext(nameof(BuildStateAsync_RegeneratesCoins_AndAppliesDecay));
        var service = new PetStateService(db);

        var state = await service.EnsureUserStateAsync("user", CancellationToken.None);
        state.Wallet.Coins = 0;
        state.Wallet.UpdatedAt = DateTime.UtcNow.AddMinutes(-60);
        state.Status.Satiety = 80;
        state.Status.Mood = 70;
        state.Status.LastUpdatedAt = DateTime.UtcNow.AddHours(-2);
        await db.SaveChangesAsync();

        var dto = await service.BuildStateAsync("user", CancellationToken.None);

        Assert.Equal(12, dto.Coins); // 60 минут / 5 = 12 монет
        Assert.Equal(60, dto.Satiety); // 4 шага по -5
        Assert.True(state.Status.LastUpdatedAt > DateTime.UtcNow.AddMinutes(-5));
    }

    [Fact]
    public async Task PerformActionAsync_FeedConsumesCoinsAndBoostsStats()
    {
        using var db = CreateContext(nameof(PerformActionAsync_FeedConsumesCoinsAndBoostsStats));
        var service = new PetStateService(db);

        var context = await service.EnsureUserStateAsync("user", CancellationToken.None);
        context.Wallet.Coins = 50;
        context.Status.Satiety = 10;
        context.Status.Mood = 40;
        await db.SaveChangesAsync();

        using var doc = JsonDocument.Parse("{\"satiety\":30,\"mood\":4}");
        var payload = doc.RootElement.Clone();

        var dto = await service.PerformActionAsync("user", "feed", payload, CancellationToken.None);

        Assert.Equal(45, dto.Coins); // 5 монет списано
        Assert.Equal(40, dto.Satiety); // 10 + 30
        Assert.Equal(44, dto.Mood);    // 40 + 4
        Assert.NotNull(context.Status.LastFedAt);
    }
}