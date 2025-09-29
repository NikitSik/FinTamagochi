namespace Tamagochi.Models;

// Модель "миссия"
// Это задание для пользователя, связанное с продуктами банка
public class Mission
{
    public int Id { get; set; }
    public string Code { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string ProductTag { get; set; } = default!;
    public int RewardCoins { get; set; }
    public int RewardXp { get; set; }
    public int Target { get; set; } = 1;
    public bool Repeatable { get; set; } = false;
}
