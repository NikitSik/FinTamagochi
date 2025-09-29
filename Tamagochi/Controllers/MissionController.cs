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

    public MissionsController(TamagochiDbContext db) => _db = db;

    // userId берём из клейма "sub" (выдаётся в AuthController.IssueJwt)
    private string UserId => HttpContext.GetUserId() ?? "demo";

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
                reward = new { coins = m.RewardCoins, xp = m.RewardXp },
                progress = new { p.Counter, target = m.Target, status = p.Status.ToString() }
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

        if (progress.Status == MissionStatus.Done)
        {
            return BadRequest("Mission already completed.");
        }

        progress.Counter++;
        progress.Status = progress.Counter >= mission.Target ? MissionStatus.Done : MissionStatus.InProgress;
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

        var wallet = await _db.Wallets.FindAsync(new object?[] { UserId }, ct);
        if (wallet is null)
        {
            wallet = new Wallet { UserId = UserId, Coins = 0 };
            _db.Wallets.Add(wallet);
        }

        wallet.Coins += mission.RewardCoins;

        // 🔓 пример разблокировки питомца за конкретную миссию
        if (mission.Code == "ANTIFRAUD_TUTORIAL")
        {
            var profile = await _db.PetProfiles.FindAsync(new object?[] { UserId }, ct);
            if (profile is null)
            {
                profile = new PetProfile { UserId = UserId, SelectedPetId = "dog", OwnedPetIds = new List<string> { "dog" } };
                _db.PetProfiles.Add(profile);
            }
            if (!profile.OwnedPetIds.Contains("cat"))
                profile.OwnedPetIds.Add("cat");
        }

        // остаёмся в Done, просто обновим время
        progress.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(new { coins = mission.RewardCoins, message = "Reward granted" });
    }

}
