using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using MyWebApi.Data;
using MyWebApi.Models;
using MyWebApi.Services;

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

    











    
}