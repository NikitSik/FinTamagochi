namespace Tamagochi.DTOs;

public record ShopItemDto(
    string Id, string Title, int Price, string Type, bool Enabled
);
