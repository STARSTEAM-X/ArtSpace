namespace MyWebApi.Models
{
    public class Activity
    {
        public int Id { get; set; }
        public string ActivityName { get; set; } = "";
        public string ActivityDescription { get; set; } = "";
        public DateTime ActivityDateStart { get; set; }
        public DateTime ActivityDateEnd { get; set; }
        public string ActivityTimeStart { get; set; } = "";
        public string ActivityTimeEnd { get; set; } = "";
        public string Location { get; set; } = "";
        public DateTime AnnounceDateEnd { get; set; }
        public string AnnounceTimeEnd { get; set; } = "";
        public string ActivityType { get; set; } = "";
        public int MaxParticipants { get; set; } = 0;
        public string ImageUrl { get; set; } = "";
        public string Status { get; set; } = "";
        public bool IsActive { get; set; } = true;
        // เก็บเป็น List ตรง ๆ เลย
        public List<string> UserJoined { get; set; } = new();
        public List<string> UserRegistered { get; set; } = new();
        public string CreatedByUserName { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
