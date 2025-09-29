using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Tamagochi.Data;

[ApiController]
[Route("api/users")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class UsersController : ControllerBase
{
    private readonly TamagochiDbContext _db;
    private readonly IWebHostEnvironment _env;

    public UsersController(TamagochiDbContext db, IWebHostEnvironment env)
    {
        _db = db; _env = env;
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst("sub")?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var u = await _db.Users.AsNoTracking()
            .Where(x => x.PublicId == userId)
            .Select(x => new
            {
                id = x.PublicId,
                nickname = x.Nickname,
                avatarUrl = x.AvatarUrl, // <-- теперь из БД
                level = 1,
                finHealth = 72
            })
            .FirstOrDefaultAsync();

        return u is null ? NotFound() : Ok(u);
    }

    // === Загрузка аватара ===
    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var userId = User.FindFirst("sub")?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        if (file is null || file.Length == 0) return BadRequest("Файл пуст");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.PublicId == userId);
        if (user is null) return NotFound();

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(ext)) return BadRequest("Разрешены: jpg, png, webp");

        var fname = $"{user.PublicId}{ext}";
        var dir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "avatars");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, fname);
        await using (var fs = System.IO.File.Create(path))
            await file.CopyToAsync(fs);

        var publicUrl = $"/avatars/{fname}";
        user.AvatarUrl = publicUrl;
        await _db.SaveChangesAsync();

        var req = HttpContext.Request;
        var baseUrl = $"{req.Scheme}://{req.Host}";
        return Ok(new { url = $"{baseUrl}{publicUrl}" }); // фронт ждёт { url }
    }


}
