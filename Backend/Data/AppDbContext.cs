using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;
using MyWebApi.Models;
using Backend.Helper;
namespace MyWebApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Activity> Activities { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Rating> Ratings { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var listToJsonConverter = new ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null), // ✅ cast ให้ชัด
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>()
        );

        var scoreListConverter = new ValueConverter<List<ScoreEntry>, string>(
            v => JsonSerializer.Serialize<List<ScoreEntry>>(v, new JsonSerializerOptions()),
            v => JsonSerializer.Deserialize<List<ScoreEntry>>(v, new JsonSerializerOptions()) ?? new List<ScoreEntry>()
        );

        modelBuilder.Entity<Activity>()
            .Property(a => a.UserJoined)
            .HasConversion(listToJsonConverter)
            .HasColumnType("longtext");   // ✅ MySQL

        modelBuilder.Entity<Activity>()
            .Property(a => a.UserRegistered)
            .HasConversion(listToJsonConverter)
            .HasColumnType("longtext");   // ✅ MySQL

        modelBuilder.Entity<User>()
            .Property(u => u.JoinedList)
            .HasConversion(listToJsonConverter)
            .HasColumnType("longtext");   // ✅ MySQL

        modelBuilder.Entity<User>()
            .Property(u => u.CreatedList)
            .HasConversion(listToJsonConverter)
            .HasColumnType("longtext");   // ✅ MySQL

        modelBuilder.Entity<User>()
            .Property(u => u.PostedList)
            .HasConversion(listToJsonConverter)
            .HasColumnType("longtext");   // ✅ MySQL

        modelBuilder.Entity<Rating>()
            .Property(r => r.Score)
            .HasConversion(scoreListConverter)
            .HasColumnType("longtext");  // ✅ MySQL
    }
}