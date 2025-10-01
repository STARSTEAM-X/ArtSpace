using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using MyWebApi.Data;
using MyWebApi.Models;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(AppDbContext db, IConfiguration config, ILogger<NotificationController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    // ✅ ดึง notification ของ user ที่ login อยู่
    // GET: api/notification/my
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyNotifications()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var notis = await _db.Notifications
            .Where(n => n.Username == username)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(notis);
    }

    // ✅ สร้าง notification ใหม่ (ใช้สำหรับ admin หรือระบบยิงให้ user)
    [HttpPost("create")]
    [Authorize]
    public async Task<IActionResult> CreateNotification([FromBody] Notification dto)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        // สมมติว่า Admin เท่านั้นที่สามารถยิง noti ให้ user อื่นได้
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null || !user.IsAdmin)
        {
            return Forbid("Only admin can create notifications for others.");
        }

        var noti = new Notification
        {
            Username = dto.Username, // ผู้รับ noti
            Title = dto.Title,
            Message = dto.Message,
            Type = dto.Type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(noti);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Notification created successfully", noti });
    }

    // ✅ Mark as read
    // PUT: api/notification/read/{id}
    [HttpPut("read/{id}")]
    [Authorize]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var noti = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.Username == username);
        if (noti == null) return NotFound(new { message = "Notification not found" });

        noti.IsRead = true;
        _db.Notifications.Update(noti);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Notification marked as read", noti });
    }
}