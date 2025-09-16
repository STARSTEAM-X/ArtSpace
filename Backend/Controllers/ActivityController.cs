using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using MyWebApi.Data;
using MyWebApi.Models;
using MyWebApi.Services;

[ApiController]
[Route("api/[controller]")]
public class ActivityController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<ActivityController> _logger;

    public ActivityController(AppDbContext db, IConfiguration config, ILogger<ActivityController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    // POST: api/activity/createactivity
    [HttpPost("createactivity")]
    [Authorize] // ✅ ต้อง login ก่อน
    public async Task<IActionResult> CreateActivity([FromForm] Activity dto, IFormFile? activityImage)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username))
        {
            return Unauthorized(new { message = "Unauthorized" });
        }

        string activityImgPath = "";
        if (activityImage != null)
        {
            activityImgPath = await FileService.UploadFileAsync(activityImage, "activity");
        }

        var activity = new Activity
        {
            ActivityName = dto.ActivityName,
            ActivityDescription = dto.ActivityDescription,
            ActivityDateStart = dto.ActivityDateStart,
            ActivityDateEnd = dto.ActivityDateEnd,
            ActivityTimeStart = dto.ActivityTimeStart,
            ActivityTimeEnd = dto.ActivityTimeEnd,
            Location = dto.Location,
            AnnounceDateEnd = dto.AnnounceDateEnd,
            AnnounceTimeEnd = dto.AnnounceTimeEnd,
            ActivityType = dto.ActivityType,
            MaxParticipants = dto.MaxParticipants,
            ImageUrl = activityImgPath,
            IsActive = true,
            CreatedByUserName = username, // ✅ ใช้ JWT
            CreatedAt = DateTime.UtcNow
        };

        _db.Activities.Add(activity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetActivities), new { id = activity.Id }, activity);
    }

    // GET: api/activity/list
    [HttpGet("list")]
    public async Task<IActionResult> GetActivities()
    {
        var activities = await _db.Activities
            .Where(a => a.IsActive)
            .Select(a => new
            {
                a.Id,
                a.ActivityName,
                a.ActivityDescription,
                a.ActivityDateStart,
                a.ActivityDateEnd,
                a.ActivityTimeStart,
                a.ActivityTimeEnd,
                a.Location,
                a.AnnounceDateEnd,
                a.AnnounceTimeEnd,
                a.ActivityType,
                cerrentParticipants = a.UserJoined.Count+a.UserRegistered.Count,
                a.MaxParticipants,
                a.ImageUrl,
                a.IsActive,
                a.CreatedByUserName,
                a.CreatedAt
            })
            .ToListAsync();
        return Ok(activities);
    }

    // POST: api/activity/join
    [HttpPost("join")]
    [Authorize]
    public async Task<IActionResult> JoinActivity([FromBody] JoinRequest dto)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var activity = await _db.Activities.FindAsync(dto.ActivityId);
        if (activity == null) return NotFound(new { message = "Activity not found" });

        if (activity.UserRegistered.Contains(username) || activity.UserJoined.Contains(username))
        {
            return BadRequest(new { message = "User already joined or registered" });
        }

        var registered = activity.UserRegistered.ToList();
        registered.Add(username);
        activity.UserRegistered = registered;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "User joined successfully",
            activity.Id,
            RegisteredUsers = activity.UserRegistered,
            JoinedUsers = activity.UserJoined
        });
    }

    // POST: api/activity/leave
    [HttpPost("leave")]
    [Authorize]
    public async Task<IActionResult> LeaveActivity([FromBody] JoinRequest dto)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var activity = await _db.Activities.FindAsync(dto.ActivityId);
        if (activity == null) return NotFound(new { message = "Activity not found" });

        bool removed = false;

        if (activity.UserRegistered.Contains(username))
        {
            var registered = activity.UserRegistered.ToList();
            registered.Remove(username);
            activity.UserRegistered = registered;
            removed = true;
        }
        else if (activity.UserJoined.Contains(username))
        {
            var joined = activity.UserJoined.ToList();
            joined.Remove(username);
            activity.UserJoined = joined;
            removed = true;
        }

        if (!removed)
        {
            return BadRequest(new { message = "User is not registered or joined in this activity" });
        }

        _db.Activities.Update(activity);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "User left activity successfully",
            activity.Id,
            RegisteredUsers = activity.UserRegistered,
            JoinedUsers = activity.UserJoined
        });
    }

    // POST: api/activity/confirmjoin
    [HttpPost("confirmjoin")]
    [Authorize]
    public async Task<IActionResult> ConfirmJoin([FromBody] JoinRequest dto)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var activity = await _db.Activities.FindAsync(dto.ActivityId);
        if (activity == null) return NotFound(new { message = "Activity not found" });

        if (!activity.UserRegistered.Contains(username))
        {
            return BadRequest(new { message = "User is not registered for this activity" });
        }

        if (activity.UserJoined.Contains(username))
        {
            return BadRequest(new { message = "User already joined" });
        }

        var registered = activity.UserRegistered.ToList();
        registered.Remove(username);
        activity.UserRegistered = registered;

        var joined = activity.UserJoined.ToList();
        joined.Add(username);
        activity.UserJoined = joined;

        _db.Activities.Update(activity);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "User confirmed join successfully",
            activity.Id,
            RegisteredUsers = activity.UserRegistered,
            JoinedUsers = activity.UserJoined
        });
    }

    // GET: api/activity/detail/{id}
    [HttpGet("detail/{id}")]
    public async Task<IActionResult> GetActivityDetail(int id)
    {
        var activity = await _db.Activities
            .Where(a => a.Id == id && a.IsActive)
            .Select(a => new
            {
                a.Id,
                a.ActivityName,
                a.ActivityDescription,
                a.ActivityDateStart,
                a.ActivityDateEnd,
                a.ActivityTimeStart,
                a.ActivityTimeEnd,
                a.Location,
                a.AnnounceDateEnd,
                a.AnnounceTimeEnd,
                a.ActivityType,
                cerrentParticipants = a.UserJoined.Count,
                a.MaxParticipants,
                a.ImageUrl,
                a.IsActive,
                a.UserJoined,
                a.UserRegistered,
                a.CreatedByUserName,
                a.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (activity == null) return NotFound(new { message = "Activity not found" });

        return Ok(activity);
    }

    // DELETE: api/activity/delete/{id}
    [HttpDelete("delete/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteActivity(int id)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var activity = await _db.Activities.FindAsync(id);
        if (activity == null || !activity.IsActive)
        {
            return NotFound(new { message = "Activity not found" });
        }

        if (!string.Equals(activity.CreatedByUserName, username, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Only the creator can delete this activity.");
        }

        activity.IsActive = false;
        _db.Activities.Update(activity);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Activity deleted successfully" });
    }

    // PUT: api/activity/update/{id}
    [HttpPut("update/{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateActivity(int id, [FromForm] Activity dto, IFormFile? activityImage)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username))
            return Unauthorized(new { message = "Unauthorized" });

        var activity = await _db.Activities.FindAsync(id);
        if (activity == null || !activity.IsActive)
            return NotFound(new { message = "Activity not found" });

        // ✅ ตรวจสอบว่าเป็นเจ้าของเท่านั้น
        if (!string.Equals(activity.CreatedByUserName, username, StringComparison.OrdinalIgnoreCase))
            return Forbid("Only the creator can update this activity.");

        // อัปโหลดรูปใหม่ (ถ้ามี)
        string activityImgPath = activity.ImageUrl;
        if (activityImage != null)
        {
            activityImgPath = await FileService.UploadFileAsync(activityImage, "activity");
        }

        // อัปเดตค่าใหม่จาก client
        activity.ActivityName = dto.ActivityName;
        activity.ActivityDescription = dto.ActivityDescription;
        activity.ActivityDateStart = dto.ActivityDateStart;
        activity.ActivityDateEnd = dto.ActivityDateEnd;
        activity.ActivityTimeStart = dto.ActivityTimeStart;
        activity.ActivityTimeEnd = dto.ActivityTimeEnd;
        activity.Location = dto.Location;
        activity.MaxParticipants = dto.MaxParticipants;
        activity.AnnounceDateEnd = dto.AnnounceDateEnd;
        activity.AnnounceTimeEnd = dto.AnnounceTimeEnd;
        activity.ActivityType = dto.ActivityType;
        activity.ImageUrl = activityImgPath;

        _db.Activities.Update(activity);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Activity updated successfully", activity });
    }

}