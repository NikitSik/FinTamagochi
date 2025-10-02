// DTOs/PetStateDto.cs
namespace Tamagochi.DTOs;

public record PetStateDto(
    int Mood,
    int Satiety,
    int Health,
    int Coins,
    string Background,
    List<string> Items,
    List<InventoryConsumableDto> Consumables,
    string SelectedPetId,
    List<string> OwnedPetIds
);
