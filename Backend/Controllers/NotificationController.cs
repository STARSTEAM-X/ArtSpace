using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using MyWebApi.Data;
using MyWebApi.Models;
using MyWebApi.Services;

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

    // // ✅ ดึง notification ของ user ที่ login อยู่
    // [HttpGet("my")]
    // [Authorize]

    // // ✅ สร้าง notification ใหม่ (admin หรือระบบยิงให้ user)
    // [HttpPost("create")]
    // [Authorize]
    
    // // ✅ Mark as read
    // [HttpPut("read/{id}")]
    // [Authorize]
}