using System.ComponentModel.DataAnnotations;

namespace Backend.Helper;


public class ScoreEntry
{
    [Required]
    public int ActivitiesId { get; set; } // ระบุ id กิจกรรม ห้ามซ้ำ
    [Required]
    public string Username { get; set; } = "";
    [Required , Range(0, 5)]
    public int Score { get; set; }
}