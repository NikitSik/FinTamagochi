using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Data;
using Tamagochi.DTOs;
using Tamagochi.Models;
using Tamagochi.Infrastructure;

namespace Tamagochi.Controllers;

[Authorize]
[ApiController]
[Route("api/pet")]
[Produces("application/json")]
public class PetStateController : ControllerBase
{
    private readonly TamagochiDbContext _db;
    public PetStateController(TamagochiDbContext db) => _db = db;

    private string UserId => HttpContext.GetUserId() ?? "demo";

    private static int Clamp(int value) => Math.Max(0, Math.Min(100, value));

    // ---- ensure helpers ----
    private async Task<(Wallet wallet, Inventory inventory)> EnsureEconomyAsync(CancellationToken ct)
    {
        var wallet = await _db.Wallets.FindAsync(new object?[] { UserId }, ct);
        var inventory = await _db.Inventories.FindAsync(new object?[] { UserId }, ct);

        var created = false;

        if (wallet is null)
        {
            wallet = new Wallet { UserId = UserId, Coins = 100 };
            _db.Wallets.Add(wallet);
            created = true;
        }

        if (inventory is null)
        {
            inventory = new Inventory { UserId = UserId, Background = "default", Items = new() };
            _db.Inventories.Add(inventory);
            created = true;
        }

        if (created)
        {
            await _db.SaveChangesAsync(ct);
        }

        return (wallet, inventory);
    }

    private async Task<PetProfile> EnsurePetAsync(CancellationToken ct)
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

    // ---- STATE ----
    private async Task<PetStateDto> BuildStateAsync(CancellationToken ct)
    {
        var (wallet, inventory) = await EnsureEconomyAsync(ct);
        var profile = await EnsurePetAsync(ct);

        var mood = 70;
        var health = 100;
        var satiety = 50;


        var snapshot = await _db.FinanceSnapshots
           .Where(x => x.UserId == UserId)
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

    [HttpGet("state")]
    public async Task<ActionResult<PetStateDto>> GetState(CancellationToken ct)
    {
        var state = await BuildStateAsync(ct);
        return Ok(state);
    }

    public record SelectPetRequest(string PetId);

    [HttpPost("select")]
    public async Task<IActionResult> Select([FromBody] SelectPetRequest req, CancellationToken ct)
    {
        var profile = await EnsurePetAsync(ct);
        if (!profile.OwnedPetIds.Contains(req.PetId))
            return BadRequest("Питомец не доступен пользователю");

        profile.SelectedPetId = req.PetId;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ---- ACTION ----
    public record PetActionRequest(string Name);

    [HttpPost("action")]
    public async Task<ActionResult<PetStateDto>> Action([FromBody] PetActionRequest req, CancellationToken ct)
    {
        var state = await BuildStateAsync(ct);
        return Ok(state);
    }
}
