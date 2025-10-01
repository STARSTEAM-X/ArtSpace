using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using MyWebApi.Data;
using MyWebApi.Models;
using MyWebApi.Services;
using Backend.Helper;
using MyWebApi.Dto;

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
            user.Bio,
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


    // add Gallery image
    // POST: api/profile/addGallery
    [HttpPost("addGallery")]
    [Authorize]
    public async Task<IActionResult> AddGalleryImage([FromForm] List<IFormFile> files)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return NotFound();

        if (files == null || files.Count == 0)
            return BadRequest(new { message = "No image uploaded." });

        var galleryList = user.GalleryList.ToList();

        foreach (var file in files)
        {
            var galleryImgPath = await FileService.UploadFileAsync(file, "gallery");
            galleryList.Add(galleryImgPath);
        }

        user.GalleryList = galleryList;
        _db.Users.Update(user);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Images added to gallery successfully.",
            galleryList = user.GalleryList
        });
    }


    // POST: api/profile/update
    [HttpPost("update")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileDto dto, IFormFile? profileImage)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return NotFound(new { message = "User not found" });

        // ✅ อัปโหลดรูปใหม่ (ถ้ามี)
        if (profileImage != null && profileImage.Length > 0)
        {
            var profilePath = await FileService.UploadFileAsync(profileImage, "profile");
            user.ProfileImg = profilePath;
        }

        // ✅ อัปเดตข้อมูล
        if (!string.IsNullOrWhiteSpace(dto.Nickname))
            user.Nickname = dto.Nickname;

        if (!string.IsNullOrWhiteSpace(dto.Bio))
            user.Bio = dto.Bio;

        _db.Users.Update(user);
        await _db.SaveChangesAsync();

        // ✅ บันทึก Notification
        var noti = new Notification
        {
            Username = username,
            Title = "แก้ไขโปรไฟล์",
            Message = "คุณได้อัปเดตโปรไฟล์เรียบร้อยแล้ว",
            Type = "info",
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(noti);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "อัปเดตโปรไฟล์สำเร็จ",
            user.ProfileImg,
            user.Nickname,
            user.Bio
        });
    }


    // POST: api/profile/updateGallery
    [HttpPost("updateGallery")]
    [Authorize]
    public async Task<IActionResult> UpdateGallery([FromForm] List<IFormFile> files, [FromForm] string keepGallery)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return NotFound();

        // keepGallery = JSON string เก็บ path ของไฟล์เก่าที่ต้องการเก็บไว้
        var keepList = System.Text.Json.JsonSerializer.Deserialize<List<string>>(keepGallery);
        user.GalleryList = keepList ?? new List<string>();

        // เพิ่มไฟล์ใหม่
        foreach (var file in files)
        {
            if (file.Length > 0)
            {
                var imgPath = await FileService.UploadFileAsync(file, "gallery");
                user.GalleryList = user.GalleryList.Append(imgPath).ToList();
            }
        }

        _db.Users.Update(user);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Gallery updated successfully",
            galleryList = user.GalleryList
        });
    }

    




}