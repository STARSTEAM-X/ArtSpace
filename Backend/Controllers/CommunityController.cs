using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using MyWebApi.Data;
using MyWebApi.Models;
using MyWebApi.Services;

[ApiController]
[Route("api/[controller]")]
public class CommunityController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<CommunityController> _logger;

    public CommunityController(AppDbContext db, IConfiguration config, ILogger<CommunityController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    // ✅ ดึงโพสต์ทั้งหมด
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var posts = await _db.Communities
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(posts);
    }

    // ✅ ดึงโพสต์เดียว
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var post = await _db.Communities.FindAsync(id);
        if (post == null) return NotFound(new { message = "ไม่พบโพสต์" });
        return Ok(post);
    }

    // ✅ สร้างโพสต์ใหม่
    [HttpPost("create")]
    [Authorize]
    public async Task<IActionResult> Create([FromForm] Community dto, IFormFile? image)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        string imagePath = "";
        if (image != null && image.Length > 0)
        {
            // 📂 อัปโหลดไฟล์
            imagePath = await FileService.UploadFileAsync(image, "community");
        }

        var post = new Community
        {
            Username = username,
            Title = dto.Title,
            Message = dto.Message,
            Discription = dto.Discription,
            Type = dto.Type,
            Image = imagePath,
            CreatedAt = DateTime.UtcNow
        };

        _db.Communities.Add(post);
        await _db.SaveChangesAsync();

        return Ok(post);
    }

    // ✅ ลบโพสต์
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var post = await _db.Communities.FindAsync(id);
        if (post == null) return NotFound(new { message = "ไม่พบโพสต์" });

        // อนุญาตให้ลบได้ถ้าเป็นเจ้าของหรือ admin
        if (post.Username != username)
            return Forbid();

        _db.Communities.Remove(post);
        await _db.SaveChangesAsync();

        return Ok(new { message = "ลบโพสต์สำเร็จ" });
    }

    // ✅ อัปเดตโพสต์
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromForm] Community dto, IFormFile? image)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var post = await _db.Communities.FindAsync(id);
        if (post == null) return NotFound(new { message = "ไม่พบโพสต์" });

        if (post.Username != username)
            return Forbid();

        // อัปเดตข้อมูล
        post.Title = dto.Title;
        post.Message = dto.Message;
        post.Discription = dto.Discription;
        post.Type = dto.Type;

        if (image != null && image.Length > 0)
        {
            post.Image = await FileService.UploadFileAsync(image, "community");
        }

        _db.Communities.Update(post);
        await _db.SaveChangesAsync();

        return Ok(post);
    }
}
