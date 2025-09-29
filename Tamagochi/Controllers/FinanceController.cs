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

    private string UserId => HttpContext.GetUserId() ?? "demo"; // fallback для локального теста

    [HttpPost("snapshot")]
    public async Task<IActionResult> CreateSnapshot([FromBody] FinanceSnapshot dto, CancellationToken ct)
    {
        dto.UserId = UserId;

        if (dto.SavingsRate == 0 && dto.Income > 0)
            dto.SavingsRate = Math.Round((dto.Income - dto.Expenses) / dto.Income, 4);

        _db.FinanceSnapshots.Add(dto);
        await _db.SaveChangesAsync(ct);
        return Created("", dto);
    }

    [HttpGet("snapshot/latest")]
    public async Task<IActionResult> GetLatest(CancellationToken ct)
    {
        var s = await _db.FinanceSnapshots
            .Where(x => x.UserId == UserId)
            .OrderByDescending(x => x.Date)
            .FirstOrDefaultAsync(ct);

        return s is null ? NotFound() : Ok(s);
    }

    // внутри FinanceController
    private async Task<SavingsAccount> EnsureSavings(CancellationToken ct)
    {
        var s = await _db.SavingsAccounts.FindAsync(new object?[] { UserId }, ct);
        if (s is null) { s = new SavingsAccount { UserId = UserId, Balance = 0m }; _db.SavingsAccounts.Add(s); await _db.SaveChangesAsync(ct); }
        return s;
    }

    public record DepositRequest(decimal Amount);

    [HttpPost("savings/deposit")]
    public async Task<IActionResult> Deposit([FromBody] DepositRequest body, CancellationToken ct)
    {
        if (body.Amount <= 0) return BadRequest("Сумма должна быть > 0");
        var acc = await EnsureSavings(ct);
        acc.Balance += body.Amount;
        acc.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(new { balance = acc.Balance });
    }

    [HttpGet("savings")]
    public async Task<IActionResult> GetSavings(CancellationToken ct)
    {
        var acc = await EnsureSavings(ct);
        return Ok(new { balance = acc.Balance });
    }

}
