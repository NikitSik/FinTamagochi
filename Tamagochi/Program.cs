using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Tamagochi.Data;
using Tamagochi.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// ===================== HOST / URLS =====================
// Слушаем по HTTP на всем интерфейсе (5228) + HTTPS (7228).
// Внимание: телефон не доверит дев-сертификату на https://<IP>:7228,
// поэтому для мобильного теста используй http://<IP>:5228.
builder.WebHost.UseUrls("http://0.0.0.0:5228;https://0.0.0.0:7228");

// ===================== SERVICES =====================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<PetStateService>();

// Диагностика JWT (dev)
IdentityModelEventSource.ShowPII = true;
builder.Logging.AddFilter("Microsoft.AspNetCore.Authentication", LogLevel.Debug);
builder.Logging.AddFilter("Microsoft.IdentityModel", LogLevel.Debug);

// ---------- Swagger + Bearer ----------
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Tamagochi API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Введите токен в формате: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference {
                    Type = ReferenceType.SecurityScheme, Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ---------- CORS (фронт: localhost:5173 и твой LAN-IP:5173) ----------
var lanIp = "192.168.0.11"; // <- твой ПК из ipconfig
builder.Services.AddCors(o => o.AddPolicy("Frontend", p =>
    p
        .WithOrigins(
            "http://localhost:5173",
            $"http://{lanIp}:5173"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
// JWT идёт через Authorization header — куки не нужны.
// Если вдруг используешь куки/SignalR с куками, добавь .AllowCredentials()
// и перечисляй конкретные Origins, как выше.
));

// ---------- DbContext (SQL Server) ----------
var connStr = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection");
builder.Services.AddDbContext<TamagochiDbContext>(o => o.UseSqlServer(connStr));

// ---------- JWT ----------
var jwt = builder.Configuration.GetSection("Jwt");
var jwtKey = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key missing");
if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Jwt:Key must be ≥ 32 bytes for HS256.");

builder.Services
    .AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

            ClockSkew = TimeSpan.FromMinutes(1)
        };

        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var auth = ctx.Request.Headers.Authorization.ToString();
                Console.WriteLine("AUTH HEADER = " + auth); // ожидаем "Bearer eyJ..."
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine("JWT fail: " + ctx.Exception);
                return Task.CompletedTask;
            },
            OnChallenge = ctx =>
            {
                Console.WriteLine("JWT challenge: " + ctx.ErrorDescription);
                return Task.CompletedTask;
            }
        };
    });

// ===================== APP PIPELINE =====================
var app = builder.Build();

// Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Tamagochi API v1");
    c.RoutePrefix = "swagger";
});

// В DEV не редиректим на HTTPS, чтобы телефон мог ходить по HTTP
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Если есть обратные прокси/DevTunnel — корректно определяем схемы
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor
});

app.UseCors("Frontend");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Служебный "жив" эндпоинт без авторизации
app.MapGet("/health", () => Results.Ok(new { ok = true, time = DateTimeOffset.UtcNow }))
   .AllowAnonymous();

// Диагностика маршрутов (по желанию)
app.MapGet("/__routes", (EndpointDataSource eds) =>
    Results.Ok(eds.Endpoints.Select(e => e.DisplayName)))
   .AllowAnonymous();

// Авто-миграции на старте
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TamagochiDbContext>();
    db.Database.Migrate();
}

// Проверка токена (оставил с авторизацией; для быстрой проверки можешь временно .AllowAnonymous())
app.MapGet("/whoami", (HttpContext ctx) =>
{
    var user = ctx.User;
    var isAuth = user?.Identity?.IsAuthenticated ?? false;
    var id = user?.FindFirst("sub")?.Value
          ?? user?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    return Results.Json(new
    {
        isAuth,
        name = user?.Identity?.Name,
        id,
        claims = user?.Claims.Select(c => new { c.Type, c.Value })
    });
}).RequireAuthorization();

app.Run();
