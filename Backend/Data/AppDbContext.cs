using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;
using MyWebApi.Models;

namespace MyWebApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Activity> Activities { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ไม่ต้องส่ง JsonSerializerOptions = null
        var listToJsonConverter = new ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null), // ✅ cast ให้ชัด
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
        );

        modelBuilder.Entity<Activity>()
        .Property(a => a.UserJoined)
        .HasConversion(listToJsonConverter)
        .HasColumnType("longtext");   // ✅ MySQL

        modelBuilder.Entity<Activity>()
            .Property(a => a.UserRegistered)
            .HasConversion(listToJsonConverter)
            .HasColumnType("longtext");   // ✅ MySQL
    }
}
