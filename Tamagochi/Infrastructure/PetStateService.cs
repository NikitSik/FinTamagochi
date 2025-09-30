using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Data;
using Tamagochi.DTOs;
using Tamagochi.Models;

namespace Tamagochi.Infrastructure;

public class PetStateService
{
    private const int WalletMaxCoins = 9999;
    private readonly TamagochiDbContext _db;
    public record UserPetState(Wallet Wallet, Inventory Inventory, PetProfile Profile, PetStatus Status);

    public PetStateService(TamagochiDbContext db)
    {
        _db = db;
    }

    public async Task<UserPetState> EnsureUserStateAsync(string userId, CancellationToken ct)
    {
        var wallet = await _db.Wallets.FindAsync(new object?[] { userId }, ct);
        var inventory = await _db.Inventories.FindAsync(new object?[] { userId }, ct);
        var profile = await _db.PetProfiles.FindAsync(new object?[] { userId }, ct);
        var status = await _db.PetStatuses.FindAsync(new object?[] { userId }, ct);

        var created = false;

        if (wallet is null)
        {
            wallet = new Wallet { UserId = userId, Coins = 100, UpdatedAt = DateTime.UtcNow };
            _db.Wallets.Add(wallet);
            created = true;
        }

        if (inventory is null)
        {
            inventory = new Inventory { UserId = userId, Background = "default", Items = new() };
            _db.Inventories.Add(inventory);
            created = true;
        }

        else if (inventory.Items is null)
        {
            inventory.Items = new();
        }

        if (profile is null)
        {
            profile = new PetProfile { UserId = userId, SelectedPetId = "dog", OwnedPetIds = new() { "dog" } };
            _db.PetProfiles.Add(profile);
            created = true;
        }

        if (status is null)
        {
            status = new PetStatus { UserId = userId, LastUpdatedAt = DateTime.UtcNow };
            _db.PetStatuses.Add(status);
            created = true;
        }

        if (created)
        {
            await _db.SaveChangesAsync(ct);
        }

        return new UserPetState(wallet, inventory, profile, status);
    }

    private static int Clamp(int value) => Math.Max(0, Math.Min(100, value));

    private static void AdjustStatus(PetStatus status, int satietyDelta = 0, int moodDelta = 0, int healthDelta = 0)
    {
        status.Satiety = Clamp(status.Satiety + satietyDelta);
        status.Mood = Clamp(status.Mood + moodDelta);
        status.Health = Clamp(status.Health + healthDelta);
    }

    private bool ApplyWalletRegeneration(Wallet wallet, DateTime now)
    {
        if (now <= wallet.UpdatedAt)
        {
            return false;
        }

        var elapsedMinutes = (int)Math.Floor((now - wallet.UpdatedAt).TotalMinutes);
        if (elapsedMinutes < 5)
        {
            return false;
        }

        var increments = elapsedMinutes / 5; // 1 монета каждые 5 минут
        if (increments <= 0)
        {
            wallet.UpdatedAt = now;
            return false;
        }

        var gained = Math.Min(40, increments); // максимум +40 за раз
        var newCoins = Math.Min(wallet.Coins + gained, WalletMaxCoins);
        var changed = newCoins != wallet.Coins;

        wallet.Coins = newCoins;
        wallet.UpdatedAt = now;
        return changed;
    }

    private bool ApplyDecay(PetStatus status, DateTime now)
    {
        if (now <= status.LastUpdatedAt)
        {
            return false;
        }

        var elapsedMinutes = (int)Math.Floor((now - status.LastUpdatedAt).TotalMinutes);
        var steps = elapsedMinutes / 30; // каждые 30 минут статусы снижаются
        if (steps <= 0)
        {
            return false;
        }

        var changed = false;
        for (var i = 0; i < steps; i++)
        {
            var satietyBefore = status.Satiety;
            if (status.Satiety > 0)
            {
                status.Satiety = Clamp(status.Satiety - 5);
                changed = true;
            }

            if (status.Mood > 0)
            {
                status.Mood = Clamp(status.Mood - 3);
                changed = true;
            }

            if (satietyBefore < 30 && status.Health > 0)
            {
                status.Health = Clamp(status.Health - 2);
                changed = true;
            }
        }

        status.LastUpdatedAt = now;
        return changed;
    }

