using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Data;
using Tamagochi.DTOs;
using Tamagochi.Infrastructure;

namespace Tamagochi.Controllers;

[Authorize]
[ApiController]
[Route("api/shop")]
[Produces("application/json")]
public class ShopController : ControllerBase
{
    private readonly TamagochiDbContext _db;
    private readonly PetStateService _petState;
    public ShopController(TamagochiDbContext db, PetStateService petState)
    {
        _db = db;
        _petState = petState;
    }

    private string UserId => HttpContext.GetUserId() ?? "demo";

    [HttpGet("items")]
    public async Task<IActionResult> Items(CancellationToken ct)
    {
        var items = await _db.ShopItems
            .AsNoTracking()
            .Where(x => x.Enabled)
            .Select(x => new ShopItemDto(x.Id, x.Title, x.Price, x.Type, x.Enabled))
            .ToListAsync(ct);

        return Ok(items);
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

        var (wallet, inventory, profile) = await _petState.EnsureUserStateAsync(UserId, ct);
        if (wallet.Coins < item.Price)
        {
            return BadRequest("Not enough coins");
        }

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
                            var value = itemElement.GetString()!;
                            if (!inventory.Items.Contains(value))
                            {
                                inventory.Items.Add(value);
                            }
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

        var state = await _petState.BuildStateAsync(UserId, ct);

        return Ok(state);
    }
}
