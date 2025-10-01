using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MyWebApi.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------
// 1️⃣ Database Configuration
// ---------------------------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new Exception("Connection string 'DefaultConnection' not found."),
        new MySqlServerVersion(new Version(8, 0, 36))
    ));

// ---------------------------
// 2️⃣ JWT Authentication
// ---------------------------
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrEmpty(jwtKey)) throw new Exception("JWT Key is not configured!");
if (string.IsNullOrEmpty(jwtIssuer)) throw new Exception("JWT Issuer is not configured!");
if (string.IsNullOrEmpty(jwtAudience)) throw new Exception("JWT Audience is not configured!");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ---------------------------
// 3️⃣ CORS Configuration
// ---------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("*") // TODO: แนะนำให้เปลี่ยนเป็น URL จริงของ frontend
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ---------------------------
// 4️⃣ Controllers
// ---------------------------
builder.Services.AddControllers();

// ---------------------------
// 5️⃣ Build & Middleware
// ---------------------------
var app = builder.Build();

app.UseStaticFiles();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
