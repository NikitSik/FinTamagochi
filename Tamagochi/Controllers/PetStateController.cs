using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tamagochi.Data;
using Tamagochi.DTOs;
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

    private string UserId => HttpContext.GetRequiredUserId();

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
        var state = await _petState.EnsureUserStateAsync(UserId, ct);
        var profile = state.Profile;
        if (!profile.OwnedPetIds.Contains(req.PetId))
            return BadRequest("Питомец не доступен пользователю");

        profile.SelectedPetId = req.PetId;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ---- ACTION ----
    public record PetActionRequest(string Name, JsonElement? Payload);

    [HttpPost("action")]
    public async Task<ActionResult<PetStateDto>> Action([FromBody] PetActionRequest req, CancellationToken ct)
    {
        try
        {
            var state = await _petState.PerformActionAsync(UserId, req.Name, req.Payload, ct);
            return Ok(state);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
