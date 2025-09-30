using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tamagochi.Controllers;
using Tamagochi.Data;
using Tamagochi.Models;
using Xunit;

namespace Tamagochi.Tests;

public class FinanceControllerTests
{
    private static FinanceController CreateController(out TamagochiDbContext db)
    {
        var options = new DbContextOptionsBuilder<TamagochiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        db = new TamagochiDbContext(options);

        db.Missions.Add(new Mission
        {
            Id = 42,
            Code = "SAVINGS_CUSHION",
            Title = "Подушка",
            Description = "",
            ProductTag = "long_savings",
            RewardCoins = 0,
            RewardXp = 0,
            Target = 3,
            Repeatable = true,
        });

        db.SaveChanges();

        var controller = new FinanceController(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        return controller;
    }

    [Fact]
    public async Task Deposit_IncreasesBalanceAndTracksProgress()
    {
        var controller = CreateController(out var db);

        var result = await controller.Deposit(new FinanceController.DepositRequest(150m), CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result);
        var balanceValue = ok.Value?.GetType().GetProperty("balance")?.GetValue(ok.Value);
        Assert.Equal(150m, Assert.IsType<decimal>(balanceValue));

        var account = await db.SavingsAccounts.SingleAsync();
        Assert.Equal("demo", account.UserId);
        Assert.Equal(150m, account.Balance);

        var progress = await db.MissionProgresses.SingleAsync();
        Assert.Equal(1, progress.Counter);
        Assert.Equal(MissionStatus.InProgress, progress.Status);
    }

    [Fact]
    public async Task Deposit_CompletesMissionWhenTargetReached()
    {
        var controller = CreateController(out var db);

        await controller.Deposit(new FinanceController.DepositRequest(100m), CancellationToken.None);
        await controller.Deposit(new FinanceController.DepositRequest(100m), CancellationToken.None);
        await controller.Deposit(new FinanceController.DepositRequest(100m), CancellationToken.None);

        var account = await db.SavingsAccounts.SingleAsync();
        Assert.Equal(300m, account.Balance);

        var progress = await db.MissionProgresses.SingleAsync();
        Assert.Equal(3, progress.Counter);
        Assert.Equal(MissionStatus.Done, progress.Status);
        Assert.False(progress.RewardClaimed);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-50)]
    public async Task Deposit_InvalidAmount_ReturnsBadRequest(decimal amount)
    {
        var controller = CreateController(out var db);

        var result = await controller.Deposit(new FinanceController.DepositRequest(amount), CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(await db.SavingsAccounts.ToListAsync());
        Assert.Empty(await db.MissionProgresses.ToListAsync());
    }
}