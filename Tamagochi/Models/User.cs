using System.ComponentModel.DataAnnotations;

namespace Tamagochi.Models;

public class User
{
    public int Id { get; set; }

    public string? AvatarUrl { get; set; }

    [Required]
    public string PublicId { get; set; } = Guid.NewGuid().ToString();

    [Required, MaxLength(50)]
    public string Nickname { get; set; } = default!;

    [Required]
    public string PasswordHash { get; set; } = default!;
}
