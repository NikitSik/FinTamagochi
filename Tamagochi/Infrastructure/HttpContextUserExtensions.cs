using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Tamagochi.Infrastructure;

public static class HttpContextUserExtensions
{
    public static string? GetUserId(this HttpContext ctx)
    {
        if (ctx.User is not { Identity: { IsAuthenticated: true } })
        {
            return null;
        }

        return ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? ctx.User.FindFirstValue(JwtRegisteredClaimNames.Sub);
    }

    public static string GetRequiredUserId(this HttpContext ctx)
        => GetUserId(ctx) ?? throw new InvalidOperationException("User identifier is missing in the current context.");
}