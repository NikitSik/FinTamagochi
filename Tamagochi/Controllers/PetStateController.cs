using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Data;
using Tamagochi.DTOs;
using Tamagochi.Models;

namespace Tamagochi.Controllers;

[Authorize]
[ApiController]
[Route("api/pet")]
[Produces("application/json")]
public class PetStateController : ControllerBase
{
    private readonly TamagochiDbContext _db;
    public PetStateController(TamagochiDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "demo";

    private static int Clamp(int v) => Math.Max(0, Math.Min(100, v));

    // ---- ensure helpers ----
    private async Task<(Wallet wallet, Inventory inv)> EnsureEconomyAsync(CancellationToken ct)
    {
        var wallet = await _db.Wallets.FindAsync(new object?[] { UserId }, ct);
        if (wallet is null) { wallet = new Wallet { UserId = UserId, Coins = 100 }; _db.Wallets.Add(wallet); }

        var inv = await _db.Inventories.FindAsync(new object?[] { UserId }, ct);
        if (inv is null) { inv = new Inventory { UserId = UserId, Background = "default", Items = new() }; _db.Inventories.Add(inv); }

        await _db.SaveChangesAsync(ct);
        return (wallet, inv);
    }

    private async Task<PetProfile> EnsurePetAsync(CancellationToken ct)
    {
        var profile = await _db.PetProfiles.FindAsync(new object?[] { UserId }, ct);
        if (profile is null)
        {
            profile = new PetProfile { UserId = UserId, SelectedPetId = "dog", OwnedPetIds = new() { "dog" } };
            _db.PetProfiles.Add(profile);
            await _db.SaveChangesAsync(ct);
        }
        return profile;
    }

    // ---- STATE ----
    [HttpGet("state")]
    public async Task<ActionResult<PetStateDto>> GetState(CancellationToken ct)
    {
        var (wallet, inv) = await EnsureEconomyAsync(ct);
        var profile = await EnsurePetAsync(ct);

        int mood = 70, health = 100, satiety = 50;

        var s = await _db.FinanceSnapshots
            .Where(x => x.UserId == UserId)
            .OrderByDescending(x => x.Date)
            .FirstOrDefaultAsync(ct);

        if (s is not null)
        {
            var sr = s.SavingsRate;
            if (sr >= 0.20m) mood = 85;
            else if (sr >= 0.10m) mood = 75;
            else if (s.Expenses > s.Income) { mood = 45; }
        }

        return Ok(new PetStateDto(
            Mood: mood,
            Satiety: satiety,
            Health: health,
            Coins: wallet.Coins,
            Background: inv.Background,
            Items: inv.Items,
            SelectedPetId: inv.SelectedPetId,
            OwnedPetIds: inv.OwnedPets
        ));

    }

    // ---- SELECT PET ----
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
        // пока без сложных расчётов
        await EnsureEconomyAsync(ct);
        await EnsurePetAsync(ct);
        return await GetState(ct);
    }
}
