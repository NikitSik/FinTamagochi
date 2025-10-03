using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Tamagochi.Data;
using Microsoft.IdentityModel.Logging;
using Tamagochi.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// --------------------- Services ---------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddScoped<PetStateService>();

IdentityModelEventSource.ShowPII = true;
builder.Logging.AddFilter("Microsoft.AspNetCore.Authentication", LogLevel.Debug);
builder.Logging.AddFilter("Microsoft.IdentityModel", LogLevel.Debug);

// Swagger + Bearer
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
        Description = "Введите токен: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(o => o.AddPolicy("Frontend", p =>
    p.WithOrigins(
        "http://localhost:5173",
        "http://localhost:3000",
        "https://melodious-zabaione-f06738.netlify.app",
        "http://192.168.0.12:5173",
        "http://192.168.0.12:3000",
        "https://localhost:7228"
    )
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()
));

var connStr = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection");

builder.Services.AddDbContext<TamagochiDbContext>(o =>
    o.UseNpgsql(connStr));

// JWT auth (как было)
var jwt = builder.Configuration.GetSection("Jwt");
var keyStr = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key missing");
if (Encoding.UTF8.GetByteCount(keyStr) < 32)
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
            IssuerSigningKey =
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),

            // чтобы строгая проверка срока не падала из-за часов
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                // Посмотрим, что реально пришло в заголовке
                var auth = ctx.Request.Headers.Authorization.ToString();
                Console.WriteLine("AUTH HEADER = " + auth); // должен быть "Bearer eyJ..."
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



// --------------------- App pipeline ---------------------
var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Tamagochi API v1");
    c.RoutePrefix = "swagger";
});

// В DEV НЕ ПРИНУЖДАЕМ К HTTPS — иначе фронт по HTTP не попадёт
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseCors("Frontend");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Диагностика маршрутов (по желанию)
app.MapGet("/__routes", (EndpointDataSource eds) =>
    Results.Ok(eds.Endpoints.Select(e => e.DisplayName)));

// Авто-миграции на старте (как было)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TamagochiDbContext>();
    db.Database.EnsureCreated();
}

// Program.cs, до app.Run()
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
}).RequireAuthorization();  // важно: требует Bearer


app.Run();
