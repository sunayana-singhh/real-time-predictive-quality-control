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

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Only CSV files are supported" });
            }

            // Log file details for debugging
            _logger.LogInformation($"Processing file: {file.FileName}, Size: {file.Length} bytes");

            var metadata = await _datasetService.ProcessUploadedFileAsync(file);
            return Ok(metadata);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid file upload: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Database error while processing file: {Message}", ex.Message);
            return StatusCode(500, new { message = "A database error occurred while processing the file" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing file: {Message}", ex.Message);
            return StatusCode(500, new { 
                message = "An unexpected error occurred while processing the file",
                details = ex.Message
            });
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
