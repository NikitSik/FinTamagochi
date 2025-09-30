using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Data;
using Tamagochi.Infrastructure;
using Tamagochi.Models;

namespace Tamagochi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class MissionsController : ControllerBase
{
    private readonly TamagochiDbContext _db;
    private readonly PetStateService _petState;

    public MissionsController(TamagochiDbContext db, PetStateService petState)
    {
        _db = db;
        _petState = petState;
    }

    // userId берём из клейма "sub" (выдаётся в AuthController.IssueJwt)
    private string UserId => HttpContext.GetRequiredUserId();

    // GET /api/missions — список миссий + Мой прогресс
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var missions = await _db.Missions.AsNoTracking().ToListAsync(ct);

        var progress = await _db.MissionProgresses
            .Where(p => p.UserId == UserId)
            .AsNoTracking()
            .ToListAsync(ct);

        var view = missions.Select(m =>
        {
            var p = progress.FirstOrDefault(x => x.MissionId == m.Id)
                    ?? new MissionProgress { MissionId = m.Id, UserId = UserId, Status = MissionStatus.New, Counter = 0 };

            return new
            {
                m.Id,
                m.Code,
                m.Title,
                m.Description,
                m.ProductTag,
                reward = new { coins = m.RewardCoins, xp = m.RewardXp, petId = m.RewardPetId },
                progress = new { p.Counter, target = m.Target, status = p.Status.ToString(), rewardClaimed = p.RewardClaimed },
                repeatable = m.Repeatable
            };
        });

        return Ok(view);
    }

    [HttpPost("{id:int}/step")]
    public async Task<IActionResult> Step(int id, CancellationToken ct)
    {
        var mission = await _db.Missions.FindAsync(new object?[] { id }, ct);
        if (mission is null)
        {
            return NotFound("Mission not found.");
        }

        var progress = await _db.MissionProgresses
            .FirstOrDefaultAsync(x => x.MissionId == id && x.UserId == UserId, ct);

        if (progress is null)
        {
            progress = new MissionProgress { MissionId = id, UserId = UserId, Status = MissionStatus.InProgress, Counter = 0 };
            _db.MissionProgresses.Add(progress);
        }

        if (progress.Status == MissionStatus.Done && !mission.Repeatable)
        {
            return BadRequest("Mission already completed.");
        }

        progress.Counter++;
        progress.Status = progress.Counter >= mission.Target ? MissionStatus.Done : MissionStatus.InProgress;

        if (progress.Status != MissionStatus.Done)
        {
            progress.RewardClaimed = false;
        }

        progress.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "Progress updated",
            counter = progress.Counter,
            target = mission.Target,
            status = progress.Status.ToString()
        });
    }

    [HttpPost("{id:int}/claim")]
    public async Task<IActionResult> Claim(int id, CancellationToken ct)
    {
        var mission = await _db.Missions.FindAsync(new object?[] { id }, ct);
        if (mission is null)
        {
            return NotFound("Mission not found.");
        }

        var progress = await _db.MissionProgresses
            .FirstOrDefaultAsync(x => x.MissionId == id && x.UserId == UserId, ct);

        if (progress is null || progress.Status != MissionStatus.Done)
        {
            return BadRequest("Mission not completed.");
        }

        if (progress.RewardClaimed && !mission.Repeatable)
        {
            return BadRequest("Reward already claimed.");
        }

        var state = await _petState.EnsureUserStateAsync(UserId, ct);
        var wallet = state.Wallet;
        wallet.Coins += mission.RewardCoins;
        wallet.UpdatedAt = DateTime.UtcNow;

        // 🔓 пример разблокировки питомца за конкретную миссию
        if (!string.IsNullOrWhiteSpace(mission.RewardPetId))
        {
            if (!state.Profile.OwnedPetIds.Contains(mission.RewardPetId))
            {
                state.Profile.OwnedPetIds.Add(mission.RewardPetId);
            }
        }

        if (mission.Repeatable)
        {
            progress.Counter = 0;
            progress.Status = MissionStatus.New;
            progress.RewardClaimed = false;
        }
        else
        {
            progress.RewardClaimed = true;
        }


        progress.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(new { coins = mission.RewardCoins, xp = mission.RewardXp, petId = mission.RewardPetId, repeatable = mission.Repeatable, message = "Reward granted" });
    }

}
