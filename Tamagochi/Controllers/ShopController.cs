// Controllers/ShopController.cs
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Data;
using Tamagochi.Infrastructure;
using Tamagochi.Models;

namespace Tamagochi.Controllers;

[Authorize]
[ApiController]
[Route("api/shop")]
[Produces("application/json")]
public class ShopController : ControllerBase
{
    private readonly TamagochiDbContext _db;
    public ShopController(TamagochiDbContext db) => _db = db;

    private string UserId => HttpContext.GetUserId() ?? "demo";

    [HttpGet("items")]
    public async Task<IActionResult> Items(CancellationToken ct)
    {
        var items = await _db.ShopItems
            .AsNoTracking()
            .Where(x => x.Enabled)
            .Select(x => new { x.Id, x.Title, x.Price, x.Type, x.Enabled })
            .ToListAsync(ct);

        return Ok(items);
    }

    private async Task<Wallet> EnsureWalletAsync(CancellationToken ct)
    {
        var wallet = await _db.Wallets.FindAsync(new object?[] { UserId }, ct);
        if (wallet is not null)
        {
            return wallet;
        }

        wallet = new Wallet { UserId = UserId, Coins = 0 };
        _db.Wallets.Add(wallet);
        await _db.SaveChangesAsync(ct);
        return wallet;
    }

    private async Task<Inventory> EnsureInventoryAsync(CancellationToken ct)
    {
        var inventory = await _db.Inventories.FindAsync(new object?[] { UserId }, ct);
        if (inventory is not null)
        {
            return inventory;
        }

        inventory = new Inventory { UserId = UserId };
        _db.Inventories.Add(inventory);
        await _db.SaveChangesAsync(ct);
        return inventory;
    }

    private async Task<PetProfile> EnsurePetProfileAsync(CancellationToken ct)
    {
        var profile = await _db.PetProfiles.FindAsync(new object?[] { UserId }, ct);
        if (profile is not null)
        {
            return profile;
        }

        profile = new PetProfile { UserId = UserId, SelectedPetId = "dog", OwnedPetIds = new() { "dog" } };
        _db.PetProfiles.Add(profile);
        await _db.SaveChangesAsync(ct);
        return profile;
    }


    public record PurchaseReq(string ItemId);

    [HttpPost("purchase")]
    public async Task<IActionResult> Purchase([FromBody] PurchaseReq req, CancellationToken ct)
    {
        var item = await _db.ShopItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.ItemId, ct);
        if (item is null || !item.Enabled)
        {
            return NotFound("Item not found");
        }

        var wallet = await EnsureWalletAsync(ct);
        if (wallet.Coins < item.Price)
        {
            return BadRequest("Not enough coins");
        }

        // Списываем монеты
        var inventory = await EnsureInventoryAsync(ct);
        var profile = await EnsurePetProfileAsync(ct);

        wallet.Coins -= item.Price;

        // Применяем покупку
        try
        {
            using var payload = JsonDocument.Parse(item.PayloadJson);
            var root = payload.RootElement;

            switch (item.Type)
            {
                case "pet":
                    {
                        if (!root.TryGetProperty("petId", out var petElement))
                        {
                            return BadRequest("Bad pet payload");
                        }

                        var petId = petElement.GetString();
                        if (string.IsNullOrWhiteSpace(petId))
                        {
                            return BadRequest("Bad pet payload");
                        }

                        if (!profile.OwnedPetIds.Contains(petId))
                        {
                            profile.OwnedPetIds.Add(petId);
                        }

                        break;
                    }
            
                case "bg":
                    {
                        if (root.TryGetProperty("background", out var background) && !string.IsNullOrWhiteSpace(background.GetString()))
                        {
                            inventory.Background = background.GetString()!;
                        }

                        break;
                    }
                case "item":
                    {
                        if (root.TryGetProperty("item", out var itemElement) && !string.IsNullOrWhiteSpace(itemElement.GetString()))
                        {
                            inventory.Items.Add(itemElement.GetString()!);
                        }

                        break;
                    }
                case "food":
                    break;
                default:
                    return BadRequest("Unknown item type");
            }
        }
        catch (JsonException)
        {
            return BadRequest("Malformed payload");
        }

        await _db.SaveChangesAsync(ct);

        // Вернём актуальное состояние питомца (как /api/pet/state)
        var petState = new
        {
            mood = 70, // без перерасчёта — или собери как в PetStateController
            satiety = 50,
            health = 70,
            coins = wallet.Coins,
            background = inventory.Background,
            items = inventory.Items,
            selectedPetId = profile.SelectedPetId,
            ownedPetIds = profile.OwnedPetIds
        };

        return Ok(petState);
    }
}
