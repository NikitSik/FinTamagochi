using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Controllers;
using Tamagochi.Data;
using Tamagochi.Infrastructure;
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
}