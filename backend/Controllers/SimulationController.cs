using IntelliInspect.Backend.Models;
using IntelliInspect.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace IntelliInspect.Backend.Controllers;

/// <summary>
/// Controller for simulation operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly IMlService _mlService;
    private readonly ILogger<SimulationController> _logger;

    public SimulationController(IMlService mlService, ILogger<SimulationController> logger)
    {
        _mlService = mlService;
        _logger = logger;
    }

    /// <summary>
    /// Start real-time simulation
    /// </summary>
    [HttpPost("start")]
    public async Task<ActionResult<List<SimulationResult>>> StartSimulation([FromBody] DateRangeConfig config)
    {
        try
        {
            if (config == null)
            {
                return BadRequest(new { message = "Date range configuration is required" });
            }

            var results = await _mlService.StartSimulationAsync(config);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting simulation");
            return StatusCode(500, new { message = "An error occurred while starting the simulation" });
        }
    }

    /// <summary>
    /// Get simulation statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<SimulationStats>> GetSimulationStats()
    {
        try
        {
            var stats = await _mlService.GetSimulationStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting simulation statistics");
            return StatusCode(500, new { message = "An error occurred while getting simulation statistics" });
        }
    }
}
