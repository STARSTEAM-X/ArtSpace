namespace MyWebApi.Models;
public class Community
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public string Discription { get; set; } = "";
    public string Image { get; set; } = "";
    public string Type { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}