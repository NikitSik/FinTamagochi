using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    private readonly PetStateService _petState;
    public PetStateController(TamagochiDbContext db, PetStateService petState)
    {
        _db = db;
        _petState = petState;
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

    private string UserId => HttpContext.GetUserId() ?? "demo";

    [HttpGet("state")]
    public async Task<ActionResult<PetStateDto>> GetState(CancellationToken ct)
    {
        var state = await _petState.BuildStateAsync(UserId, ct);
        return Ok(state);
    }

    public record SelectPetRequest(string PetId);

    [HttpPost("select")]
    public async Task<IActionResult> Select([FromBody] SelectPetRequest req, CancellationToken ct)
    {
        var (_, _, profile) = await _petState.EnsureUserStateAsync(UserId, ct);
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
        var state = await _petState.BuildStateAsync(UserId, ct);
        return Ok(state);
    }
}
