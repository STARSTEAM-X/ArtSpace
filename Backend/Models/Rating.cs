namespace MyWebApi.Models
{
    public class Rating
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public List<string> Score { get; set; } = new();
        public int AgvScore { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}