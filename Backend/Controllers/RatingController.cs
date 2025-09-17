using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using MyWebApi.Data;
using MyWebApi.Models;
using MyWebApi.Services;

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











    
}