using System;
using System.Collections.Generic;
using System.Linq;
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
            inventory = new Inventory { UserId = userId, Background = "default", Items = new(), Consumables = new(StringComparer.Ordinal) };
            _db.Inventories.Add(inventory);
            created = true;
        }
        else
        {
            if (inventory.Items is null)
            {
                inventory.Items = new();
            }

            if (inventory.Consumables is null)
            {
                inventory.Consumables = new(StringComparer.Ordinal);
            }
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

    private static bool TryExtractEffect(JsonElement payload, out int satiety, out int mood, out int health)
    {
        satiety = 0;
        mood = 0;
        health = 0;

        if (payload.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        if (payload.TryGetProperty("satiety", out var satietyEl) && satietyEl.ValueKind == JsonValueKind.Number)
        {
            satiety = satietyEl.GetInt32();
        }

        if (payload.TryGetProperty("mood", out var moodEl) && moodEl.ValueKind == JsonValueKind.Number)
        {
            mood = moodEl.GetInt32();
        }

        if (payload.TryGetProperty("health", out var healthEl) && healthEl.ValueKind == JsonValueKind.Number)
        {
            health = healthEl.GetInt32();
        }

        return satiety != 0 || mood != 0 || health != 0;
    }

    private static string RequireItemId(JsonElement? payload, string actionDescription)
    {
        if (payload is not JsonElement element || element.ValueKind != JsonValueKind.Object)
        {
            throw new InvalidOperationException($"Не выбран предмет для {actionDescription}");
        }

        if (!element.TryGetProperty("itemId", out var itemIdEl) || itemIdEl.ValueKind != JsonValueKind.String)
        {
            throw new InvalidOperationException($"Не выбран предмет для {actionDescription}");
        }

        var itemId = itemIdEl.GetString();
        if (string.IsNullOrWhiteSpace(itemId))
        {
            throw new InvalidOperationException($"Не выбран предмет для {actionDescription}");
        }

        return itemId;
    }

    private static void DecrementConsumable(Dictionary<string, int> consumables, string itemId)
    {
        if (!consumables.TryGetValue(itemId, out var count))
        {
            return;
        }

        if (count <= 1)
        {
            consumables.Remove(itemId);
            return;
        }

        consumables[itemId] = count - 1;
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
                {
                    var itemId = RequireItemId(payload, "лечения");

                    if (!context.Inventory.Consumables.TryGetValue(itemId, out var healCount) || healCount <= 0)
                    {
                        throw new InvalidOperationException("Нет подходящих предметов для лечения");
                    }

                    var shopItem = await _db.ShopItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == itemId, ct);
                    if (shopItem is null || !string.Equals(shopItem.Type, "medicine", StringComparison.Ordinal))
                    {
                        throw new InvalidOperationException("Этот предмет нельзя использовать для лечения");
                    }

                    if (string.IsNullOrWhiteSpace(shopItem.PayloadJson))
                    {
                        throw new InvalidOperationException("Предмет не содержит данных для лечения");
                    }

                    using var healDoc = JsonDocument.Parse(shopItem.PayloadJson);
                    if (!TryExtractEffect(healDoc.RootElement, out var satietyGain, out var moodGain, out var healthGain) || healthGain == 0)
                    {
                        throw new InvalidOperationException("Предмет не даёт эффекта лечения");
                    }

                    AdjustStatus(context.Status, satietyGain, moodGain, healthGain);
                    context.Status.LastHealedAt = now;
                    context.Status.LastUpdatedAt = now;
                    DecrementConsumable(context.Inventory.Consumables, itemId);
                    changed = true;
                    break;
                }

            case "feed":
                {
                    var itemId = RequireItemId(payload, "кормления");

                    if (!context.Inventory.Consumables.TryGetValue(itemId, out var foodCount) || foodCount <= 0)
                    {
                        throw new InvalidOperationException("Корм закончился");
                    }

                    var shopItem = await _db.ShopItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == itemId, ct);
                    if (shopItem is null || !string.Equals(shopItem.Type, "food", StringComparison.Ordinal))
                    {
                        throw new InvalidOperationException("Этот предмет нельзя использовать для кормления");
                    }

                    if (string.IsNullOrWhiteSpace(shopItem.PayloadJson))
                    {
                        throw new InvalidOperationException("Корм не содержит данных об эффекте");
                    }

                    using var feedDoc = JsonDocument.Parse(shopItem.PayloadJson);
                    if (!TryExtractEffect(feedDoc.RootElement, out var satietyGain, out var moodGain, out var healthGain) || satietyGain == 0)
                    {
                        throw new InvalidOperationException("Корм не даёт сытости");
                    }

                    AdjustStatus(context.Status, satietyGain, moodGain, healthGain);
                    context.Status.LastFedAt = now;
                    context.Status.LastUpdatedAt = now;
                    DecrementConsumable(context.Inventory.Consumables, itemId);
                    changed = true;
                    break;
                }

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

        context.Inventory.Consumables ??= new Dictionary<string, int>(StringComparer.Ordinal);

        var consumableDtos = new List<InventoryConsumableDto>();
        if (context.Inventory.Consumables.Count > 0)
        {
            var itemIds = context.Inventory.Consumables.Keys.ToList();
            var shopItems = await _db.ShopItems
                .Where(x => itemIds.Contains(x.Id))
                .ToListAsync(ct);

            var map = shopItems.ToDictionary(x => x.Id, StringComparer.Ordinal);

            foreach (var (itemId, count) in context.Inventory.Consumables)
            {
                if (count <= 0)
                {
                    continue;
                }

                if (map.TryGetValue(itemId, out var shopItem))
                {
                    consumableDtos.Add(new InventoryConsumableDto(shopItem.Id, shopItem.Title, shopItem.Type, count));
                }
                else
                {
                    consumableDtos.Add(new InventoryConsumableDto(itemId, itemId, "unknown", count));
                }
            }

            consumableDtos = consumableDtos
                .OrderBy(c => c.Type, StringComparer.Ordinal)
                .ThenBy(c => c.Title, StringComparer.Ordinal)
                .ToList();
        }

        return new PetStateDto(
            Mood: Clamp(mood),
            Satiety: Clamp(context.Status.Satiety),
            Health: Clamp(context.Status.Health),
            Coins: context.Wallet.Coins,
            Background: context.Inventory.Background,
            Items: context.Inventory.Items,
            Consumables: consumableDtos,
            SelectedPetId: context.Profile.SelectedPetId,
            OwnedPetIds: context.Profile.OwnedPetIds
        );
    }
}