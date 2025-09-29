using System.ComponentModel.DataAnnotations;

namespace Tamagochi.Models
{
    // Модель "питомец" (Tamagochi)
    // Это одна запись в таблице Tamagochis
    public class Tamagochi
    {
        public int Id { get; set; }

        [Required, StringLength(50)]
        public string Title { get; set; } = default!;

        [Required, StringLength(50)]
        public string Developer { get; set; } = default!;
    }
}
