using IntelliInspect.Backend.Models;

namespace IntelliInspect.Backend.Services;

/// <summary>
/// Service interface for dataset operations
/// </summary>
public interface IDatasetService
{
    /// <summary>
    /// Process uploaded CSV file and return metadata
    /// </summary>
    Task<DatasetMetadata> ProcessUploadedFileAsync(IFormFile file);

    /// <summary>
    /// Validate date ranges configuration
    /// </summary>
    Task<DateRangeValidation> ValidateDateRangesAsync(DateRangeConfig config);

    /// <summary>
    /// Get records within a specific date range
    /// </summary>
    Task<List<DatasetRecord>> GetRecordsInDateRangeAsync(DateTime startDate, DateTime endDate);

    /// <summary>
    /// Get monthly breakdown of records
    /// </summary>
    Task<List<MonthlyData>> GetMonthlyBreakdownAsync(DateRangeConfig config);
}
