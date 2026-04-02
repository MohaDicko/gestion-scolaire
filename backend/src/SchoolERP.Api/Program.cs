using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Infrastructure.Persistence;
using SchoolERP.Infrastructure.Services;
using SchoolERP.Application.Common.Interfaces;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

// ── CONTROLLERS ─────────────────────────────────────────────────
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpContextAccessor();

// ── SWAGGER with JWT support ─────────────────────────────────────
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SchoolERP API",
        Version = "v1",
        Description = "Multi-tenant School ERP/SIS REST API"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization. Enter: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

// ── DATABASE ─────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    // Détection automatique : PostgreSQL (Docker/Prod) ou SQLite (dev local)
    if (connectionString.StartsWith("Host=", StringComparison.OrdinalIgnoreCase))
    {
        options.UseNpgsql(connectionString, npgsql =>
            npgsql.MigrationsAssembly("SchoolERP.Infrastructure"));
    }
    else
    {
        options.UseSqlite(connectionString, sqlite =>
            sqlite.MigrationsAssembly("SchoolERP.Infrastructure"));
    }
});

// ── MULTI-TENANT SERVICE ──────────────────────────────────────────
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IUnitOfWork>(provider => provider.GetRequiredService<AppDbContext>());
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// ── JWT AUTHENTICATION ────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(
                builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ── MediatR (CQRS) ────────────────────────────────────────────────
var applicationAssembly = System.Reflection.Assembly.Load("SchoolERP.Application");

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(applicationAssembly);
    cfg.AddOpenBehavior(typeof(SchoolERP.Application.Common.Behaviors.ValidationBehavior<,>));
});

// ── VALIDATION ────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssembly(applicationAssembly);

var app = builder.Build();

// ── MIDDLEWARE PIPELINE ───────────────────────────────────────────
app.UseMiddleware<SchoolERP.Api.Middleware.ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "SchoolERP API v1"));
}

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── AUTO-MIGRATE ON STARTUP ────────────────────
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    Console.WriteLine($"✅ Database migration applied successfully. Environment: {app.Environment.EnvironmentName}");
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️  Database migration skipped: {ex.Message}");
    Console.WriteLine("   Make sure PostgreSQL is running and connection string is correct.");
}

app.Run();
