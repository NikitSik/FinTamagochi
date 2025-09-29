using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using Tamagochi.Data;
using Tamagochi.DTOs;
using Tamagochi.Models;
using Tamagochi.Infrastructure;

namespace Tamagochi.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly TamagochiDbContext _db;
    private readonly IConfiguration _cfg;

    public AuthController(TamagochiDbContext db, IConfiguration cfg)
    {
        _db = db;
        _cfg = cfg;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        if (await _db.Users.AnyAsync(u => u.Nickname == req.Nickname, ct))
            return BadRequest("Nickname already taken");

        var user = new User
        {
            Nickname = req.Nickname,
            PasswordHash = HashPassword(req.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        var token = JwtHelper.IssueJwt(user.PublicId, user.Nickname, _cfg);
        return Ok(new AuthResponse(user.PublicId, token));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Nickname == req.Nickname, ct);
        if (user == null || user.PasswordHash != HashPassword(req.Password))
            return Unauthorized("Invalid nickname or password");

        var token = JwtHelper.IssueJwt(user.PublicId, user.Nickname, _cfg);
        return Ok(new AuthResponse(user.PublicId, token));
    }

    private static string HashPassword(string password)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}
