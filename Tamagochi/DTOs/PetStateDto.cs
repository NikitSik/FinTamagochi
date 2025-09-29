// DTOs/PetStateDto.cs
namespace Tamagochi.DTOs;

public record PetStateDto(
    int Mood,
    int Satiety,
    int Health,
    int Coins,
    string Background,
    List<string> Items,
    string SelectedPetId,
    List<string> OwnedPetIds
);
