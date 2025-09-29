using System.Security.Claims;

namespace Tamagochi.Infrastructure;

public static class HttpContextUserExtensions
{
    public static string? GetUserId(this HttpContext ctx)
        => ctx.User?.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
}
