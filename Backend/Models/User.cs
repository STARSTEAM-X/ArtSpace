namespace MyWebApi.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Nickname { get; set; } = "";
    public string Email { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string DateOfBirth { get; set; } = "";
    public string Gender { get; set; } = "";
    public string ProfileImg { get; set; } = "";
    public List<string> GalleryList { get; set; } = new();
    public List<string> JoinedList { get; set; } = new();
    public List<string> CreatedList { get; set; } = new();
    public List<string> PostedList { get; set; } = new();
    public bool IsAdmin { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
