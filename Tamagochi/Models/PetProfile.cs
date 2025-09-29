namespace Tamagochi.Models
{
    public class PetProfile
    {
        public string UserId { get; set; } = null!;
        public string SelectedPetId { get; set; } = "dog"; // 👈 по умолчанию собака
        public List<string> OwnedPetIds { get; set; } = new() { "dog" }; // Собака разблокирована по умолчанию
    }
}
