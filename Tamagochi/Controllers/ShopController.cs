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

    public record PurchaseReq(string ItemId);

    [HttpPost("purchase")]
    public async Task<IActionResult> Purchase([FromBody] PurchaseReq req, CancellationToken ct)
    {
        var item = await _db.ShopItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.ItemId, ct);
        if (item is null || !item.Enabled) return NotFound("Item not found");

        var wallet = await _db.Wallets.FindAsync(new object?[] { UserId }, ct);
        if (wallet is null)
        {
            wallet = new Wallet { UserId = UserId, Coins = 0 };
            _db.Wallets.Add(wallet);
        }

        if (wallet.Coins < item.Price) return BadRequest("Not enough coins");

        var inv = await _db.Inventories.FindAsync(new object?[] { UserId }, ct);
        if (inv is null)
        {
            inv = new Inventory { UserId = UserId };
            _db.Inventories.Add(inv);
        }

        // Списываем монеты
        wallet.Coins -= item.Price;

        // Применяем покупку
        try
        {
            switch (item.Type)
            {
                case "pet":
                    {
                        var petId = JsonDocument.Parse(item.PayloadJson).RootElement.GetProperty("petId").GetString();
                        if (string.IsNullOrWhiteSpace(petId)) return BadRequest("Bad pet payload");
                        if (!inv.OwnedPets.Contains(petId!))
                            inv.OwnedPets.Add(petId!);
                        break;
                    }
                case "bg":
                    {
                        var bg = JsonDocument.Parse(item.PayloadJson).RootElement.GetProperty("background").GetString();
                        if (!string.IsNullOrWhiteSpace(bg)) inv.Background = bg!;
                        break;
                    }
                case "item":
                    {
                        var id = JsonDocument.Parse(item.PayloadJson).RootElement.GetProperty("item").GetString();
                        if (!string.IsNullOrWhiteSpace(id)) inv.Items.Add(id!);
                        break;
                    }
                case "food":
                    // ничего не записываем в инвентарь — еда тратится сразу на фронте действием "buy"
                    break;
                default:
                    return BadRequest("Unknown item type");
            }
        }
        catch
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
            background = inv.Background,
            items = inv.Items,
            selectedPetId = inv.SelectedPetId,
            ownedPetIds = inv.OwnedPets
        };

        return Ok(petState);
    }
}
