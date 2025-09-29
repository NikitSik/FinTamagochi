namespace Tamagochi.Models;
public class SavingsAccount
{
    public string UserId { get; set; } = default!;
    public decimal Balance { get; set; } = 0m;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}