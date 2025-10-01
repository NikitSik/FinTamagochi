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
public class FinanceController : ControllerBase
{
    private readonly TamagochiDbContext _db;

    public FinanceController(TamagochiDbContext db) => _db = db;

    private string UserId => HttpContext.GetRequiredUserId();

    [HttpPost("snapshot")]
    public async Task<IActionResult> CreateSnapshot([FromBody] FinanceSnapshot dto, CancellationToken ct)
    {
        dto.UserId = UserId;

        if (dto.SavingsRate == 0 && dto.Income > 0)
        {
            dto.SavingsRate = decimal.Round((dto.Income - dto.Expenses) / dto.Income, 4, MidpointRounding.AwayFromZero);
        }

        _db.FinanceSnapshots.Add(dto);
        await _db.SaveChangesAsync(ct);
        return Created(string.Empty, dto);
    }

    [HttpGet("snapshot/latest")]
    public async Task<IActionResult> GetLatest(CancellationToken ct)
    {
        var snapshot = await _db.FinanceSnapshots
            .Where(x => x.UserId == UserId)
            .OrderByDescending(x => x.Date)
            .FirstOrDefaultAsync(ct);

        return snapshot is null ? NotFound() : Ok(snapshot);
    }

    // внутри FinanceController
    private async Task<SavingsAccount> EnsureSavingsAsync(CancellationToken ct)
    {
        var account = await _db.SavingsAccounts.FindAsync(new object?[] { UserId }, ct);
        if (account is not null)
        {
            return account;
        }

        account = new SavingsAccount { UserId = UserId, Balance = 0m };
        _db.SavingsAccounts.Add(account);
        await _db.SaveChangesAsync(ct);

        return account;
    }

    public record AmountRequest(decimal Amount);

    private async Task<FinanceSnapshot?> GetLatestSnapshotAsync(CancellationToken ct)
    {
        return await _db.FinanceSnapshots
            .Where(x => x.UserId == UserId)
            .OrderByDescending(x => x.Date)
            .ThenByDescending(x => x.Id)
            .FirstOrDefaultAsync(ct);
    }

    private static IActionResult? ValidateAmount(AmountRequest body)
    {
        if (body.Amount <= 0)
        {
            return new BadRequestObjectResult("Сумма должна быть > 0");
        }

        return null;
    }

    [HttpPost("balance/deposit")]
    public async Task<IActionResult> TopUpBalance([FromBody] AmountRequest body, CancellationToken ct)
    {
        if (ValidateAmount(body) is { } bad)
        {
            return bad;
        }

        var snapshot = await GetLatestSnapshotAsync(ct);
        if (snapshot is null)
        {
            return BadRequest("Сначала зафиксируйте баланс текущего счёта");
        }

        snapshot.Balance += body.Amount;

        await _db.SaveChangesAsync(ct);
        return Ok(new { balance = snapshot.Balance });
    }

    [HttpPost("balance/withdraw")]
    public async Task<IActionResult> WithdrawBalance([FromBody] AmountRequest body, CancellationToken ct)
    {
        if (ValidateAmount(body) is { } bad)
        {
            return bad;
        }

        var snapshot = await GetLatestSnapshotAsync(ct);
        if (snapshot is null)
        {
            return BadRequest("Сначала зафиксируйте баланс текущего счёта");
        }

        if (snapshot.Balance < body.Amount)
        {
            return BadRequest("Недостаточно средств на текущем счёте");
        }

        snapshot.Balance -= body.Amount;

        await _db.SaveChangesAsync(ct);
        return Ok(new { balance = snapshot.Balance });
    }

    [HttpPost("savings/deposit")]
    public async Task<IActionResult> Deposit([FromBody] AmountRequest body, CancellationToken ct)
    {
        if (ValidateAmount(body) is { } bad)
        {
            return bad;
        }

        var account = await EnsureSavingsAsync(ct);
        var latestSnapshot = await GetLatestSnapshotAsync(ct);

        if (latestSnapshot is null)
        {
            return BadRequest("Сначала зафиксируйте баланс текущего счёта");
        }

        if (latestSnapshot.Balance < body.Amount)
        {
            return BadRequest("Недостаточно средств на текущем счёте");
        }

        latestSnapshot.Balance -= body.Amount;

        account.Balance += body.Amount;
        account.UpdatedAt = DateTime.UtcNow;

        await TrackSavingsMissionProgressAsync(ct);

        await _db.SaveChangesAsync(ct);
        return Ok(new { balance = account.Balance });
    }

    [HttpPost("savings/withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] AmountRequest body, CancellationToken ct)
    {
        if (ValidateAmount(body) is { } bad)
        {
            return bad;
        }

        var account = await EnsureSavingsAsync(ct);

        if (account.Balance < body.Amount)
        {
            return BadRequest("Недостаточно средств на накопительном счёте");
        }

        var latestSnapshot = await GetLatestSnapshotAsync(ct);
        if (latestSnapshot is null)
        {
            return BadRequest("Сначала зафиксируйте баланс текущего счёта");
        }

        account.Balance -= body.Amount;
        account.UpdatedAt = DateTime.UtcNow;

        latestSnapshot.Balance += body.Amount;

        await _db.SaveChangesAsync(ct);
        return Ok(new { balance = account.Balance, currentBalance = latestSnapshot.Balance });
    }

    private async Task TrackSavingsMissionProgressAsync(CancellationToken ct)
    {
        const string MissionCode = "SAVINGS_CUSHION";

        var mission = await _db.Missions.FirstOrDefaultAsync(x => x.Code == MissionCode, ct);
        if (mission is null)
        {
            return;
        }

        var progress = await _db.MissionProgresses
            .FirstOrDefaultAsync(x => x.MissionId == mission.Id && x.UserId == UserId, ct);

        if (progress is null)
        {
            progress = new MissionProgress
            {
                MissionId = mission.Id,
                UserId = UserId,
                Status = MissionStatus.InProgress,
                Counter = 0
            };

            _db.MissionProgresses.Add(progress);
        }

        if (progress.Status == MissionStatus.Done)
        {
            if (!mission.Repeatable || !progress.RewardClaimed)
            {
                return;
            }

            progress.Counter = 0;
            progress.Status = MissionStatus.New;
            progress.RewardClaimed = false;
        }

        progress.Counter++;
        progress.Status = progress.Counter >= mission.Target ? MissionStatus.Done : MissionStatus.InProgress;
        progress.UpdatedAt = DateTime.UtcNow;
    }

    [HttpGet("savings")]
    public async Task<IActionResult> GetSavings(CancellationToken ct)
    {
        var account = await EnsureSavingsAsync(ct);
        return Ok(new { balance = account.Balance });
    }

}
