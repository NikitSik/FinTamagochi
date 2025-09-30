namespace Tamagochi.Models;

// Статусы выполнения миссии
public enum MissionStatus
{
    New = 0,        
    InProgress = 1, 
    Done = 2       
}

// Таблица "прогресс миссий"
// Хранит состояние выполнения миссии конкретным пользователем
public class MissionProgress
{
    public int Id { get; set; }
    public int MissionId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public MissionStatus Status { get; set; } = MissionStatus.New;
    public int Counter { get; set; } = 0;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool RewardClaimed { get; set; } = false;
}
