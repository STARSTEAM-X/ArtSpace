using Backend.Helper;
namespace MyWebApi.Models
{
    public class Rating
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public List<ScoreEntry> Score { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}