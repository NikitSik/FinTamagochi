using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Data;
using Tamagochi.Models;
using Xunit;

namespace Tamagochi.Tests.Data;

public class TamagochiDbContextTests
{
    private static TamagochiDbContext CreateContext(string name)
    {
        var options = new DbContextOptionsBuilder<TamagochiDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        return new TamagochiDbContext(options);
    }

    [Fact]
    public async Task SaveChangesAsync_DetectsInventoryItemMutations()
    {
        using var db = CreateContext(nameof(SaveChangesAsync_DetectsInventoryItemMutations));
        db.Inventories.Add(new Inventory { UserId = "user", Items = new List<string> { "apple" } });
        await db.SaveChangesAsync();

        var inventory = await db.Inventories.SingleAsync(i => i.UserId == "user");
        inventory.Items.Add("banana");
        await db.SaveChangesAsync();

        db.ChangeTracker.Clear();
        var reloaded = await db.Inventories.SingleAsync(i => i.UserId == "user");
        Assert.Contains("banana", reloaded.Items);
    }

    [Fact]
    public async Task SaveChangesAsync_DetectsPetProfileMutations()
    {
        using var db = CreateContext(nameof(SaveChangesAsync_DetectsPetProfileMutations));
        db.PetProfiles.Add(new PetProfile { UserId = "user", OwnedPetIds = new List<string> { "dog" } });
        await db.SaveChangesAsync();

        var profile = await db.PetProfiles.SingleAsync(p => p.UserId == "user");
        profile.OwnedPetIds.Add("cat");
        await db.SaveChangesAsync();

        db.ChangeTracker.Clear();
        var reloaded = await db.PetProfiles.SingleAsync(p => p.UserId == "user");
        Assert.Contains("cat", reloaded.OwnedPetIds);
    }
}
