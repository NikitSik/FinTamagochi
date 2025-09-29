using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Tamagochi.Data;
using Tamagochi.Infrastructure;

namespace Tamagochi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class UsersController : ControllerBase
{
    private readonly TamagochiDbContext _db;
    private readonly IWebHostEnvironment _env;

    public UsersController(TamagochiDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = HttpContext.GetUserId() ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _db.Users.AsNoTracking()
            .Where(x => x.PublicId == userId)
            .Select(x => new
            {
                id = x.PublicId,
                nickname = x.Nickname,
                avatarUrl = x.AvatarUrl,
                level = 1,
                finHealth = 72
            })
            .FirstOrDefaultAsync();

        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        var userId = HttpContext.GetUserId() ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest("Файл пуст");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.PublicId == userId);
        if (user is null)
        {
            return NotFound();
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(extension))
        {
            return BadRequest("Разрешены: jpg, png, webp");
        }

        var fileName = $"{user.PublicId}{extension}";
        var root = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var avatarDirectory = Path.Combine(root, "avatars");
        Directory.CreateDirectory(avatarDirectory);

        var fullPath = Path.Combine(avatarDirectory, fileName);
        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var publicUrl = $"/avatars/{fileName}";
        user.AvatarUrl = publicUrl;
        await _db.SaveChangesAsync();

        var request = HttpContext.Request;
        var baseUrl = $"{request.Scheme}://{request.Host}";
        return Ok(new { url = $"{baseUrl}{publicUrl}" });
    }
}
