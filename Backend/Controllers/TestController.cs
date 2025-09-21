using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyWebApi.Data;
namespace MyWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly AppDbContext _db;
    public TestController(AppDbContext db)
    {
        _db = db;
    }

    // POST: api/test/resetdb
    [HttpPost("resetdb")]
    public async Task<IActionResult> ResetDatabase()
    {
        try
        {
            // 1. ลบ Database เดิมออก
            await _db.Database.EnsureDeletedAsync();

            // 2. สร้างใหม่จาก Migration
            await _db.Database.MigrateAsync();

            return Ok(new { message = "Database reset successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error resetting database", error = ex.Message });
        }
    }
}