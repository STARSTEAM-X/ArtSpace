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
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<ProfileController> _logger;

    public ProfileController(AppDbContext db, IConfiguration config, ILogger<ProfileController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    // GET: api/profile/myprofile
    [HttpGet("myprofile")]
    [Authorize]
    public async Task<IActionResult> GetMyProfile()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return NotFound();

        // ดึง id list จาก user
        var joinedIds = user.JoinedList.Select(id => int.TryParse(id, out var val) ? val : -1).Where(id => id > 0).ToList();
        var createdIds = user.CreatedList.Select(id => int.TryParse(id, out var val) ? val : -1).Where(id => id > 0).ToList();
        var postedIds = user.PostedList.Select(id => int.TryParse(id, out var val) ? val : -1).Where(id => id > 0).ToList();

        // ดึง activities จริง
        var joinedActivities = await _db.Activities.Where(a => joinedIds.Contains(a.Id)).ToListAsync();
        var createdActivities = await _db.Activities.Where(a => createdIds.Contains(a.Id)).ToListAsync();
        var postedActivities = await _db.Activities.Where(a => postedIds.Contains(a.Id)).ToListAsync();

        // ดึง ratings ที่ user นี้ถูกโหวต
        var ratings = await _db.Ratings.Where(r => r.Username == username).ToListAsync();

        var allScores = ratings.SelectMany(r => r.Score);
        var totalScore = allScores.Sum(s => s.Score);
        var countScore = allScores.Count();
        var avgScore = countScore > 0 ? (double)totalScore / countScore : 0;

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.Nickname,
            user.FirstName,
            user.LastName,
            user.DateOfBirth,
            user.Gender,
            user.ProfileImg,
            user.GalleryList,
            user.IsAdmin,
            user.IsActive,
            user.CreatedAt,
            JoinedActivities = joinedActivities,
            CreatedActivities = createdActivities,
            PostedActivities = postedActivities,
            Ratings = ratings,
            AverageScore = avgScore
        });
    }

    // GET: api/profile/{username}
    [HttpGet("{username}")]
    [Authorize]
    public async Task<IActionResult> GetUserProfile(string username)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return NotFound();

        var joinedIds = user.JoinedList.Select(id => int.TryParse(id, out var val) ? val : -1).Where(id => id > 0).ToList();
        var createdIds = user.CreatedList.Select(id => int.TryParse(id, out var val) ? val : -1).Where(id => id > 0).ToList();
        var postedIds = user.PostedList.Select(id => int.TryParse(id, out var val) ? val : -1).Where(id => id > 0).ToList();

        var joinedActivities = await _db.Activities.Where(a => joinedIds.Contains(a.Id)).ToListAsync();
        var createdActivities = await _db.Activities.Where(a => createdIds.Contains(a.Id)).ToListAsync();
        var postedActivities = await _db.Activities.Where(a => postedIds.Contains(a.Id)).ToListAsync();

        var ratings = await _db.Ratings.Where(r => r.Username == username).ToListAsync();
        var allScores = ratings.SelectMany(r => r.Score);
        var totalScore = allScores.Sum(s => s.Score);
        var countScore = allScores.Count();
        var avgScore = countScore > 0 ? (double)totalScore / countScore : 0;

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.Nickname,
            user.FirstName,
            user.LastName,
            user.DateOfBirth,
            user.Gender,
            user.ProfileImg,
            user.GalleryList,
            user.IsAdmin,
            user.IsActive,
            user.CreatedAt,
            JoinedActivities = joinedActivities,
            CreatedActivities = createdActivities,
            PostedActivities = postedActivities,
            Ratings = ratings,
            AverageScore = avgScore
        });
    }
}