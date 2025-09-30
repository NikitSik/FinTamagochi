namespace Tamagochi.Models;

public class PetStatus
{
    public string UserId { get; set; } = default!;
    public int Mood { get; set; } = 70;
    public int Satiety { get; set; } = 50;
    public int Health { get; set; } = 100;
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastFedAt { get; set; }
    public DateTime? LastPlayedAt { get; set; }
    public DateTime? LastHealedAt { get; set; }
}