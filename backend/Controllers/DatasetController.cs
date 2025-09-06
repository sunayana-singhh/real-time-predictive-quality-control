using IntelliInspect.Backend.Models;
using IntelliInspect.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace IntelliInspect.Backend.Controllers;

/// <summary>
/// Controller for dataset operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DatasetController : ControllerBase
{
    private readonly IDatasetService _datasetService;
    private readonly ILogger<DatasetController> _logger;

    public DatasetController(IDatasetService datasetService, ILogger<DatasetController> logger)
    {
        _datasetService = datasetService;
        _logger = logger;
    }

    /// <summary>
    /// Upload and process CSV dataset
    /// </summary>
    [HttpPost("upload")]
    public async Task<ActionResult<DatasetMetadata>> UploadDataset(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded" });
            }

            var metadata = await _datasetService.ProcessUploadedFileAsync(file);
            return Ok(metadata);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid file upload");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing uploaded file");
            return StatusCode(500, new { message = "An error occurred while processing the file" });
        }
    }

    /// <summary>
    /// Validate date ranges configuration
    /// </summary>
    [HttpPost("validate-ranges")]
    public async Task<ActionResult<DateRangeValidation>> ValidateDateRanges([FromBody] DateRangeConfig config)
    {
        try
        {
            if (config == null)
            {
                return BadRequest(new { message = "Date range configuration is required" });
            }

            var validation = await _datasetService.ValidateDateRangesAsync(config);
            return Ok(validation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating date ranges");
            return StatusCode(500, new { message = "An error occurred while validating date ranges" });
        }
    }
}
