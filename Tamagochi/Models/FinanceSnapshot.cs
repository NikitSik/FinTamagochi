namespace Tamagochi.Models;

// Модель "финансовый снимок"
// Это одна запись о состоянии бюджета пользователя за конкретную дату
public class FinanceSnapshot
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public decimal Income { get; set; }

    public decimal Expenses { get; set; }

    public decimal Balance { get; set; }

    public decimal SavingsRate { get; set; }
}