    public bool ApplyFoodPayload(PetStatus status, JsonElement payload)
    {
        if (payload.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        var satiety = payload.TryGetProperty("satiety", out var satietyEl) && satietyEl.ValueKind == JsonValueKind.Number
            ? satietyEl.GetInt32()
            : 0;
        var mood = payload.TryGetProperty("mood", out var moodEl) && moodEl.ValueKind == JsonValueKind.Number
            ? moodEl.GetInt32()
            : 0;
        var health = payload.TryGetProperty("health", out var healthEl) && healthEl.ValueKind == JsonValueKind.Number
            ? healthEl.GetInt32()
            : 0;

        if (satiety == 0 && mood == 0 && health == 0)
        {
            return false;
        }

        AdjustStatus(status, satiety, mood, health);
        status.LastFedAt = DateTime.UtcNow;
        status.LastUpdatedAt = DateTime.UtcNow;
        return true;
    }

    public async Task<PetStateDto> PerformActionAsync(string userId, string actionName, JsonElement? payload, CancellationToken ct)
    {
        var context = await EnsureUserStateAsync(userId, ct);
        var now = DateTime.UtcNow;
        var changed = ApplyWalletRegeneration(context.Wallet, now) | ApplyDecay(context.Status, now);

        switch (actionName)
        {
            case "play":
                if (context.Status.Satiety <= 10)
                {
                    throw new InvalidOperationException("Питомец слишком голоден для игры");
                }

                AdjustStatus(context.Status, satietyDelta: -6, moodDelta: 12);
                context.Status.LastPlayedAt = now;
                context.Status.LastUpdatedAt = now;
                changed = true;
                break;

            case "heal":
                const int healCost = 25;
                if (context.Wallet.Coins < healCost)
                {
                    throw new InvalidOperationException("Недостаточно монет для лечения");
                }

                context.Wallet.Coins -= healCost;
                context.Wallet.UpdatedAt = now;
                AdjustStatus(context.Status, moodDelta: 5, healthDelta: 20);
                context.Status.LastHealedAt = now;
                context.Status.LastUpdatedAt = now;
                changed = true;
                break;

            case "feed":
                var satietyGain = 20;
                var moodGain = 3;
                var healthGain = 0;

                if (payload is JsonElement feedPayload && feedPayload.ValueKind == JsonValueKind.Object)
                {
                    if (feedPayload.TryGetProperty("satiety", out var satietyEl) && satietyEl.ValueKind == JsonValueKind.Number)
                    {
                        satietyGain = satietyEl.GetInt32();
                    }
                    if (feedPayload.TryGetProperty("mood", out var moodEl) && moodEl.ValueKind == JsonValueKind.Number)
                    {
                        moodGain = moodEl.GetInt32();
                    }
                    if (feedPayload.TryGetProperty("health", out var healthEl) && healthEl.ValueKind == JsonValueKind.Number)
                    {
                        healthGain = healthEl.GetInt32();
                    }
                }

                const int feedCost = 5;
                if (context.Wallet.Coins < feedCost)
                {
                    throw new InvalidOperationException("Недостаточно монет для корма");
                }

                context.Wallet.Coins -= feedCost;
                context.Wallet.UpdatedAt = now;
                AdjustStatus(context.Status, satietyGain, moodGain, healthGain);
                context.Status.LastFedAt = now;
                context.Status.LastUpdatedAt = now;
                changed = true;
                break;

            default:
                throw new InvalidOperationException("Неизвестное действие");
        }

        if (changed)
        {
            await _db.SaveChangesAsync(ct);
        }

        return await BuildStateDtoAsync(context, ct);
    }

    public async Task<PetStateDto> BuildStateAsync(string userId, CancellationToken ct)
    {
        var context = await EnsureUserStateAsync(userId, ct);
        var now = DateTime.UtcNow;
        var changed = ApplyWalletRegeneration(context.Wallet, now) | ApplyDecay(context.Status, now);

        if (changed)
        {
            await _db.SaveChangesAsync(ct);
        }

        return await BuildStateDtoAsync(context, ct);
    }

    private async Task<PetStateDto> BuildStateDtoAsync(UserPetState context, CancellationToken ct)
    {
        var mood = context.Status.Mood;

        var snapshot = await _db.FinanceSnapshots
            .Where(x => x.UserId == context.Wallet.UserId)
            .OrderByDescending(x => x.Date)
            .FirstOrDefaultAsync(ct);

        if (snapshot is not null)
        {
            var savingsRate = snapshot.SavingsRate;
            if (savingsRate >= 0.20m)
            {
                mood = Clamp(mood + 8);
            }
            else if (savingsRate >= 0.10m)
            {
                mood = Clamp(mood + 4);
            }
            else if (snapshot.Expenses > snapshot.Income)
            {
                mood = Clamp(mood - 10);
            }
        }

        return new PetStateDto(
            Mood: Clamp(mood),
            Satiety: Clamp(context.Status.Satiety),
            Health: Clamp(context.Status.Health),
            Coins: context.Wallet.Coins,
            Background: context.Inventory.Background,
            Items: context.Inventory.Items,
            SelectedPetId: context.Profile.SelectedPetId,
            OwnedPetIds: context.Profile.OwnedPetIds
        );
    }
}