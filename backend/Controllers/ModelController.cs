using IntelliInspect.Backend.Models;
using IntelliInspect.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace IntelliInspect.Backend.Controllers;

/// <summary>
/// Controller for model training operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ModelController : ControllerBase
{
    private readonly IMlService _mlService;
    private readonly ILogger<ModelController> _logger;

    public ModelController(IMlService mlService, ILogger<ModelController> logger)
    {
        _mlService = mlService;
        _logger = logger;
    }

    /// <summary>
    /// Train the ML model
    /// </summary>
    [HttpPost("train")]
    public async Task<ActionResult<TrainingResult>> TrainModel([FromBody] DateRangeConfig config)
    {
        try
        {
            if (config == null)
            {
                return BadRequest(new { message = "Date range configuration is required" });
            }

            var result = await _mlService.TrainModelAsync(config);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error training model");
            return StatusCode(500, new { message = "An error occurred while training the model" });
        }
    }
}
