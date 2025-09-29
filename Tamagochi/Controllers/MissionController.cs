using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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
    private string UserId => User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "demo";

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

    // POST /api/missions/{id}/step — сделать шаг по миссии
    [HttpPost("{id:int}/step")]
    public async Task<IActionResult> Step(int id, CancellationToken ct)
    {
        var mission = await _db.Missions.FindAsync([id], ct);
        if (mission is null) return NotFound("Mission not found.");

        var p = await _db.MissionProgresses
            .FirstOrDefaultAsync(x => x.MissionId == id && x.UserId == UserId, ct);

        if (p is null)
        {
            p = new MissionProgress { MissionId = id, UserId = UserId, Status = MissionStatus.InProgress, Counter = 0 };
            _db.MissionProgresses.Add(p);
        }

        if (p.Status == MissionStatus.Done)
            return BadRequest("Mission already completed.");

        p.Counter++;
        p.Status = p.Counter >= mission.Target ? MissionStatus.Done : MissionStatus.InProgress;
        p.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Progress updated", counter = p.Counter, target = mission.Target, status = p.Status.ToString() });
    }

    // POST /api/missions/{id}/claim — забрать награду
    // POST /api/missions/{id}/claim — забрать награду
    [HttpPost("{id:int}/claim")]
    public async Task<IActionResult> Claim(int id, CancellationToken ct)
    {
        var mission = await _db.Missions.FindAsync(new object?[] { id }, ct);
        if (mission is null) return NotFound("Mission not found.");

        var p = await _db.MissionProgresses
            .FirstOrDefaultAsync(x => x.MissionId == id && x.UserId == UserId, ct);

        if (p is null || p.Status != MissionStatus.Done)
            return BadRequest("Mission not completed.");

        // 💰 кошелек
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
        p.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return Ok(new { coins = mission.RewardCoins, message = "Reward granted" });
    }

}
