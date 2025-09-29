namespace Tamagochi.Models;
public class Inventory
{
    public string UserId { get; set; } = default!;
    public string Background { get; set; } = "default";
    public List<string> Items { get; set; } = new();
    public List<string> OwnedPets { get; set; } = new() { "dog" }; // стартовый пес
    public string SelectedPetId { get; set; } = "dog";
}

