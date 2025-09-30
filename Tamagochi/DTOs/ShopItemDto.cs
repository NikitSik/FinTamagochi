namespace Tamagochi.DTOs;

public record ShopItemEffectDto(int? Satiety, int? Mood, int? Health);

public record ShopItemDto(
     string Id,
    string Title,
    string? Description,
    int Price,
    string Type,
    bool Enabled,
    ShopItemEffectDto? Effect
);
