using System.ComponentModel.DataAnnotations;

public class RegisterDto
{
    [Required, MinLength(3)]
    public string Username { get; set; } = null!;

    [Required, MinLength(6)]
    public string Password { get; set; } = null!;

    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    public string Nickname { get; set; } = "";

    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string DateOfBirth { get; set; } = "";
    public string Gender { get; set; } = "";
    public bool IsAdmin { get; set; } = false;
}
