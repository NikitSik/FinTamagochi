using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Tamagochi.Infrastructure;

public static class JwtHelper
{
    public static string IssueJwt(string userId, string nickname, IConfiguration cfg)
    {
        var jwt = cfg.GetSection("Jwt");
        var keyStr = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key missing");

        if (Encoding.UTF8.GetByteCount(keyStr) < 32)
            throw new InvalidOperationException("Jwt:Key must be ≥ 32 bytes.");

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr)),
            SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim("nickname", nickname)
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
