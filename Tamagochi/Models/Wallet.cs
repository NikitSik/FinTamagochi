namespace Tamagochi.Models;

public class Wallet
{
    public string UserId { get; set; } = default!;
    public int Coins { get; set; } = 0;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
