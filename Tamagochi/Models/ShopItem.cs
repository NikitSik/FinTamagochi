namespace Tamagochi.Models;

public class ShopItem
{
    public string Id { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public int Price { get; set; }
    public string Type { get; set; } = default!; // "food" | "medicine" | "bg" | "item"
    public string? PayloadJson { get; set; }     // произвольный JSON (например {"background":"sky"} или {"item":"ball"} )
    public bool Enabled { get; set; } = true;
}
