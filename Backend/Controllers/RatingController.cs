using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using MyWebApi.Data;
using MyWebApi.Models;
using MyWebApi.Services;

using Backend.Helper;

[ApiController]
[Route("api/[controller]")]
public class RatingController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<RatingController> _logger;

    public RatingController(AppDbContext db, IConfiguration config, ILogger<RatingController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    // POST: api/rating/add
    [HttpPost("add")]
    [Authorize]
    public async Task<IActionResult> AddRating([FromBody] ScoreEntry dto)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var voter = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (voter == null) return NotFound();

        // ❌ ห้ามโหวตตัวเอง
        if (dto.Username == username)
        {
            return BadRequest(new { message = "You cannot rate yourself." });
        }

        // ✅ ตรวจสอบว่ากิจกรรมมีจริง
        var activity = await _db.Activities.FirstOrDefaultAsync(a => a.Id == dto.ActivitiesId);
        if (activity == null)
        {
            return NotFound(new { message = "Activity not found." });
        }

        // ✅ ตรวจสอบว่าคนที่โหวตอยู่ในกิจกรรมนี้หรือไม่
        if (!activity.UserJoined.Contains(username))
        {
            return BadRequest(new { message = "You must join the activity before rating." });
        }

        // ✅ หา Rating ของ user ที่ถูกโหวต
        var rating = await _db.Ratings.FirstOrDefaultAsync(r => r.Username == dto.Username);

        if (rating == null)
        {
            // ยังไม่มี record -> สร้างใหม่
            rating = new Rating
            {
                Username = dto.Username,
                Score = new List<ScoreEntry>
                {
                    new ScoreEntry
                    {
                        ActivitiesId = dto.ActivitiesId,
                        Username = username,
                        Score = dto.Score
                    }
                },
                CreatedAt = DateTime.UtcNow
            };
            _db.Ratings.Add(rating);
        }
        else
        {
            // ✅ ถ้ามีการโหวตซ้ำจาก user เดิมในกิจกรรมเดิม -> อัปเดตค่าใหม่
            var existing = rating.Score
                .FirstOrDefault(s => s.ActivitiesId == dto.ActivitiesId && s.Username == username);

            if (existing != null)
            {
                existing.Score = dto.Score; // อัปเดตคะแนนล่าสุด
            }
            else
            {
                rating.Score.Add(new ScoreEntry
                {
                    ActivitiesId = dto.ActivitiesId,
                    Username = username,
                    Score = dto.Score
                });
            }

            _db.Ratings.Update(rating);
        }

        await _db.SaveChangesAsync();

        return Ok(new { message = "Rating saved successfully", ratingId = rating.Id });
    }

}