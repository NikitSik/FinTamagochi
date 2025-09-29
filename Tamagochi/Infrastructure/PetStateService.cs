using Microsoft.EntityFrameworkCore;
using Tamagochi.Data;
using Tamagochi.DTOs;
using Tamagochi.Models;

namespace Tamagochi.Infrastructure;

public class PetStateService
{
    private readonly TamagochiDbContext _db;

    public PetStateService(TamagochiDbContext db)
    {
        _db = db;
    }

    public async Task<(Wallet wallet, Inventory inventory, PetProfile profile)> EnsureUserStateAsync(string userId, CancellationToken ct)
    {
        var wallet = await _db.Wallets.FindAsync(new object?[] { userId }, ct);
        var inventory = await _db.Inventories.FindAsync(new object?[] { userId }, ct);
        var profile = await _db.PetProfiles.FindAsync(new object?[] { userId }, ct);

        var created = false;

        if (wallet is null)
        {
            wallet = new Wallet { UserId = userId, Coins = 100 };
            _db.Wallets.Add(wallet);
            created = true;
        }

        if (inventory is null)
        {
            inventory = new Inventory { UserId = userId, Background = "default", Items = new() };
            _db.Inventories.Add(inventory);
            created = true;
        }

        if (profile is null)
        {
            profile = new PetProfile { UserId = userId, SelectedPetId = "dog", OwnedPetIds = new() { "dog" } };
            _db.PetProfiles.Add(profile);
            created = true;
        }

        if (created)
        {
            await _db.SaveChangesAsync(ct);
        }

        return (wallet, inventory, profile);
    }

    private static int Clamp(int value) => Math.Max(0, Math.Min(100, value));

    public async Task<PetStateDto> BuildStateAsync(string userId, CancellationToken ct)
    {
        var (wallet, inventory, profile) = await EnsureUserStateAsync(userId, ct);

        var mood = 70;
        var health = 100;
        var satiety = 50;

        var snapshot = await _db.FinanceSnapshots
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.Date)
            .FirstOrDefaultAsync(ct);

        if (snapshot is not null)
        {
            var savingsRate = snapshot.SavingsRate;
            if (savingsRate >= 0.20m)
            {
                mood = 85;
            }
            else if (savingsRate >= 0.10m)
            {
                mood = 75;
            }
            else if (snapshot.Expenses > snapshot.Income)
            {
                mood = 45;
            }
        }

        return new PetStateDto(
            Mood: Clamp(mood),
            Satiety: Clamp(satiety),
            Health: Clamp(health),
            Coins: wallet.Coins,
            Background: inventory.Background,
            Items: inventory.Items,
            SelectedPetId: profile.SelectedPetId,
            OwnedPetIds: profile.OwnedPetIds
        );
    }
}