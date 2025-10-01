using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Controllers;
using Tamagochi.Data;
using Tamagochi.Infrastructure;
using Tamagochi.Models;
using Xunit;

namespace Tamagochi.Tests.Controllers;

public class FinanceControllerTests
{
    private static TamagochiDbContext CreateContext(string name)
    {
        var options = new DbContextOptionsBuilder<TamagochiDbContext>()
            .UseInMemoryDatabase(name)
            .Options;

        return new TamagochiDbContext(options);
    }

    private static FinanceController CreateController(TamagochiDbContext db, ClaimsPrincipal user)
    {
        var controller = new FinanceController(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = user
                }
            }
        };

        return controller;
    }

    [Fact]
    public async Task GetSavings_UsesSubClaimWhenNameIdentifierMissing()
    {
        using var db = CreateContext(nameof(GetSavings_UsesSubClaimWhenNameIdentifierMissing));
        var userId = "user-123";
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId)
        }, authenticationType: "TestAuth"));

        var controller = CreateController(db, principal);

        var result = await controller.GetSavings(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(userId, controller.HttpContext.GetRequiredUserId());

        var account = await db.SavingsAccounts.SingleAsync(a => a.UserId == userId);
        Assert.Equal(0m, account.Balance);

        var balanceProperty = ok.Value?.GetType().GetProperty("balance");
        Assert.NotNull(balanceProperty);
        Assert.Equal(account.Balance, (decimal)(balanceProperty!.GetValue(ok.Value) ?? 0m));
    }

    [Fact]
    public async Task GetLatest_CreatesDefaultSnapshotForNewUser()
    {
        using var db = CreateContext(nameof(GetLatest_CreatesDefaultSnapshotForNewUser));
        var userId = "user-42";
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        }, authenticationType: "TestAuth"));

        var controller = CreateController(db, principal);

        var result = await controller.GetLatest(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var snapshot = Assert.IsType<FinanceSnapshot>(ok.Value);

        Assert.Equal(userId, snapshot.UserId);
        Assert.Equal(0m, snapshot.Balance);
        Assert.Equal(0m, snapshot.Income);
        Assert.Equal(0m, snapshot.Expenses);
        Assert.NotEqual(default, snapshot.Date);

        var stored = await db.FinanceSnapshots.SingleAsync();
        Assert.Equal(snapshot.Id, stored.Id);

        var savings = await db.SavingsAccounts.SingleAsync();
        Assert.Equal(userId, savings.UserId);
        Assert.Equal(0m, savings.Balance);
    }

    [Fact]
    public async Task TopUpBalance_CreatesSnapshotAndUpdatesBalance()
    {
        using var db = CreateContext(nameof(TopUpBalance_CreatesSnapshotAndUpdatesBalance));
        var userId = "user-99";
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId)
        }, authenticationType: "TestAuth"));

        var controller = CreateController(db, principal);

        var result = await controller.TopUpBalance(new FinanceController.AmountRequest(500m), CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var balanceProperty = ok.Value?.GetType().GetProperty("balance");
        Assert.NotNull(balanceProperty);
        Assert.Equal(500m, (decimal)(balanceProperty!.GetValue(ok.Value) ?? 0m));

        var snapshot = await db.FinanceSnapshots.SingleAsync();
        Assert.Equal(userId, snapshot.UserId);
        Assert.Equal(500m, snapshot.Balance);

        var savings = await db.SavingsAccounts.SingleAsync();
        Assert.Equal(userId, savings.UserId);
        Assert.Equal(0m, savings.Balance);
    }
}