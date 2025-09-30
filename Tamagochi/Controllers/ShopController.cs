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

    private string UserId => HttpContext.GetRequiredUserId();

    [HttpGet("items")]
    public async Task<IActionResult> Items(CancellationToken ct)
    {
        var entities = await _db.ShopItems
            .AsNoTracking()
            .Where(x => x.Enabled)
            .ToListAsync(ct);

        var items = entities
           .Select(x => new ShopItemDto(
               x.Id,
               x.Title,
               x.Description,
               x.Price,
               x.Type,
               x.Enabled,
               x.Type == "food" && x.PayloadJson is not null ? MapEffect(x.PayloadJson) : null
           ))
           .ToList();

        return Ok(items);
    }

    private static ShopItemEffectDto? MapEffect(string payloadJson)
    {
        try
        {
            using var payload = JsonDocument.Parse(payloadJson);
            var root = payload.RootElement;

            int? satiety = root.TryGetProperty("satiety", out var satietyEl) ? satietyEl.GetInt32() : null;
            int? mood = root.TryGetProperty("mood", out var moodEl) ? moodEl.GetInt32() : null;
            int? health = root.TryGetProperty("health", out var healthEl) ? healthEl.GetInt32() : null;

            if (satiety is null && mood is null && health is null)
            {
                return null;
            }

            return new ShopItemEffectDto(satiety, mood, health);
        }
        catch (JsonException)
        {
            return null;
        }
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

        var userState = await _petState.EnsureUserStateAsync(UserId, ct);
        var wallet = userState.Wallet;
        if (wallet.Coins < item.Price)
        {
            return BadRequest("Not enough coins");
        }

        wallet.Coins -= item.Price;
        wallet.UpdatedAt = DateTime.UtcNow;

        if (item.PayloadJson is null)
        {
            return BadRequest("Item is missing payload");
        }

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

                        if (!userState.Profile.OwnedPetIds.Contains(petId))
                        {
                            userState.Profile.OwnedPetIds.Add(petId);
                        }

                        break;
                    }
            
                case "bg":
                    {
                        if (root.TryGetProperty("background", out var background) && !string.IsNullOrWhiteSpace(background.GetString()))
                        {
                            userState.Inventory.Background = background.GetString()!;
                        }

                        break;
                    }
                case "item":
                    {
                        if (root.TryGetProperty("item", out var itemElement) && !string.IsNullOrWhiteSpace(itemElement.GetString()))
                        {
                            var value = itemElement.GetString()!;
                            if (!userState.Inventory.Items.Contains(value))
                            {
                                userState.Inventory.Items.Add(value);
                            }
                        }

                        break;
                    }
                case "food":
                    {
                        var applied = _petState.ApplyFoodPayload(userState.Status, root);
                        if (!applied)
                        {
                            return BadRequest("Bad food payload");
                        }

                        break;
                    }
                default:
                    return BadRequest("Unknown item type");
            }
        }
        catch (JsonException)
        {
            return BadRequest("Malformed payload");
        }

        await _db.SaveChangesAsync(ct);

        var dto = await _petState.BuildStateAsync(UserId, ct);

        return Ok(dto);
    }
}
